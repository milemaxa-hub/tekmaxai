import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const articles = (await getCollection('vesti'))
    .filter((a) => !a.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const baseUrl = site?.toString().replace(/\/$/, '') || 'https://latest-editorial-role-open.trycloudflare.com';

  const items = articles
    .map((entry) => {
      const slug = entry.id.replace(/\.mdx?$/, '');
      const url = `${baseUrl}/vesti/${slug}/`;
      const pubDate = entry.data.date.toUTCString();
      const cat = entry.data.category;
      return `
    <item>
      <title><![CDATA[${entry.data.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${cat}</category>
      <author>${entry.data.author}</author>
      <description><![CDATA[${entry.data.excerpt}]]></description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Tekmax — srpski AI &amp; tech portal</title>
    <link>${baseUrl}/</link>
    <description>Najvažnije vesti iz sveta veštačke inteligencije, hardvera i startup-a — na srpskom.</description>
    <language>sr-Latn</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
