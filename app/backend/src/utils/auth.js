const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// ⚠️ VULNERABILITY: ใช้ bcrypt rounds น้อยมาก + เก็บ password แบบ weak hash
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 1)
}

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}

// ⚠️ VULNERABILITY: JWT secret อ่อนแอมาก
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d'
  })
}

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'secret')
}

module.exports = { hashPassword, comparePassword, generateToken, verifyToken }