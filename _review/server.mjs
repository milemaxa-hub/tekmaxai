#!/usr/bin/env node
/**
 * TEKMAX REVIEW — server
 * Node http server (bez dependency-ja). Port 4322.
 * Serve: _review/public/ + JSON API.
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REVIEW = join(ROOT, '_review');
const ARTICLES_DIR = join(REVIEW, 'articles');
const PUBLIC = join(REVIEW, 'public');
const INDEX_FILE = join(REVIEW, 'index.json');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4322;
const TOKEN = process.env.REVIEW_TOKEN || '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const readJSON = (p, fallback = null) => {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fallback; }
};
const writeJSON = (p, data) => writeFileSync(p, JSON.stringify(data, null, 2));

function runSync() {
  try {
    const out = execFileSync(process.execPath, [join(REVIEW, 'sync.mjs')], { encoding: 'utf8' });
    return { ok: true, out: out.trim() };
  } catch (e) {
    return { ok: false, out: String(e.stderr || e.message) };
  }
}

function slugOk(slug) {
  return /^[a-z0-9-]+$/.test(slug);
}

function articlePath(slug) {
  return join(ARTICLES_DIR, `${slug}.json`);
}

function publicArticle(slug) {
  const p = articlePath(slug);
  if (!existsSync(p)) return null;
  const art = JSON.parse(readFileSync(p, 'utf8'));
  // redacted copy — bez interno-previse detalja nema potrebe, šaljemo sve osim meta.excerpt? šaljemo sve, UI bira
  return art;
}

function serveStatic(res, pathname) {
  let p = normalize(join(PUBLIC, pathname));
  if (!p.startsWith(PUBLIC)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (!existsSync(p) || statSync(p).isDirectory()) {
    if (pathname === '/' || !extname(pathname)) p = join(PUBLIC, 'index.html');
  }
  if (!existsSync(p)) { res.writeHead(404); res.end('Not found'); return; }
  const ext = extname(p);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(readFileSync(p));
}

function sendJSON(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// --- Token zaštita ---
const STATIC_EXT = new Set(['.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.ico']);
function isPublicStatic(pathname) {
  return STATIC_EXT.has(extname(pathname).toLowerCase());
}
function authOk(url, req) {
  if (!TOKEN) return true; // bez REVIEW_TOKEN u env — stari ponašanje
  if (url.searchParams.get('token') === TOKEN) return true;
  const h = req.headers['authorization'] || '';
  return h === `Bearer ${TOKEN}`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) { reject(new Error('too large')); req.destroy(); } });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  // Sve osim čistih statičkih resursa (.css/.js/.svg/slike) traži token
  if (!isPublicStatic(pathname) && !authOk(url, req)) {
    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'forbidden' }));
    return;
  }

  try {
    // API
    if (pathname === '/api/index') {
      return sendJSON(res, 200, readJSON(INDEX_FILE, { articles: [] }));
    }
    if (pathname === '/api/config') {
      return sendJSON(res, 200, readJSON(join(REVIEW, 'config.json'), { siteUrl: '', panelUrl: '' }));
    }
    if (pathname === '/api/sync' && req.method === 'POST') {
      const r = runSync();
      return sendJSON(res, r.ok ? 200 : 500, r);
    }
    let m;
    if ((m = pathname.match(/^\/api\/article\/([^/]+)$/)) && req.method === 'GET') {
      const slug = m[1];
      if (!slugOk(slug)) return sendJSON(res, 400, { error: 'bad slug' });
      const art = publicArticle(slug);
      if (!art) return sendJSON(res, 404, { error: 'not found' });
      return sendJSON(res, 200, art);
    }
    if ((m = pathname.match(/^\/api\/article\/([^/]+)\/content$/)) && req.method === 'GET') {
      const slug = m[1];
      if (!slugOk(slug)) return sendJSON(res, 400, { error: 'bad slug' });
      const art = publicArticle(slug);
      if (!art) return sendJSON(res, 404, { error: 'not found' });
      const srcPath = join(ROOT, 'src', 'content', 'vesti', art.file || `${slug}.mdx`);
      if (!existsSync(srcPath)) return sendJSON(res, 404, { error: 'fajl ne postoji' });
      let raw = readFileSync(srcPath, 'utf8');
      // skini frontmatter
      raw = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
      return sendJSON(res, 200, { content: raw });
    }
    if ((m = pathname.match(/^\/api\/article\/([^/]+)\/comment$/)) && req.method === 'POST') {
      const slug = m[1];
      if (!slugOk(slug)) return sendJSON(res, 400, { error: 'bad slug' });
      const art = publicArticle(slug);
      if (!art) return sendJSON(res, 404, { error: 'not found' });
      const body = await readBody(req);
      const author = body.author === 'claw' ? 'claw' : 'mile';
      const type = ['image', 'text', 'general'].includes(body.type) ? body.type : 'general';
      const text = String(body.text || '').trim();
      if (!text) return sendJSON(res, 400, { error: 'prazan komentar' });
      const parentId = Number(body.parentId) || null;
      if (parentId && !art.comments.some((c) => c.id === parentId)) {
        return sendJSON(res, 400, { error: 'parent ne postoji' });
      }
      const comment = {
        id: Date.now(),
        author,
        type,
        text,
        parentId,
        status: 'new',
        createdAt: new Date().toISOString(),
      };
      art.comments.push(comment);
      writeJSON(articlePath(slug), art);
      runSync(); // automatski osveži index.json (newCommentCount u kalendaru)
      return sendJSON(res, 200, { ok: true, comment });
    }
    if ((m = pathname.match(/^\/api\/article\/([^/]+)\/status$/)) && req.method === 'POST') {
      const slug = m[1];
      if (!slugOk(slug)) return sendJSON(res, 400, { error: 'bad slug' });
      const art = publicArticle(slug);
      if (!art) return sendJSON(res, 404, { error: 'not found' });
      const body = await readBody(req);
      const status = String(body.status || '');
      const allowed = ['draft', 'review', 'changes', 'approved', 'scheduled', 'published'];
      if (!allowed.includes(status)) return sendJSON(res, 400, { error: 'bad status' });
      art.status = status;
      // scheduledAt se čuva kad se šalje u body (bilo koji status); briše se pri prelasku na published
      if (body.scheduledAt !== undefined && body.scheduledAt !== null) {
        art.scheduledAt = String(body.scheduledAt);
      }
      if (status === 'published') {
        art.scheduledAt = null;
        art.publishedAt = art.publishedAt || new Date().toISOString();
      }
      writeJSON(articlePath(slug), art);
      runSync(); // automatski osveži index.json (kalendar čita index.json, ne articles/*.json)
      return sendJSON(res, 200, { ok: true, status, scheduledAt: art.scheduledAt || null });
    }
    if ((m = pathname.match(/^\/api\/article\/([^/]+)\/comment\/(\d+)\/status$/)) && req.method === 'POST') {
      const slug = m[1];
      const id = Number(m[2]);
      if (!slugOk(slug)) return sendJSON(res, 400, { error: 'bad slug' });
      const art = publicArticle(slug);
      if (!art) return sendJSON(res, 404, { error: 'not found' });
      const body = await readBody(req);
      const st = ['new', 'read', 'done'].includes(body.status) ? body.status : 'read';
      const c = art.comments.find((x) => x.id === id);
      if (!c) return sendJSON(res, 404, { error: 'comment not found' });
      c.status = st;
      writeJSON(articlePath(slug), art);
      return sendJSON(res, 200, { ok: true, status: st });
    }
    if ((m = pathname.match(/^\/img-proxy\/([^/]+)$/))) {
      const slug = m[1];
      if (!slugOk(slug)) return sendJSON(res, 400, { error: 'bad slug' });
      const art = publicArticle(slug);
      const imgRel = art && art.meta && art.meta.image;
      if (!imgRel) { res.writeHead(404); res.end('no image'); return; }
      const imgPath = normalize(join(ROOT, 'public', imgRel.replace(/^\//, '')));
      if (!imgPath.startsWith(join(ROOT, 'public'))) { res.writeHead(403); res.end('Forbidden'); return; }
      if (!existsSync(imgPath)) { res.writeHead(404); res.end('not found'); return; }
      const ext = extname(imgPath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'image/jpeg', 'Cache-Control': 'no-cache' });
      res.end(readFileSync(imgPath));
      return;
    }
    if (pathname === '/api/has-new') {
      const idx = readJSON(INDEX_FILE, { articles: [] });
      const fresh = [];
      for (const a of idx.articles) {
        if (a.newCommentCount > 0) fresh.push(a);
      }
      return sendJSON(res, 200, { count: fresh.length, articles: fresh.map((a) => ({ slug: a.slug, title: a.title, n: a.newCommentCount })) });
    }

    // statika
    return serveStatic(res, pathname);
  } catch (e) {
    sendJSON(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`TEKMAX REVIEW server: http://localhost:${PORT}`);
});
