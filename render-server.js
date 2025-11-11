import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.redirect("/signup"));

app.get("/signup", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "signup.html"))
);

app.get("/thank-you", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "thank-you.html"))
);

app.post("/signup", (req, res) => {
  console.log("New signup:", req.body);
  res.redirect("/thank-you");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Minimal server running on port ${PORT}`));
