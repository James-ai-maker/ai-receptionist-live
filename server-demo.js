import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve signup page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

// ✅ Simple chat endpoint (like your demo)
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a polite, helpful AI receptionist for a UK business." },
        { role: "user", content: message }
      ],
    });

    const reply = completion.choices?.[0]?.message?.content || "Sorry, I couldn’t generate a reply.";
    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ reply: "Error: Unable to connect to AI service." });
  }
});

// ✅ Optional text-to-speech route (keep if needed)
app.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "coral",
      input: text
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "TTS failed" });
  }
});

// ✅ Start the server (Render provides PORT automatically)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ AI Receptionist running on port ${PORT}`));
