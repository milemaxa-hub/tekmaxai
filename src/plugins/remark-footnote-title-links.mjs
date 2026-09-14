/**
 * remark-footnote-title-links
 *
 * Mile (14.09.2026): u sekciji "Izvori" sme da stoji SAMO naslov izvora, i taj
 * naslov je link. Nikako "Naslov, izvor, datum. https://..." - gde se goli URL
 * prikazuje kao plavi link ispod naslova.
 *
 * Plugin hvata fusnote u kojima je URL napisan kao goli tekst (GFM autolink) i
 * pretvara ih u jedan link: [Naslov, izvor, datum](url).
 *
 * Bezbedno je ponovljiv: fusnote koje već imaju link sa naslovom se ne diraju
 * (nema autolink-a => nema izmene).
 */
import { visit } from 'unist-util-visit';

const stripUrl = (s) => String(s || '').replace(/[/#?.]+$/, '');

export default function remarkFootnoteTitleLinks() {
  return (tree) => {
    visit(tree, 'footnoteDefinition', (node) => {
      for (const child of node.children || []) {
        if (!child || child.type !== 'paragraph' || !Array.isArray(child.children)) continue;

        const kids = child.children;

        const isAutolink = (k) =>
          !!k &&
          k.type === 'link' &&
          Array.isArray(k.children) &&
          k.children.length === 1 &&
          k.children[0].type === 'text' &&
          stripUrl(k.children[0].value) === stripUrl(k.url);

        const autolinks = kids.filter(isAutolink);
        if (autolinks.length === 0) continue; // već je link sa naslovom - ne diraj

        const url = autolinks[autolinks.length - 1].url;

        // sve pre golog URL-a = naslov izvora
        const rest = kids.filter((k) => !autolinks.includes(k));
        while (rest.length > 0) {
          const last = rest[rest.length - 1];
          if (last.type !== 'text') break;
          last.value = last.value.replace(/[\s.,:;]+$/, '');
          if (last.value === '') rest.pop();
          else break;
        }
        if (rest.length === 0) continue;

        child.children = [{ type: 'link', url, title: null, children: rest }];
      }
    });
  };
}
