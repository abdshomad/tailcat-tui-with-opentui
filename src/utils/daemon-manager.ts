import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

export interface AppConfig {
  autoStartWeb: boolean;
  preferredPort: string;
  autoScan: boolean;
  persistServing: boolean;
  plugins?: Record<string, boolean>;
}

export const DEFAULT_CONFIG: AppConfig = {
  autoStartWeb: false,
  preferredPort: '3840',
  autoScan: true,
  persistServing: false,
  plugins: {
    webServer: true,
    fileLogger: true,
    autoPortScanner: true,
    metricsCollector: true,
  },
};

export class DaemonManager {
  private static getConfigDir(): string {
    const dir = resolve(homedir(), '.config', 'tailcat-tui');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  public static getConfigFile(): string {
    return resolve(this.getConfigDir(), 'config.json');
  }

  public static getPidFile(): string {
    return resolve(this.getConfigDir(), 'web-server.pid');
  }

  public static loadConfig(): AppConfig {
    try {
      const file = this.getConfigFile();
      if (existsSync(file)) {
        const raw = readFileSync(file, 'utf-8');
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      }
    } catch {
      // Return default on error
    }
    return { ...DEFAULT_CONFIG };
  }

  public static saveConfig(config: Partial<AppConfig>): AppConfig {
    const current = this.loadConfig();
    const updated = { ...current, ...config };
    try {
      writeFileSync(this.getConfigFile(), JSON.stringify(updated, null, 2), 'utf-8');
    } catch {
      // Ignored
    }
    return updated;
  }

  public static getDaemonPid(): number | null {
    try {
      const pidFile = this.getPidFile();
      if (existsSync(pidFile)) {
        const pidStr = readFileSync(pidFile, 'utf-8').trim();
        const pid = parseInt(pidStr, 10);
        if (!isNaN(pid) && pid > 0) {
          // Check if alive
          process.kill(pid, 0);
          return pid;
        }
      }
    } catch {
      // Process not alive or file invalid
      this.clearPidFile();
    }
    return null;
  }

  public static isDaemonRunning(): boolean {
    return this.getDaemonPid() !== null;
  }

  public static clearPidFile(): void {
    try {
      const pidFile = this.getPidFile();
      if (existsSync(pidFile)) {
        unlinkSync(pidFile);
      }
    } catch {
      // Ignored
    }
  }

  public static spawnDaemon(port = '3840', autoScan = true): { success: boolean; pid?: number; error?: string } {
    if (this.isDaemonRunning()) {
      return { success: false, error: `Daemon already running on PID ${this.getDaemonPid()}` };
    }

    try {
      const entryPoint = resolve(process.cwd(), 'dist', 'index.js');
      const args = [entryPoint, '--daemon', `--web-port=${port}`];
      if (autoScan) args.push('--auto-scan');

      const child = spawn(process.execPath, args, {
        detached: true,
        stdio: 'ignore',
        cwd: process.cwd(),
      });

      child.unref();

      if (child.pid) {
        writeFileSync(this.getPidFile(), String(child.pid), 'utf-8');
        return { success: true, pid: child.pid };
      }
      return { success: false, error: 'Child process spawned without PID' };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }

  public static stopDaemon(): { success: boolean; message: string } {
    const pid = this.getDaemonPid();
    if (!pid) {
      this.clearPidFile();
      return { success: false, message: 'No active daemon found' };
    }

    try {
      process.kill(pid, 'SIGTERM');
      this.clearPidFile();
      return { success: true, message: `Terminated daemon process [PID ${pid}]` };
    } catch (err: any) {
      this.clearPidFile();
      return { success: false, message: `Failed to kill PID ${pid}: ${err?.message || err}` };
    }
  }
}
