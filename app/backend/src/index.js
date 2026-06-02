const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth.routes')
const noteRoutes = require('./routes/note.routes')
const searchRoutes = require('./routes/search.routes')
const profileRoutes = require('./routes/profile.routes')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/notes', noteRoutes)
app.use('/search', searchRoutes)
app.use('/users', profileRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'VulnLab API is running 🚀' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app