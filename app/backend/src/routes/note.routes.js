const express = require('express')
const { getNotes, getNoteById, createNote, updateNote, deleteNote } = require('../controllers/note.controller')
const { authenticate } = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/', authenticate, getNotes)
router.get('/:id', authenticate, getNoteById)
router.post('/', authenticate, createNote)
router.put('/:id', authenticate, updateNote)
router.delete('/:id', authenticate, deleteNote)

module.exports = router