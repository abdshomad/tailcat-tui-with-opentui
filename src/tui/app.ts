import { ANSI } from './ansi.js';
import { AppState, TabId, createInitialState } from './state.js';
import { TailcatService } from '../services/tailcat.service.js';
import { TailcatWebPlugin } from '../services/web-server.plugin.js';
import { PluginManagerService } from '../services/plugin-manager.service.js';
import { PipeView } from './views/pipe-view.js';
import { PortsView } from './views/ports-view.js';
import { SSHView } from './views/ssh-view.js';
import { FilesView } from './views/files-view.js';
import { DiagnosticsView } from './views/diagnostics-view.js';
import { KeysView } from './views/keys-view.js';
import { SessionsView } from './views/sessions-view.js';
import { WebView } from './views/web-view.js';
import { DaemonManager } from '../utils/daemon-manager.js';

export class TailcatTUIApp {
  private state: AppState;
  private service: TailcatService;
  private webServer: TailcatWebPlugin;
  private pluginManager?: PluginManagerService;
  private isRunning = false;
  private tabs: { id: TabId; label: string; num: string }[] = [
    { id: 'pipe', label: 'Pipe/Stream', num: '1' },
    { id: 'ports', label: 'Ports', num: '2' },
    { id: 'ssh', label: 'SSH', num: '3' },
    { id: 'files', label: 'Files/SFTP', num: '4' },
    { id: 'diag', label: 'Diagnostics', num: '5' },
    { id: 'keys', label: 'Keys', num: '6' },
    { id: 'sessions', label: 'Sessions', num: '7' },
    { id: 'web', label: 'Settings/Plugins', num: '8' },
  ];

  constructor(service: TailcatService, webServer?: TailcatWebPlugin, pluginManager?: PluginManagerService) {
    this.service = service;
    const ctx = service.getContext();
    this.webServer = webServer || ctx.webServer;
    this.pluginManager = pluginManager || ctx.pluginManager;
    this.state = createInitialState();

    // Load saved config
    const savedConfig = DaemonManager.loadConfig();
    this.state.forms.webPortInput = savedConfig.preferredPort;
    this.state.forms.webAutoScan = savedConfig.autoScan;
    this.state.forms.webAutoStart = savedConfig.autoStartWeb;

    // Subscribe to Cordis events for live updates
    ctx.on('tailcat/token-discovered', ({ session, token }) => {
      this.state.statusMessage = `Discovered Token for [${session.id}]: ${token}`;
      this.state.statusType = 'success';
      this.render();
    });

    ctx.on('tailcat/session-updated', (session) => {
      if (session.status === 'completed' || session.status === 'failed') {
        this.state.statusMessage = `Session [${session.id}] ${session.status}`;
        this.state.statusType = session.status === 'completed' ? 'success' : 'error';
      }
      this.render();
    });

    ctx.on('tailcat/session-log', () => {
      if (this.state.activeTab === 'sessions' || this.state.activeTab === 'pipe') {
        this.render();
      }
    });

    ctx.on('tailcat/web-started', ({ port }) => {
      this.state.statusMessage = `Web server active on http://127.0.0.1:${port}`;
      this.state.statusType = 'success';
      this.render();
    });

    ctx.on('tailcat/web-stopped', () => {
      this.state.statusMessage = 'Web server stopped';
      this.state.statusType = 'info';
      this.render();
    });

    ctx.on('tailcat/plugin-enabled', ({ name }) => {
      this.state.statusMessage = `Cordis Plugin [${name}] enabled.`;
      this.state.statusType = 'success';
      this.render();
    });

    ctx.on('tailcat/plugin-disabled', ({ name }) => {
      this.state.statusMessage = `Cordis Plugin [${name}] disposed / disabled.`;
      this.state.statusType = 'info';
      this.render();
    });
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    if (this.webServer && this.state.forms.webAutoStart) {
      try {
        await this.webServer.listenAuto(this.state.forms.webPortInput, this.state.forms.webAutoScan);
      } catch {
        // Ignored on startup error
      }
    }

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf-8');
      process.stdout.write(ANSI.enterAltScreen + ANSI.hideCursor);
      
      process.stdin.on('data', (key: string) => this.handleKey(key));
      process.on('SIGWINCH', () => this.render());
    }
    this.render();
  }

  public stop(): void {
    this.isRunning = false;
    if (process.stdin.isTTY) {
      process.stdout.write(ANSI.showCursor + ANSI.leaveAltScreen);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  }

  public static renderAppScreen(
    state: AppState,
    service: TailcatService,
    webServer?: TailcatWebPlugin,
    pluginManager?: PluginManagerService,
    width = 80,
    tabs = [
      { id: 'pipe' as TabId, label: 'Pipe/Stream', num: '1' },
      { id: 'ports' as TabId, label: 'Ports', num: '2' },
      { id: 'ssh' as TabId, label: 'SSH', num: '3' },
      { id: 'files' as TabId, label: 'Files/SFTP', num: '4' },
      { id: 'diag' as TabId, label: 'Diagnostics', num: '5' },
      { id: 'keys' as TabId, label: 'Keys', num: '6' },
      { id: 'sessions' as TabId, label: 'Sessions', num: '7' },
      { id: 'web' as TabId, label: 'Settings/Plugins', num: '8' },
    ]
  ): string[] {
    const lines: string[] = [];

    // Header
    const binInfo = service.getBinaryInfo();
    const binStatus = binInfo.available 
      ? `${ANSI.cyan}● Ready (${binInfo.source})${ANSI.reset}` 
      : `${ANSI.gray}○ Missing${ANSI.reset}`;
    
    const webStatus = webServer
      ? webServer.getStatus() === 'online'
        ? `${ANSI.cyan}● Web :${webServer.getPort()}${ANSI.reset}`
        : webServer.getStatus() === 'daemon'
        ? `${ANSI.cyan}● Web Daemon :${webServer.getPort()}${ANSI.reset}`
        : `${ANSI.gray}○ Web Off${ANSI.reset}`
      : `${ANSI.gray}○ Web Off${ANSI.reset}`;

    const pluginCount = pluginManager ? pluginManager.listPlugins().filter(p => p.enabled).length : 4;
    
    lines.push(`${ANSI.cyan}${ANSI.bold}TAILCAT TUI${ANSI.reset}  ${ANSI.gray}v0.1.0 | Cordis Micro-Kernel (${pluginCount} Plugins) | Binary: ${binStatus} | ${webStatus}${ANSI.reset}`);
    
    // Tab bar
    const tabHeaders = tabs.map(t => {
      const active = state.activeTab === t.id;
      return active
        ? `${ANSI.cyan}${ANSI.bold}[● ${t.num} ${t.label}]${ANSI.reset}`
        : `${ANSI.gray}[  ${t.num} ${t.label}]${ANSI.reset}`;
    }).join(' ');
    lines.push(tabHeaders);
    lines.push(`${ANSI.gray}${'─'.repeat(width)}${ANSI.reset}`);

    // Active View
    let viewLines: string[] = [];
    switch (state.activeTab) {
      case 'pipe': viewLines = PipeView.render(state, service, width); break;
      case 'ports': viewLines = PortsView.render(state, service, width); break;
      case 'ssh': viewLines = SSHView.render(state, service, width); break;
      case 'files': viewLines = FilesView.render(state, service, width); break;
      case 'diag': viewLines = DiagnosticsView.render(state, service, width); break;
      case 'keys': viewLines = KeysView.render(state, service, width); break;
      case 'sessions': viewLines = SessionsView.render(state, service, width); break;
      case 'web': viewLines = WebView.render(state, webServer, width, pluginManager); break;
    }
    lines.push(...viewLines);

    // Status Bar & Help (Clean 2-color)
    lines.push(`${ANSI.gray}${'─'.repeat(width)}${ANSI.reset}`);
    lines.push(`${ANSI.cyan}Status: ${ANSI.white}${state.statusMessage}${ANSI.reset}`);
    lines.push(`${ANSI.gray}Keys: [1-8] Tabs | [w] Toggle Web | [Tab] Navigate | [Enter] Select/Toggle | [k] Kill | [q] Quit${ANSI.reset}`);

    return lines;
  }

  public render(): void {
    if (!this.isRunning) return;
    const width = Math.max(80, process.stdout.columns || 80);
    const lines = TailcatTUIApp.renderAppScreen(this.state, this.service, this.webServer, this.pluginManager, width, this.tabs);

    // Output buffer
    process.stdout.write(ANSI.cursorHome + ANSI.clearScreen + lines.join('\n'));
  }

  private async handleKey(key: string): Promise<void> {
    if (key === '\u0003' || key === 'q') { // Ctrl+C or 'q'
      this.stop();
      process.exit(0);
    }

    // Quick Web Server Toggle with 'w'
    if (key === 'w' && this.state.activeTab !== 'web') {
      if (this.webServer && this.webServer.getStatus() === 'online') {
        await this.webServer.stop();
        this.state.statusMessage = 'Web server stopped.';
      } else if (this.webServer) {
        const port = await this.webServer.listenAuto(this.state.forms.webPortInput, this.state.forms.webAutoScan);
        this.state.statusMessage = `Web server started on http://127.0.0.1:${port}`;
      }
      this.render();
      return;
    }

    // Number keys for tabs
    const num = parseInt(key, 10);
    if (!isNaN(num) && num >= 1 && num <= this.tabs.length) {
      this.state.activeTab = this.tabs[num - 1].id;
      this.state.forms.focusedFieldIndex = 0;
      this.render();
      return;
    }

    // Tab / Shift-Tab
    if (key === '\t') {
      this.state.forms.focusedFieldIndex = (this.state.forms.focusedFieldIndex + 1) % 11;
      this.render();
      return;
    }

    // Enter -> execute active view action
    if (key === '\r' || key === '\n') {
      let msg = '';
      switch (this.state.activeTab) {
        case 'pipe': msg = PipeView.handleAction(this.state, this.service); break;
        case 'ports': msg = PortsView.handleAction(this.state, this.service); break;
        case 'ssh': msg = SSHView.handleAction(this.state, this.service); break;
        case 'files': msg = FilesView.handleAction(this.state, this.service); break;
        case 'diag': msg = DiagnosticsView.handleAction(this.state, this.service); break;
        case 'keys': msg = KeysView.handleAction(this.state, this.service); break;
        case 'sessions': msg = SessionsView.handleAction(this.state, this.service, 'enter'); break;
        case 'web': msg = await WebView.handleAction(this.state, this.webServer, this.pluginManager); break;
      }
      this.state.statusMessage = msg;
      this.state.statusType = msg.startsWith('Error') ? 'error' : 'success';
      this.render();
      return;
    }

    // Kill in sessions view
    if (key === 'k') {
      const msg = SessionsView.handleAction(this.state, this.service, 'k');
      this.state.statusMessage = msg;
      this.render();
      return;
    }

    this.render();
  }

  public getState(): AppState {
    return this.state;
  }

  public setState(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
  }
}
