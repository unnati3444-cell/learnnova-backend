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

    // ✅ Combine all content
    const fullContent = sources
      .map((s, i) => `--- SOURCE ${i + 1}: ${s.name} ---\n${s.content}`)
      .join('\n\n')

    // ✅ Safe chunk size (important)
    const CHUNK_SIZE = 40000   // ~10k tokens approx
    const chunks = []

    for (let i = 0; i < fullContent.length; i += CHUNK_SIZE) {
      chunks.push(fullContent.slice(i, i + CHUNK_SIZE))
    }

    console.log(`Processing ${chunks.length} chunks`)

    let finalNotes = ''

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`)

      const prompt = `
You are generating structured CA Inter Law class notes.

${focus ? `FOCUS: ${focus}` : ''}

STRICT RULES:
- Use ONLY provided content
- Structured notes
- Bullet points
- Preserve section numbers
- No outside knowledge

SOURCE MATERIAL:
${chunks[i]}
`

      let result

      try {
        result = await generateAILong({
          prompt,
          maxTokens: 8192,
        })
      } catch (aiError) {
        console.error(`Chunk ${i + 1} failed:`, aiError)
        return res.status(500).json({ error: "AI generation failed" })
      }

      finalNotes += `\n\n--- PART ${i + 1} ---\n\n`
      finalNotes += result.text
    }

    return res.json({ notes: finalNotes.trim() })

  } catch (err) {
    console.error("Server Error:", err)
    return res.status(500).json({ error: "Server error" })
  }
})


// ✅ Start server
const PORT = process.env.PORT || 8080

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})