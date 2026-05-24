# shared/ — CLAUDE.md

## Reusable components

| Component | Selector | Inputs | Purpose |
|-----------|----------|--------|---------|
| MetricCardComponent | `app-metric-card` | label, value, icon, colorClass, sub, isCurrency | KPI tile |
| EmptyStateComponent | `app-empty-state` | icon, message | Empty list placeholder |
| ProgressBarComponent | `app-progress-bar` | label, value, max, colorClass | Labelled progress bar |
| ConfirmDialogComponent | (MatDialog) | ConfirmDialogData (title, message) | Confirm/cancel modal |
| SidebarComponent | `app-sidebar` | isAdmin, open | Left navigation |
| TopbarComponent | `app-topbar` | (emits) menuClick | Top header bar |

## Pipes
| Pipe | Name | Usage |
|------|------|-------|
| InrFormatPipe | `inr` | `{{ 85000 | inr }}` → `₹85,000` |

## Usage rules
- Import `InrFormatPipe` directly into any component that formats currency
- Use `MetricCardComponent` for all KPI cards — never duplicate the metric-card HTML
- ConfirmDialogComponent requires `MatDialogModule` — open via `MatDialog.open()`
