## MTG Card Scanner – Mobile

> **v1.0.0-ts** — Fully migrated to TypeScript. All screens, components, contexts, hooks, services and utilities are `.ts`/`.tsx` with strict type-checking. Prettier, ESLint, and Husky pre-commit hooks are configured.


Expo-managed React Native frontend for the MTG Card Scanner project. Handles auth, card scanning/upload, Scryfall lookups, and personal collection management.

### Setup
- Node 18+ and npm
- Expo SDK 54 (Expo Go 3.14+); install/update Expo Go from the SDK 54 link if needed.
- From `mobile/`: `npm install`
- Create `.env` (not committed) to configure runtime URLs (defaults point to the deployed backend):
  ```
  EXPO_PUBLIC_BACKEND_URL=https://mtg-card-scanner-477210.oa.r.appspot.com
  BACKEND_HEALTH_PATH=/test
  ```
  These values are consumed both by Expo (via `EXPO_PUBLIC_*`) and the backend connectivity script.

### Type-checking & Linting
```
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm run lint:fix    # ESLint with auto-fix
npm run format      # Prettier write
```

### Running the App
```
npm start        # Expo CLI
npm run android  # Build & install on Android
npm run ios      # Build & install on iOS simulator
```
By default the app targets the deployed backend at `https://mtg-card-scanner-477210.oa.r.appspot.com`. Adjust `app.json > extra.backendUrl` or `.env` only if you need a different environment.

### Test Backend Connectivity via `.env`
Use the helper script to confirm the configured backend is reachable before launching the app:
```
cd mobile
npm run test:backend
```
The script loads `.env`, builds the endpoint from `EXPO_PUBLIC_BACKEND_URL` (fallbacks to the deployed URL or `http://localhost:${PORT}`) plus `BACKEND_HEALTH_PATH`, then calls the `/test` route. Expect `Backend reachable ✅` with the JSON payload. Adjust the `.env` values if you need to target a different server or health path.

