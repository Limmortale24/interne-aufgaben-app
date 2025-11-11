# Interne Aufgaben-App • WhatsApp (Cloud API)

Direktes Senden von WhatsApp-Nachrichten an bis zu **49 Teilnehmer** (Gruppen: Housekeeping, Technik, Rezeption, Geschäftsführung).
Die **Geschäftsführung** wird automatisch als CC mit aufgenommen.

## Hinweise
- **Freitext** außerhalb des 24‑Std.-Fensters erfordert **genehmigte Vorlagen** (Templates). Das Beispiel sendet Freitext (`type: text`).
- Benötigt:
  - `WHATSAPP_TOKEN` (Permanent Token)
  - `WABA_PHONE_NUMBER_ID` (WhatsApp-Nummern-ID)

## Setup lokal
```bash
npm install
cp .env.example .env  # .env mit Token/ID füllen
npm start             # http://localhost:3000
```

## Anpassen
- Gruppen/Limit: `public/app.jsx` und `server.js` (`GROUPS`, `MAX_PARTICIPANTS`).
- Für Templates statt Freitext Payload in `server.js` von `type: "text"` auf `type: "template"` ändern.
