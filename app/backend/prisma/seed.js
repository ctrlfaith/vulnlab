const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash('password123', 10)

  await prisma.user.upsert({
    where: { email: 'test3@test.com' },
    update: { password: hashed },
    create: {
      username: 'test3',
      email: 'test3@test.com',
      password: hashed,
    },
  })

  await prisma.user.upsert({
    where: { email: 'test4@test.com' },
    update: { password: hashed },
    create: {
      username: 'test4',
      email: 'test4@test.com',
      password: hashed,
    },
  })

  const test4 = await prisma.user.findUnique({ where: { email: 'test4@test.com' } })

  await prisma.note.createMany({
    data: [
      { title: 'Note by test4 #1', content: 'Content 1', isPublic: true,  authorId: test4.id },
      { title: 'Note by test4 #2', content: 'Content 2', isPublic: false, authorId: test4.id },
    ],
    skipDuplicates: true,
  })

  console.log('Seed completed')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())