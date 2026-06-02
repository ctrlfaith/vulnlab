const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// GET all notes — VULNERABILITY: IDOR — คืน note ทั้งหมดรวม private ของคนอื่น ไม่ filter ownership
const getNotes = async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      include: { author: { select: { username: true } } }
    })
    res.json(notes)
  } catch (error) {
    res.status(500).json({ message: error.message, stack: error.stack })
  }
}

// GET single note by ID
const getNoteById = async (req, res) => {
  try {
    const { id } = req.params

    // VULNERABILITY: IDOR — ไม่ check ownership
    const note = await prisma.note.findUnique({
      where: { id: parseInt(id) },
      include: { author: { select: { username: true } } }
    })

    if (!note) {
      return res.status(404).json({ message: 'Note not found' })
    }

    res.json(note)
  } catch (error) {
    res.status(500).json({ message: error.message, stack: error.stack })
  }
}

// POST create note
const createNote = async (req, res) => {
  try {
    const { title, content, isPublic } = req.body

    // VULNERABILITY: ไม่ sanitize content → XSS
    const note = await prisma.note.create({
      data: {
        title,
        content,
        isPublic: isPublic || false,
        authorId: req.user.id
      }
    })

    res.status(201).json(note)
  } catch (error) {
    res.status(500).json({ message: error.message, stack: error.stack })
  }
}

// PUT update note
const updateNote = async (req, res) => {
  try {
    const { id } = req.params
    const { title, content, isPublic } = req.body

    // VULNERABILITY: IDOR — ไม่ check ownership
    const note = await prisma.note.update({
      where: { id: parseInt(id) },
      data: { title, content, isPublic }
    })

    res.json(note)
  } catch (error) {
    res.status(500).json({ message: error.message, stack: error.stack })
  }
}

// DELETE note
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params

    // VULNERABILITY: IDOR — ไม่ check ownership
    await prisma.note.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Note deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message, stack: error.stack })
  }
}

module.exports = { getNotes, getNoteById, createNote, updateNote, deleteNote }