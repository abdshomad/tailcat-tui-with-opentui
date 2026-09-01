import { ChildProcess } from 'node:child_process';
import type { TailcatService } from './tailcat.service.js';
import type { TailcatWebPlugin } from './web-server.plugin.js';
import type { FileLoggerPlugin } from './file-logger.plugin.js';
import type { AutoPortScannerPlugin } from './auto-port-scanner.plugin.js';
import type { MetricsCollectorPlugin } from './metrics-collector.plugin.js';
import type { PluginManagerService } from './plugin-manager.service.js';

export type SessionType = 
  | 'pipe-server' 
  | 'pipe-client' 
  | 'serve-port' 
  | 'connect-port' 
  | 'serve-ssh' 
  | 'ssh-client' 
  | 'recv-files' 
  | 'serve-files' 
  | 'send-files' 
  | 'list-files' 
  | 'ping' 
  | 'socks' 
  | 'exit-node' 
  | 'genkey' 
  | 'custom';

export type SessionStatus = 'idle' | 'starting' | 'running' | 'completed' | 'failed' | 'terminated';

export interface TailcatSession {
  id: string;
  type: SessionType;
  command: string;
  args: string[];
  startTime: Date;
  endTime?: Date;
  status: SessionStatus;
  token?: string;
  exitCode?: number | null;
  logs: string[];
  process?: ChildProcess;
  metadata?: Record<string, any>;
}

export interface KeyInfo {
  name: string;
  publicKey?: string;
  path?: string;
  isClient?: boolean;
}

export interface PluginInfo {
  name: string;
  displayName: string;
  description: string;
  enabled: boolean;
  status: 'active' | 'inactive' | 'error';
  details?: string;
}

declare module 'cordis' {
  interface Context {
    tailcat: TailcatService;
    webServer: TailcatWebPlugin;
    fileLogger: FileLoggerPlugin;
    autoPortScanner: AutoPortScannerPlugin;
    metricsCollector: MetricsCollectorPlugin;
    pluginManager: PluginManagerService;
  }
  interface Events<C extends Context = Context> {
    'tailcat/session-created'(session: TailcatSession): void;
    'tailcat/session-updated'(session: TailcatSession): void;
    'tailcat/token-discovered'(data: { session: TailcatSession; token: string }): void;
    'tailcat/session-log'(data: { session: TailcatSession; text: string }): void;
    'tailcat/plugin-enabled'(data: { name: string }): void;
    'tailcat/plugin-disabled'(data: { name: string }): void;
  }
}
