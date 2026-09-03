# Custom Print ERP — Frontend (Storefront + Admin)

React + TypeScript + Vite. Two apps in one: a VistaPrint-style **customer storefront** and a full **ERP admin panel**. Pairs with the `custom-print-backend` API.

## Run
```bash
npm install
npm run dev        # vite → http://localhost:5173
```
Backend must be running at `http://localhost:4000` (see the backend repo). Owner admin login: **SuperAdmin / 1234** at `/admin`.

## Env (.env — see .env.example)
- `VITE_API_URL` (admin API base), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (storefront customer auth only).
- Note: `src/lib/api.ts` currently hardcodes `http://localhost:4000` for both the admin API (`/api/v1`) and the internal auth (`/employee/auth`). Move to `VITE_API_URL` before deploy.

## Layout
- `src/App.tsx` — all routes. Storefront routes at top level; admin under `/admin/*` wrapped in `<AdminAuthProvider><AdminGate>`. `FULLSCREEN_PATHS` hides navbar/footer (editor, review, checkout, admin, etc.).
- `src/customer/pages/*` — storefront. `src/admin/pages/*` — ERP admin (one page per nav item). `src/admin/components/AdminLayout.tsx` — sidebar + topbar + route guard. `src/shared/components/product-editor/*` — the design editor.
- `src/lib/api.ts` — `api.get/post/patch/delete` (sends the internal JWT as Bearer), plus `loginInternal`, `fetchMe`, `updateMyAccount`, `posVerify`, `posLogin`, token helpers (localStorage `inkora_admin_token`).

## Admin auth + rights (internal = our DB, NOT Supabase)
- `src/admin/lib/AuthContext.tsx` — `AuthProvider` + `useAuth()` → `{ user, can(key), logout }`. `can()` = owner bypasses, else `permissions.includes(key)`.
- `src/admin/lib/rights.ts` — **single source of truth** for grantable rights: `PAGE_RIGHTS` (grouped, key = route path after `/admin/`), `FEATURE_RIGHTS` (feature.* fraud toggles), `PRESETS` (Sales/Warehouse/Finance/Purchasing/Viewer starting points).
- Owner assigns per-employee rights in **Employees → Access** (`AccessModal` in `EmployeesPage.tsx`): login email/password/PIN, Owner toggle, page checklist, feature toggles, POS counter dropdown.
- **Nav + routes filter by rights** (`AdminLayout` `canSeePage`): sidebar shows only granted pages; the route guard blocks direct-URL access; owner sees all. Special cases: a user with an assigned POS counter auto-gets **POS Terminal**; **My Jobs** shows for non-owners only; base `/admin` (Dashboard) needs the `dashboard` right (else AdminGate redirects to their first available page).
- On login → navigate to `/admin` (Dashboard), or first available page if no dashboard right.
- **My Jobs** (`MyJobsPage.tsx`, `/admin/my-jobs`): worker's own assigned jobs — Start/Mark-Done + log materials from the order's warehouse. Not shown to owner.
- Self-service **My Account** (sidebar footer, `AccountSettingsModal.tsx`): change own username/password/POS password. This is also the owner's password-change UI.

## Storefront buy flow (see backend for the order engine)
- **Designable products** (`EDITOR_TEMPLATE` in `ProductDetailPage.tsx`: business-cards→business_card, letterhead→letterhead; pen NOT built) show **"Design it"** → `/editor` → **`/review`** (DesignReviewPage, clone of VistaPrint "Review your design", approve-gate) → Continue auto-adds to cart → `/cart`.
- **Non-designable products** show **"Upload design & Checkout"** + **"Upload design & Add to Cart"** (file picker → cart/checkout).
- **Cart** (`CartPage.tsx`): line items with Edit design/options; **"More things you may like"** = same-category suggestions from `CATALOG_PRODUCTS`.
- Editor templates live in `src/shared/components/product-editor/templates.ts` — only Business Card (5 shape variants), Letterhead, Pen exist.

## Editor design conventions (admin pages)
- Font: Poppins. Dark `#0F172A`, blue `#3B82F6`/`#1D4ED8`, green `#10B981`. Pages use `AdminLayout` + shared `Table`/`Badge`/`StatCard`/`StatGrid`/`SearchInput`. Money is AED, VAT-inclusive.
- Disabled/"coming later" modules render a "Temporarily Unavailable by Ahmad" screen (Serials, Lots, Applicants, Webhooks, Email Templates, Notifications, Scheduled Reports).

## Gotchas
- `tsconfig` has `noUnusedLocals`/`noUnusedParameters` — remove unused imports/vars or the build fails.
- Vite's oxc parser is stricter than `tsc` — e.g. a duplicate named import compiles under `tsc` but 500s Vite and blanks the app. If the screen goes blank with a 500, check for duplicate imports.
- The storefront is still largely **mock/hardcoded** (home/catalog/product data, checkout). Checkout does NOT yet create a real backend order — wiring it to the online order engine is the main remaining work.

## Known gaps / TODO
- Wire checkout → real order (`/customer` order API → online Order Handling).
- Connect catalog/home/product pages to real backend products.
- My Orders / Order Confirmation read mock data.
- Design review shows a "Your design" placeholder, not the real artwork (editor is div-based; needs html2canvas to capture).
