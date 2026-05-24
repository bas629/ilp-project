# FinApp Frontend — CLAUDE.md

## What was built
Angular 17 standalone component SPA for a personal finance management app called **FinApp**.

## Tech stack
- Angular 17, TypeScript, standalone components
- SCSS (no Bootstrap, no Angular Material cards/tables/inputs)
- Chart.js for all charts
- Angular Material: Dialog and Snackbar only (allowed exceptions)
- Tabler Icons (CDN webfont)
- DM Sans font (Google Fonts)

## Key rules (enforced throughout)
- No `mat-form-field`, no `mat-card`, no `mat-table` — plain HTML with SCSS
- No Bootstrap
- Every component is `standalone: true`
- `userId` always read from `StorageService` → never hardcoded

## Backend
Spring Boot at `http://localhost:8080`. See `src/app/core/services/` for all API calls.

## Folder layout
```
src/app/
  core/           models, services, guards, interceptors
  features/       one folder per page/screen
  shared/         reusable components (sidebar, topbar, metric-card, …) + pipes
```

## Running
```bash
cd finapp-frontend
npm install
ng serve          # dev server → http://localhost:4200
ng build          # production build → dist/
```

## Live API wiring (as of 2026-05-17)
All core screens fetch real data — no mock data remaining:
- **DashboardComponent** — GET /Expanse/{userId} + GET /investment/{userId}; ngOnDestroy resets state so navigating away and back never shows a blank screen
- **FinancialRecordsComponent** — GET /Expanse/{userId}; DELETE /Expanse/{id}; correct Investment/Income/Expense tag logic via INCOME_CATS + INVESTMENT_CATS
- **ExpensesComponent** — POST /Expanse; GET /Expanse/{userId} to refresh totals; income/investment/expense correctly excluded from chart
- **StocksComponent** — GET /investment/{userId}; POST /investment; DELETE /investment/{id} with confirm dialog
- **PortfolioComponent** — GET /investment/{userId}; grouped breakdown with distribution %; empty state if no investments
- **GoldComponent** — POST /gold; GET /gold/{userId}; DELETE /gold/{goldId} with confirm dialog; computed P&L from backend-returned fields
- **WellnessComponent** — GET /wellness/{userId}; shows savings rate, investment rate, and dynamic recommendations

## Category classification rules
- **Income**: category in `['Salary', 'Freelance', 'Business', 'Rental', 'Other']`
- **Investment**: category contains stock/invest/gold/etf/sgb/mutualfund keywords, OR title contains "buy stock"/"invest"
- **Expense**: everything else

## Shell / Sidebar responsive behaviour (as of 2026-05-17)
- **Desktop (> 768 px)** — sidebar visible by default; hamburger toggles it by collapsing width to 0
- **Mobile (≤ 768 px)** — sidebar hidden by default (translateX(-100%)); hamburger slides it in from left; dark overlay appears and tap-to-close works; any nav link click also auto-closes sidebar
- Implementation: `ShellComponent` owns `sidebarOpen` + `isMobile` signals; sidebar dispatches `window.CustomEvent('finapp-nav-click')` on every link click; shell listens and closes on mobile

## Delete / reload pattern (as of 2026-05-17)
All three data screens use a named `loadData()` method — never call `ngOnInit()` directly:
- **FinancialRecordsComponent** — `loadData()` sets `loading=true`, fetches GET /Expanse/{userId}, updates `allRecords`; `confirmDeleteRecord()` calls it after DELETE succeeds. Signal renamed `confirmDeleteId` (was `confirmDelete`).
- **StocksComponent** — `loadData()` sets `loading=true`, fetches GET /investment/{userId}, updates `investments`; `confirmDelete()` calls it after DELETE succeeds (was `doConfirmDelete`).
- **GoldComponent** — same pattern: `loadData()` called from `ngOnInit`, `onSave`, and `doConfirmDelete`.
- All ids come from backend response fields (`expenseId`, `investmentId`, `goldId`) — no longer undefined.

## Live API wiring — Goals (as of 2026-05-17)
- **GoalsComponent** — POST /goal; GET /goal/{userId}; PATCH /goal/{goalId}/progress?amount=N; DELETE /goal/{goalId}
- All backed by H2 DB — goals persist across page refresh
- goal.model.ts exports `GoalDto` interface (replaces old `Goal` with string id) and `computeStatus()`
- goal.service.ts added to core/services/

## Angular template note
Arrow functions (`v => !v`) are not valid in Angular templates.
Always add a named wrapper method (e.g. `toggleAddForm()`) and call that from the template.

## Buy More & Sell Stocks (as of 2026-05-17)
- **StocksComponent** — replaced delete button with "Buy" + "Sell" action buttons per row
- **Buy More**: `POST /investment/buy-more` (BuyMoreDto) — merges into existing investment row; auto-creates "Stock_Buy" expense record
- **Sell**: `POST /investment/sell` (SellStockDto) — partial sell reduces qty+cost; full sell removes investment row; auto-creates "Stock_Sale" income record
- Both dialogs use named methods (`setSellQty`, `setSellPrice`, `setBuyQty`, `setBuyPrice`, `setBuyDate`) instead of arrow functions — arrow functions are invalid in Angular templates
- **FinancialRecordsComponent** — `INCOME_CATS` now includes `'Stock_Sale'`; `INVESTMENT_KEYS` now includes `'stock_buy'`, `'stock_sale'`, `'stock_credited'`

## Delete response handling (as of 2026-05-17)
Backend delete endpoints return plain text (e.g. "Expense deleted successfully"), not JSON.
All three delete service methods use `{ responseType: 'text' }` and return `Observable<string>`:
- `ExpenseService.deleteExpense` — `http.delete(..., { responseType: 'text' })`
- `InvestmentService.deleteInvestment` — same
- `GoalService.deleteGoal` — same
Using `http.delete<void>()` (the default JSON parser) on a plain-text response causes a JSON
parse error in Angular, triggering the error callback even when the HTTP status is 200.

## Known TODOs (missing backend APIs)
- PUT /Expanse/{id} — edit existing expense
- Admin rules persistence API
- Admin monitoring / security API
- Backend role field on LoginResponseDto (currently inferred from email)
