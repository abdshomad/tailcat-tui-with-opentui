import { Context, Service } from 'cordis';
import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { TailcatSession } from './session.types.js';

export class FileLoggerPlugin extends Service {
  static name = 'fileLogger';
  static inject = ['tailcat'];
  private logDir: string;
  private activeLogsCount: number = 0;

  constructor(ctx: Context) {
    super(ctx, 'fileLogger', true);
    this.logDir = resolve(homedir(), '.config', 'tailcat-tui', 'logs');
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }

    this.ctx.on('tailcat/session-log', ({ session, text }: { session: TailcatSession; text: string }) => {
      this.writeLog(session.id, text);
    });
  }

  static apply(ctx: Context): void {
    ctx.provide('fileLogger');
    ctx.fileLogger = new FileLoggerPlugin(ctx);
  }

  public getLogDir(): string {
    return this.logDir;
  }

  public getActiveLogsCount(): number {
    return this.activeLogsCount;
  }

  private writeLog(sessionId: string, text: string): void {
    try {
      const file = resolve(this.logDir, `session-${sessionId}.log`);
      const timestamp = new Date().toISOString();
      appendFileSync(file, `[${timestamp}] ${text}\n`, 'utf8');
      this.activeLogsCount++;
    } catch {
      // Ignore logging write failures gracefully
    }
  }
}
