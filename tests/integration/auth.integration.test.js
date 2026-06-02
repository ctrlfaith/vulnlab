const request = require('supertest')
const app = require('../../app/backend/src/index')
const { PrismaClient } = require('../../app/backend/node_modules/@prisma/client')

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

const uniqueSuffix = Date.now()
const TEST_EMAIL = `integration_${uniqueSuffix}@test.com`
const TEST_USERNAME = `integrationuser_${uniqueSuffix}`

let createdauthorId

beforeAll(async () => {
  const existing = await prisma.user.findUnique({ where: { email: TEST_EMAIL } })
  if (existing) {
    await prisma.note.deleteMany({ where: { authorId: existing.id } })
    await prisma.user.delete({ where: { id: existing.id } })
  }
})

afterAll(async () => {
  if (createdauthorId) {
    await prisma.note.deleteMany({ where: { authorId: createdauthorId } })
    await prisma.user.delete({ where: { id: createdauthorId } })
  }
  await prisma.$disconnect()
})

describe('Auth API', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ username: TEST_USERNAME, email: TEST_EMAIL, password: 'password123' })

      expect(res.status).toBe(201)
      expect(res.body.token).toBeTruthy()
      expect(res.body.user.email).toBe(TEST_EMAIL)
      createdauthorId = res.body.user.id
    })

    it('should return 400 if user already exists', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ username: TEST_USERNAME, email: TEST_EMAIL, password: 'password123' })

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('User already exists')
    })
  })

  describe('POST /auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: 'password123' })

      expect(res.status).toBe(200)
      expect(res.body.token).toBeTruthy()
    })

    it('should return 401 with wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: 'wrongpassword' })

      expect(res.status).toBe(401)
    })

    it('should return 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' })

      expect(res.status).toBe(401)
    })
  })
})
