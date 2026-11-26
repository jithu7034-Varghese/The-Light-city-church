# Seed data

## Legacy: devotionals (`posts.json`, `build-posts.mjs`)

**One-time import, already applied. Don't rerun it.**

- `posts.json` holds the 239 devotionals captured from the old GoDaddy site. It was loaded into the church database once with `npx tsx supabase/seed.ts`. The live devotionals are now edited in the admin (**Devotionals**), so this file is a historical snapshot, not the source of truth.
- `build-posts.mjs` built `posts.json` from `raw/` and `src/data/blogs.json`. Its inputs **no longer reproduce** the file: on 2026-11-24 a rerun wrote only 200 posts. It now refuses to run without `--force`, and even then writes `posts.rebuilt.json` for comparison instead of overwriting `posts.json`.
- `seed.ts` refuses to run against a database that already has posts. Use it only to fill an empty database (for example a new staging project). `--force` overrides that, and it **overwrites** posts with the same slug, so staff edits are lost.

## Still in use

| File | What it's for |
|---|---|
| `pages/*.ts`, `pages/globals.ts` | Page and site content from the old site, loaded by `npx tsx supabase/seed-pages.ts` (skips existing pages unless `--force`) |
| `raw/old-site-images.json`, `import-old-images.ts` | Old-site images (devotionals, gallery, page photos). Safe to rerun |
| `write-stock-report.ts` | Regenerates `docs/stock-images-to-review.md` |
| `old-site-content.json`, `privacy-policy.md` | Source wording for the page seed |
