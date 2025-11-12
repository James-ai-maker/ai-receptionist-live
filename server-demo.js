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

// ✅ Serve signup page from file if present, otherwise inline HTML
app.get("/", (req, res) => {
  const fsPath = path.join(__dirname, "public", "signup.html");
  import("fs").then(fs => {
    fs.default.readFile(fsPath, "utf8", (err, html) => {
      if (!err && html) return res.type("html").send(html);
      // Inline minimal demo if file not found
      res.type("html").send(`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ReceptAInist — Live Demo</title>
<style>
  body{font-family:system-ui,Arial;background:#0c0b10;color:#fff;margin:0}
  .wrap{max-width:900px;margin:0 auto;padding:24px 16px 48px}
  h1{margin:8px 0 6px;font-size:28px;background:linear-gradient(135deg,#8c3dff,#ff3dbb);
     -webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .grid{display:grid;grid-template-columns:1.2fr 1fr;gap:18px}
  @media(max-width:900px){.grid{grid-template-columns:1fr}}
  .card{background:#121118;border:1px solid #2a2834;border-radius:14px;padding:16px}
  .messages{height:360px;overflow:auto;background:#0f0e15;border:1px solid #3a3747;border-radius:10px;padding:10px}
  .msg{margin:8px 0}.user{color:#b2d7ff}.bot{color:#baffc8}
  textarea,button{width:100%;padding:10px;border-radius:10px;border:1px solid #3a3747;background:#0f0e15;color:#fff}
  button{cursor:pointer;font-weight:800;background:linear-gradient(135deg,#8c3dff,#ff3dbb);border:none;margin-top:10px}
  a.btn{display:inline-block;text-decoration:none;padding:10px 14px;border-radius:999px;background:linear-gradient(135deg,#8c3dff,#ff3dbb);color:#fff;font-weight:800}
</style>
</head>
<body>
<div class="wrap">
  <h1>ReceptAInist — Live AI Receptionist Demo</h1>
  <div class="grid">
    <div class="card">
      <h2 style="margin:0 0 8px;">Quick Links</h2>
      <p><a class="btn" href="https://calendly.com/jamestempleman21/receiptainist-setup-call" target="_blank" rel="noopener">📅 Book a setup call</a></p>
      <p><a class="btn" href="https://buy.stripe.com/7sY14n4qGaZH04nh280ZW00" target="_blank" rel="noopener">Pay £299 Website Setup</a></p>
      <p><a class="btn" href="https://buy.stripe.com/9B63cve1gc3L3gz5jq0ZW01" target="_blank" rel="noopener">Pay £499 Telephone Setup</a></p>
      <p style="color:#aaa;font-size:12px">Standard voices: Derek, Clyde • Premium (+£49/mo): Blondi, Clara, Frederick Surry, Hope • Elite (+£99/mo): James, Jess, Lily</p>
    </div>
    <div class="card">
      <h2 style="margin:0 0 8px;">Chat with the receptionist</h2>
      <div id="messages" class="messages" aria-live="polite"></div>
      <textarea id="msg" placeholder="Ask opening hours, availability, pricing, etc."></textarea>
      <button id="sendBtn">Send</button>
    </div>
  </div>
</div>
<script>
  const $messages=document.getElementById('messages');
  const $msg=document.getElementById('msg');
  const $btn=document.getElementById('sendBtn');
  function addLine(t,c){const d=document.createElement('div');d.className='msg '+c;d.textContent=t;$messages.appendChild(d);$messages.scrollTop=$messages.scrollHeight;}
  async function send(){
    const text=$msg.value.trim(); if(!text) return;
    addLine('You: '+text,'user'); $msg.value='';
    try{
      const r=await fetch('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text})});
      const data=await r.json();
      addLine('Assistant: '+(data.reply||'No reply'),'bot');
    }catch(e){ addLine('Error talking to server.','bot'); }
  }
  $btn.addEventListener('click',send);
  $msg.addEventListener('keydown',e=>{ if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)) send(); });
</script>
</body></html>`);
    });
  });
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
