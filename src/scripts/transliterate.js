/**
 * Tekmax Script Transliteration
 *
 * Srpski latinica ↔ ćirilica je BIJEKTIVNA (1:1), izuzev digrafa
 * dž, lj, nj koji se pišu kao jedno ćirilično slovo.
 *
 * Ovaj fajl izlaže:
 *   - window.tekmaxScriptLib.latToCyr(text) -> ćirilični string
 *   - window.tekmaxScriptLib.cyrToLat(text) -> latinični string
 *   - window.tekmaxScriptLib.transliterateAll(target, mode) -> primeni na DOM
 *
 * Modovi: 'auto' | 'latin' | 'cyrillic'
 */

(function () {
  // 1:1 mapiranje (latinica → ćirilica)
  const LAT_TO_CYR = {
    // Osnovna slova
    'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'đ': 'ђ',
    'e': 'е', 'ž': 'ж', 'z': 'з', 'i': 'и', 'j': 'ј', 'k': 'к',
    'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п', 'r': 'р',
    's': 'с', 't': 'т', 'ć': 'ћ', 'u': 'у', 'f': 'ф', 'h': 'х',
    'c': 'ц', 'č': 'ч', 'dž': 'џ', 'š': 'ш',

    // Velika slova
    'A': 'А', 'B': 'Б', 'V': 'В', 'G': 'Г', 'D': 'Д', 'Đ': 'Ђ',
    'E': 'Е', 'Ž': 'Ж', 'Z': 'З', 'I': 'И', 'J': 'Ј', 'K': 'К',
    'L': 'Л', 'M': 'М', 'N': 'Н', 'O': 'О', 'P': 'П', 'R': 'Р',
    'S': 'С', 'T': 'Т', 'Ć': 'Ћ', 'U': 'У', 'F': 'Ф', 'H': 'Х',
    'C': 'Ц', 'Č': 'Ч', 'Dž': 'Џ', 'Š': 'Ш',
  };

  // Obrnuto (ćirilica → latinica)
  const CYR_TO_LAT = {};
  for (const [lat, cyr] of Object.entries(LAT_TO_CYR)) {
    CYR_TO_LAT[cyr] = lat;
  }

  /**
   * Preslika string. Poštuje digrafe dž/lj/nj (samo u smeru lat→cyr
   * jer u ćirilici postoje kao jedno slovo).
   */
  function latToCyr(text) {
    if (!text) return text;
    let out = '';
    let i = 0;
    while (i < text.length) {
      const c = text[i];
      const cNext = text[i + 1] || '';
      const cNext2 = text[i + 2] || '';

      // dž (case-insensitive: dž, Dž, DŽ)
      const dzh = c + cNext + cNext2;
      if (dzh.toLowerCase() === 'dž') {
        const isUpper = dzh[0] === dzh[0].toUpperCase() && dzh[0] !== dzh[0].toLowerCase();
        // Ako je "Dž" (veliko slovo pa malo), koristimo veliko Џ
        // Ako je "DŽ" (oboje veliko), koristimo veliko Џ
        out += isUpper ? 'Џ' : 'џ';
        i += 3;
        continue;
      }

      // Ostala slova (uključujući lj, nj — ali u latinici lj/nj su 2 slova,
      // u ćirilici су takođe 2 slova (љ = ne postoji u srpskom, њ = ne postoji
      // — SRPSKI KORISTI lj i nj kao DVA SLOVA u oba pisma)
      // Srpska ćirilica: љ → ne postoji, њ → ne postoji
      // Dakle lj ostaje lj, nj ostaje nj u oba pisma.
      if (LAT_TO_CYR[c] !== undefined) {
        out += LAT_TO_CYR[c];
      } else {
        out += c;
      }
      i++;
    }
    return out;
  }

  function cyrToLat(text) {
    if (!text) return text;
    let out = '';
    for (const c of text) {
      if (CYR_TO_LAT[c] !== undefined) {
        out += CYR_TO_LAT[c];
      } else {
        out += c;
      }
    }
    return out;
  }

  /**
   * Determiniše koje pismo je string napisan.
   */
  function detectScript(text) {
    if (!text) return 'latin';
    const sample = text.slice(0, 200);
    let cyr = 0, lat = 0;
    for (const c of sample) {
      // ćirilično slovo (Unicode block 0400-04FF)
      if (c >= '\u0400' && c <= '\u04FF') cyr++;
      // latinično slovo srpske azbuke
      if (/[čćžšđČĆŽŠĐ]/.test(c)) lat++;
    }
    return cyr > lat ? 'cyrillic' : 'latin';
  }

  /**
   * Walker po DOM-u, preskače skripte, stilove, atribute, već prevedene.
   *
   * Koristi TreeWalker za tekstualne node-ove, čuva originalni tekst u
   * data-original-lat / data-original-cyr atributima da se može reversati
   * bez gubitka.
   */
  function transliterateAll(mode) {
    const root = document.body;
    if (!root) return;

    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'TEMPLATE', 'IFRAME']);
    const SKIP_CLASSES = ['no-transliterate', 'logo-text', 'script-label', 'brand-t']; // logo preskačemo (već ima obe verzije u DOM-u)

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.isContentEditable || parent.closest('[contenteditable="true"]')) return NodeFilter.FILTER_REJECT;
        if (parent.closest('.no-transliterate')) return NodeFilter.FILTER_REJECT;
        const text = node.textContent || '';
        if (!text.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);

    for (const node of nodes) {
      const text = node.textContent;

      // Prvi put: zapamti original u latinici
      if (!node.parentElement.dataset.origLat) {
        // Ako je trenutno ćirilica, prevedi u latinicu da sačuvaš
        if (detectScript(text) === 'cyrillic') {
          node.parentElement.dataset.origLat = cyrToLat(text);
        } else {
          node.parentElement.dataset.origLat = text;
        }
      }

      const orig = node.parentElement.dataset.origLat;
      if (!orig) continue;

      if (mode === 'cyrillic') {
        node.textContent = latToCyr(orig);
      } else {
        node.textContent = orig;
      }
    }

    // Ažuriraj html lang
    document.documentElement.setAttribute('lang', mode === 'cyrillic' ? 'sr-Cyrl' : 'sr-Latn');
  }

  // Export
  window.tekmaxScriptLib = {
    latToCyr,
    cyrToLat,
    detectScript,
    transliterateAll,
  };
})();
