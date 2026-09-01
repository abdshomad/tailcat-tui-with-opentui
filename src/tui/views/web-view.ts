import { ANSI, box } from '../ansi.js';
import { AppState } from '../state.js';
import { TailcatWebPlugin } from '../../services/web-server.plugin.js';
import { PluginManagerService } from '../../services/plugin-manager.service.js';
import { DaemonManager } from '../../utils/daemon-manager.js';

export class WebView {
  public static render(state: AppState, webServer?: TailcatWebPlugin, width = 80, pluginManager?: PluginManagerService): string[] {
    const lines: string[] = [];
    const fIdx = state.forms.focusedFieldIndex;
    const status = webServer ? webServer.getStatus() : 'offline';
    const port = webServer ? webServer.getPort() : 3840;

    const statusBadge = status === 'online'
      ? `${ANSI.cyan}${ANSI.bold}ONLINE${ANSI.reset} ${ANSI.white}http://127.0.0.1:${port}${ANSI.reset}`
      : status === 'daemon'
      ? `${ANSI.cyan}${ANSI.bold}RUNNING (Daemon PID ${DaemonManager.getDaemonPid()})${ANSI.reset} ${ANSI.white}http://127.0.0.1:${port}${ANSI.reset}`
      : `${ANSI.gray}OFFLINE${ANSI.reset}`;

    lines.push(`${ANSI.cyan}${ANSI.bold}=== Cordis Micro-Kernel Plugin Registry & Settings ===${ANSI.reset}`);
    lines.push(`${ANSI.gray}Dynamically enable or dispose Cordis plugins at runtime without restarting the application.${ANSI.reset}`);
    lines.push('');

    // Section 1: Cordis Plugin Registry
    lines.push(`${ANSI.bold}1. Cordis Plugin Registry & Dynamic Lifecycle${ANSI.reset}`);
    const plugins = pluginManager ? pluginManager.listPlugins() : [
      { name: 'webServer', displayName: 'Cordis Web Dashboard', enabled: true, status: 'active' as const, details: `:${port}` },
      { name: 'fileLogger', displayName: 'Real-Time File Logger', enabled: true, status: 'active' as const, details: 'Active' },
      { name: 'autoPortScanner', displayName: 'Auto Port Scanner', enabled: true, status: 'active' as const, details: 'Ready' },
      { name: 'metricsCollector', displayName: 'Metrics & Telemetry Tracker', enabled: true, status: 'active' as const, details: 'Tracking' },
    ];

    plugins.forEach((p, idx) => {
      const isFocused = fIdx === idx;
      const stateBadge = p.enabled
        ? `${ANSI.cyan}[ ENABLED ]${ANSI.reset}`
        : `${ANSI.gray}[ DISABLED ]${ANSI.reset}`;
      
      const cursor = isFocused ? `${ANSI.cyan}${ANSI.bold}► ` : '  ';
      const nameFmt = isFocused ? `${ANSI.cyan}${ANSI.bold}${p.displayName} [${p.name}]${ANSI.reset}` : `${ANSI.white}${p.displayName} [${p.name}]${ANSI.reset}`;
      lines.push(`${cursor}${nameFmt} : ${stateBadge} ${ANSI.gray}(${p.details || 'Ready'})${ANSI.reset}`);
    });

    lines.push(`  ${fIdx === 4 ? ANSI.cyan + ANSI.bold + '► [ TOGGLE SELECTED PLUGIN ] ◄' : ANSI.gray + '  [ TOGGLE SELECTED PLUGIN ]  '}${ANSI.reset}`);
    lines.push('');

    // Section 2: Web Server Configuration & Lifecycle
    lines.push(`${ANSI.bold}2. Web Server Configuration & Persistence${ANSI.reset}`);
    lines.push(`  Web Server State: ${statusBadge}`);
    lines.push(`  [Preferred Port]: ${fIdx === 5 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.webPortInput || '3840') + ' ] <' : ANSI.white + '  [ ' + (state.forms.webPortInput || '3840') + ' ]  '}${ANSI.reset} ${ANSI.gray}(e.g. 3840, 8080, or 'auto')${ANSI.reset}`);
    lines.push(`  [Auto-Scan Port]: ${fIdx === 6 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.webAutoScan ? 'ENABLED' : 'DISABLED') + ' ] <' : ANSI.white + '  [ ' + (state.forms.webAutoScan ? 'ENABLED' : 'DISABLED') + ' ]  '}${ANSI.reset}`);
    
    if (status === 'online') {
      lines.push(`  ${fIdx === 7 ? ANSI.cyan + ANSI.bold + '► [ STOP LOCAL WEB SERVER ] ◄' : ANSI.gray + '  [ STOP LOCAL WEB SERVER ]  '}${ANSI.reset}`);
    } else {
      lines.push(`  ${fIdx === 7 ? ANSI.cyan + ANSI.bold + '► [ START WEB SERVER ] ◄' : ANSI.gray + '  [ START WEB SERVER ]  '}${ANSI.reset}`);
    }
    lines.push('');

    // Section 3: Persistence & Detached Daemon
    lines.push(`${ANSI.bold}3. Preferences & Background Daemon${ANSI.reset}`);
    lines.push(`  [Auto-Start on Boot] : ${fIdx === 8 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.webAutoStart ? 'YES' : 'NO') + ' ] <' : ANSI.white + '  [ ' + (state.forms.webAutoStart ? 'YES' : 'NO') + ' ]  '}${ANSI.reset}`);
    lines.push(`  ${fIdx === 9 ? ANSI.cyan + ANSI.bold + '► [ SAVE PREFERENCES TO CONFIG ] ◄' : ANSI.gray + '  [ SAVE PREFERENCES TO CONFIG ]  '}${ANSI.reset}`);
    
    if (status === 'daemon') {
      lines.push(`  ${fIdx === 10 ? ANSI.cyan + ANSI.bold + '► [ STOP DETACHED DAEMON ] ◄' : ANSI.gray + '  [ STOP DETACHED DAEMON ]  '}${ANSI.reset}`);
    } else {
      lines.push(`  ${fIdx === 10 ? ANSI.cyan + ANSI.bold + '► [ DETACH AS BACKGROUND DAEMON ] ◄' : ANSI.gray + '  [ DETACH AS BACKGROUND DAEMON ]  '}${ANSI.reset} ${ANSI.gray}(Runs standalone)${ANSI.reset}`);
    }

    return box('8. Settings & Plugin Manager', lines, width);
  }

  public static async handleAction(state: AppState, webServer: TailcatWebPlugin, pluginManager?: PluginManagerService): Promise<string> {
    const fIdx = state.forms.focusedFieldIndex;
    const plugins = pluginManager ? pluginManager.listPlugins() : [];

    // Plugin list toggle (fields 0-3 select plugin, field 4 toggles)
    if (fIdx >= 0 && fIdx <= 3) {
      if (pluginManager && plugins[fIdx]) {
        const p = plugins[fIdx];
        const newState = pluginManager.togglePlugin(p.name);
        return `Plugin [${p.displayName}] is now ${newState ? 'ENABLED' : 'DISPOSED / DISABLED'}.`;
      }
    } else if (fIdx === 4) {
      if (pluginManager && plugins.length > 0) {
        const target = plugins[state.forms.selectedPluginIndex || 0] || plugins[0];
        const newState = pluginManager.togglePlugin(target.name);
        return `Plugin [${target.displayName}] is now ${newState ? 'ENABLED' : 'DISPOSED / DISABLED'}.`;
      }
    } else if (fIdx === 6) {
      state.forms.webAutoScan = !state.forms.webAutoScan;
      return `Auto-scan port toggled to ${state.forms.webAutoScan ? 'ENABLED' : 'DISABLED'}.`;
    } else if (fIdx === 8) {
      state.forms.webAutoStart = !state.forms.webAutoStart;
      return `Auto-start on boot toggled to ${state.forms.webAutoStart ? 'YES' : 'NO'}.`;
    } else if (fIdx === 7) {
      if (webServer.isRunning()) {
        await webServer.stop();
        return 'Web server stopped.';
      } else {
        const port = await webServer.listenAuto(state.forms.webPortInput, state.forms.webAutoScan);
        return `Web server started on http://127.0.0.1:${port}`;
      }
    } else if (fIdx === 9) {
      // Save Config
      DaemonManager.saveConfig({
        preferredPort: state.forms.webPortInput,
        autoScan: state.forms.webAutoScan,
        autoStartWeb: state.forms.webAutoStart,
      });
      return 'Preferences saved to ~/.config/tailcat-tui/config.json';
    } else if (fIdx === 10) {
      // Detach daemon or stop
      if (DaemonManager.isDaemonRunning()) {
        DaemonManager.stopDaemon();
        return 'Detached daemon stopped.';
      } else {
        const res = DaemonManager.spawnDaemon(state.forms.webPortInput);
        return res.success ? `Detached background daemon launched (PID: ${res.pid}).` : `Failed: ${res.error}`;
      }
    }
    return 'Action navigated';
  }
}
