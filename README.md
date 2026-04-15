# agi.jetzt — Der Weg zur Allgemeinen Intelligenz

Live-Tracking der wichtigsten Technologierevolution unserer Zeit.

🔗 **Live:** [agi.jetzt](https://agi.jetzt)

## Was ist das?

Eine deutschsprachige, datengetriebene Website die den Fortschritt der Menschheit Richtung Künstlicher Allgemeiner Intelligenz (AGI) dokumentiert. Mit interaktiven Visualisierungen, einem AI Intelligence Dashboard, Deep-Dive-Artikeln und einem kuratierten News-Feed.

## Features

- 🧠 **Three.js Neural Mesh** — Interaktives 3D-Gehirn als Hero, reagiert auf Scroll
- 📊 **AI Dashboard** — 17 Widgets: KPIs, Benchmarks, Rankings, Funding, Compute, Adoption
- 📰 **News Feed** — Kuratierte AI-News auf Deutsch (Research · Industrie · Open Source · Politik · Produkt)
- 📈 **Deep Dives** — Kapital · Compute · Länder · Kontroversen · Glossar
- 🧩 **AGI Quiz** — "Wie AGI-ready bist du?"
- ⏱️ **AGI Countdown** — basierend auf Metaculus-Prognosen
- 🎨 **Editorial Design** — Cream/Beige Theme, Serif-Italic Akzente, Sans-Serif Headlines

## Tech Stack

- [Astro 5](https://astro.build) — Static Site Generator mit Islands-Architektur
- [Tailwind CSS 4](https://tailwindcss.com) — Styling via Vite-Plugin
- [Three.js](https://threejs.org) — 3D Neural Mesh (lazy-loaded)
- [GSAP](https://gsap.com) + ScrollTrigger — Scroll-Animationen
- [Apache ECharts 6](https://echarts.apache.org) — Dashboard-Charts (tree-shaken, IntersectionObserver-mount)
- [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) · [Inter Tight](https://fonts.google.com/specimen/Inter+Tight) · [JetBrains Mono](https://www.jetbrains.com/lp/mono/) — selbst gehostet (DSGVO)

## Lokale Entwicklung

```bash
# Dependencies
pnpm install

# Dev-Server (http://localhost:4321)
pnpm dev

# Production-Build
pnpm build

# Build-Preview
pnpm preview
```

Erfordert Node.js ≥ 20 und pnpm ≥ 9.

## Deploy

Das Projekt wird als Docker-Container deployed:

```bash
docker build -t agi-jetzt .
docker run -p 80:80 agi-jetzt
```

Nginx-Konfiguration mit gehärteten Security-Headers (CSP, HSTS, Permissions-Policy, COOP) liegt in `nginx.conf`.

## Projektstruktur

```
src/
├── components/        # Astro-Komponenten (Landing-Sections)
│   └── dashboard/     # Dashboard-Widgets + WidgetCard + Header
├── layouts/           # Layout.astro, DeepDiveLayout.astro
├── pages/             # 9 Routen: /, /dashboard, /quiz, /kapital,
│                      #   /laender, /compute, /kontroversen, /glossar, /404
├── data/              # JSON-Datenquellen (news, timeline, landscape, ...)
│   └── dashboard/     # 16 JSON-Files für Dashboard-Widgets
├── scripts/           # Three.js Hero, GSAP-ScrollTrigger, UI-Enhancements
└── styles/            # Tailwind + eigene CSS-Variablen (Cream-Theme)

public/
├── fonts/             # Self-hosted Variable Fonts (woff2)
├── logos/             # Brand-Logos (Landscape-Section, siehe public/logos/README.md)
└── og-*.svg/png       # 8 Open-Graph-Images (generiert via scripts/generate-og-images.mjs)
```

## Autor

**Stefan Braum** — IT-Architekt, AI-Enthusiast, Maker

- 🌐 [braum.consulting](https://braum.consulting)
- 💼 [LinkedIn](https://linkedin.com/in/stefanbraum)

## Lizenz

MIT — siehe [LICENSE](./LICENSE).
