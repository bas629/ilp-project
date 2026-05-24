# core/ — CLAUDE.md

## Contents
- `models/`       — TypeScript interfaces matching backend DTOs
- `services/`     — HTTP services (auth, expense, investment, stock, storage)
- `guards/`       — `AuthGuard` (requires login), `AdminGuard` (requires admin role)
- `interceptors/` — `errorInterceptor` redirects to /login on 401

## Services
| Service | Purpose |
|---------|---------|
| `StorageService` | Typed localStorage wrapper; never hardcodes userId |
| `AuthService` | Login/register/logout; reads/writes `LoggedInUser` via StorageService |
| `ExpenseService` | POST /Expanse (note: backend spelling) |
| `InvestmentService` | POST /investment, /Stock, /buyStock, /sellStock |
| `StockService` | In-memory BehaviorSubject for stock holdings (mock until GET API exists) |

## Role assignment (temporary)
Until backend adds `role` to `LoginResponseDto`, role is inferred:
- email contains 'admin' → role = 'admin'
- otherwise → role = 'user'
