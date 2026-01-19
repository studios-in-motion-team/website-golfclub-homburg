**GitHub Actions: Prebuild + Build (Template)**

Use this template as starting point for a GitHub Actions workflow that runs the `prebuild` step, validates generated artifacts, and then runs the static site build.

- **Name:** prebuild-and-build
- **Trigger:** push to main (adjust branch), or manual workflow dispatch

Workflow sketch:

1. Checkout code
2. Setup Node.js (matching your CI Node version)
3. Install deps (`npm ci`)
4. Run `npm run prebuild`
5. Validate artifacts exist (`content/freeda-news.json`, `public/sitemap.xml`)
6. Run `npm run build`
7. Optionally persist `content/freeda-news.json` as an artifact for downstream jobs

Example YAML (paste into `.github/workflows/prebuild-build.yml`):

```yaml
name: Prebuild + Build

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install
        run: npm ci

      - name: Prebuild (fetch Freeda)
        env:
          VITE_FREEDA_API_BASEURL: ${{ secrets.VITE_FREEDA_API_BASEURL }}
          VITE_FREEDA_COMPANY_UUID: ${{ secrets.VITE_FREEDA_COMPANY_UUID }}
          VITE_FREEDA_API_KEY: ${{ secrets.VITE_FREEDA_API_KEY }}
          VITE_SITEMAP_DOMAIN: ${{ secrets.VITE_SITEMAP_DOMAIN }}
        run: npm run prebuild

      - name: Validate prebuild artifacts
        run: |
          test -s content/freeda-news.json
          test -s public/sitemap.xml

      - name: Build site
        run: npm run build

      - name: (Optional) Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: freeda-cache
          path: content/freeda-news.json
```

Notes:

- Store Freeda credentials in repository secrets (`Settings → Secrets`) and reference them as shown.
- Adjust `node-version` to your CI runtime. If your project relies on global `fetch`, prefer Node 18+.
- Consider caching `node_modules` for speed via `actions/cache`.

This is a template; adapt steps for your deployment flow (Netlify, Vercel, custom). For Vercel/Netlify, you can run `npm run prebuild` in the build command or add a pre-step in the platform's build settings.
