const { verifyToken } = require('../utils/auth')

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    req.user = decoded
    next()
  } catch (error) {
    // ⚠️ VULNERABILITY: expose token error details
    res.status(401).json({ message: 'Invalid token', error: error.message })
  }
}

module.exports = { authenticate }