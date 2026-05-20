## MTG Card Scanner Backend (TypeScript + Express + GCP)

> **v1.0.0-ts** — Full TypeScript codebase. All source files are `.ts`/`.tsx`. Strict type-checking, Prettier formatting, Husky pre-commit hooks, and GitHub Actions CI are all in place.


Backend API for a React Native app that scans Magic: The Gathering cards, stores them securely, and synchronizes the user's collection across devices. Built with TypeScript, Express, JWT auth, Firestore, and Google Cloud Storage. Deployed on Google App Engine with CI/CD via GitHub Actions.

### Features
- **TypeScript strict mode**: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` across the entire backend
- **JWT authentication**: signup, login, refresh token
- **Firestore**: users and cards collections
- **Cloud Storage**: secure image uploads using in-memory upload and server-side upload
- **Endpoints**: add card (with image), list, delete, sync collection
- **Tests**: Jest + Supertest
- **Deployment**: App Engine Standard (Node 20), GitHub Actions workflow
- **Code quality**: Prettier formatting, Husky pre-commit hooks, lint-staged, commitlint (conventional commits)

### API Overview
- POST `/api/auth/signup`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/cards` (multipart/form-data: image + fields: name, edition, rarity)
- GET `/api/cards`
- DELETE `/api/cards/:id`
- GET `/api/cards/sync?since=ISO_TIMESTAMP`

### Local Development
1) Node 20+ and yarn or npm
2) Create `.env` in project root:
```
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
GCP_PROJECT_ID=your-project-id
GCS_BUCKET=your-bucket-name
# for local dev only
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account.json
PORT=8080
```
3) Add your service account key file referenced by `GOOGLE_APPLICATION_CREDENTIALS` (local only).
4) Install deps and run:
```
yarn
yarn dev
```

### Mobile Frontend
The Expo-based React Native client lives in `mobile/` and is configured to use the deployed backend at `https://mtg-card-scanner-477210.oa.r.appspot.com` by default. See `mobile/README.md` for setup, environment variables, and connectivity tests.

### Environment Variables (App Engine)
Configure via App Engine `app.yaml` and/or Secret Manager:
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `GCP_PROJECT_ID`
- `GCS_BUCKET`

### GCP Setup Steps (High level)
1) Create a GCP project and enable APIs: App Engine, Cloud Build, Firestore (in Native mode), Cloud Storage, IAM, Secret Manager.
2) Create a Storage bucket (regional). Note bucket name in `.env`.
3) Initialize Firestore in Native mode.
4) Create a service account with roles: Storage Object Admin, Datastore User, Service Account User, Cloud Build Service Account (for CI). Download key for local dev only.
5) Store secrets (`JWT_SECRET`) in Secret Manager. Grant access to App Engine and Cloud Build service accounts.
6) App Engine: `gcloud app create --region=europe-west1` (or your region).
7) First deploy: `gcloud app deploy` from local or rely on GitHub Actions using Workload Identity Federation.

### CI/CD (GitHub Actions)
This repo includes `.github/workflows/deploy.yml` that:
- Installs Node
- Builds and tests
- Authenticates to GCP using Workload Identity Federation (recommended) or a service account key (fallback)
- Deploys to App Engine Standard

See comments in the workflow file for setup steps.
