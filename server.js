import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// ✅ Health check
app.get('/', (req, res) => {
  res.send('LearnNovaAI Backend Running ✅')
})


// ✅ NOTES GENERATION ROUTE
app.post('/generate-notes', async (req, res) => {
  try {
    const { sources, focus } = req.body

    if (!sources || sources.length === 0) {
      return res.status(400).json({ error: 'No sources provided' })
    }

    const content = sources
      .map((s, i) => `--- SOURCE ${i + 1}: ${s.name} ---\n${s.content}`)
      .join('\n\n')
      .slice(0, 150000)   // ✅ Large allowed

    const prompt = `
You are generating CLASS NOTES for a CA Inter Law student.

${focus ? `FOCUS: ${focus}` : ''}

STRICT RULES:
- Use ONLY provided content
- Structured notes
- Bullet points
- Keep section numbers exactly
- No storytelling

CONTENT:
${content}
`

    // ✅ Call Gemini
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )

    const data = await geminiRes.json()

    if (!geminiRes.ok) {
      console.error(data)
      return res.status(500).json({ error: 'AI generation failed' })
    }

    const notes =
      data.candidates?.[0]?.content?.parts?.[0]?.text || 'No notes generated.'

    res.json({ notes })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})


// ✅ Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})