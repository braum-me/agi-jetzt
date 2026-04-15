# Routine: Weekly Briefing (Draft)

**Trigger:** Schedule — jeden Freitag 10:00 CEST
**Output:** Ein neuer Markdown-File in `src/content/briefing/kw-NN-YYYY.md`
**PR-Label:** `content`, `draft`
**Erwartung:** Rohentwurf — Stefan schreibt den Feinschliff manuell vor Merge.

---

## Dein Auftrag

Recherchiere die wichtigsten KI-Entwicklungen der **aktuellen Kalenderwoche**
(Montag–Donnerstag) und erzeuge daraus einen Rohentwurf für das wöchentliche
Briefing auf agi.jetzt.

Du bist ein **Recherche-Assistent**, kein Ghostwriter. Liefere faktisch präzise,
quellenbasierte Bausteine. Stefan formt danach die finale redaktionelle Fassung.

## Schritt 1 — Kontext erfassen

1. Ermittle die aktuelle ISO-Kalenderwoche (`date +%V`).
2. Datum des kommenden Freitags berechnen (Format: `YYYY-MM-DD`).
3. Lies `automation/tasks/weekly-briefing-draft.md` (dieses File) damit du das
   Format kennst.
4. Lies das **letzte veröffentlichte Briefing** in `src/content/briefing/` (höchste KW-Nummer).
   Das ist dein Stil-Referenz: Tonfall, Absatz-Länge, Tabellen-Verwendung, Footer.

## Schritt 2 — Recherche

Nutze **WebSearch gegen folgende Primärquellen**:

| Kategorie                    | Quellen                                                                                   |
|------------------------------|-------------------------------------------------------------------------------------------|
| Lab-Releases                 | anthropic.com/news, openai.com/blog, deepmind.google/discover/blog, xai.news, mistral.ai/news |
| Tech-News                    | techcrunch.com (Kategorie: artificial-intelligence), theverge.com/ai-artificial-intelligence, semafor.com/technology |
| Business / Funding           | bloomberg.com (Kategorie: AI), reuters.com/technology/artificial-intelligence, ft.com/artificial-intelligence |
| Research                     | arxiv.org/list/cs.AI/recent, 9to5google.com (für Google-Announcements), venturebeat.com/ai |
| Policy / Regulation          | artificialintelligenceact.eu, whitehouse.gov (Executive Orders), federalregister.gov      |
| Safety / Incidents           | incidentdatabase.ai, safe.ai, aisi.gov.uk                                                  |

**Zeitfilter:** ausschließlich Events der aktuellen Woche (Mo–Do). Keine Re-runs älterer Storys.

**Mindestens 8 Stories** identifizieren, daraus die **Top-Story** auswählen nach Kriterium:
- Strukturelle Relevanz für AGI-Entwicklung > Aufmerksamkeit
- Messbare Fakten > Gerüchte
- Direkte Auswirkung auf Dashboard-Kennzahlen bevorzugt (Benchmarks, Funding, Governance)

## Schritt 3 — Frontmatter schreiben

```yaml
---
title: "KI-Briefing KW NN/YYYY"
subtitle: "<ein Satz, Topstory-Kernaussage>"
date: YYYY-MM-DD    # der kommende Freitag
kw: NN              # ohne führende 0
year: YYYY
author: "Stefan Braum"
summary: "<1-2 Sätze, max 250 Zeichen, elevator pitch der Ausgabe>"
topStory: "<präziser Topstory-Titel, max 80 Zeichen>"
statsHighlight:
  value: "<Zahl/Wert — z.B. '$122 Mrd.' oder '94.3 %'>"
  label: "<Bedeutung in 3-5 Wörtern>"
  context: "<Einordnung in 1 Satz, Quelle in Klammern>"
tags:
  - <tag1>    # 3-6 tags aus: openai, anthropic, deepmind, meta, xai, mistral, funding,
  - <tag2>    # safety, benchmark, china, eu-ai-act, regulation, opensource, hardware,
  - <tag3>    # deepseek, robotics, etc.
draft: true   # IMMER draft=true — Stefan setzt vor Merge auf false
---
```

## Schritt 4 — Body-Struktur (Markdown)

**Exakt diese Abschnitte, in dieser Reihenfolge:**

```markdown
## Das Wichtigste in 30 Sekunden

- **<Bold-Lead Topstory>** — <1 Satz Kernaussage mit Zahl>.
- **<Bold-Lead Nebenstory 1>** — <1 Satz>.
- **<Bold-Lead Nebenstory 2>** — <1 Satz>.
- **<Bold-Lead Nebenstory 3>** — <1 Satz>.

## <Topstory-Headline>

<4–6 Absätze, je 3–5 Sätze>

<Absatz 1: Was ist passiert, wer hat es gemacht, wann>
<Absatz 2: Harte Fakten — Zahlen, Quellen inline verlinkt>
<Absatz 3: Strategische Einordnung — warum relevant>
<Absatz 4: Zweitmeinung / Counter-Position / Unsicherheit>
<Absatz 5 optional: Was passiert als Nächstes, Prognose>

## Kurz notiert

**<Bold-Lead 1.>** <1 Absatz, 2-4 Sätze, inline-Link zur Quelle>

**<Bold-Lead 2.>** <1 Absatz>

**<Bold-Lead 3.>** <1 Absatz>

**<Bold-Lead 4.>** <1 Absatz>

**<Bold-Lead 5.>** <1 Absatz>

## Zahl der Woche

**<Wert>** — <Ausführliche Einordnung in 3-5 Sätzen. Dieselbe Zahl wie im Frontmatter statsHighlight, aber als Erzählung ausgebaut. Mit Vergleich/Kontext/Quelle.>

## Leseempfehlung

**„<Artikel-/Paper-Titel>"** (<Quelle>, <Datum>). <1-2 Sätze: warum diese eine Quelle die Woche zusammenfasst. Link als `[…](URL)`.>

---

*Dieses Briefing erscheint jeden Freitag auf agi.jetzt — schau regelmäßig vorbei. Alle Daten live im [Dashboard →](/dashboard)*
```

## Schritt 5 — Qualitätsregeln (harte Guardrails)

**Diese Regeln sind nicht verhandelbar. Verstoß = PR nicht mergen:**

1. **Jede Zahl + jede Behauptung braucht einen inline-markdown-Link** zur Primärquelle.
   Form: `[Quelle](https://…)` oder `[Quelle ↗](https://…)`.
2. **Mindestens 8 verschiedene externe URLs** im gesamten Body.
3. **Keine Zahlen ohne Datum des Abrufs oder Zeitstempel der Quelle.**
   Wenn die Quelle kein Datum zeigt: Zahl nicht verwenden.
4. **Keine Pressemitteilungs-Floskeln.** „Game-changer", „revolutionary",
   „industry-leading" → raus. Sachlich-nüchtern, siehe KW 16/2026 als Referenz.
5. **Sprache:** Deutsch. Fachbegriffe (WAU, MAU, SOTA, RLHF) sind OK,
   werden aber auf erste Erwähnung kurz erklärt.
6. **Keine Duplikate** zur Vorwoche. Prüfe das letzte Briefing — Topstory darf
   nicht wiederholt werden, außer es gab in dieser Woche einen echten neuen Entwicklungsschritt.
7. **`draft: true`** im Frontmatter. IMMER. Stefan entscheidet manuell über Publish.

## Schritt 6 — Commit & PR

**Branch:** `automated/briefing-kw-NN-YYYY`

**Commit-Message:**
```
🤖 draft: KI-Briefing KW NN/YYYY

Topstory: <Titel>

Storys (N):
- [<Titel>](<URL>) — <Quelle, Datum>
- [<Titel>](<URL>) — <Quelle, Datum>
- ...

Zahl der Woche: <Wert> — <Quelle>
Leseempfehlung: <Titel> (<Quelle>)

Quellen gesamt: <N distinct URLs>
Status: draft=true → review & finalize before merge
```

**PR-Title:** `🤖 Briefing KW NN/YYYY — draft`

**PR-Body:**
```markdown
## Draft Weekly Briefing KW NN/YYYY

Topstory: **<Titel>**

### Stories mit Quellen

1. [<Titel>](<URL>) — <Quelle, Datum>
2. ...

### Reviewer-Checklist
- [ ] Topstory ist die richtige Wahl? (nicht doppelt mit letzter KW)
- [ ] Alle Zahlen stimmen mit Quellen überein?
- [ ] Tonfall sachlich, keine Marketing-Floskeln?
- [ ] statsHighlight ist der stärkste Datenpunkt der Woche?
- [ ] Zeitform konsistent (Präteritum für Ereignisse, Präsens für Einordnung)?
- [ ] Wörterzahl ~900–1300?
- [ ] `draft: true` vor Merge auf `false` setzen.

/label ~content ~draft ~weekly
```

## Schritt 7 — Nicht tun

- **Niemals** `draft: false` setzen. Das ist Stefans Entscheidung.
- **Niemals** Dashboard-JSONs aus diesem Task mit-bearbeiten. Nur die Briefing-MD.
- **Niemals** mehrere Briefings in einem Run. Genau eine KW pro Run.
- **Niemals** Halluzinieren von Releases/Announcements, die du nicht mit mindestens einer Quelle belegen kannst.
- **Niemals** US-Datumsformat (MM/DD/YYYY). Immer ISO oder deutsch.
- **Niemals** direkt auf `main` committen.
