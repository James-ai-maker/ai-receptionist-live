import dotenv from "dotenv";
dotenv.config();

const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;

(async () => {
  try {
    console.log("🎤 Fetching available voices from ElevenLabs API...\n");

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
      },
    });

    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const data = await response.json();

    data.voices.forEach((v, i) => {
      console.log(`Voice ${i + 1}:`);
      console.log(`🗣️  Name: ${v.name}`);
      console.log(`💬  Accent: ${v.labels?.accent || "Unknown"}`);
      console.log(`🎧  Voice ID: ${v.voice_id}`);
      console.log("──────────────────────────────\n");
    });

    console.log(`✅ Total voices found: ${data.voices.length}`);
  } catch (err) {
    console.error("❌ Error listing voices:", err);
  }
})();
