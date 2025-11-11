/* eslint-disable no-unused-vars */
const { useState, useMemo, useEffect } = React;

const GROUPS = ["Housekeeping", "Technik", "Rezeption", "Geschäftsführung"];
const MAX_PARTICIPANTS = 49;

const LS_PARTICIPANTS = "ifa_participants_v1";
const LS_LOG = "ifa_log_v1";

const emptyParticipant = () => ({
  id: crypto.randomUUID(),
  name: "",
  group: GROUPS[0],
});

function App() {
  const [participants, setParticipants] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_PARTICIPANTS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [draft, setDraft] = useState(emptyParticipant());

  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("Alle"); // Alle | Gruppe
  const [targetGroup, setTargetGroup] = useState(GROUPS[0]);
  const [senderId, setSenderId] = useState("");

  const [log, setLog] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_LOG);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem(LS_PARTICIPANTS, JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem(LS_LOG, JSON.stringify(log));
  }, [log]);

  const managers = useMemo(
    () => participants.filter((p) => p.group === "Geschäftsführung"),
    [participants]
  );

  const recipients = useMemo(() => {
    const base =
      targetType === "Alle"
        ? participants
        : participants.filter((p) => p.group === targetGroup);
    const combined = [...base, ...managers];
    const dedup = [];
    const seen = new Set();
    for (const p of combined) {
      if (!p.name.trim()) continue;
      if (!seen.has(p.name)) {
        seen.add(p.name);
        dedup.push(p);
      }
    }
    return dedup;
  }, [participants, targetType, targetGroup, managers]);

  const remaining = MAX_PARTICIPANTS - participants.length;
  const canAdd = participants.length < MAX_PARTICIPANTS;

  function addParticipant() {
    if (!canAdd) return;
    if (!draft.name.trim()) return;
    setParticipants((prev) => [...prev, draft]);
    setDraft(emptyParticipant());
  }

  function removeParticipant(id) {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }

  function clearAll() {
    if (confirm("Alle Teilnehmer löschen?")) setParticipants([]);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(participants, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teilnehmer.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data)) {
          const sanitized = data
            .map((d) => ({
              id: crypto.randomUUID(),
              name: String(d.name || "").trim(),
              group: GROUPS.includes(d.group) ? d.group : GROUPS[0],
            }))
            .slice(0, MAX_PARTICIPANTS);
          setParticipants(sanitized);
        }
      } catch (err) {
        alert("Ungültige Datei");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function exportLog() {
    const blob = new Blob([JSON.stringify(log, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "verlauf.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function sendMessage() {
    if (!message.trim() || recipients.length === 0) return;
    const sender =
      participants.find((p) => p.id === senderId) || {
        id: null,
        name: "System",
        group: null,
      };

    const entry = {
      id: crypto.randomUUID(),
      text: message.trim(),
      ts: new Date().toISOString(),
      targetType,
      targetGroup: targetType === "Gruppe" ? targetGroup : null,
      sender: { id: sender.id, name: sender.name, group: sender.group },
      recipients: recipients.map((r) => ({
        id: r.id,
        name: r.name,
        group: r.group,
      })),
    };
    setLog((prev) => [entry, ...prev]);
    setMessage("");
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">
            Interne Aufgaben-App (ohne WhatsApp)
          </h1>
          <div className="text-sm text-slate-500">
            Bis zu {MAX_PARTICIPANTS} Teilnehmer
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Teilnehmer Verwaltung */}
          <section className="bg-white rounded-2xl shadow p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-3">
              Teilnehmer hinzufügen
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Name</label>
                <input
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2"
                  placeholder="z. B. Anna Müller"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Gruppe</label>
                <select
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2"
                  value={draft.group}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, group: e.target.value }))
                  }
                >
                  {GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex gap-3 items-center">
                <button
                  className={`px-4 py-2 rounded-xl text-white ${
                    canAdd ? "bg-slate-900" : "bg-slate-300"
                  }`}
                  onClick={addParticipant}
                  disabled={!canAdd}
                >
                  Hinzufügen
                </button>
                <span className="text-sm text-slate-500">
                  Verbleibend: {remaining}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-3 text-sm">
              <button className="px-3 py-2 rounded-xl border" onClick={exportJson}>
                Export
              </button>
              <label className="px-3 py-2 rounded-xl border cursor-pointer">
                Import
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={importJson}
                />
              </label>
              <button className="px-3 py-2 rounded-xl border" onClick={clearAll}>
                Alle löschen
              </button>
            </div>
          </section>

          {/* Teilnehmer Liste */}
          <section className="bg-white rounded-2xl shadow p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-3">
              Teilnehmerliste ({participants.length}/{MAX_PARTICIPANTS})
            </h2>
            {participants.length === 0 ? (
              <p className="text-sm text-slate-500">Noch keine Teilnehmer.</p>
            ) : (
              <ul className="divide-y">
                {participants.map((p) => (
                  <li
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.group}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-sm text-red-600"
                        onClick={() => removeParticipant(p.id)}
                      >
                        Entfernen
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Nachricht versenden */}
        <section className="bg-white rounded-2xl shadow p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-3">Nachricht erstellen</h2>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-sm mb-1">Absender</label>
                <select
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                >
                  <option value="">— System —</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.group})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Nachricht</label>
                <textarea
                  className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 min-h-[100px]"
                  placeholder="Text deiner Nachricht oder Aufgabe…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Ziel</label>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-2 rounded-xl border ${
                      targetType === "Alle" ? "bg-slate-900 text-white" : ""
                    }`}
                    onClick={() => setTargetType("Alle")}
                  >
                    Alle (Gesamt)
                  </button>
                  <button
                    className={`px-3 py-2 rounded-xl border ${
                      targetType === "Gruppe" ? "bg-slate-900 text-white" : ""
                    }`}
                    onClick={() => setTargetType("Gruppe")}
                  >
                    Gruppe
                  </button>
                </div>
              </div>
              {targetType === "Gruppe" && (
                <div>
                  <label className="block text-sm mb-1">Gruppierung</label>
                  <select
                    className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2"
                    value={targetGroup}
                    onChange={(e) => setTargetGroup(e.target.value)}
                  >
                    {GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="p-3 bg-slate-50 rounded-xl text-sm">
                <div className="font-medium">CC‑Regel</div>
                <p>
                  Die <strong>Geschäftsführung</strong> wird <em>immer</em>{" "}
                  automatisch mit einbezogen – unabhängig vom Ziel.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 p-3 bg-slate-50 rounded-xl text-sm">
            <div className="font-medium mb-1">
              Empfänger-Vorschau ({recipients.length})
            </div>
            {recipients.length === 0 ? (
              <p className="text-slate-500">
                Keine gültigen Empfänger. Bitte Teilnehmer anlegen.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                {recipients.map((p) => (
                  <div key={p.id} className="border rounded-xl px-3 py-2">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.group}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50"
              disabled={!recipients.length || !message.trim()}
              onClick={sendMessage}
            >
              Nachricht speichern & verteilen
            </button>
            <button
              className="px-4 py-2 rounded-xl border"
              onClick={() => navigator.clipboard.writeText(message)}
            >
              Nachricht kopieren
            </button>
          </div>
        </section>

        {/* Verlauf */}
        <section className="bg-white rounded-2xl shadow p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-3">Verlauf</h2>
          {log.length === 0 ? (
            <p className="text-sm text-slate-500">Noch keine Nachrichten.</p>
          ) : (
            <ul className="space-y-4">
              {log.map((entry) => (
                <li key={entry.id} className="border rounded-2xl p-4">
                  <div className="text-xs text-slate-500 mb-2">
                    {new Date(entry.ts).toLocaleString()}
                  </div>
                  <div className="text-sm mb-2">
                    <span className="font-medium">Absender: </span>
                    {entry.sender?.name || "System"}
                    {entry.sender?.group ? ` (${entry.sender.group})` : ""}
                  </div>
                  <div className="whitespace-pre-wrap">{entry.text}</div>
                  <div className="mt-3 text-sm">
                    <div className="font-medium">
                      Empfänger ({entry.recipients.length}):
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {entry.recipients.map((r) => (
                        <span
                          key={r.id}
                          className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs"
                        >
                          {r.name} • {r.group}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Ziel: {entry.targetType}
                      {entry.targetGroup ? ` • ${entry.targetGroup}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <button className="px-3 py-2 rounded-xl border" onClick={exportLog}>
              Verlauf exportieren
            </button>
          </div>
        </section>

        <footer className="text-xs text-slate-500 text-center pb-8">
          © {new Date().getFullYear()} – Statische Demo ohne Server; Daten bleiben lokal im Browser (localStorage).
        </footer>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
