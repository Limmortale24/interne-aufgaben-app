# Interne Aufgaben-App (ohne WhatsApp)

Statische Mini-Web-App für interne Nachrichten/Aufgaben mit Gruppen.

## Features
- Bis zu **49 Teilnehmer**
- Gruppen: **Housekeeping, Technik, Rezeption, Geschäftsführung**
- Ziel **Alle (Gesamt)** oder **eine Gruppe**
- **Geschäftsführung immer in Kopie**
- **Absender** auswählbar (jeder Teilnehmer oder „System“)
- **Verlauf** speichert: Text, Zeitpunkt, Absender, Ziel, Empfänger
- **Lokal** im Browser (localStorage), kein Server
- **Export/Import** von Teilnehmern (JSON) und Export des Verlaufs

## Nutzung (lokal)
1. Ordner downloaden / entpacken
2. Die Datei `index.html` im Browser öffnen

## Deployment auf GitHub Pages
1. Neues Repo erstellen, z. B. `interne-aufgaben-app`
2. Diese drei Dateien committen:
   - `index.html`
   - `app.jsx`
   - `README.md`
3. In den Repository-Einstellungen **Pages** aktivieren und den Branch `main` (root) auswählen.
4. Nach wenigen Minuten ist die Seite unter der von GitHub bereitgestellten URL erreichbar.

> Tipp: Da JSX im Browser via Babel kompiliert wird, ist kein Buildschritt nötig.
