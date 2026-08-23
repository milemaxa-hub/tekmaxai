import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const vesti = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/vesti' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    category: z.string(),
    excerpt: z.string(),
    author: z.string(),
    image: z.string().optional(),
    description: z.string().optional(), // SEO meta description (140-160 karaktera)
    tags: z.array(z.string()).default([]), // tagovi za /tag/[tag] strane
    draft: z.boolean().default(false), // draft: true = nije vidljiv na sajtu (filter u svim stranama)
  }),
});

export const collections = { vesti };
