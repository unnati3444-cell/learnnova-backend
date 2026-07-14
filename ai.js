import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Free Gemini models (try in this order)
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-flash-lite",
];

async function callGemini(prompt, maxTokens = 2000) {
  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`Trying Gemini model: ${modelName}`);

      const model = genAI.getGenerativeModel({
        model: modelName,
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.4,
        },
      });

      const text = result.response.text().trim();

      if (!text) throw new Error("Empty response");

      return text;

    } catch (err) {
      console.log(`Model failed: ${modelName}`);
    }
  }

  throw new Error("All Gemini models failed");
}

// ✅ Stage 1 – Clean Transcript
export async function cleanChunkWithAI({ content, focus }) {
  const prompt = `
You are an expert academic content extractor.

Extract ONLY academic study material from the following lecture transcript.

REMOVE:
- Teacher references
- YouTube references
- Feedback requests
- Motivational lines
- Repetition
- Series branding
- Transcript commentary

Keep:
- Definitions
- Sections
- Procedures
- Case laws
- Conditions
- Timelines
- Legal provisions

Return clean academic content only.

${focus ? `FOCUS AREA: ${focus}` : ""}

TRANSCRIPT:
${content}
`;

  return await callGemini(prompt, 1500);
}

// ✅ Stage 2 – Final Publishing Formatter
export async function formatFinalNotes({ content, focus }) {
  const prompt = `
You are an expert academic publishing formatter.

Transform the following academic content into PREMIUM, EDITORIAL-STYLE, EXAM-READY STUDY NOTES.

STRUCTURE:

1. Title Banner with emojis.
2. Brief Overview (2–4 lines).
3. Key Points (5–8 bullets).
4. Structured sections with emoji headers.
5. Convert procedures into tables where possible.
6. Add:
   - Timeline Summary table (if deadlines exist)
   - Practical Checklist
   - Key Takeaways

RULES:

- Bold important keywords.
- Highlight section numbers, forms, deadlines.
- Clean academic tone.
- No repetition.
- No teacher references.
- No YouTube references.
- No transcript phrases.
- No chunk markers.

${focus ? `FOCUS AREA: ${focus}` : ""}

CONTENT:
${content}
`;

  return await callGemini(prompt, 2500);
}