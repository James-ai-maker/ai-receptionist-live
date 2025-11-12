import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OpenAI (Render: set OPENAI_API_KEY)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===========================
   HOME — serve file if present, else inline fallback
   =========================== */
app.get("/", (req, res) => {
  const fsPath = path.join(__dirname, "public", "signup.html");
  import("fs").then(fs => {
    fs.default.readFile(fsPath, "utf8", (err, html) => {
      if (!err && html) return res.type("html").send(html);
      // Inline fallback (works even with empty /public)
      res.type("html").send(`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ReceptAInist — Live Demo</title>
<style>
  body{font-family:system-ui,Arial;background:#0c0b10;color:#fff;margin:0}
  .wrap{max-width:1000px;margin:0 auto;padding:24px 16px 48px}
  h1{margin:8px 0 6px;font-size:28px;background:linear-gradient(135deg,#8c3dff,#ff3dbb);
     -webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .grid{display:grid;grid-template-columns:1.1fr 1fr;gap:18px}
  @media(max-width:900px){.grid{grid-template-columns:1fr}}
  .card{background:#121118;border:1px solid #2a2834;border-radius:14px;padding:16px}
  .messages{height:360px;overflow:auto;background:#0f0e15;border:1px solid #3a3747;border-radius:10px;padding:10px}
  .msg{margin:8px 0}.user{color:#b2d7ff}.bot{color:#baffc8}
  label{display:block;margin-top:10px;color:#ddd;font-weight:600}
  input,select,textarea,button{width:100%;padding:10px;border-radius:10px;border:1px solid #3a3747;background:#0f0e15;color:#fff}
  textarea{min-height:80px;resize:vertical}
  button{cursor:pointer;font-weight:800;background:linear-gradient(135deg,#8c3dff,#ff3dbb);border:none;margin-top:10px}
  a.btn{display:inline-block;text-decoration:none;padding:10px 14px;border-radius:999px;background:linear-gradient(135deg,#8c3dff,#ff3dbb);color:#fff;font-weight:800}
  .hint{color:#aaa;font-size:12px;margin-top:8px}
  .plans{display:flex;gap:12px;flex-wrap:wrap}
  .plan{flex:1 1 260px;background:#141320;border:1px solid #2a2834;border-radius:12px;padding:12px}
  .price{font-weight:800}
</style>
</head>
<body>
<div class="wrap">
  <h1>ReceptAInist — Live AI Receptionist Demo</h1>
  <div class="grid">
    <!-- Left: Pricing + Lead Form + CTAs -->
    <div class="card">
      <h2 style="margin:0 0 8px;">Plans</h2>
      <div class="plans">
        <div class="plan">
          <div>🌐 <b>Website Receptionist</b></div>
          <div class="price">£299 setup • £199/mo</div>
          <ul style="margin:8px 0 0 18px;">
            <li>24/7 lead capture on your site</li>
            <li>Answers FAQs, books calls</li>
            <li>Standard voices included</li>
          </ul>
          <p><a class="btn" href="https://buy.stripe.com/7sY14n4qGaZH04nh280ZW00" target="_blank" rel="noopener">Pay £299 setup</a></p>
        </div>
        <div class="plan">
          <div>📞 <b>Telephone Receptionist</b></div>
          <div class="price">£499 setup • £399/mo</div>
          <ul style="margin:8px 0 0 18px;">
            <li>Dedicated number, 24/7</li>
            <li>Qualifies & books appointments</li>
            <li>Premium/Elite voices available</li>
          </ul>
          <p><a class="btn" href="https://buy.stripe.com/9B63cve1gc3L3gz5jq0ZW01" target="_blank" rel="noopener">Pay £499 setup</a></p>
        </div>
      </div>

      <h3 style="margin:18px 0 8px;">Book a setup call</h3>
      <p><a class="btn" href="https://calendly.com/jamestempleman21/receiptainist-setup-call" target="_blank" rel="noopener">📅 Open Calendly</a></p>

      <p class="hint">Standard voices: Derek, Clyde • Premium (+£49/mo): Blondi, Clara, Frederick Surry, Hope • Elite (+£99/mo): James, Jess, Lily</p>

      <h3 style="margin:18px 0 8px;">Send your details</h3>
      <form method="POST" action="/lead" id="leadForm">
        <label>Business Name</label>
        <input name="company" required placeholder="Templeman AI">

        <label>Contact Name</label>
        <input name="contact_name" required placeholder="Your full name">

        <label>Email</label>
        <input type="email" name="email" required placeholder="you@business.com">

        <label>Phone</label>
        <input name="phone" required placeholder="+44 7xxx xxx xxx">

        <label>Plan</label>
        <select name="plan">
          <option>Website Receptionist</option>
          <option>Telephone Receptionist</option>
          <option>Both / not sure</option>
        </select>

        <label>Voice (optional)</label>
        <select name="voice_name">
          <option>Standard – Derek</option>
          <option>Standard – Clyde</option>
          <option>Premium – Blondi</option>
          <option>Premium – Clara</option>
          <option>Premium – Frederick Surry</option>
          <option>Premium – Hope</option>
          <option>Elite – James</option>
          <option>Elite – Jess</option>
          <option>Elite – Lily</option>
        </select>

        <label>Notes</label>
        <textarea name="notes" placeholder="Anything we should know?"></textarea>

        <button type="submit">Send my details</button>
        <p class="hint">We’ll email you a confirmation and next steps.</p>
      </form>
    </div>

    <!-- Right: Chat -->
    <div class="card">
      <h2 style="margin:0 0 8px;">Chat with the receptionist</h2>
      <div id="messages" class="messages" aria-live="polite"></div>
      <label for="msg">Your message</label>
      <textarea id="msg" placeholder="Ask opening hours, availability, pricing, etc."></textarea>
      <button id="sendBtn">Send</button>
      <p class="hint">This demo uses OpenAI live on the server you’re connected to.</p>
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

/* ===========================
   CHAT -> OpenAI
   =========================== */
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  console.log("🗣️ /chat message:", message);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a polite, helpful AI receptionist for a UK business. Keep replies concise and friendly. If asked to book, suggest using the setup call link." },
        { role: "user", content: String(message || "") }
      ],
    });

    const reply = completion.choices?.[0]?.message?.content || "Sorry, I couldn’t generate a reply.";
    return res.json({ reply });
  } catch (error) {
    console.error("❌ Chat error:", error?.response?.data || error?.message || error);
    return res.status(500).json({ reply: "Error: Unable to connect to AI service." });
  }
});

/* ===========================
   TTS (optional)
   =========================== */
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
    res.set({ "Content-Type": "audio/mpeg", "Content-Length": audioBuffer.length });
    res.send(audioBuffer);
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "TTS failed" });
  }
});

/* ===========================
   LEAD FORM -> email via Nodemailer
   =========================== */
app.post("/lead", async (req, res) => {
  try {
    const {
      company = "",
      contact_name = "",
      email = "",
      phone = "",
      plan = "",
      voice_name = "",
      notes = ""
    } = req.body || {};

    const subject = `New ReceptAInist lead: ${company || contact_name || email}`;
    const text =
`New lead from ReceptAInist
--------------------------------
Business: ${company}
Contact:  ${contact_name}
Email:    ${email}
Phone:    ${phone}
Plan:     ${plan}
Voice:    ${voice_name}
Notes:
${notes}
`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,          // e.g. "smtp.ionos.co.uk"
      port: Number(process.env.SMTP_PORT),  // e.g. 587
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"ReceptAInist" <${process.env.SMTP_USER}>`,
      to: process.env.LEAD_TO_EMAIL || process.env.SMTP_USER,
      subject,
      text,
    });

    return res.redirect("/thank-you");
  } catch (err) {
    console.error("❌ Lead email error:", err?.response || err?.message || err);
    return res.status(500).send("Could not send email right now.");
  }
});

/* ===========================
   THANK YOU PAGE
   =========================== */
app.get("/thank-you", (req, res) => {
  res.type("html").send(`
    <!doctype html>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Thanks — ReceptAInist</title>
    <body style="font-family:system-ui,Arial;background:#0c0b10;color:#fff;margin:0">
      <div style="max-width:800px;margin:0 auto;padding:32px 16px">
        <h1>Thanks — we’ve got your details.</h1>
        <p><a style="color:#8c3dff" href="https://calendly.com/jamestempleman21/receiptainist-setup-call" target="_blank" rel="noopener">Book your setup call</a></p>
        <p><a style="color:#8c3dff" href="/">← Back to demo</a></p>
      </div>
    </body>
  `);
});

/* ===========================
   START
   =========================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ AI Receptionist running on port ${PORT}`));
