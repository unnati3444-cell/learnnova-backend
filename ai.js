import Groq from 'groq-sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

const GROQ_PRIMARY = 'llama-3.3-70b-versatile'
const GROQ_FALLBACK = 'llama-3.1-8b-instant'

const OR_PRIMARY = 'meta-llama/llama-3.3-70b-instruct:free'
const OR_FALLBACK = 'qwen/qwen-2.5-72b-instruct:free'

function trimPrompt(prompt, maxChars) {
  if (prompt.length <= maxChars) return prompt
  return prompt.slice(0, maxChars)
}

async function callGemini(opts, model) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const m = genAI.getGenerativeModel({ model })

  const result = await m.generateContent({
    contents: [{ role: 'user', parts: [{ text: opts.prompt }] }],
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 8192,
      temperature: opts.temperature ?? 0.4,
    },
  })

  const text = result.response.text().trim()
  if (!text) throw new Error(`Empty Gemini (${model})`)
  return text
}

async function callGroq(opts, model, limit) {
  const completion = await groq.chat.completions.create({
    model,
    messages: [{ role: 'user', content: trimPrompt(opts.prompt, limit) }],
    max_tokens: Math.min(opts.maxTokens ?? 4096, 4096),
    temperature: opts.temperature ?? 0.4,
  })

  const text = completion.choices[0]?.message?.content?.trim()
  if (!text) throw new Error(`Empty Groq (${model})`)
  return text
}

async function callOpenRouter(opts, model) {
  const completion = await openrouter.chat.completions.create({
    model,
    messages: [{ role: 'user', content: opts.prompt }],
    max_tokens: opts.maxTokens ?? 8192,
    temperature: opts.temperature ?? 0.4,
  })

  const text = completion.choices[0]?.message?.content?.trim()
  if (!text) throw new Error(`Empty OpenRouter (${model})`)
  return text
}

export async function generateAILong(opts) {
  const attempts = [
    ...GEMINI_MODELS.map(m => () => callGemini(opts, m)),
    () => callOpenRouter(opts, OR_PRIMARY),
    () => callOpenRouter(opts, OR_FALLBACK),
    () => callGroq(opts, GROQ_PRIMARY, 20000),
    () => callGroq(opts, GROQ_FALLBACK, 10000),
  ]

  for (const fn of attempts) {
    try {
      const text = await fn()
      return { text }
    } catch (err) {
      console.log('Provider failed, trying next...')
    }
  }

  throw new Error('All AI providers failed')
}