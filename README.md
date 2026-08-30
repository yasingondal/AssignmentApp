# Amrutam Super App

A production-ready Ayurvedic Super App built with React Native and TypeScript, featuring three independent modules: **Consultation**, **Shop**, and **Health Records**.

## Project Overview

Amrutam Super App demonstrates senior-level mobile engineering: scalable architecture, offline-first behavior, large dataset performance, reliability patterns, and comprehensive testing. The app works entirely with deterministic mock APIs — no backend required.

## Commands

```bash
# Install dependencies
npm install

# iOS pods (first time / after native dep changes)
bundle install && bundle exec pod install --project-directory=ios

# Start Metro
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run tests
npm test

# Lint
npm run lint
```

## Troubleshooting Android build

If you see `A problem occurred starting process 'command 'npx''` or `'node'`:

Gradle does not load your shell PATH (nvm/fnm). This project auto-resolves Node from nvm in `android/settings.gradle`. If it still fails:

1. Ensure Node is installed: `node -v` (React Native 0.87 recommends Node 22+)
2. Stop Gradle daemons: `cd android && ./gradlew --stop`
3. Rebuild: `npm run android`

You can also set `NODE_BINARY` before building:

```bash
export NODE_BINARY=$(which node)
npm run android
```

## Architecture

Feature-oriented Clean Architecture with clear boundaries:

```
src/
  app/              Navigation, providers, bootstrap
  core/             API, storage, network, sync, errors, logging, config
  design-system/    Theme tokens, reusable UI components
  features/         consultation, shop, health-records, settings
  shared/           Cross-feature hooks and utilities
  testing/          Test setup and helpers
```

**Data flow:** Screen → Hook/Query → Repository → API Client → Mock Handler

UI never imports mock data directly.

## State Management

| Concern | Solution |
|---------|----------|
| Server/cache state | TanStack Query |
| Cart, wishlist | Zustand + AsyncStorage persist |
| Offline sync queue | Zustand + AsyncStorage |
| Theme, session | Zustand + AsyncStorage |
| Local UI state | Component state |

## API Architecture

- `apiClient` — typed HTTP abstraction with timeout, auth, failure simulation
- `mockApiRouter` — routes to feature-specific mock handlers
- Repositories — `ConsultationRepository`, `ProductRepository`, `HealthRecordRepository`
- Deterministic data generation (seeded PRNG) — 5K doctors, 20K products, 10K records

## Offline Strategy

- **Cached API responses** — AsyncStorage TTL cache for doctors, products, health records, slots; fresh-or-stale fallback when offline
- **Offline cart** — persisted cart hydrate on bootstrap; works without network
- **Offline bookings** — local `pending` booking + sync queue (idempotency keys); slot held locally
- **Auto-sync** — on reconnect, `syncService` processes the queue with exponential backoff (`pending` → `syncing` → `confirmed` / `failed` / `conflict`)
- **Demo** — Settings → **Force Offline** (dev) to exercise cache + queue without Airplane Mode

## Performance

Scale (mocked / generated): **5,000 doctors**, **20,000 products**, **10,000 health records**.

| Technique | How it’s demonstrated |
|-----------|------------------------|
| **Virtualized rendering** | `@shopify/flash-list` on doctor, product, and health timeline lists (`estimatedItemSize`, `getItemType` for mixed year/month/record rows) |
| **Memoization** | `React.memo` list rows (`DoctorListItem`, `ProductListItem`, `HealthRecordItem`); `useMemo` / `useCallback` for filters, flattened pages, and `renderItem` |
| **Efficient state updates** | Debounced search (300ms); deferred filter apply; Zustand narrow selectors (e.g. cart qty per product); `keepPreviousData` while pages refetch |
| **Lazy loading** | Infinite `useInfiniteQuery` pages (20 / 20 / 50); streaming pagination that does not build full filtered arrays for list pages; `lazyScreen()` / `React.lazy` for detail and secondary stack screens |

- **Streaming pagination** — `doctorPagination`, `productPagination`, `healthRecordPagination`
- **Dev benchmark** — Settings → Run Performance Benchmark (measures first-page fetch times)

## Reliability

Mock API simulates: slow network, timeouts, random failures, session expiration, invalid JSON, empty/partial responses. Configurable via `environment.mockFailure` in Settings (dev mode).

## Testing

```
src/features/consultation/domain/__tests__/   Filter & validation tests
src/features/shop/domain/__tests__/           Product filter/sort tests
src/core/utils/__tests__/                     Currency, date grouping
src/features/consultation/__tests__/          E2E booking flow
```

Run: `npm test`

## Environment

Configuration in `src/core/config/environment.ts`:
- `development` / `test` / `production`
- Mock API toggle, failure simulation, log levels, feature flags

## Accessibility

- Accessible labels on buttons, inputs, images
- `accessibilityRole` and `accessibilityLiveRegion` for alerts
- Minimum 44pt touch targets
- Color not sole indicator of state (text + badges)

## Dark Mode

Theme tokens in `design-system/theme/`. Supports light, dark, and system preference.

## Bonus Features

1. **Deep Linking** — `amrutam://doctor/:id`, `amrutam://product/:id`, etc.
2. **Localization** — English + Hindi (i18next)
3. **Performance Monitoring** — Dev benchmark utility

## Trade-offs

- FlashList for all large lists (doctors, products, health timeline) — recycling + pagination
- Mock API in-process — no MSW server needed, deterministic and fast

## Future Improvements

- Real backend integration (repositories ready)
- Detox/Maestro for device E2E
- MMKV for faster persistence
- Push notifications for sync results
- Biometric auth for health records
