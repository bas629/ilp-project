# features/ — CLAUDE.md

## Screen inventory
| Route | Component | Auth required | Admin only |
|-------|-----------|---------------|------------|
| /login | LoginComponent | No | No |
| /register/success | AcknowledgementComponent | No | No |
| /app/dashboard | DashboardComponent | Yes | No |
| /app/expenses | ExpensesComponent | Yes | No |
| /app/records | FinancialRecordsComponent | Yes | No |
| /app/stocks | StocksComponent | Yes | No |
| /app/gold | GoldComponent | Yes | No |
| /app/portfolio | PortfolioComponent | Yes | No |
| /app/wellness | WellnessComponent | Yes | No |
| /app/risk | RiskProfileComponent | Yes | No |
| /app/goals | GoalsComponent | Yes | No |
| /app/profile | ProfileComponent | Yes | No |
| /app/admin/rules | RulesComponent | Yes | Yes |
| /app/admin/monitoring | MonitoringComponent | Yes | Yes |
| /app/admin/security | SecurityComponent | Yes | Yes |

## Shell layout
`ShellComponent` wraps all /app/* routes. It contains:
- `SidebarComponent` (left, 220px, collapsible)
- `TopbarComponent` (top, 48px, shows page title + logout)
- `<router-outlet>` (main content area)

## Mock data
All screens using mock data are clearly marked with `// TODO: replace with API call`.
See `financial-records.component.ts`, `stock.service.ts`, `gold.component.ts`,
`portfolio.component.ts`, `wellness.component.ts`, `monitoring.component.ts`,
`security.component.ts`, `dashboard.component.ts`.
