# Architecture Decision Records

## 1. State Management

**Problem:** Multiple state types — server data, persistent cart, sync queue, UI.

**Options:** Redux Toolkit, Zustand, Context only, TanStack Query alone.

**Selected:** TanStack Query (server/cache) + Zustand (client persistent).

**Reason:** Minimal boilerplate, excellent cache/retry for API state, Zustand persist for cart/wishlist/queue.

**Trade-off:** Two libraries instead of one; acceptable given clear separation.

---

## 2. API Architecture

**Problem:** UI must not know mock vs real API.

**Options:** Direct fetch in screens, MSW, in-process mock router.

**Selected:** `apiClient` + `registerMockHandler` + repository pattern.

**Reason:** Single swap point for production API; repositories encapsulate cache logic.

**Trade-off:** In-process mocks don't test HTTP layer; acceptable for RN assignment.

---

## 3. Offline Storage

**Problem:** Persist cart, bookings, cache, sync queue.

**Options:** MMKV, AsyncStorage, SQLite.

**Selected:** AsyncStorage via centralized `storage` utility.

**Reason:** Zero native config, works with Zustand persist, sufficient for demo scale.

**Trade-off:** Slower than MMKV for very large payloads.

---

## 4. Sync Queue

**Problem:** Offline bookings must sync without duplicates.

**Options:** Manual retry, background task, event-driven queue.

**Selected:** Persistent queue with idempotency keys, processed on network reconnect.

**Reason:** Simple, testable, matches assignment requirements.

**Trade-off:** No background fetch on iOS/Android; sync only when app is open.

---

## 5. List Virtualization

**Problem:** 5K doctors / 20K products / 10K health records must not lag.

**Options:** FlatList, FlashList, ScrollView + SectionList.

**Selected:** FlashList for doctors, products, and the health timeline (flattened year → month → record rows with `getItemType`).

**Reason:** One virtualized recycler for all large surfaces; section headers are memoized row types instead of nesting native SectionList.

**Trade-off:** Manual section rows vs native SectionList sticky headers; mitigated by pagination and `React.memo` on header/item components.

---

## 6. Data Generation

**Problem:** Large deterministic datasets without huge JSON files.

**Options:** Committed JSON, runtime generation, Faker.

**Selected:** Seeded PRNG (Mulberry32) with per-index caching.

**Reason:** Stable tests, O(1) per-item generation, no repo bloat.

**Trade-off:** First full-scan filter is O(n); acceptable with pagination.

---

## 7. Error Handling

**Problem:** Typed errors with user-friendly messages.

**Options:** String errors, custom classes, Result types.

**Selected:** `AppError` hierarchy with `userMessage` and `retryable` flags.

**Reason:** Centralized mapping, toast integration, sync retry logic.

**Trade-off:** try/catch boilerplate in repositories.

---

## 8. Navigation

**Problem:** Type-safe, extensible, deep-link ready.

**Options:** React Navigation, Expo Router.

**Selected:** React Navigation v7 with typed param lists per stack.

**Reason:** Industry standard, linking config built-in, matches RN CLI project.

**Trade-off:** Manual type definitions per screen.

---

## 9. Testing Strategy

**Problem:** Cover business logic, hooks, E2E flow.

**Options:** Detox, Maestro, Jest integration.

**Selected:** Jest unit tests for pure functions + integration test for booking flow.

**Reason:** Runs in CI without emulator; E2E flow tested at repository level.

**Trade-off:** No true UI E2E on device; documented as future improvement.

---

## 10. Theme Architecture

**Problem:** Light/dark mode without hardcoded colors.

**Options:** styled-components, StyleSheet + context, NativeWind.

**Selected:** Theme context with token objects (colors, spacing, typography).

**Reason:** No extra deps, all design-system components consume tokens.

**Trade-off:** Manual style props vs CSS-in-JS ergonomics.
