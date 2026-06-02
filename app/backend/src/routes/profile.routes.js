const express = require('express')
const { getProfile, updateProfile } = require('../controllers/profile.controller')
const { authenticate } = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/:id', authenticate, getProfile)
router.put('/:id', authenticate, updateProfile)

module.exports = router