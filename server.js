import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { cleanChunkWithAI, formatFinalNotes } from "./ai.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("LearnNova Backend Running ✅");
});

app.post("/generate-notes", async (req, res) => {
  try {
    const { sources, focus } = req.body;

    if (!sources || sources.length === 0) {
      return res.status(400).json({ error: "No sources provided" });
    }

    // ✅ Combine content
    const fullContent = sources
      .map((s) => s.content)
      .join("\n\n");

    // ✅ Safe chunk size (smaller than before)
    const CHUNK_SIZE = 12000;
    const chunks = [];

    for (let i = 0; i < fullContent.length; i += CHUNK_SIZE) {
      chunks.push(fullContent.slice(i, i + CHUNK_SIZE));
    }

    console.log(`Processing ${chunks.length} chunks`);

    // ✅ Stage 1: Clean & Extract Academic Content
    let mergedContent = "";

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Cleaning chunk ${i + 1}/${chunks.length}`);

      const cleaned = await cleanChunkWithAI({
        content: chunks[i],
        focus,
      });

      mergedContent += "\n\n" + cleaned;
    }

    // ✅ Stage 2: Final Publishing Formatter
    console.log("Formatting final notes...");

    const finalNotes = await formatFinalNotes({
      content: mergedContent.trim(),
      focus,
    });

    return res.json({ notes: finalNotes });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});