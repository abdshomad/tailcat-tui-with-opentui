import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export interface ScreenshotOptions {
  type: 'tui' | 'web';
  module: string;
  feature: string;
  stepNumber: number;
  slug: string;
  width?: number;
  height?: number;
}

export class TerminalScreenshot {
  public static ansiToHtml(ansiText: string): string {
    let html = ansiText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Clean simulation-style color mapping (Transparent/Pure Black backgrounds only)
    const colors: Record<string, string> = {
      '30': '#71717a', '31': '#ef4444', '32': '#22c55e', '33': '#eab308',
      '34': '#3b82f6', '35': '#a855f7', '36': '#38bdf8', '37': '#f4f4f5',
      '90': '#71717a', '91': '#f87171', '92': '#4ade80', '93': '#fde047',
      '94': '#60a5fa', '95': '#c084fc', '96': '#38bdf8', '97': '#ffffff',
    };

    // Replace ANSI escape codes
    html = html.replace(/\x1b\[([0-9;]+)m/g, (_, codes) => {
      if (codes === '0') return '</span>';
      const parts = codes.split(';');
      let style = '';
      for (const p of parts) {
        if (p === '1') style += 'font-weight:bold;';
        if (p === '2') style += 'opacity:0.6;';
        if (colors[p]) {
          style += `color:${colors[p]};`;
        }
      }
      return `<span style="${style}">`;
    });

    return html;
  }

  public static captureTUIFrame(lines: string[], opts: ScreenshotOptions): string {
    const formattedHtml = lines.map(l => this.ansiToHtml(l)).join('\n');
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0;
    padding: 24px;
    background-color: #000000;
    color: #f4f4f5;
    font-family: 'JetBrains Mono', 'Fira Code', 'DejaVu Sans Mono', monospace;
    font-size: 14px;
    line-height: 1.35;
    letter-spacing: 0.5px;
  }
  .window {
    background: #09090b;
    border-radius: 8px;
    border: 1px solid #27272a;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
    padding: 16px;
    display: inline-block;
    min-width: 760px;
  }
  .window-header {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .dot-red { background: #3f3f46; }
  .dot-yellow { background: #3f3f46; }
  .dot-green { background: #38bdf8; }
  pre { margin: 0; white-space: pre; }
</style>
</head>
<body>
  <div class="window">
    <div class="window-header">
      <span class="dot dot-red"></span>
      <span class="dot dot-yellow"></span>
      <span class="dot dot-green"></span>
    </div>
    <pre>${formattedHtml}</pre>
  </div>
</body>
</html>`;

    return this.renderHtmlToWebp(fullHtml, opts);
  }

  public static renderHtmlToWebp(htmlContent: string, opts: ScreenshotOptions): string {
    const targetDir = resolve(
      process.cwd(),
      'screenshots',
      opts.type,
      opts.module,
      opts.feature
    );
    mkdirSync(targetDir, { recursive: true });

    const stepFormatted = String(opts.stepNumber).padStart(2, '0');
    const targetFile = resolve(targetDir, `${stepFormatted}-${opts.slug}.webp`);
    const tempHtml = resolve(targetDir, `temp-${Date.now()}.html`);
    const tempPng = resolve(targetDir, `temp-${Date.now()}.png`);

    try {
      writeFileSync(tempHtml, htmlContent, 'utf-8');

      // Headless Chrome capture
      execSync(
        `google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=1080,820 --screenshot="${tempPng}" "file://${tempHtml}"`,
        { stdio: 'pipe' }
      );

      // Convert PNG to WebP with ffmpeg
      execSync(
        `ffmpeg -y -i "${tempPng}" -c:v libwebp -lossless 1 -compression_level 6 "${targetFile}"`,
        { stdio: 'pipe' }
      );

      return targetFile;
    } finally {
      if (existsSync(tempHtml)) unlinkSync(tempHtml);
      if (existsSync(tempPng)) unlinkSync(tempPng);
    }
  }
}
