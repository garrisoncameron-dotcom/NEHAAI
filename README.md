# HS GovTech Conference Navigator

Production template for lightweight HS GovTech-sponsored conference guide apps.

The NEHA AEC 2026 Kansas City app is the first production instance of this template. The public app is static, mobile-first, and deployable on GitHub Pages or Cloudflare Pages. Conference-specific live content is controlled through Google Sheets and Google Apps Script.

## Template Model

For the next conference, clone this repo and create a new Google Sheet + Apps Script deployment for that event.

Each conference instance owns its own:

- schedule and guide data
- conference branding and venue assets
- Google Sheet backend
- lead capture, demo requests, trivia scores, and alert data
- deployment URL or branded subdomain

This keeps early conference apps fast to launch and easy to reason about. If this grows into a broader product, the same data model can later move into a shared multi-conference backend.

## Deploy

This folder can be published directly as a static site.

GitHub Pages:
- Push this folder contents to a GitHub repo.
- Enable Pages from the repo root, or deploy this folder as the published artifact.

Cloudflare Pages:
- Create a Pages project connected to the GitHub repo.
- Build command: leave blank
- Output directory: `/` if this folder is the repo root.

No backend or build step is required.

The app includes `manifest.webmanifest` and `sw.js` so mobile browsers can save it to the home screen. The Podcast tab uses curated recent YouTube episode links from the Beyond Data Management channel.

## Google Sheets Backend

The app uses a Google Apps Script Web App endpoint for live conference data and form submissions. Current backend features include:

- lead capture
- demo requests
- trivia scores and leaderboard
- score emails after trivia completion
- sheet-managed in-app alerts

The `App Alerts` sheet tab can be used for operational updates or sponsored placements. Example sponsor use cases:

- "Visit Booth 314 for a giveaway"
- "Sponsor happy hour starts at 4 PM"
- "See a live demo at the HS GovTech booth"
- "Featured partner spotlight"

See [TEMPLATE_ADMIN_GUIDE.md](TEMPLATE_ADMIN_GUIDE.md) for the Google Sheet admin model and clone checklist.

## New Conference Setup

1. Create a Google Sheet.
2. Open Extensions > Apps Script.
3. Paste the contents of `google-apps-script-leads.gs`.
4. Deploy as a Web App:
   - Execute as: Me
   - Who has access: Anyone
5. Paste the Web App URL into `lead-config.js`:

```js
window.NEHA_LEAD_ENDPOINT = "https://script.google.com/macros/s/.../exec";
```

Then replace or update:

- `data/sessions.json`
- `data/guide.json`
- venue map assets in `assets/`
- app name and icon details in `index.html` and `manifest.webmanifest`
- brand-specific copy, colors, and sponsor language as needed
