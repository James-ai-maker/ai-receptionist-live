// ✅ Load environment variables
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import bcrypt from "bcryptjs";
import { initDB } from "./database.js";

// ✅ Setup Express & Paths
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// serve files from /public (signup.html, thank-you.html, voices, etc.)
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

// ✅ Database Init (but don't crash app if DB fails on Render)
let db = null;
try {
  db = await initDB();
  console.log("✅ Database initialised");
} catch (err) {
  console.error("❌ Database init failed. App will run without DB.", err);
}

// ✅ OpenAI Setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ==========================================================
// 🌐 BASIC PAGES
// ==========================================================

// Home → redirect to signup
app.get("/", (req, res) => {
  res.redirect("/signup");
});

// Signup page – serves public/signup.html
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

// Thank-you page – serves public/thank-you.html
app.get("/thank-you", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "thank-you.html"));
});

// ==========================================================
// 🤖 AI CHAT ROUTE
// ==========================================================
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  try {
    console.log("🗣️ Received message from user:", message);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a polite, helpful AI receptionist." },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion?.choices?.[0]?.message?.content ||
      "Sorry, I couldn’t generate a reply.";

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ reply: "Something went wrong." });
  }
});

// ==========================================================
// 📅 BOOKING ROUTE (no external API yet)
// ==========================================================
function formatDateForSpeech(isoString) {
  try {
    const date = new Date(isoString);
    const day = date.getDate();
    const month = date.toLocaleString("en-GB", { month: "long" });

    let hours = date.getHours();
    let minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";

    return `${day}${suffix} of ${month} at ${hours}:${minutes} ${ampm}`;
  } catch {
    return isoString;
  }
}

app.post("/book", async (req, res) => {
  try {
    const { summary, start, end } = req.body;
    if (!summary || !start || !end) {
      return res
        .status(400)
        .json({ reply: "⚠️ Please fill in all booking details." });
    }

    const spokenDate = formatDateForSpeech(start);
    const message = `✅ I’ve scheduled “${summary}” for ${spokenDate}... 
If there’s anything more you need, I’m right here to help.`;

    res.json({ reply: message });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ reply: "❌ Sorry, booking failed." });
  }
});

// ==========================================================
// 🆕 HANDLE CLIENT SIGNUP FORM (FOR BUSINESSES)
// ==========================================================
app.post("/signup", async (req, res) => {
  try {
    const { company, email, phone, notes, plan, voice_tier, voice_name } = req.body;

    // Validate required fields
    if (!company || !email || !phone) {
      return res.status(400).send("⚠️ All required fields must be filled in.");
    }

    const combinedNotes =
      `Plan chosen: ${plan || "Not specified"}\n` +
      `Voice bundle: ${voice_tier || "Standard"}\n` +
      `Voice name: ${voice_name || "Not specified"}\n` +
      `Notes: ${notes || ""}`;

    if (db) {
      await db.run(
        "INSERT INTO clients (company, email, phone, greeting) VALUES (?, ?, ?, ?)",
        [company, email, phone, combinedNotes]
      );
      console.log("📌 New Client Signup saved:", {
        company,
        email,
        plan,
        voice_tier,
        voice_name,
      });
    } else {
      console.warn(
        "⚠️ DB not available. Signup not saved to DB.",
        { company, email, plan, voice_tier, voice_name }
      );
    }

    // Redirect to thank-you page with Calendly
    res.redirect("/thank-you");
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).send("❌ Something went wrong while saving your data.");
  }
});

// ==========================================================
// 🔊 TTS ROUTE — Coral (UK female), MP3 output
// ==========================================================
app.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "coral", // UK-ish, calm female voice
      input: text,
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
      "Cache-Control": "no-store",
    });
    res.send(audioBuffer);
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "TTS failed" });
  }
});

// ==========================================================
// 🚀 Start Server (Render-friendly)
// ==========================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ AI Receptionist running on port ${PORT}`)
);
