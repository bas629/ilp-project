# FinWell – Financial Wellness & Smart Investment Tracker

> A full-stack financial management platform with real-time stock simulation, digital gold trading, expense tracking, and AI-style wellness scoring.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Spring Boot 3.5.14, Java 21, Spring Security (JWT), WebSockets |
| **Frontend** | Angular 17 (Standalone Components), TypeScript |
| **Database** | H2 In-Memory (auto-reset on restart) |
| **Real-time** | STOMP over SockJS |

---

## ✨ Features

- 📈 **Live Stock Exchange** — Simulated stock prices ticking every 10 seconds with sparkline charts
- 🥇 **Digital Gold Trading** — Buy/sell gold grams with real-time price updates
- 💰 **Smart Expense Ledger** — Track credits & debits with month filtering and type sorting
- 🎯 **Goal Tracker** — Set savings targets, deposit funds, track progress
- 📊 **Portfolio & Wellness Score** — Risk analysis, diversification score, and AI-style recommendations
- 🔐 **Secure Auth** — JWT-based login, BCrypt passwords, dedicated Change Password screen

---

## 🛠️ Getting Started

### Prerequisites
- Java 21+
- Node.js 18+

### Run the Backend
```bash
cd first
./mvnw spring-boot:run
# API available at http://localhost:8080
```

### Run the Frontend
```bash
cd frontend
npm install
npm run start
# App available at http://localhost:4200
```

---

## 🔑 Demo Account

| Email | Password |
|---|---|
| `test@example.com` | `Test@1234` |

> The demo account is pre-seeded with ₹50,000 in wallet balance.

---

## 📖 Documentation

See [`project_documentation.md`](./project_documentation.md) for the full technical documentation including:
- Architecture diagrams
- Database schema
- API reference
- Portfolio risk & wellness scoring algorithms
- Component breakdown

---

## 📂 Project Structure

```
Basu/
├── first/              # Spring Boot Backend
├── frontend/           # Angular 17 Frontend
└── project_documentation.md
```

---

## 🌐 Repository

**GitHub**: [https://github.com/bas629/ilp-project](https://github.com/bas629/ilp-project)
