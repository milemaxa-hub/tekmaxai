/* ============================================
   Tekmax Search UI — autocomplete dropdown
   ============================================ */

(function () {
  'use strict';

  const CLASS = {
    container: '[data-search-box]',
    input: '[data-search-input]',
    dropdown: '[data-search-dropdown]',
    content: '[data-search-dropdown-content]',
    active: 'active',
    visible: '!block',
  };

  let activeIndex = -1;
  let lastResults = [];

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function $$(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Category color map
  const CAT_COLORS = {
    AI: '#ff6b9d',
    Tehnologije: '#00d4ff',
    Mobilni: '#ffd60a',
    Gedžeti: '#a78bfa',
    Biznis: '#10b981',
    Gaming: '#f97316',
    Nauka: '#06b6d4',
  };

  /**
   * Render jedan rezultat
   */
  function renderResult(article, query) {
    const html = window.tekmaxSearch.highlight(escapeHtml(article.title), query);
    const excHtml = window.tekmaxSearch.highlight(escapeHtml(article.excerpt), query, 2);
    const catColor = CAT_COLORS[article.category] || '#a0a0a8';

    return `
      <a href="/vesti/${encodeURIComponent(article.slug)}" class="search-result-card block px-3 py-2 sm:px-4 sm:py-3">
        <div class="flex items-start gap-3">
          ${article.image ? `<img src="${escapeHtml(article.image)}" alt="" class="hidden h-14 w-20 shrink-0 rounded object-cover sm:block" loading="lazy" />` : ''}
          <div class="min-w-0 flex-1">
            <h4 class="line-clamp-1 text-body-sm font-semibold text-ink-primary sm:text-body">${html}</h4>
            <p class="mt-1 line-clamp-2 text-caption text-ink-secondary sm:text-body-sm">${excHtml}</p>
            <div class="mt-1.5 flex flex-wrap items-center gap-2">
              <span class="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style="background:${catColor}20;color:${catColor}">${escapeHtml(article.category)}</span>
              <span class="text-[10px] text-ink-tertiary">${escapeHtml(article.date)}</span>
              <span class="text-[10px] text-ink-tertiary">· ${escapeHtml(article.author)}</span>
            </div>
          </div>
        </div>
      </a>
    `;
  }

  /**
   * Render kategorije filter
   */
  function renderRecent(recent) {
    if (!recent.length) return '';
    return `
      <div class="border-b border-line-subtle px-3 py-2 sm:px-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-caption text-ink-tertiary">Nedavno:</span>
          ${recent.map((q) => `
            <button type="button" class="search-recent rounded border border-line-subtle bg-bg-secondary px-2 py-1 text-caption font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent" data-recent-query="${escapeHtml(q)}">${escapeHtml(q)}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render rezultate u dropdown
   */
  function renderResults(container, articles, query) {
    const recent = window.tekmaxSearch.getRecentSearches();
    const recentHtml = query.length < 2 ? renderRecent(recent) : '';

    if (query.length < 2) {
      container.innerHTML = `
        ${recentHtml}
        <div class="px-3 py-2 sm:px-4">
          <p class="text-caption text-ink-tertiary">
            Unesite bar 2 karaktera za pretragu
          </p>
        </div>
      `;
      return;
    }

    if (articles.length === 0) {
      container.innerHTML = `
        <div class="px-4 py-6 text-center">
          <div class="text-body text-ink-secondary">Nema rezultata za "<strong class="text-ink-primary">${escapeHtml(query)}</strong>"</div>
          <div class="mt-2 text-caption text-ink-tertiary">
            Probajte manje specifičan termin ili proverite pravopis
          </div>
        </div>
      `;
      return;
    }

    const resultsHtml = articles
      .map((a, i) => renderResult(a, query))
      .join('<div class="border-t border-line-subtle"></div>');

    container.innerHTML = `
      <div class="border-b border-line-subtle bg-bg-secondary px-3 py-2 sm:px-4">
        <div class="flex items-center justify-between">
          <span class="text-caption font-semibold text-ink-secondary">
            <strong>${articles.length}</strong> ${articles.length === 1 ? 'rezultat' : articles.length < 5 ? 'rezultata' : 'rezultata'}
          </span>
          ${window.location.pathname === '/pretraga' ? '' : `
          <a
            href="/pretraga?q=${encodeURIComponent(query)}"
            data-search-see-all
            class="text-caption text-accent link-hover"
          >
            Vidi sve rezultate →
          </a>`}
        </div>
      </div>
      ${resultsHtml}
    `;
  }

  /**
   * Soft navigate to /pretraga?q=... without page reload
   * Koristimo history.pushState + dispatchEvent da triggerujemo isti
   * popstate listener koji bind-ujemo.
   */
  function softNavigate(query) {
    const trimmed = (query || '').trim();
    const url = trimmed
      ? `/pretraga?q=${encodeURIComponent(trimmed)}`
      : '/pretraga';

    if (window.location.pathname === '/pretraga') {
      // Already on /pretraga — just update URL and let the page handler re-render
      window.history.pushState({ q: trimmed }, '', url);
      // Dispatch popstate event manually so the page listener picks it up
      window.dispatchEvent(new PopStateEvent('popstate', { state: { q: trimmed } }));
      // Fire custom event too — Safari i neki browseri ne guraju popstate od pushState
      window.dispatchEvent(new CustomEvent('tekmax:softnav', { detail: { q: trimmed } }));
    } else {
      // Navigate to /pretraga fresh — use pushState to avoid reload,
      // then fetch + swap the document body via ajax pattern.
      // The simplest reliable approach: do a real full nav. The /pretraga page
      // re-reads its inline data-articles on every load, so a full reload here
      // is also fine and simpler.
      window.location.href = url;
    }
  }

  /**
   * Bind jedan SearchBox container
   */
  function bindSearchBox(box) {
    const input = $(CLASS.input, box);
    const dropdown = $(CLASS.dropdown, box);
    const content = $(CLASS.content, box);
    const form = $('[data-search-form]', box);
    if (!input || !dropdown || !content) return;

    // Init input vrednost od URL-a (search-ui.js se izvršava posle
    // SSR-a; SSR ne poznaje query jer je statički build, pa input.value
    // je placeholder "_" i treba prepisati sa URL vrednošću).
    const urlInit = new URL(window.location.href);
    let qInit = (urlInit.searchParams.get('q') || '').trim();
    if (qInit && qInit !== '_') {
      input.value = qInit;
      // Na /pretraga sa query-jem u URL-u, odmah otvori dropdown sa rezultatima.
      // To daje "search results" osećaj bez inline containera.
      if (window.location.pathname === '/pretraga') {
        // Sačekaj jedan frame da search engine učita index
        setTimeout(() => {
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.focus();
        }, 50);
      }
    } else if (input.value === '_') {
      input.value = '';
    }

    let debounceTimer;
    const debounceDelay = box.dataset.variant === 'compact' ? 150 : 0;

    async function handleInput() {
      const query = input.value.trim();
      activeIndex = -1;
      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(async () => {
        const { articles } = await window.tekmaxSearch.loadIndex();
        if (!query || query.length < 2) {
          renderResults(content, [], '');
          dropdown.classList.remove('hidden');
          return;
        }

        const results = await window.tekmaxSearch.search(query, articles);
        lastResults = results;
        renderResults(content, results, query);

        if (results.length > 0 || query.length >= 2) {
          dropdown.classList.remove('hidden');
        }
      }, debounceDelay);
    }

    input.addEventListener('input', handleInput);
    input.addEventListener('focus', handleInput);

    // Click-outside zatvara
    document.addEventListener('click', (e) => {
      if (!box.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });

    // Keyboard navigacija
    input.addEventListener('keydown', (e) => {
      const cards = $$('.search-result-card', dropdown);

      if (e.key === 'Escape') {
        dropdown.classList.add('hidden');
        activeIndex = -1;
        input.blur();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (cards.length === 0) return;
        activeIndex = Math.min(activeIndex + 1, cards.length - 1);
        cards.forEach((c, i) => c.classList.toggle(CLASS.active, i === activeIndex));
        cards[activeIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (cards.length === 0) return;
        activeIndex = Math.max(activeIndex - 1, 0);
        cards.forEach((c, i) => c.classList.toggle(CLASS.active, i === activeIndex));
        cards[activeIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault(); // spreči default form submit
        const trimmed = input.value.trim();

        // Ako je selektovan rezultat, idi na njega
        if (activeIndex >= 0 && cards[activeIndex]) {
          cards[activeIndex].click();
          return;
        }

        // Ako ima rezultata u dropdown-u i korisnik pritisne Enter bez selekcije,
        // klikni prvi rezultat. Time radimo "natural" autocomplete ponašanje
        // gde Enter vodi na prvi match.
        const firstCard = cards[0];
        if (firstCard) {
          firstCard.click();
          return;
        }

        // Ako nema rezultata, ne radi ništa (korisnik verovatno još kuca).
        // Ranije je ovo pozivalo softNavigate — to je sad besmisleno jer /pretraga
        // nema inline results container.
      }
    });

    // "Vidi sve rezultate" link u dropdown-u — soft navigate kad kliknut
    dropdown.addEventListener('click', (e) => {
      // "Vidi sve rezultate" link
      const seeAll = e.target.closest('[data-search-see-all]');
      if (seeAll) {
        e.preventDefault();
        const trimmed = input.value.trim();
        if (trimmed.length >= 2) {
          window.tekmaxSearch.saveRecentSearch(trimmed);
          // Ako već na /pretraga, dropdown JE već inline prikazan — ne navigiraj.
          if (window.location.pathname === '/pretraga') return;
          softNavigate(trimmed);
        }
        return;
      }

      // Recent search chip
      const btn = e.target.closest('[data-recent-query]');
      if (btn) {
        const q = btn.dataset.recentQuery;
        input.value = q;
        handleInput();
        input.focus();
        return;
      }

      // Klik na konkretan rezultat card
      const card = e.target.closest('.search-result-card');
      if (card) {
        const trimmed = input.value.trim();
        if (trimmed.length >= 2) {
          window.tekmaxSearch.saveRecentSearch(trimmed);
        }
      }
    });

    // Form submit (Enter dugme na mobilnom tastaturi) — takođe soft navigate,
    // osim ako je već na /pretraga (gde dropdown JE već inline prikazan).
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const trimmed = input.value.trim();
        if (trimmed.length < 2) {
          dropdown.classList.add('hidden');
          return;
        }
        window.tekmaxSearch.saveRecentSearch(trimmed);

        // Ako već na /pretraga, klikni prvi rezultat u dropdown-u (ako postoji).
        if (window.location.pathname === '/pretraga') {
          const cards = $$('.search-result-card', dropdown);
          if (cards[0]) cards[0].click();
          return;
        }

        // Inače idi na /pretraga fresh.
        window.location.href = trimmed ? `/pretraga?q=${encodeURIComponent(trimmed)}` : '/pretraga';
      });
    }
  }

  /**
   * Global keyboard shortcut: ⌘K ili Ctrl+K za fokus na search box
   */
  function bindGlobalShortcut() {
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('[data-search-input]');
        if (input) {
          input.focus();
          input.select();
        }
      }
    });
  }

  /**
   * Init
   */
  function init() {
    if (typeof window.tekmaxSearch === 'undefined') return;
    $$('[data-search-box]').forEach(bindSearchBox);
    bindGlobalShortcut();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
