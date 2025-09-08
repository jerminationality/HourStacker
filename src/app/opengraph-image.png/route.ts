import { NextRequest } from 'next/server';

// Simple dynamically generated PNG fallback (served as an SVG converted by browsers) for rich link previews.
// For more advanced rendering, integrate @vercel/og and change content-type appropriately.
export const runtime = 'edge';

export async function GET(_req: NextRequest) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#415A77" />
        <stop offset="100%" stop-color="#1B263B" />
      </linearGradient>
      <style>
        .title { font: 700 88px 'PT Sans', 'Arial', sans-serif; fill: #E0E1DD; }
        .subtitle { font: 400 36px 'PT Sans', 'Arial', sans-serif; fill: #E0E1DD; opacity: 0.85; }
        .badge { font: 600 24px 'PT Sans', 'Arial', sans-serif; fill: #E0E1DD; }
      </style>
    </defs>
    <rect width="1200" height="630" fill="url(#g)" />
    <circle cx="1080" cy="120" r="80" fill="#E0E1DD" fill-opacity="0.06" />
    <circle cx="150" cy="500" r="120" fill="#E0E1DD" fill-opacity="0.05" />
    <text x="80" y="240" class="title">HourStacker</text>
    <text x="82" y="320" class="subtitle">Track and visualize your work hours</text>
    <rect x="82" y="360" rx="10" ry="10" width="360" height="54" fill="#778DA9" />
    <text x="102" y="398" class="badge">Fast • Local • PWA</text>
  </svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
    }
  });
}
