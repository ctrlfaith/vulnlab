const express = require('express')
const { search } = require('../controllers/search.controller')
const { authenticate } = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/', authenticate, search)

module.exports = router