import { exec } from 'node:child_process';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { ScreenshotOptions } from './terminal-screenshot.js';

const execPromise = promisify(exec);

export class WebScreenshot {
  public static async captureUrlToWebp(url: string, opts: ScreenshotOptions): Promise<string> {
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
    const tempPng = resolve(targetDir, `web-temp-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);

    const width = opts.width || 1280;
    const height = opts.height || 800;

    try {
      await execPromise(`google-chrome --headless=new --no-sandbox --disable-gpu --screenshot="${tempPng}" --window-size=${width},${height} "${url}"`);
      await execPromise(`ffmpeg -y -i "${tempPng}" -quality 90 "${targetFile}"`);
    } finally {
      if (existsSync(tempPng)) unlinkSync(tempPng);
    }

    return targetFile;
  }
}
