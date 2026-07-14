import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // stable free model
});

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

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.3,
    },
  });

  return result.response.text().trim();
}

// ✅ Stage 2 – Premium Formatting Layer
export async function formatFinalNotes({ content, focus }) {
  const prompt = `
You are an expert academic publishing formatter.

Transform the following academic content into PREMIUM, EDITORIAL-STYLE, EXAM-READY STUDY NOTES.

STRUCTURE:

1. Title Banner with relevant emojis.
2. Brief Overview (2–4 lines only).
3. Key Points (5–8 concise bullets).
4. Structured numbered sections with emoji headers.
5. Convert procedural or comparative information into tables wherever possible.
6. Add:
   - Timeline Summary table (if deadlines exist)
   - Practical Checklist section (if procedural topic)
   - Key Takeaways section

FORMATTING RULES:

- Use emojis for major section headers (📘 📜 ⚖️ 📂 🏢 ✅ 📌 ⏱️ 📊 🔍).
- Bold important keywords, forms, section numbers, and deadlines.
- Keep paragraphs short.
- Clean academic tone.
- No repetition.

STRICTLY DO NOT INCLUDE:
- Teacher names
- YouTube references
- Motivational commentary
- Transcript phrases
- Chunk markers

${focus ? `FOCUS AREA: ${focus}` : ""}

CONTENT:
${content}
`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 3500,
      temperature: 0.4,
    },
  });

  return result.response.text().trim();
}