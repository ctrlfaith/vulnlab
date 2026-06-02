const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// GET profile by user ID
const getProfile = async (req, res) => {
  try {
    const { id } = req.params

    // VULNERABILITY: Broken Access Control — ดู profile ใครก็ได้
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, username: true, email: true, createdAt: true }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message, stack: error.stack })
  }
}

// PUT update profile
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params
    const { username, email } = req.body

    // VULNERABILITY: Broken Access Control — แก้ profile คนอื่นได้
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { username, email },
      select: { id: true, username: true, email: true }
    })

    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message, stack: error.stack })
  }
}

module.exports = { getProfile, updateProfile }