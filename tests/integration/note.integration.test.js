const request = require('supertest')
const app = require('../../app/backend/src/index')
const { PrismaClient } = require('../../app/backend/node_modules/@prisma/client')

const prisma = new PrismaClient()

let token
let authorId
let noteId

const uniqueSuffix = Date.now()
const TEST_EMAIL = `note_${uniqueSuffix}@test.com`
const TEST_USERNAME = `noteuser_${uniqueSuffix}`

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
  authorId = res.body.user.id
})

afterAll(async () => {
  const victim = await prisma.user.findUnique({ where: { email: `victim_${uniqueSuffix}@test.com` } })
  if (victim) {
    await prisma.note.deleteMany({ where: { authorId: victim.id } })
    await prisma.user.delete({ where: { id: victim.id } })
  }
  if (authorId) {
    await prisma.note.deleteMany({ where: { authorId } })
    await prisma.user.delete({ where: { id: authorId } })
  }
  await prisma.$disconnect()
})

describe('Notes API', () => {
  describe('POST /notes', () => {
    it('should create a note', async () => {
      const res = await request(app)
        .post('/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Note', content: 'Test Content', isPublic: true })

      expect(res.status).toBe(201)
      expect(res.body.title).toBe('Test Note')
      noteId = res.body.id
    })

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/notes')
        .send({ title: 'Test Note', content: 'Test Content' })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /notes', () => {
    it('should get all notes', async () => {
      const res = await request(app)
        .get('/notes')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })
  })

  describe('GET /notes/:id', () => {
    it('should get note by id', async () => {
      const res = await request(app)
        .get(`/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(noteId)
    })

    it('should return 404 for non-existent note', async () => {
      const res = await request(app)
        .get('/notes/99999')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /notes/:id', () => {
    it('should update a note', async () => {
      const res = await request(app)
        .put(`/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Note', content: 'Updated Content', isPublic: false })

      expect(res.status).toBe(200)
      expect(res.body.title).toBe('Updated Note')
    })
  })

  describe('DELETE /notes/:id', () => {
    it('should delete a note', async () => {
      const res = await request(app)
        .delete(`/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Note deleted')
    })
  })

  describe('⚠️ IDOR Vulnerability', () => {
    it('should allow accessing other users note (IDOR)', async () => {
      const user2 = await request(app)
        .post('/auth/register')
        .send({
          username: `victim_${uniqueSuffix}`,
          email: `victim_${uniqueSuffix}@test.com`,
          password: 'password123'
        })

      const note = await request(app)
        .post('/notes')
        .set('Authorization', `Bearer ${user2.body.token}`)
        .send({ title: 'Private Note', content: 'Secret Content', isPublic: false })

      const res = await request(app)
        .get(`/notes/${note.body.id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.content).toBe('Secret Content')
    })
  })
})
