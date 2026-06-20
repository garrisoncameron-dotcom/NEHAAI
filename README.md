# HS GovTech NEHA Navigator

Static conference guide for NEHA AEC 2026.

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

## Lead Capture

The lead gate posts to a Google Apps Script Web App endpoint.

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
