# FinApp — Angular 17 Frontend

Personal finance management application built with Angular 17 standalone components.

---

## Project overview

FinApp helps users track expenses, investments (stocks + gold), financial goals, and get a wellness score for their financial health. It connects to a Spring Boot REST API backend.

---

## Folder structure

```
finapp-frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/         auth.guard.ts, admin.guard.ts
│   │   │   ├── interceptors/   error.interceptor.ts
│   │   │   ├── models/         user, expense, investment, goal, stock models
│   │   │   └── services/       auth, expense, investment, stock, storage services
│   │   ├── features/
│   │   │   ├── auth/           login (+ register panel), acknowledgement
│   │   │   ├── shell/          layout wrapper (sidebar + topbar)
│   │   │   ├── dashboard/      overview with charts
│   │   │   ├── expenses/       add income / expense entry
│   │   │   ├── financial-records/ transaction history table
│   │   │   ├── stocks/         stock holdings CRUD
│   │   │   ├── gold/           gold holdings CRUD
│   │   │   ├── portfolio/      charts + breakdown
│   │   │   ├── wellness/       wellness score factors
│   │   │   ├── risk-profile/   quiz + risk level
│   │   │   ├── goals/          financial goals tracker
│   │   │   ├── profile/        user profile
│   │   │   └── admin/          rules, monitoring, security (admin only)
│   │   └── shared/
│   │       ├── components/     sidebar, topbar, metric-card, progress-bar, empty-state, confirm-dialog
│   │       └── pipes/          inr-format.pipe.ts
│   ├── styles.scss             global design system (colors, buttons, cards, forms, tables, badges)
│   └── index.html              Google Fonts (DM Sans) + Tabler Icons
├── CLAUDE.md
└── README.md
```

---

## How to run

### Prerequisites
- Node.js 18+
- Angular CLI 17: `npm install -g @angular/cli@17`

### Development server

```bash
cd finapp-frontend
npm install
ng serve
```

Open `http://localhost:4200`

### Production build

```bash
ng build
# Output → dist/finapp-frontend/
```

---

## Backend connection

The frontend expects the Spring Boot backend running at `http://localhost:8080`.

Start the backend:
```bash
cd first
./mvnw spring-boot:run
```

### Available API endpoints used

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /user | Register a new user |
| POST | /login | Login (returns userId, name, status) |
| POST | /Expanse | Create an expense or income entry |
| POST | /investment | Record a stock investment |
| POST | /Stock | Add a stock listing (stub) |
| POST | /buyStock | Buy stock (stub) |
| PATCH | /sellStock | Sell stock (stub) |

---

## Authentication

- Login stores user in `localStorage` under key `finapp_user`
- Role is inferred: emails containing 'admin' get `admin` role, others get `user`
- Admin users can access `/app/admin/*` routes
- `AuthGuard` protects all `/app/*` routes
- Clicking the avatar in the top-right logs out

---

## Known TODOs (missing backend APIs)

| TODO | Notes |
|------|-------|
| GET /Expanse/{userId} | Fetch user's transaction history |
| PUT /Expanse/{id} | Edit a transaction |
| DELETE /Expanse/{id} | Delete a transaction |
| GET /investment/{userId} | Fetch user's investments |
| GET /Stock | List all available stocks |
| Dedicated gold API | Currently mapped to /investment with GOLD- prefix |
| Admin rules persistence | Frontend stores in memory; no backend admin API yet |
| Role field in LoginResponseDto | Backend should return role; currently inferred from email |
| Wellness score computation | Should be calculated server-side from real transaction data |

---

## Design system

All UI is built with plain HTML + SCSS. Global styles in `src/styles.scss` provide:
- Color variables (blue, green, red, amber, teal, purple)
- `.card`, `.metric-card`, `.btn`, `.btn-icon`
- `.form-group`, `.form-row-2`, `.form-row-3`
- `.data-table`, `.table-wrap`
- `.badge-*` variants
- `.tab-bar`, `.tab-type-toggle`
- `.progress-wrap`, `.risk-segmented-bar`
- `.empty-state`, `.alert-*`

No Bootstrap. No Angular Material form fields, cards, or tables.
Angular Material is used only for: Dialog, Snackbar.
