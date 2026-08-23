#!/usr/bin/env node
/**
 * TEKMAX REVIEW — sync
 * Skenira MDX članke u src/content/vesti/ i sinhronizuje _review/articles/*.json
 * Čuva komentare i statuse; dodaje nove članke; ažurira meta (title, date, image...).
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VESTI = join(ROOT, 'src', 'content', 'vesti');
const REVIEW = join(ROOT, '_review');
const ARTICLES_DIR = join(REVIEW, 'articles');

mkdirSync(ARTICLES_DIR, { recursive: true });

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const body = m[1];
  const out = {};
  const grab = (key) => {
    const re = new RegExp(`^${key}:\\s*(.+)$`, 'm');
    const mm = body.match(re);
    if (!mm) return undefined;
    let v = mm[1].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    return v;
  };
  out.title = grab('title');
  out.excerpt = grab('excerpt');
  out.category = grab('category');
  out.author = grab('author');
  out.image = grab('image');
  out.description = grab('description');
  out.date = grab('date');
  const tagsM = body.match(/^tags:\s*\[([\s\S]*?)\]/m);
  if (tagsM) {
    out.tags = tagsM[1].split(',').map((t) => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }
  return out;
}

const files = readdirSync(VESTI).filter((f) => /\.(mdx|md)$/.test(f));
const seen = new Set();
const index = [];

for (const f of files) {
  const slug = f.replace(/\.(mdx|md)$/, '');
  seen.add(slug);
  const raw = readFileSync(join(VESTI, f), 'utf8');
  const fm = parseFrontmatter(raw);
  const artPath = join(ARTICLES_DIR, `${slug}.json`);
  let art = existsSync(artPath) ? JSON.parse(readFileSync(artPath, 'utf8')) : null;

  if (!art) {
    art = {
      slug,
      file: f,
      status: 'review', // novi članak čeka Mile-ov review pre objave (avg 2026: workflow = piši → review → odobri → objavi)
      comments: [],
      createdAt: new Date().toISOString(),
      publishedAt: null,
    };
  }
  // uvek ažuriraj meta
  art.meta = {
    title: fm.title || slug,
    excerpt: fm.excerpt || '',
    category: fm.category || '',
    author: fm.author || '',
    image: fm.image || '',
    description: fm.description || '',
    tags: fm.tags || [],
    date: fm.date || '',
  };
  art.file = f;
  if (!art.comments) art.comments = [];
  if (!art.publishedAt && fm.date) art.publishedAt = `${fm.date}T00:00:00`;
  writeFileSync(artPath, JSON.stringify(art, null, 2));

  index.push({
    slug,
    file: f,
    status: art.status,
    title: art.meta.title,
    category: art.meta.category,
    image: art.meta.image,
    date: art.meta.date,
    scheduledAt: art.scheduledAt || null,
    commentCount: art.comments.length,
    newCommentCount: art.comments.filter((c) => c.status === 'new').length,
    createdAt: art.createdAt,
    publishedAt: art.publishedAt,
  });
}

// ukloni article JSON za obrisane sluge (samo ako nemaju komentare)
for (const f of readdirSync(ARTICLES_DIR)) {
  const slug = f.replace(/\.json$/, '');
  if (!seen.has(slug)) {
    const p = join(ARTICLES_DIR, f);
    const art = JSON.parse(readFileSync(p, 'utf8'));
    if (art.comments && art.comments.length > 0) {
      art.deleted = true;
      writeFileSync(p, JSON.stringify(art, null, 2));
      index.push({ slug, file: '(obrisan)', status: 'deleted', title: art.meta?.title || slug, category: '', image: '', date: '', commentCount: art.comments.length, newCommentCount: 0, createdAt: art.createdAt, publishedAt: art.publishedAt });
    } else {
      rmSync(p);
    }
  }
}

index.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

const idx = {
  updatedAt: new Date().toISOString(),
  total: index.length,
  articles: index,
};
writeFileSync(join(REVIEW, 'index.json'), JSON.stringify(idx, null, 2));
console.log(`SYNC OK: ${index.length} članaka (${files.length} fajlova)`);
