import { Context, Service } from 'cordis';
import { createServer, Server, IncomingMessage, ServerResponse } from 'node:http';
import { TailcatService } from './tailcat.service.js';
import { PortScanner } from '../utils/port-scanner.js';
import { DaemonManager } from '../utils/daemon-manager.js';

export class TailcatWebPlugin extends Service {
  static name = 'webServer';
  static inject = ['tailcat'];
  private server: Server | null = null;
  private port: number = 3840;
  private running: boolean = false;

  constructor(ctx: Context) {
    super(ctx, 'webServer', true);
  }

  static apply(ctx: Context): void {
    ctx.provide('webServer');
    ctx.webServer = new TailcatWebPlugin(ctx);
  }

  public getPort(): number {
    return this.port;
  }

  public isRunning(): boolean {
    return this.running || DaemonManager.isDaemonRunning();
  }

  public getStatus(): 'offline' | 'online' | 'daemon' {
    if (this.running) return 'online';
    if (DaemonManager.isDaemonRunning()) return 'daemon';
    return 'offline';
  }

  public async start(): Promise<void> {
    const config = DaemonManager.loadConfig();
    if (config.autoStartWeb && !this.isRunning()) {
      await this.listenAuto(config.preferredPort, config.autoScan);
    }
  }

  public async listenAuto(preferredPortInput: string | number | 'auto' = 3840, autoScan = true): Promise<number> {
    const resolvedPort = await PortScanner.resolvePort(preferredPortInput, autoScan);
    return this.listen(resolvedPort);
  }

  public listen(port = 3840): Promise<number> {
    this.port = port;
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => this.handleRequest(req, res));
      this.server.listen(port, () => {
        this.running = true;
        this.ctx.emit('tailcat/web-started', { port: this.port });
        resolve(port);
      });
      this.server.on('error', (err) => {
        this.running = false;
        reject(err);
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.running = false;
          this.ctx.emit('tailcat/web-stopped');
          resolve();
        });
      } else {
        this.running = false;
        resolve();
      }
    });
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const tailcat = this.ctx.tailcat;
    const url = new URL(req.url || '/', `http://localhost:${this.port}`);
    const activeTab = url.searchParams.get('tab') || 'pipe';

    if (url.pathname === '/api/sessions') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tailcat ? tailcat.getSessions() : []));
      return;
    }

    const html = this.renderWebDashboard(activeTab, tailcat);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  private renderWebDashboard(activeTab: string, tailcat?: TailcatService): string {
    const tabs = [
      { id: 'pipe', label: '1. Pipe & Stream' },
      { id: 'ports', label: '2. Ports & Tunnels' },
      { id: 'ssh', label: '3. SSH Server & Client' },
      { id: 'files', label: '4. Files & SFTP' },
      { id: 'diag', label: '5. Diagnostics & Ping' },
      { id: 'keys', label: '6. Keys & Identities' },
      { id: 'sessions', label: '7. Active Sessions' },
    ];

    const tabNav = tabs.map(t => `
      <a href="/?tab=${t.id}" class="tab ${activeTab === t.id ? 'active' : ''}">${t.label}</a>
    `).join('');

    const sessions = tailcat ? tailcat.getSessions() : [];
    const binInfo = tailcat ? tailcat.getBinaryInfo() : { available: false, source: 'unknown' };

    let tabBody = '';

    if (activeTab === 'pipe') {
      tabBody = `
        <div class="grid-2">
          <div class="card">
            <div class="card-title">📡 1. Pipe / Stream Server</div>
            <p class="desc">Listen for raw incoming data streams. Generates a one-time connection token.</p>
            <div class="form-group">
              <label>WireGuard Key Profile</label>
              <select><option>Ephemeral (New key)</option><option>Saved Profile: default</option></select>
            </div>
            <button class="btn-primary">Start Stream Listener</button>
          </div>
          <div class="card">
            <div class="card-title">📤 2. Client Stream Sender</div>
            <p class="desc">Connect to a remote server token and stream standard input payload.</p>
            <div class="form-group">
              <label>Remote Server Token</label>
              <input type="text" placeholder="tcomFwWCC..." value="tco2FwWCD9arGS1IghQI9817293847192837491823749" />
            </div>
            <div class="form-group">
              <label>Payload / Message</label>
              <input type="text" value="hello from tailcat web stream" />
            </div>
            <button class="btn-accent">Send Stream Payload</button>
          </div>
        </div>
      `;
    } else if (activeTab === 'ports') {
      tabBody = `
        <div class="grid-2">
          <div class="card">
            <div class="card-title">🔌 1. Expose Local TCP Port</div>
            <p class="desc">Forward local ports (e.g. 8080, 8443, or 'all') to peers without firewall changes.</p>
            <div class="form-group">
              <label>Local Port / Service</label>
              <input type="text" value="8080" />
            </div>
            <div class="form-group">
              <label>WireGuard ACL --allow (Optional Nodekey)</label>
              <input type="text" placeholder="nodekey:... (Leave empty for public token)" />
            </div>
            <button class="btn-primary">Serve Local Port 8080</button>
          </div>
          <div class="card">
            <div class="card-title">🌐 2. Dial Remote Port Tunnel</div>
            <p class="desc">Connect to an exposed remote port over Tailscale userspace WireGuard plane.</p>
            <div class="form-group">
              <label>Target Connection Token</label>
              <input type="text" placeholder="tco2FwWC..." value="tco2FwWCDq1j80pW3WoS91827391827391827391827" />
            </div>
            <div class="form-group">
              <label>Remote Port Number</label>
              <input type="text" value="8080" />
            </div>
            <button class="btn-accent">Dial Remote Port Tunnel</button>
          </div>
        </div>
      `;
    } else if (activeTab === 'ssh') {
      tabBody = `
        <div class="grid-2">
          <div class="card">
            <div class="card-title">🔒 1. Userspace SSH Server</div>
            <p class="desc">Start an auth-free userspace SSH daemon. No local SSH daemon or firewall ports needed.</p>
            <div class="form-group">
              <label>Authentication Mode</label>
              <select><option>Auth-Free (Token possession grants shell)</option><option>ACL Protected (--allow=nodekey:...)</option></select>
            </div>
            <button class="btn-primary">Start Auth-Free SSH Server</button>
          </div>
          <div class="card">
            <div class="card-title">💻 2. SSH Client Execution</div>
            <p class="desc">Connect to a remote SSH server token and execute terminal commands.</p>
            <div class="form-group">
              <label>Remote SSH Token</label>
              <input type="text" placeholder="tco2FwWC..." value="tco2FwWCDXy8QUKziMH08172938471928374918273" />
            </div>
            <div class="form-group">
              <label>Remote Command (Optional)</label>
              <input type="text" value="uname -a && whoami" />
            </div>
            <button class="btn-accent">Connect SSH Shell</button>
          </div>
        </div>
      `;
    } else if (activeTab === 'files') {
      tabBody = `
        <div class="grid-2">
          <div class="card">
            <div class="card-title">📥 1. Drop Box Receiver</div>
            <p class="desc">Accept incoming file uploads into a write-only drop box directory.</p>
            <div class="form-group">
              <label>Destination Inbox Directory</label>
              <input type="text" value="./inbox" />
            </div>
            <button class="btn-primary">Start Drop Box Receiver</button>
          </div>
          <div class="card">
            <div class="card-title">📁 2. SFTP Directory Server & Copy</div>
            <p class="desc">Serve a directory tree over SFTP ('tailcat serve files') or upload files ('tailcat cp').</p>
            <div class="form-group">
              <label>Directory Path to Serve</label>
              <input type="text" value="/srv/files" />
            </div>
            <div class="form-group">
              <label>Access Mode</label>
              <select><option>Read-Only (ro)</option><option>Read-Write (rw)</option></select>
            </div>
            <button class="btn-accent">Serve Directory via SFTP</button>
          </div>
        </div>
      `;
    } else if (activeTab === 'diag') {
      tabBody = `
        <div class="grid-2">
          <div class="card">
            <div class="card-title">⚡ 1. Network Diagnostics & Ping</div>
            <p class="desc">Measure roundtrip latency over DERP relay and probe direct UDP path upgrades.</p>
            <div class="form-group">
              <label>Target Peer Token</label>
              <input type="text" value="tco2FwWCBzJQA0UCDrBn9182739182739182739182739" />
            </div>
            <div class="form-group">
              <label><input type="checkbox" checked style="width:auto;margin-right:8px;" /> Probe until direct UDP connection established (--until-direct)</label>
            </div>
            <button class="btn-primary">Ping Peer Target</button>
          </div>
          <div class="card">
            <div class="card-title">🔍 2. Token Parser & Resolver</div>
            <p class="desc">Decode self-contained connection tokens into WireGuard server keys and DERP regions.</p>
            <div class="form-group">
              <label>Encoded Token String</label>
              <input type="text" value="tco2FwWCDS4z9EJBUGiL2ZQTkL-5cg2BZ2Q328ov18273918273" />
            </div>
            <button class="btn-accent">Parse & Resolve Token</button>
          </div>
        </div>
      `;
    } else if (activeTab === 'keys') {
      tabBody = `
        <div class="grid-2">
          <div class="card">
            <div class="card-title">🔑 1. Generate WireGuard Keypair</div>
            <p class="desc">Create persistent identity keys ('genkey') or fixed-region tokens.</p>
            <div class="form-group">
              <label>Key Name / Profile</label>
              <input type="text" value="prod-gateway" />
            </div>
            <div class="form-group">
              <label>DERP Relay Region</label>
              <select><option>Auto (Lowest Latency)</option><option>San Francisco (sfo / 302)</option><option>Local Docker (900)</option></select>
            </div>
            <button class="btn-primary">Generate Keypair</button>
          </div>
          <div class="card">
            <div class="card-title">🛡️ 2. Stored Identity Profiles</div>
            <p class="desc">Manage saved keys in ~/.config/tailcat/keys/ for ACL authorization.</p>
            <div class="session-row">
              <span><b>default</b> (nodekey:8b50b2da...)</span>
              <span class="badge" style="background:#0284c7">Server / Client</span>
            </div>
            <div class="session-row">
              <span><b>client-default</b> (nodekey:9cd3f884...)</span>
              <span class="badge" style="background:#10b981">Client Identity</span>
            </div>
          </div>
        </div>
      `;
    } else if (activeTab === 'sessions') {
      tabBody = `
        <div class="card">
          <div class="card-title">📊 Active Supervised Tunnels (${sessions.length})</div>
          <p class="desc">Live process table of background servers, dialers, and SSH processes.</p>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px;font-family:monospace;">
              <thead>
                <tr style="background:#0f172a;color:#94a3b8;text-align:left;">
                  <th style="padding:10px;border-bottom:1px solid #334155;">Session ID</th>
                  <th style="padding:10px;border-bottom:1px solid #334155;">Type</th>
                  <th style="padding:10px;border-bottom:1px solid #334155;">Token</th>
                  <th style="padding:10px;border-bottom:1px solid #334155;">Status</th>
                  <th style="padding:10px;border-bottom:1px solid #334155;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${sessions.length === 0 ? '<tr><td colspan="5" style="padding:14px;color:#64748b;">No active sessions running.</td></tr>' : sessions.map(s => `
                  <tr style="border-bottom:1px solid #334155;">
                    <td style="padding:10px;color:#38bdf8;">${s.id}</td>
                    <td style="padding:10px;font-weight:bold;">${s.type}</td>
                    <td style="padding:10px;color:#a5b4fc;">${s.token || '(connecting...)'}</td>
                    <td style="padding:10px;"><span class="badge" style="background:${s.status === 'running' ? '#065f46' : '#7f1d1d'};color:#34d399;">${s.status.toUpperCase()}</span></td>
                    <td style="padding:10px;"><button style="background:#ef4444;padding:4px 10px;font-size:12px;">Kill</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Tailcat Web Dashboard</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f8fafc; margin: 0; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px; }
  .title { font-size: 22px; font-weight: bold; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
  .badge { font-size: 12px; background: #1e293b; padding: 4px 10px; border-radius: 9999px; border: 1px solid #334155; }
  .tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .tab { padding: 8px 16px; border-radius: 6px; text-decoration: none; color: #94a3b8; background: #1e293b; font-size: 14px; font-weight: 500; border: 1px solid #334155; transition: all 0.2s; }
  .tab:hover { color: #f8fafc; border-color: #38bdf8; }
  .tab.active { background: #0284c7; color: #ffffff; border-color: #38bdf8; font-weight: bold; }
  .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px; }
  .card { background: #131d31; border: 1px solid #22324e; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); }
  .card-title { font-size: 17px; font-weight: bold; margin-bottom: 6px; color: #f1f5f9; display: flex; align-items: center; gap: 6px; }
  .desc { font-size: 13px; color: #94a3b8; margin: 0 0 16px 0; line-height: 1.4; }
  .form-group { margin-bottom: 14px; }
  label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; font-weight: 500; }
  input, select { width: 100%; box-sizing: border-box; padding: 9px 12px; background: #090d16; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-size: 14px; outline: none; }
  input:focus, select:focus { border-color: #38bdf8; }
  button { padding: 9px 18px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px; }
  .btn-primary { background: #10b981; color: white; }
  .btn-primary:hover { background: #059669; }
  .btn-accent { background: #3b82f6; color: white; }
  .btn-accent:hover { background: #2563eb; }
  .session-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #090d16; border: 1px solid #1e293b; border-radius: 6px; margin-bottom: 8px; font-family: monospace; font-size: 13px; }
</style>
</head>
<body>
  <div class="header">
    <div class="title">🐈 Tailcat Web Dashboard <span class="badge" style="background:#0369a1;color:white;">Cordis Micro-Kernel</span></div>
    <div class="badge">Binary: ${binInfo.available ? '● Ready (' + binInfo.source + ')' : '● Missing'}</div>
  </div>
  <div class="tabs">${tabNav}</div>
  ${tabBody}
</body>
</html>`;
  }
}

declare module 'cordis' {
  interface Context {
    webServer: TailcatWebPlugin;
  }
  interface Events<C extends Context = Context> {
    'tailcat/web-started'(data: { port: number }): void;
    'tailcat/web-stopped'(): void;
  }
}
