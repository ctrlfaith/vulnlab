const { hashPassword, comparePassword, generateToken, verifyToken } = require('../../app/backend/src/utils/auth')

describe('Auth Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const hash = await hashPassword('password123')
      expect(hash).not.toBe('password123')
      expect(hash).toBeTruthy()
    })

    it('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword('password123')
      const hash2 = await hashPassword('password123')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const hash = await hashPassword('password123')
      const result = await comparePassword('password123', hash)
      expect(result).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const hash = await hashPassword('password123')
      const result = await comparePassword('wrongpassword', hash)
      expect(result).toBe(false)
    })
  })

  describe('generateToken', () => {
    it('should generate a JWT token', () => {
      const token = generateToken({ id: 1, username: 'testuser' })
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken({ id: 1, username: 'testuser' })
      const decoded = verifyToken(token)
      expect(decoded.id).toBe(1)
      expect(decoded.username).toBe('testuser')
    })

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalidtoken')).toThrow()
    })
  })
})