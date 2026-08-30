# Amrutam Super App — Implementation Plan

## Repository Analysis

| Aspect | Current State |
|--------|---------------|
| React Native | 0.87.1 |
| React | 19.2.3 |
| TypeScript | Extends `@react-native/typescript-config` |
| Navigation | None — default `NewAppScreen` |
| State Management | None |
| API Layer | None |
| Storage | None |
| Tests | Default `App.test.tsx` only |
| iOS/Android | Standard RN CLI scaffold |

**Technical debt:** Fresh boilerplate with no feature architecture. All infrastructure must be established.

---

## Architecture

Feature-oriented Clean Architecture with clear boundaries:

```
src/
  app/           — bootstrap, navigation, providers
  core/          — api, storage, network, sync, errors, logging, config
  design-system/ — theme tokens, reusable UI components
  features/      — consultation, shop, health-records (domain/data/presentation)
  shared/        — cross-feature hooks, utils, types
  testing/       — mocks, fixtures, helpers
```

**Data flow:** Screen → Hook → Repository → API Client → Mock Handler  
UI never imports mock data directly.

---

## Modules

### 1. Consultation
- 5,000+ doctors (virtualized, paginated)
- Search (debounced), filters (pure functions, tested)
- Doctor details, slot selection, booking flow
- Upcoming consultations, cancellation
- Offline booking queue with sync

### 2. Shop
- 20,000+ products (FlashList, infinite scroll)
- Search, multi-filter, sort
- Cart (persisted), wishlist, checkout
- Offline cart

### 3. Health Records
- 10,000+ records (SectionList virtualized)
- Timeline grouped by month/year
- Search, filters, attachment preview

---

## State Management

| Concern | Solution |
|---------|----------|
| Server/cache state | TanStack Query + repository cache metadata |
| Cart, wishlist, theme, auth | Zustand with AsyncStorage persistence |
| Offline sync queue | Zustand + AsyncStorage |
| Local UI state | Component state / hooks |

**Rationale:** TanStack Query handles caching, stale-while-revalidate, and retry. Zustand is minimal for client-persistent state without boilerplate.

---

## Offline Strategy

1. **API response cache** — AsyncStorage with `fetchedAt`, `expiresAt`, `version`
2. **Network service** — NetInfo wrapper exposing `online | offline | reconnecting`
3. **Offline cart** — Zustand persist middleware
4. **Booking queue** — Persistent queue with idempotency keys
5. **Auto-sync** — Network listener processes queue with exponential backoff
6. **Conflict handling** — Status: `pending | syncing | confirmed | failed | conflict | expired`

---

## API Strategy

- `ApiClient` abstraction with typed requests/responses
- `MockApiHandler` with configurable failure simulation
- Repositories: `DoctorRepository`, `ConsultationRepository`, `ProductRepository`, `HealthRecordRepository`
- Deterministic data generation (seeded PRNG) — no huge JSON files
- Pagination at API level

---

## Performance Strategy

- **FlashList** for doctor/product lists
- **SectionList** for health timeline (year/month sections)
- Debounced search (300ms)
- Pure filter/sort functions outside React
- Memoized list item components
- Lazy screen imports where non-critical
- Paginated API — never load full datasets into memory

---

## Testing Strategy

| Layer | Tool | Coverage |
|-------|------|----------|
| Business logic | Jest | Filters, cart calc, booking validation, grouping |
| Hooks | @testing-library/react-native | Search, pagination, sync |
| Components | RTL | Key UI states |
| E2E | Jest integration test | Consultation booking flow |

---

## Implementation Phases

### Phase 1 — Foundation
- Dependencies, path aliases, folder structure
- Environment config, logger, typed errors
- API client, mock handlers, storage
- Network service, sync queue skeleton
- Theme, design system components
- Providers (theme, query, toast, error boundary)
- Root navigation (typed tabs + stacks)

### Phase 2 — Consultation
- Doctor domain models, generator, repository
- Doctor list (search, filter, virtualized)
- Doctor details, slots, booking flow
- Upcoming consultations, cancel
- Offline booking queue integration

### Phase 3 — Shop
- Product generator, repository
- Product list (infinite scroll, filter, sort)
- Product details, cart, wishlist, checkout

### Phase 4 — Health Records
- Record generator, repository
- Timeline with grouping, search, filters
- Attachment preview abstraction

### Phase 5 — Offline/Sync
- Cache layer wiring
- Auto-sync on reconnect
- Offline banner, toast notifications

### Phase 6 — Reliability
- Failure simulation config
- Session expiration handling
- Global error boundary

### Phase 7 — Testing
- Unit tests for business logic
- Hook tests
- E2E consultation flow test

### Phase 8 — Bonus (3 features)
1. Deep linking (React Navigation linking config)
2. Localization (English + Hindi via i18next)
3. Performance monitoring (dev overlay utility)

### Phase 9 — Documentation
- README.md, ARCHITECTURE_DECISIONS.md, REQUIREMENTS_CHECKLIST.md

---

## Dependencies (with rationale)

| Package | Reason |
|---------|--------|
| @react-navigation/* | Typed navigation, deep linking |
| @tanstack/react-query | Server state, cache, retry |
| zustand | Lightweight persistent client state |
| @react-native-async-storage/async-storage | Local persistence |
| @react-native-community/netinfo | Network detection |
| @shopify/flash-list | High-performance virtualization |
| zod | Runtime API/payload validation |
| react-i18next | Localization bonus |
| @testing-library/react-native | Component/hook tests |
