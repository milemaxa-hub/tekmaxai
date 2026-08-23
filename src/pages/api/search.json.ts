import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const articles = await getCollection('vesti');
  const data = articles
    .filter((a) => !a.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((entry) => ({
      title: entry.data.title,
      excerpt: entry.data.excerpt,
      category: entry.data.category,
      author: entry.data.author,
      date: entry.data.date.toISOString().split('T')[0],
      image: entry.data.image,
      slug: entry.id.replace(/\.(md|mdx)$/, ''),
      tags: entry.data.tags ?? [],
    }));

  return new Response(JSON.stringify({ articles: data }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
