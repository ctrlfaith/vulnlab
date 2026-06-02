const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const search = async (req, res) => {
  try {
    const { q } = req.query

    // ⚠️ VULNERABILITY: SQL Injection — ต่อ query ตรงๆ ไม่ใช้ parameterized query
    const results = await prisma.$queryRawUnsafe(
      `SELECT * FROM Note WHERE title LIKE '%${q}%'`
    )

    // Fix BigInt serialization (เกิดตอน UNION inject columns ที่เป็น int)
    const serialized = JSON.parse(
      JSON.stringify(results, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    )

    res.json(serialized)
  } catch (error) {
    res.status(500).json({ message: error.message, stack: error.stack })
  }
}

module.exports = { search }