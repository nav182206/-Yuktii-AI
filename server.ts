import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Database from "better-sqlite3";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("credlens.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT, -- 'admin', 'employee', 'owner'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT,
    owner_id TEXT,
    status TEXT, -- 'active', 'pending'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    company_id TEXT,
    status TEXT, -- 'Step 1: Document Verification', 'Step 2: Site Visit Pending', etc.
    risk_score REAL,
    cam_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    application_id TEXT,
    type TEXT, -- 'structured', 'unstructured'
    name TEXT,
    url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(application_id) REFERENCES applications(id)
  );
`);

// Seed default users if empty
const userCount = db.prepare("SELECT count(*) as count FROM users").get().count;
if (userCount === 0) {
  db.prepare("INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)")
    .run("u1", "admin@bank.com", "admin123", "Super Admin", "admin");
  db.prepare("INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)")
    .run("u2", "employee@bank.com", "bank123", "Credit Officer", "employee");
  db.prepare("INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)")
    .run("u3", "owner@company.com", "owner123", "Company Promoter", "owner");
  
  // Seed a sample company and application
  db.prepare("INSERT INTO companies (id, name, owner_id, status) VALUES (?, ?, ?, ?)")
    .run("c1", "Acme Corp", "u3", "active");
  db.prepare("INSERT INTO applications (id, company_id, status, risk_score) VALUES (?, ?, ?, ?)")
    .run("a1", "c1", "Step 1: Document Verification Complete", 72.5);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      // In a real app, use sessions or JWT. For this demo, we'll return user info.
      res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // Management Routes (Super Admin)
  app.get("/api/admin/companies", (req, res) => {
    const companies = db.prepare("SELECT * FROM companies").all();
    res.json(companies);
  });

  app.post("/api/admin/companies", (req, res) => {
    const { id, name, owner_id } = req.body;
    db.prepare("INSERT INTO companies (id, name, owner_id, status) VALUES (?, ?, ?, ?)")
      .run(id, name, owner_id, "active");
    res.json({ success: true });
  });

  // Verifier Routes (Bank Employee)
  app.get("/api/employee/applications", (req, res) => {
    const apps = db.prepare(`
      SELECT a.*, c.name as company_name 
      FROM applications a 
      JOIN companies c ON a.company_id = c.id
    `).all();
    res.json(apps);
  });

  // Customer Routes (Company Owner)
  app.get("/api/owner/status/:ownerId", (req, res) => {
    const status = db.prepare(`
      SELECT a.*, c.name as company_name 
      FROM applications a 
      JOIN companies c ON a.company_id = c.id 
      WHERE c.owner_id = ?
    `).get(req.params.ownerId);
    res.json(status);
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
