import sqlite3 from "sqlite3";
import { open } from "sqlite";

const run = async () => {
  const db = await open({ filename: "./data.db", driver: sqlite3.Database });
  try {
    await db.exec(`ALTER TABLE clients ADD COLUMN voice_tier TEXT DEFAULT 'standard';`);
  } catch (e) {
    if (!String(e.message).includes('duplicate column')) console.log(e.message);
  }
  try {
    await db.exec(`ALTER TABLE clients ADD COLUMN voice_name TEXT;`);
  } catch (e) {
    if (!String(e.message).includes('duplicate column')) console.log(e.message);
  }
  console.log("✅ Columns ensured: voice_tier, voice_name");
  await db.close();
};

run().catch(err => { console.error(err); process.exit(1); });
