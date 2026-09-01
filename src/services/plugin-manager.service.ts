import { Context, Service } from 'cordis';
import { TailcatWebPlugin } from './web-server.plugin.js';
import { FileLoggerPlugin } from './file-logger.plugin.js';
import { AutoPortScannerPlugin } from './auto-port-scanner.plugin.js';
import { MetricsCollectorPlugin } from './metrics-collector.plugin.js';
import { DaemonManager } from '../utils/daemon-manager.js';
import { PluginInfo } from './session.types.js';

interface PluginRegistration {
  name: string;
  displayName: string;
  description: string;
  pluginClass: any;
  defaultEnabled: boolean;
}

export class PluginManagerService extends Service {
  static name = 'pluginManager';
  static inject = ['tailcat'];
  private registrations: Map<string, PluginRegistration> = new Map();
  private forks: Map<string, any> = new Map();

  constructor(ctx: Context) {
    super(ctx, 'pluginManager', true);

    this.register('webServer', {
      name: 'webServer',
      displayName: 'Cordis Web Dashboard',
      description: 'Embedded HTTP Web Dashboard, UI controls & REST APIs on port 3840+',
      pluginClass: TailcatWebPlugin,
      defaultEnabled: true,
    });

    this.register('fileLogger', {
      name: 'fileLogger',
      displayName: 'Real-Time File Logger',
      description: 'Streams session stdout/stderr logs into ~/.config/tailcat-tui/logs/',
      pluginClass: FileLoggerPlugin,
      defaultEnabled: true,
    });

    this.register('autoPortScanner', {
      name: 'autoPortScanner',
      displayName: 'Auto Port Scanner',
      description: 'Probes TCP socket availability and allocates free ports sequentially',
      pluginClass: AutoPortScannerPlugin,
      defaultEnabled: true,
    });

    this.register('metricsCollector', {
      name: 'metricsCollector',
      displayName: 'Metrics & Telemetry Tracker',
      description: 'Monitors ping latency, DERP relay paths vs direct UDP upgrades',
      pluginClass: MetricsCollectorPlugin,
      defaultEnabled: true,
    });
  }

  static apply(ctx: Context): void {
    ctx.provide('pluginManager');
    ctx.pluginManager = new PluginManagerService(ctx);
  }

  public register(name: string, reg: PluginRegistration): void {
    this.registrations.set(name, reg);
  }

  public initFromConfig(): void {
    const config = DaemonManager.loadConfig();
    const pluginStates = (config as any).plugins || {};

    for (const [name, reg] of this.registrations.entries()) {
      const shouldEnable = pluginStates[name] !== undefined ? !!pluginStates[name] : reg.defaultEnabled;
      if (shouldEnable) {
        this.enablePlugin(name, false);
      }
    }
  }

  public listPlugins(): PluginInfo[] {
    const list: PluginInfo[] = [];

    for (const [name, reg] of this.registrations.entries()) {
      const isForked = this.forks.has(name);
      let details = '';

      if (name === 'webServer' && isForked) {
        const webServer = this.ctx.get('webServer') as any;
        const status = webServer ? webServer.getStatus() : 'offline';
        const port = webServer ? webServer.getPort() : 3840;
        details = `${status.toUpperCase()} (:${port})`;
      } else if (name === 'fileLogger' && isForked) {
        const fileLogger = this.ctx.get('fileLogger') as any;
        const count = fileLogger ? fileLogger.getActiveLogsCount() : 0;
        details = `${count} events recorded`;
      } else if (name === 'metricsCollector' && isForked) {
        const metricsCollector = this.ctx.get('metricsCollector') as any;
        const summary = metricsCollector ? metricsCollector.getMetricsSummary() : { totalPings: 0 };
        details = `${summary.totalPings} pings tracked`;
      } else if (name === 'autoPortScanner' && isForked) {
        details = 'Ready';
      }

      list.push({
        name: reg.name,
        displayName: reg.displayName,
        description: reg.description,
        enabled: isForked,
        status: isForked ? 'active' : 'inactive',
        details,
      });
    }

    return list;
  }

  public enablePlugin(name: string, persist = true): boolean {
    const reg = this.registrations.get(name);
    if (!reg) return false;
    if (this.forks.has(name)) return true;

    try {
      const fork = this.ctx.plugin(reg.pluginClass);
      this.forks.set(name, fork);
      this.ctx.emit('tailcat/plugin-enabled', { name });

      if (persist) {
        this.savePluginState();
      }
      return true;
    } catch (err) {
      console.error(`Failed to enable plugin ${name}:`, err);
      return false;
    }
  }

  public disablePlugin(name: string, persist = true): boolean {
    const fork = this.forks.get(name);
    if (!fork) return true;

    try {
      // Cordis Dynamic Fork Disposal
      fork.dispose();
      this.forks.delete(name);
      this.ctx.emit('tailcat/plugin-disabled', { name });

      if (persist) {
        this.savePluginState();
      }
      return true;
    } catch (err) {
      console.error(`Failed to dispose plugin ${name}:`, err);
      return false;
    }
  }

  public togglePlugin(name: string): boolean {
    if (this.forks.has(name)) {
      this.disablePlugin(name);
      return false;
    } else {
      this.enablePlugin(name);
      return true;
    }
  }

  public isPluginEnabled(name: string): boolean {
    return this.forks.has(name);
  }

  private savePluginState(): void {
    const currentConfig = DaemonManager.loadConfig();
    const pluginsMap: Record<string, boolean> = {};

    for (const name of this.registrations.keys()) {
      pluginsMap[name] = this.forks.has(name);
    }

    DaemonManager.saveConfig({
      ...currentConfig,
      plugins: pluginsMap,
    } as any);
  }
}
