# VulnLab

![CI](https://github.com/ctrlfaith/vulnlab/actions/workflows/test.yml/badge.svg)
![Tests](https://img.shields.io/badge/tests-46%2F46%20passing-brightgreen)
![Security](https://img.shields.io/badge/security-7%20vulns%20documented-red)
![Performance](https://img.shields.io/badge/load%20test-250%20req%20%7C%200%25%20error-blue)
![Live](https://img.shields.io/badge/live-demo-lime)

> An intentionally vulnerable full-stack web application built as a QA & Security testing portfolio project. Demonstrates end-to-end testing skills across unit, integration, E2E, security, and performance testing.

🌐 **Live Demo:** [fortunate-luck-production-b82a.up.railway.app](https://fortunate-luck-production-b82a.up.railway.app)  
⚠️ *Intentionally vulnerable — do not submit real personal data*

---

## Overview

VulnLab is a note-sharing web application containing **7 intentional security vulnerabilities** — designed to be discovered, documented, and tested. The project showcases a complete QA workflow from test strategy through automated CI/CD pipelines.

**Tech Stack**

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MySQL, Prisma ORM |
| Auth | JWT (localStorage) |
| Testing | Jest, Supertest, Playwright, Thunder Client |
| CI/CD | GitHub Actions |
| Security | OWASP ZAP |
| Performance | Apache JMeter |

---

## Vulnerabilities (Intentional)

| # | Vulnerability | OWASP | Severity |
|---|--------------|-------|----------|
| 1 | Insecure Direct Object Reference (IDOR) — Notes API | A01 | 🔴 High |
| 2 | SQL Injection — Search Endpoint | A03 | 🔴 High |
| 3 | Cross-Site Scripting (XSS) — Note Content | A03 | 🟠 Medium |
| 4 | Broken Access Control — User Profile | A01 | 🟠 Medium |
| 5 | Cryptographic Failures — Weak JWT Secret | A02 | 🟠 Medium |
| 6 | Security Misconfiguration — Stack Trace Exposure | A05 | 🟡 Low |
| 7 | Auth Failures — No Rate Limiting on Login | A07 | 🟠 Medium |

Full details in [`docs/VULNERABILITIES.md`](docs/VULNERABILITIES.md)

---

## Test Coverage

```
Unit Tests:           7/7   ✅
Auth Integration:     8/8   ✅  (includes vuln verification tests)
Notes Integration:    9/9   ✅  (includes IDOR + XSS tests)
Search Integration:   4/4   ✅  (includes SQLi test)
E2E Auth:             4/4   ✅
E2E Notes:            6/6   ✅
E2E Search:           3/3   ✅
E2E Profile:          5/5   ✅
─────────────────────────────
Total:               46/46  ✅
```

### Test Types

**Unit Tests** — `tests/unit/`  
Core utility functions: password hashing, JWT generation/verification

**Integration Tests** — `tests/integration/`  
API endpoint testing via Supertest, including intentional vulnerability verification:
- IDOR: access another user's private note
- SQLi: `' OR 1=1 #` returns all notes
- XSS: payload stored and returned unsanitized
- JWT: forged token accepted by protected endpoints
- Rate limit: 11 failed logins return 401, never 429
- Stack trace: malformed request exposes `stack` field

> Thunder Client (VS Code) was used during development to manually probe API endpoints before writing automated tests.

**E2E Tests** — `app/frontend/tests/e2e/`  
Full browser automation via Playwright (Chromium):
- Auth flow: register, login, logout, redirect guard
- Notes CRUD + IDOR exploit via UI
- Search + SQLi banner confirmation
- Profile IDOR warning banner

---

## Security Testing

**OWASP ZAP Baseline Scan** — `tests/security/`

| Result | Count |
|--------|-------|
| PASS | 56 |
| WARN | 11 |
| FAIL | 0 |

Notable: ZAP detected `dangerouslySetInnerHTML` in compiled bundles — confirming the XSS vulnerability.

Full report: [`tests/security/reports/zap-report.html`](tests/security/reports/zap-report.html)  
Security assessment: [`docs/SECURITY_REPORT.md`](docs/SECURITY_REPORT.md)

---

## Performance Testing

**Apache JMeter Load Test** — `tests/performance/`

| Metric | Result |
|--------|--------|
| Endpoint | `GET /notes` |
| Virtual Users | 50 |
| Total Requests | 250 |
| Duration | 10s |
| Throughput | 25.3 req/s |
| Avg Response Time | 10 ms |
| Min Response Time | 7 ms |
| Max Response Time | 118 ms |
| Error Rate | 0.00% ✅ |

Full dashboard: [`tests/performance/report/index.html`](tests/performance/report/index.html)

---

## CI/CD

GitHub Actions runs on every push to `main`:

```
backend-tests  →  MySQL service → migrate → Jest (unit + integration)
e2e-tests      →  MySQL service → seed → start backend → Playwright
```

Both jobs must pass before merge. Playwright report uploaded as artifact (30 days).

---

## Project Structure

```
vulnlab/
├── .github/workflows/
│   └── test.yml              # CI pipeline
├── app/
│   ├── backend/              # Express API + Prisma
│   │   ├── prisma/           # Schema + migrations + seed
│   │   └── src/              # Controllers, routes, middleware
│   └── frontend/             # Next.js app + Playwright tests
├── docs/
│   ├── VULNERABILITIES.md    # 7 intentional vulns documented
│   └── SECURITY_REPORT.md    # Pentest-style assessment report
├── tests/
│   ├── unit/                 # Jest unit tests
│   ├── integration/          # Supertest integration tests
│   ├── security/             # ZAP config + report
│   └── performance/          # JMeter plan + results
└── README.md
```

---

## Getting Started

```bash
# Clone
git clone https://github.com/ctrlfaith/vulnlab.git
cd vulnlab

# Backend
cd app/backend
cp .env.example .env        # configure DATABASE_URL
npm install
npx prisma migrate dev
npx prisma db seed
npm start

# Frontend (new terminal)
cd app/frontend
npm install
npm run dev
```

App runs at `http://localhost:3000` | API at `http://localhost:5000`

**Test accounts:** `test3@test.com` / `test4@test.com` — password: `password123`

```bash
# Run tests
cd app/backend && npm test                        # unit + integration
cd app/frontend && npx playwright test            # E2E (Chromium)
cd app/frontend && npx playwright test --ui       # E2E with UI mode
```

---

## ⚠️ Disclaimer

This application is **intentionally vulnerable** for educational and portfolio purposes. The live demo is deployed on Railway solely for portfolio demonstration. All vulnerabilities exist by design — do not submit real personal data.

---

*Built by [Phuriphatthanachai Rattanatham](https://ctrlfaith-portfolio.vercel.app) — [GitHub](https://github.com/ctrlfaith)*
