# RDY Supply — Engineering Standards

## Stack
- React 18 + TypeScript (strict) + Vite
- Zustand (no persist) — all state lives in memory, fetched from Supabase on login
- Supabase project: `fcwjvdbtitwjpqzurdge` at `https://fcwjvdbtitwjpqzurdge.supabase.co`
- Tailwind CSS v4 with `@theme inline` CSS custom properties
- `verbatimModuleSyntax` is ON — always use `import type` for type-only imports

## Architecture Rules

### State Management
- **Never** add `persist` to Zustand stores. All data is fetched fresh on login via `fetchInitialData`.
- The `_hasHydrated` guard **must** remain on `fetchInitialData`. Never remove or bypass it — it prevents redundant Supabase round-trips on every navigation.
- After writes (insert/update/delete), update local Zustand state directly. **Never** call `fetchInitialData()` after a write — this is a performance regression.
- All Supabase UPDATEs must use `.select()` and check `updated.length === 0` to catch silent RLS failures.

### Supabase & Security
- All 10 tables have RLS enabled. Never disable RLS on any table.
- Never embed secrets in source code. Credentials live only in `.env.local` (local) and Vercel env vars (prod).
- `.env.local` is gitignored — never commit it.
- The `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it to the client bundle (never prefix with `VITE_`).
- Always validate Supabase responses: check `error` before using `data`.

### TypeScript
- Zero `any` types. Use explicit interfaces.
- Zero unused imports. Remove them immediately — the build fails on TS6133.
- Type-only imports must use `import type { Foo }` syntax (verbatimModuleSyntax).
- All component props must have explicit interfaces, never inline `{ prop: any }`.

### Performance
- Supabase queries use `.limit()` — never fetch unbounded rows. Current limits: 500 stock entries, 200 paper entries.
- Use `useMemo` and `useCallback` for expensive derived state inside components.
- No unnecessary `useEffect` chains — derive state from store directly where possible.
- Avoid re-renders: split large components into smaller ones with stable props.

## Code Style

### What NOT to do
- No duplicate logic — if the same operation exists in the store, don't reimplement it in a component.
- No "just in case" error handling for impossible states — trust internal guarantees.
- No comments explaining WHAT the code does — only WHY if it's non-obvious.
- No feature flags, backwards-compat shims, or dead code left behind after refactors.
- No multi-paragraph docstrings or comment blocks.
- No `console.log` left in production code.
- No `// TODO` without an associated issue.

### Naming
- Store actions: `verbNoun` (e.g., `addStockEntry`, `updateContract`, `removeEquipmentFromContract`).
- Components: PascalCase files and exports.
- Tailwind classes: use CSS custom properties from `@theme inline`, never hardcode color hex values.

### File Organization
```
src/
  components/
    features/   # business-domain UI (ImportModal, etc.)
    layout/     # AppLayout, Sidebar, Topbar
    ui/         # Base primitives (Button, Card, etc.)
  lib/          # pure utilities (excel, supabase client)
  pages/        # route-level components
  store/        # Zustand stores only
```
- Never put business logic in `lib/`. Never put UI in `store/`.
- One component per file. No barrel re-exports unless the directory is a true module boundary.

## Git
- Commit messages: `type: concise description` (feat, fix, design, refactor, chore).
- Never force-push `main`.
- Never skip pre-commit hooks (`--no-verify`).

## Schema Reference (Supabase)
Tables: `profiles`, `contracts`, `contract_technicians`, `equipment_models`, `contract_equipment`, `equipment_min_stock`, `equipment_stock_entries`, `paper_stock_entries`, `stock_alerts`, `user_configs`.

All tables: `FOR ALL TO authenticated USING (true) WITH CHECK (true)` — open to any authenticated user. Tighten per-table if requirements change.

## When Modifying the Store (`useDataStore.ts`)
1. Add the Supabase operation first.
2. On success, mutate `set()` locally — do not re-fetch.
3. On failure, surface the error to the caller, do not silently swallow.
4. Keep the `_hasHydrated` + `isLoading` guard on `fetchInitialData` intact.

## When Adding a New Page
1. Import only from `../../store/useDataStore` and `../../store/useAuthStore`.
2. Derive all data via `useMemo` — never store derived values in local `useState`.
3. All data mutations go through store actions — never call Supabase directly from a component.

---

## AI Assistant Rules (Gemini / Claude / any LLM)

These rules exist to prevent common AI-generated code regressions. Any AI editing this codebase **must** follow them without exception.

### Hard Stops — Never Do These
- **Never** add `persist` middleware to Zustand. Data is intentionally ephemeral.
- **Never** call `fetchInitialData()` after a write operation. This kills performance.
- **Never** remove the `_hasHydrated` guard from `fetchInitialData`.
- **Never** add unused imports — the build breaks (`TS6133`).
- **Never** use `any` — find or create the correct type.
- **Never** call Supabase directly inside a React component — use store actions.
- **Never** use `import { SomeType }` without the `type` keyword when `verbatimModuleSyntax` is on.
- **Never** hardcode the Supabase URL, anon key, or service role key in source files.
- **Never** disable or weaken RLS policies.
- **Never** add `console.log` to production code paths.
- **Never** create new files when editing an existing file would suffice.
- **Never** refactor code that was not part of the requested change.
- **Never** add abstractions, helpers, or utilities "for future use."

### Before Every Edit
1. Read the file first. Never edit blindly.
2. Check existing store actions before adding a new one — it may already exist.
3. Verify TypeScript compiles: run `npx tsc --noEmit` after changes.
4. Verify no unused imports were left behind.

### Supabase Write Pattern (mandatory)
```typescript
const { data: updated, error } = await supabase
  .from('table_name')
  .update(payload)
  .eq('id', id)
  .select();

if (error) throw error;
if (!updated || updated.length === 0) throw new Error('Update blocked by RLS or row not found');

// Only after confirmed success:
set(state => ({ items: state.items.map(i => i.id === id ? { ...i, ...payload } : i) }));
```

### Component Pattern (mandatory)
```typescript
// Derive from store, never re-fetch
const items = useDataStore(s => s.items);
const derived = useMemo(() => items.filter(...), [items]);

// Mutations always go through store actions
const { updateItem } = useDataStore();
await updateItem(id, payload); // store handles Supabase + local state
```
