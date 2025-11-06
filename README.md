# x01 AI — Oracle Test

Frontend-only multilingual crypto oracle for GitHub Pages.

## Features
- Accepts input in any language (Google Translate public endpoint)
- Fetches realtime crypto prices (CoinCap public API)
- Auto refresh every 10 seconds
- Chart visualization with Chart.js
- Ready for GitHub Pages (no server required)

## How to deploy
1. Create new GitHub repo and push these files to the root.
2. On GitHub: Settings → Pages → Source: `main` branch → `/ (root)`. Save.
3. Wait ~1 minute, then open provided URL.

## Notes
- CoinCap public API has rate limits for heavy usage. This app refreshes every 10s; if you fork for many users, consider a proper backend + API key.
