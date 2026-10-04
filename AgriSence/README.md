<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/cf5dca16-35dc-47c2-8eb5-5cbcec05e23a

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## AI Services

AgriSence uses two independent Gemini services:

- **Guide AI** (`POST /api/chat`) answers farming questions, uses the supplied weather/farm/simulator context, and returns safe navigation buttons for the website.
- **Pest Vision AI** (`POST /api/pest-diagnosis`) analyzes only uploaded crop/pest images and returns a validated structured diagnosis.

Both services use `GEMINI_API_KEY` by default. They can be isolated with separate credentials and models when needed:

```env
GEMINI_CHAT_API_KEY=your_chat_key
GEMINI_CHAT_MODEL=gemini-3.8-flash
GEMINI_CHAT_FALLBACK_MODEL=gemini-3.5-flash-lite
GEMINI_PEST_API_KEY=your_pest_key
GEMINI_PEST_MODEL=gemini-3.8-flash
GEMINI_PEST_FALLBACK_MODEL=gemini-3.5-flash-lite
```

The fallback model is used only when the primary model is unavailable or returns invalid structured output. Never expose these keys in client-side code.

## Live Mandi Market Feed

The market modal does not use seeded or generated prices. The server fetches observed mandi records and returns their source and observation timestamps. Configure one server-side feed:

```env
# Recommended: data.gov.in Agmarknet resource
DATA_GOV_IN_API_KEY=your_data_gov_in_key
DATA_GOV_IN_RESOURCE_ID=9ef84268-d588-465a-a308-a864a43d0070

# Or use an organization-approved JSON feed with records/data/prices[]
MANDI_FEED_URL=https://your-feed.example/api/mandi-prices
MANDI_FEED_SOURCE_NAME=Your live mandi source
MANDI_FEED_API_KEY=your_server_side_feed_token
```

If no live feed is configured or the upstream source fails, the UI shows an unavailable-feed state instead of presenting static prices as current market data. The Buy/Mandi view creates a buy plan and history record; it does not place a financial or commodity order on the user's behalf.
# Portal accounts and same-tab access

AgriSence keeps Farmer Board, Office, and Vendor/Broker navigation in the same browser tab. The Farmer Board uses the normal farmer Firebase account. Office accounts are separate Firebase identities with administrator-issued IDs, and Vendor accounts are separate identities created through the Vendor portal. A vendor may use the same contact email as a farmer because the server stores that contact email separately from the vendor Firebase login identity.

## One-time owner setup

Server-side portal actions require Firebase Admin credentials. Copy the server-only settings from `.env.example` into `.env.local` and set `FIREBASE_SERVICE_ACCOUNT_JSON` (or the equivalent Admin credential variables). Then set `AGRISENCE_ADMIN_ID`, `AGRISENCE_ADMIN_PASSWORD`, and `AGRISENCE_ADMIN_NAME`, and run:

```bash
npm run admin:create
```

Use the generated official ID and password at `/office/login`. The owner account receives the **Official access** page, where it can create and issue credentials for selected officials. Never put Firebase Admin credentials in `VITE_*` variables or commit them.

The server portal API validates each custom portal token, checks the active membership record, validates input and order transitions, and writes portal data through the Admin SDK. Client-side Firestore rules remain enabled for user-scoped fallback records.

The repository root (`/mnt/d/hackspire/AgriSence`) is the authoritative application. The nested `AgriSence/` directory is excluded from the root build and version-control scope as a stale duplicate workspace.
