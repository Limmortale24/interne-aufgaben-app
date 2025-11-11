import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({limit: "1mb"}));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const WABA_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WABA_PHONE_NUMBER_ID;

if (!WABA_TOKEN || !PHONE_NUMBER_ID) {
  console.warn("[WARN] Bitte .env ausfüllen: WHATSAPP_TOKEN und WABA_PHONE_NUMBER_ID");
}

// Normalize to E.164 digits without '+'
function normalizePhone(num) {
  if (!num) return "";
  const digits = String(num).replace(/\D/g, "");
  return digits;
}

const GROUPS = ["Housekeeping", "Technik", "Rezeption", "Geschäftsführung"];
const MAX_PARTICIPANTS = 49;

app.post("/api/send", async (req, res) => {
  try {
    const { senderId, message, targetType, targetGroup, participants } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Leerer Nachrichtentext" });
    }
    if (!Array.isArray(participants)) {
      return res.status(400).json({ error: "Teilnehmerliste fehlt" });
    }
    if (participants.length > MAX_PARTICIPANTS) {
      return res.status(400).json({ error: `Maximal ${MAX_PARTICIPANTS} Teilnehmer` });
    }

    // Sanitize participants
    const people = participants
      .map(p => ({
        id: p.id,
        name: String(p.name || "").trim(),
        group: GROUPS.includes(p.group) ? p.group : GROUPS[0],
        phone: normalizePhone(p.phone || ""),
      }))
      .filter(p => p.name && p.phone);

    const managers = people.filter(p => p.group === "Geschäftsführung");

    const base = targetType === "Gruppe"
      ? people.filter(p => p.group === targetGroup)
      : people;

    // Deduplicate by phone; include managers as CC
    const byPhone = new Map();
    for (const p of [...base, ...managers]) {
      if (!byPhone.has(p.phone)) byPhone.set(p.phone, p);
    }
    const recipients = Array.from(byPhone.values());

    const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;
    const headers = {
      Authorization: `Bearer ${WABA_TOKEN}`,
      "Content-Type": "application/json",
    };

    async function sendTo(recipient) {
      const payload = {
        messaging_product: "whatsapp",
        to: recipient.phone,
        type: "text",
        text: { body: message },
      };
      try {
        const { data } = await axios.post(url, payload, { headers });
        return { ok: True, recipient, response: data };
      } catch (err) {
        const msg = err?.response?.data || err.message;
        return { ok: False, recipient, error: msg };
      }
    }

    const results = [];
    for (const r of recipients) {
      const out = await sendTo(r);
      results.push(out);
      await new Promise(s => setTimeout(s, 150));
    }

    const summary = {
      count: recipients.length,
      ok: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length,
      results,
    };

    res.json(summary);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Unerwarteter Fehler" });
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
