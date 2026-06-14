import express from 'express'
import cors from 'cors'
import path from 'path'
import dreamsRouter from './routes/dreams'
import aiRouter from './routes/ai'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/dreams', dreamsRouter)
app.use('/api/ai', aiRouter)

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist')
app.use(express.static(clientDist))
app.use((_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`🌠 WE-AIGO API running at http://localhost:${PORT}`)
})
