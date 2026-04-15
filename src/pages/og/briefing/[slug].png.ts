import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { Resvg } from '@resvg/resvg-js';

export async function getStaticPaths() {
  const now = new Date();
  const briefings = await getCollection('briefing', ({ data }) => !data.draft && data.date.valueOf() <= now.valueOf());
  return briefings.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

const PAPER = '#f5f1e8';
const INK = '#1a1814';
const ACCENT = '#5b3aa3';
const BURGUNDY = '#8b2c4d';
const MUTED = 'rgba(26,24,20,0.55)';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Naive word-wrap by max characters per line (works for German display font at given size)
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (trial.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = trial;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length + 1) {
    const last = lines[lines.length - 1];
    if (last.length > maxChars - 1) lines[lines.length - 1] = last.slice(0, maxChars - 1) + '…';
    else lines[lines.length - 1] = last + '…';
  }
  return lines;
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: Awaited<ReturnType<typeof getCollection>>[number] };
  const data = entry.data;
  const subtitleLines = wrap(data.subtitle, 32, 3);
  const stat = data.statsHighlight;
  const dateStr = data.date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="paperGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${PAPER}"/>
      <stop offset="100%" stop-color="#efe9dc"/>
    </linearGradient>
    <linearGradient id="accentLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${BURGUNDY}"/>
      <stop offset="100%" stop-color="${ACCENT}"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#paperGrad)"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="1200" height="6" fill="url(#accentLine)"/>

  <!-- Brand -->
  <g transform="translate(72, 70)">
    <circle cx="18" cy="18" r="18" fill="${INK}"/>
    <text x="50" y="26" font-family="Georgia, serif" font-size="26" font-weight="500" fill="${INK}">
      agi<tspan fill="${MUTED}">.</tspan><tspan font-style="italic">jetzt</tspan>
    </text>
  </g>

  <!-- KW eyebrow -->
  <g transform="translate(72, 156)">
    <rect x="0" y="-22" width="180" height="32" rx="16" fill="${BURGUNDY}" opacity="0.12"/>
    <text x="14" y="-2" font-family="ui-monospace, 'JetBrains Mono', monospace" font-size="12" letter-spacing="3" fill="${BURGUNDY}" font-weight="600">
      KW ${String(data.kw).padStart(2, '0')} · ${data.year}
    </text>
  </g>

  <!-- Subtitle (headline) -->
  <g transform="translate(72, 220)" font-family="Georgia, 'Instrument Serif', serif" fill="${INK}" font-weight="400">
    ${subtitleLines.map((line, i) => `<text x="0" y="${i * 78}" font-size="64" font-style="italic">${escapeXml(line)}</text>`).join('\n    ')}
  </g>

  <!-- Stat highlight -->
  <g transform="translate(72, 470)">
    <text x="0" y="0" font-family="ui-monospace, monospace" font-size="11" letter-spacing="3" fill="${MUTED}" font-weight="600">ZAHL DER WOCHE</text>
    <text x="0" y="60" font-family="Georgia, serif" font-size="56" fill="${ACCENT}" font-weight="500">${escapeXml(stat.value)}</text>
    <text x="0" y="92" font-family="system-ui, sans-serif" font-size="18" fill="${INK}" opacity="0.75">${escapeXml(stat.label.length > 60 ? stat.label.slice(0, 58) + '…' : stat.label)}</text>
  </g>

  <!-- Bottom meta strip -->
  <g transform="translate(0, 580)">
    <line x1="72" y1="0" x2="1128" y2="0" stroke="${INK}" stroke-opacity="0.12" stroke-width="1"/>
    <text x="72" y="30" font-family="ui-monospace, monospace" font-size="13" letter-spacing="2" fill="${INK}" opacity="0.7">${escapeXml(dateStr)} · ${escapeXml(data.author)}</text>
    <text x="1128" y="30" font-family="ui-monospace, monospace" font-size="13" letter-spacing="2" fill="${BURGUNDY}" opacity="0.85" text-anchor="end" font-weight="600">agi.jetzt/briefing</text>
  </g>
</svg>`;

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true },
  })
    .render()
    .asPng();

  return new Response(png, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
