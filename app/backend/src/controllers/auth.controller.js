const { PrismaClient } = require('@prisma/client')
const { hashPassword, comparePassword, generateToken } = require('../utils/auth')

const prisma = new PrismaClient()

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    // VULNERABILITY: ไม่มี input validation
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    })

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword }
    })

    const token = generateToken({ id: user.id, username: user.username })

    res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email } })
  } catch (error) {
    // VULNERABILITY: expose error details
    res.status(500).json({ message: error.message, stack: error.stack })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // VULNERABILITY: ไม่มี rate limiting
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isValid = await comparePassword(password, user.password)

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = generateToken({ id: user.id, username: user.username })

    res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
  } catch (error) {
    // VULNERABILITY: expose error details
    res.status(500).json({ message: error.message, stack: error.stack })
  }
}

module.exports = { register, login }