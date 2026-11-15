# KomaYomi Docs

VitePress documentation site for **KomaYomi — Manga Learner**, published to GitHub Pages:
<https://payayakamo.github.io/KomaYomi-docs/>

The site is trilingual: English at `/`, Simplified Chinese at `/zh/`, Japanese at `/ja/`.

## Local development

```bash
npm install
npm run docs:dev      # http://127.0.0.1:5174
npm run docs:build    # static output in .vitepress/dist
npm run docs:preview  # preview the production build
```

`scripts/dev.mjs` sets `DOCS_BASE=/` so local dev serves from the server root. Production builds default to the `/KomaYomi-docs/` subpath required by GitHub Pages.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site on Node 20 and deploys `.vitepress/dist` with `actions/deploy-pages`. Build output is never committed.

## Structure

```text
.vitepress/
  config.mts          # site config: locales, nav, sidebars, SEO/OG/JSON-LD, base
  theme/              # default theme extensions (breadcrumbs, footer, styles)
public/               # logo, robots.txt, social card, screenshots
guide/                # English guide
zh/ ja/               # Chinese and Japanese translations
404.md  index.md  concepts.md  data-format.md  extending.md  faq.md
remote-backup.md  terminology.md  server/error-codes.md
```

## Notes

- Raw HTML in Markdown (`<img src="/assets/...">`, the 404 links) is prefixed with `base` by a markdown-it hook in `config.mts`, because VitePress does not rewrite raw HTML paths.
- `SITE_URL` in `config.mts` feeds canonical URLs, `hreflang`, Open Graph, JSON-LD and the sitemap; keep it in sync with the Pages host.
