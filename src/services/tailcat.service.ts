import { Context, Service } from 'cordis';
import { spawn, spawnSync, ChildProcess } from 'node:child_process';
import { BinaryResolver, BinaryResolution } from '../utils/binary-resolver.js';
import { TailcatSession, SessionType, SessionStatus } from './session.types.js';

export class TailcatService extends Service {
  static name = 'tailcat';
  private sessions = new Map<string, TailcatSession>();
  private sessionCounter = 0;
  private binaryInfo: BinaryResolution;

  constructor(ctx: Context) {
    super(ctx, 'tailcat', true);
    this.binaryInfo = BinaryResolver.resolveTailcatBinary();
  }

  static apply(ctx: Context): void {
    ctx.provide('tailcat');
    ctx.tailcat = new TailcatService(ctx);
  }

  public getContext(): Context {
    return this.ctx;
  }

  public getBinaryInfo(): BinaryResolution {
    return this.binaryInfo;
  }

  public setCustomBinaryPath(path: string): void {
    this.binaryInfo = {
      path,
      source: 'local-bin',
      available: true,
      version: 'custom',
    };
  }

  public getSessions(): TailcatSession[] {
    return Array.from(this.sessions.values());
  }

  public getSession(id: string): TailcatSession | undefined {
    return this.sessions.get(id);
  }

  public addMockSession(data: Partial<TailcatSession>): TailcatSession {
    const id = data.id || `session-${++this.sessionCounter}-${Date.now().toString(36)}`;
    const session: TailcatSession = {
      id,
      type: data.type || 'custom',
      command: data.command || 'mock command',
      args: data.args || [],
      startTime: data.startTime || new Date(),
      status: data.status || 'running',
      token: data.token,
      logs: data.logs || [],
      metadata: data.metadata,
    };
    this.sessions.set(id, session);
    this.ctx.emit('tailcat/session-created', session);
    return session;
  }

  public killSession(id: string): boolean {
    const session = this.sessions.get(id);
    if (!session || !session.process || session.status !== 'running') {
      return false;
    }
    session.process.kill('SIGTERM');
    session.status = 'terminated';
    session.endTime = new Date();
    this.ctx.emit('tailcat/session-updated', session);
    return true;
  }

  public executeOneShot(args: string[]): { success: boolean; output: string; exitCode: number } {
    const binary = this.binaryInfo.path || 'tailcat';
    const result = spawnSync(binary, args, { encoding: 'utf-8' });
    const output = ((result.stdout || '') + (result.stderr || '')).trim();
    return {
      success: result.status === 0,
      output,
      exitCode: result.status ?? 1,
    };
  }

  public spawnSession(type: SessionType, args: string[], metadata?: Record<string, any>): TailcatSession {
    const binary = this.binaryInfo.path || 'tailcat';
    const id = `session-${++this.sessionCounter}-${Date.now().toString(36)}`;
    
    const session: TailcatSession = {
      id,
      type,
      command: `${binary} ${args.join(' ')}`,
      args,
      startTime: new Date(),
      status: 'starting',
      logs: [],
      metadata,
    };

    this.sessions.set(id, session);
    this.ctx.emit('tailcat/session-created', session);

    try {
      const proc = spawn(binary, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      session.process = proc;
      session.status = 'running';

      const handleOutput = (chunk: Buffer) => {
        const text = chunk.toString();
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            session.logs.push(line);
            if (session.logs.length > 500) session.logs.shift();
            // Match token formats: tcom... or tc...
            const tokenMatch = line.match(/\b(tcom[A-Za-z0-9_-]{20,}|tc[A-Za-z0-9_-]{10,})\b/);
            if (tokenMatch && !session.token) {
              session.token = tokenMatch[1];
              this.ctx.emit('tailcat/token-discovered', { session, token: session.token });
            }
          }
        }
        this.ctx.emit('tailcat/session-log', { session, text });
      };

      proc.stdout.on('data', handleOutput);
      proc.stderr.on('data', handleOutput);

      proc.on('close', (code) => {
        session.exitCode = code;
        session.endTime = new Date();
        session.status = code === 0 ? 'completed' : 'failed';
        this.ctx.emit('tailcat/session-updated', session);
      });

      proc.on('error', (err) => {
        session.status = 'failed';
        session.logs.push(`Error: ${err.message}`);
        this.ctx.emit('tailcat/session-updated', session);
      });

    } catch (err: any) {
      session.status = 'failed';
      session.logs.push(`Failed to spawn: ${err?.message || err}`);
      this.ctx.emit('tailcat/session-updated', session);
    }

    return session;
  }

  public clearFinishedSessions(): void {
    for (const [id, session] of this.sessions.entries()) {
      if (session.status === 'completed' || session.status === 'failed') {
        this.sessions.delete(id);
      }
    }
  }
}
