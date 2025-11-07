// server.js
require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

// optional: quick health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, port: process.env.PORT || 3001, hasKey: !!process.env.ALERTZY_KEY });
});

// ---- Alertzy proxy route (keeps your key secret) ----
app.post("/api/alertzy", async (req, res) => {
  try {
    const { title, message, priority = 1, group } = req.body || {};
    const form = new URLSearchParams();
    form.set("accountKey", process.env.ALERTZY_KEY);  // <-- from .env
    if (title) form.set("title", title);
    if (message) form.set("message", message);
    if (group) form.set("group", group);
    form.set("priority", String(priority));           // 0 normal, 1 high, 2 critical

    const r = await fetch("https://alertzy.app/send", { method: "POST", body: form });
    const data = await r.json().catch(() => ({}));

    if (!r.ok || data.response === "fail") {
      return res.status(400).json({ ok: false, error: data });
    }
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// Choose any port; we'll proxy to this from Vite
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Alertzy server running on :${PORT}`));
