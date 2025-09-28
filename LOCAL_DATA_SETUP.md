# Local Data Caching Setup

## How It Works

The application now transparently tries to load patient data from a local file before falling back to the remote API. This makes loading **instant** when the local file is available.

### Loading Priority:
1. **Browser Cache** (localStorage) - If data was loaded in the last 5 minutes
2. **Local File** - `/Users/timtoepper/Downloads/code-of-website/patient-data.json` (< 1 second)
3. **Remote API** - Falls back if local file doesn't exist (30+ seconds)

## Setup Instructions

### Option 1: Automatic (Both Servers)
```bash
# Terminal 1 - Start the main application
npm run dev

# Terminal 2 - Start the local data server
npm run dev:local
```

### Option 2: Main App Only (Falls back to API)
```bash
npm run dev
```

## How to Get the Local Data File

1. Let the app fetch from the API once
2. Save the data to: `/Users/timtoepper/Downloads/code-of-website/patient-data.json`
3. Future loads will be instant

## Technical Details

- Local data server runs on port 5174
- Vite proxies `/api/local-data` to the local server
- If local file doesn't exist, silently falls back to API
- Users never see any difference - it's completely transparent

## Files Modified

- `src/services/patientApiService.ts` - Added local file loading logic
- `vite.config.ts` - Added proxy for local data endpoint
- `local-data-server.cjs` - Simple Node.js server for local files
- `package.json` - Added `dev:local` script