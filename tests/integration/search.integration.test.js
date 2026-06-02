const request = require('supertest')
const app = require('../../app/backend/src/index')
const { PrismaClient } = require('../../app/backend/node_modules/@prisma/client')

const prisma = new PrismaClient()

let token
let authorId

const uniqueSuffix = Date.now()
const TEST_EMAIL = `search_${uniqueSuffix}@test.com`
const TEST_USERNAME = `searchuser_${uniqueSuffix}`

beforeAll(async () => {
  const existing = await prisma.user.findUnique({ where: { email: TEST_EMAIL } })
  if (existing) {
    await prisma.note.deleteMany({ where: { authorId: existing.id } })
    await prisma.user.delete({ where: { id: existing.id } })
  }

  const res = await request(app)
    .post('/auth/register')
    .send({ username: TEST_USERNAME, email: TEST_EMAIL, password: 'password123' })

  token = res.body.token
  authorId = res.body.user?.id

  await request(app)
    .post('/notes')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Public Note', content: 'Hello World', isPublic: true })

  await request(app)
    .post('/notes')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Private Note', content: 'Secret Content', isPublic: false })
})

afterAll(async () => {
  if (authorId) {
    await prisma.note.deleteMany({ where: { authorId } })
    await prisma.user.delete({ where: { id: authorId } })
  }
  await prisma.$disconnect()
})

describe('Search API', () => {
  describe('GET /search', () => {
    it('should return matching notes', async () => {
      const res = await request(app)
        .get('/search?q=Public')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('should return empty array for no match', async () => {
      const res = await request(app)
        .get('/search?q=zzznomatch')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.length).toBe(0)
    })

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/search?q=Public')

      expect(res.status).toBe(401)
    })
  })

  describe('⚠️ SQL Injection Vulnerability', () => {
    it('should be vulnerable to SQL injection', async () => {
      const res = await request(app)
        .get("/search?q=%' OR '1'='1")
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.length).toBeGreaterThan(0)
    })
  })
})
