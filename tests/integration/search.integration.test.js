const request = require('supertest')
const app = require('../../app/backend/src/index')
const { PrismaClient } = require('../../app/backend/node_modules/@prisma/client')

const prisma = new PrismaClient()

let token

beforeAll(async () => {
  await prisma.note.deleteMany()
  await prisma.user.deleteMany()

  const res = await request(app)
    .post('/auth/register')
    .send({ username: 'searchuser', email: 'search@test.com', password: 'password123' })

  token = res.body.token

  // สร้าง notes สำหรับ test
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
  await prisma.note.deleteMany()
  await prisma.user.deleteMany()
  await prisma.$disconnect()
})

describe('Search API', () => {
  describe('GET /search', () => {
    it('should return matching notes', async () => {
      const res = await request(app)
        .get('/search?q=Hello')
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
        .get('/search?q=hello')

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