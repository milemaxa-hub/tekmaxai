/* ============================================
   Tekmax Search Engine — client-side fuzzy
   Bez eksternih dependency-ja
   ============================================ */

(function () {
  'use strict';

  // === Fuzzy Search Engine ===

  /**
   * Normalize srpski tekst — lowercase + đ→dj, č→c, ć→c, š→s, ž→z
   */
  function normalize(text) {
    return (text || '')
      .toLowerCase()
      .replace(/đ/g, 'dj')
      .replace(/č/g, 'c')
      .replace(/ć/g, 'c')
      .replace(/š/g, 's')
      .replace(/ž/g, 'z')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Tokenizacija i stemming — reč "najbolji" postaje "bolji", "čipova" -> "cip"
   */
  function tokenize(text) {
    const norm = normalize(text);
    return norm
      .split(/[\s,.!?;:()\[\]"'`]+/)
      .filter(Boolean)
      .map((w) => stem(w))
      .filter((w) => w.length > 1);
  }

  /** Light srpski stemmer — samo sufiksi */
  function stem(word) {
    const suffixes = ['ima', 'ovi', 'eva', 'ama', 'ata', 'uma'];
    for (const s of suffixes) {
      if (word.endsWith(s) && word.length > s.length + 2) {
        return word.slice(0, -s.length);
      }
    }
    return word;
  }

  /**
   * Pravi Levenshtein distance (ograničen) — za fuzzy typo toleranciju
   */
  function levenshtein(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      let rowMin = max + 1;
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
        rowMin = Math.min(rowMin, dp[i][j]);
      }
      if (rowMin > max) return max + 1;
    }
    return dp[m][n];
  }

  /**
   * Traži podstring toleranciju — "macbok" u "macbook"
   */
  function fuzzySubstringMatch(query, text) {
    const q = normalize(query);
    const t = normalize(text);
    if (!q) return { match: false, score: 0 };
    if (t.includes(q)) {
      return { match: true, score: 100 };
    }
    if (q.length >= 4) {
      const tri = q.substring(0, 3);
      if (t.includes(tri)) {
        return { match: true, score: 60 };
      }
    }
    if (q.length <= 12) {
      const parts = t.split(/[\s,.!?;]+/).filter(Boolean);
      for (const part of parts) {
        if (Math.abs(part.length - q.length) > 2) continue;
        const dist = levenshtein(q, part, 2);
        if (dist <= 2) {
          return { match: true, score: 50 - dist * 10 };
        }
      }
    }
    return { match: false, score: 0 };
  }

  /**
   * Testira jedan query token na tekstu
   */
  function matchToken(token, text) {
    if (!token || !text) return 0;
    const normText = normalize(text);
    const normToken = normalize(token);

    const words = normText.split(/[\s,.!?;:()\[\]"'`]+/);
    if (words.includes(normToken)) return 100;

    if (normToken.length >= 3) {
      const prefixHits = words.filter((w) => w.startsWith(normToken)).length;
      if (prefixHits > 0) return 80;
    }

    if (normText.includes(normToken)) return 60;

    const fuzzy = fuzzySubstringMatch(normToken, normText);
    if (fuzzy.match) return fuzzy.score;

    return 0;
  }

  /**
   * Glavna pretraga — scoring
   */
  function search(query, articles, options = {}) {
    const { category, includeBody = true } = options;
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];

    const results = [];
    for (const article of articles) {
      // Filter po kategoriji
      if (category && normalize(category) !== normalize(article.category)) {
        continue;
      }

      const titleScore = tokens.reduce((sum, t) => sum + matchToken(t, article.title), 0);
      const excerptScore = tokens.reduce((sum, t) => sum + matchToken(t, article.excerpt) * 0.6, 0);
      const tagScore = (article.tags || []).reduce(
        (sum, tag) => sum + tokens.reduce((s, t) => s + matchToken(t, tag) * 0.8, 0),
        0
      );
      const categoryScore = tokens.reduce((sum, t) => sum + matchToken(t, article.category) * 0.5, 0);

      const daysAgo = Math.max(0, (Date.now() - new Date(article.date).getTime()) / 86400000);
      const freshness = Math.max(0, 10 - daysAgo / 10);

      let totalScore = titleScore + excerptScore + tagScore + categoryScore + freshness;

      // Bonus: body match ako postoji
      if (includeBody && article._body) {
        const bodyScore = tokens.reduce((sum, t) => sum + matchToken(t, article._body) * 0.3, 0);
        if (bodyScore > 20) {
          totalScore += bodyScore;
        }
      }

      if (totalScore > 30) {
        results.push({ article, score: totalScore });
      }
    }

    results.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 1) {
        return new Date(b.article.date) - new Date(a.article.date);
      }
      return b.score - a.score;
    });

    return results.slice(0, 20).map((r) => r.article);
  }

  /**
   * Highlight matched terms u tekstu
   */
  function highlight(text, query, maxHighlights) {
    if (!text || !query) return text;
    const tokens = tokenize(query);
    if (tokens.length === 0) return text;

    const limit = maxHighlights ?? 3;
    let result = text;
    let highlightedCount = 0;

    for (const token of tokens) {
      if (highlightedCount >= limit) break;
      const normToken = normalize(token);
      if (!normToken || normToken.length < 2) continue;

      const escaped = normToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      let matches = 0;
      result = result.replace(regex, (m) => {
        if (matches >= limit) return m;
        matches++;
        return `<mark class="search-mark">${m}</mark>`;
      });
      if (matches > 0) highlightedCount++;
    }

    return result;
  }

  /**
   * Dobija indeks članaka (cache 5 min)
   */
  let cache = null;
  async function loadIndex() {
    if (cache) return cache;
    try {
      const res = await fetch('/api/search.json');
      if (!res.ok) throw new Error('Index fetch failed');
      const data = await res.json();
      cache = { articles: data.articles || [], fetchedAt: Date.now() };
      return cache;
    } catch (e) {
      console.error('[search] Failed to load index:', e);
      return { articles: [] };
    }
  }

  /**
   * Recent searches u localStorage
   */
  const RECENT_KEY = 'tekmax:recent-searches';
  function getRecentSearches() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch (_) {
      return [];
    }
  }
  function saveRecentSearch(query) {
    if (!query || query.length < 2) return;
    const recent = getRecentSearches().filter((q) => q !== query);
    recent.unshift(query);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
  }

  // === Public API ===
  window.tekmaxSearch = {
    search,
    highlight,
    tokenize,
    normalize,
    loadIndex,
    getRecentSearches,
    saveRecentSearch,
    matchToken,
  };
})();
