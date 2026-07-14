import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { generateAILong } from './ai.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// ✅ Test route
app.get('/', (req, res) => {
  res.send('LearnNova Backend Running ✅')
})


// ✅ Notes Route
app.post('/generate-notes', async (req, res) => {
  try {
    const { sources, focus } = req.body

    if (!sources || sources.length === 0) {
      return res.status(400).json({ error: 'No sources provided' })
    }

    const content = sources
      .map((s, i) => `--- SOURCE ${i + 1}: ${s.name} ---\n${s.content}`)
      .join('\n\n')
      .slice(0, 200000)  // Large allowed ✅

    const prompt = `
You are generating CLASS NOTES.

${focus ? `FOCUS: ${focus}` : ''}

Strict structured notes.
Use only provided content.
Use bullet points.
No outside knowledge.

SOURCE MATERIAL:
${content}
`

    const { text } = await generateAILong({
      prompt,
      maxTokens: 65536,
    })

    res.json({ notes: text })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})


// ✅ Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})