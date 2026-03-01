import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Database from "better-sqlite3";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("campaigns.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    brief TEXT,
    strategy TEXT,
    reasoning TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS variants (
    id TEXT PRIMARY KEY,
    campaign_id TEXT,
    subject TEXT,
    body TEXT,
    segment TEXT,
    send_time TEXT,
    tone TEXT,
    strategy_focus TEXT,
    status TEXT,
    open_rate REAL DEFAULT 0,
    click_rate REAL DEFAULT 0,
    FOREIGN KEY(campaign_id) REFERENCES campaigns(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/campaigns", (req, res) => {
    const campaigns = db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC").all();
    res.json(campaigns);
  });

  app.get("/api/campaigns/:id", (req, res) => {
    const campaign = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id);
    const variants = db.prepare("SELECT * FROM variants WHERE campaign_id = ?").all(req.params.id);
    res.json({ ...campaign, variants });
  });

  app.post("/api/campaigns", (req, res) => {
    const { id, brief, strategy } = req.body;
    db.prepare("INSERT INTO campaigns (id, brief, strategy, reasoning, status) VALUES (?, ?, ?, ?, ?)")
      .run(id, brief, JSON.stringify(strategy), strategy.reasoning, "pending_approval");
    res.json({ success: true });
  });

  app.post("/api/variants", (req, res) => {
    const { variants } = req.body;
    const insert = db.prepare(`
      INSERT INTO variants (id, campaign_id, subject, body, segment, send_time, tone, strategy_focus, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const transaction = db.transaction((vars) => {
      for (const v of vars) {
        insert.run(v.id, v.campaign_id, v.subject, v.body, JSON.stringify(v.segment), v.send_time, v.tone, v.strategy_focus, "draft");
      }
    });
    
    transaction(variants);
    res.json({ success: true });
  });

  app.post("/api/campaigns/:id/approve", (req, res) => {
    db.prepare("UPDATE campaigns SET status = 'approved' WHERE id = ?").run(req.params.id);
    db.prepare("UPDATE variants SET status = 'scheduled' WHERE campaign_id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/variants/:id/metrics", (req, res) => {
    const { open_rate, click_rate } = req.body;
    db.prepare("UPDATE variants SET open_rate = ?, click_rate = ?, status = 'completed' WHERE id = ?")
      .run(open_rate, click_rate, req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
