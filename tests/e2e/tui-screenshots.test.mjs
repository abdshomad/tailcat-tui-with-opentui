import { test } from 'node:test';
import assert from 'node:assert';
import { existsSync } from 'node:fs';
import { Context } from 'cordis';
import { TailcatService } from '../../dist/services/tailcat.service.js';
import { TailcatWebPlugin } from '../../dist/services/web-server.plugin.js';
import { PluginManagerService } from '../../dist/services/plugin-manager.service.js';
import { TailcatTUIApp } from '../../dist/tui/app.js';
import { createInitialState } from '../../dist/tui/state.js';
import { TerminalScreenshot } from '../../dist/utils/terminal-screenshot.js';

test('E2E TUI Screenshots: All 8 interaction modules with expanded states', async () => {
  const ctx = new Context();
  ctx.plugin(TailcatService);
  ctx.plugin(TailcatWebPlugin);
  ctx.plugin(PluginManagerService);
  ctx.pluginManager.initFromConfig();

  // Create sample sessions for realistic UI display
  ctx.tailcat.addMockSession({
    type: 'serve-port',
    command: 'tailcat serve 8080',
    args: ['serve', '8080'],
    token: 'tco2FwWCCpvssskl8qhb93847291048172938471928374918237491283749',
    status: 'running',
  });

  ctx.tailcat.addMockSession({
    type: 'serve-ssh',
    command: 'tailcat serve no-auth-ssh',
    args: ['serve', 'no-auth-ssh'],
    token: 'tco2FwWCBLlCt6WsK7tg91827391827391827391827391827391827391827',
    status: 'running',
  });

  const state = createInitialState();

  // 1. Pipe & Stream
  state.activeTab = 'pipe';
  state.forms.focusedFieldIndex = 0;
  state.statusMessage = 'Pipe/Stream server mode. Press Enter on [ START STREAM SERVER ] to listen.';
  const pipeLines1 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const pipeShot1 = TerminalScreenshot.captureTUIFrame(pipeLines1, {
    type: 'tui',
    module: 'pipe',
    feature: 'stream-server',
    stepNumber: 1,
    slug: 'view-server-form',
  });
  assert.ok(existsSync(pipeShot1), `File exists: ${pipeShot1}`);

  state.forms.focusedFieldIndex = 3;
  state.forms.pipeClientToken = 'tco2FwWCD9arGS1IghQI9817293847192837491823749';
  state.forms.pipeClientMessage = 'hello from tailcat tui client stream';
  state.statusMessage = 'Client stream configured. Ready to transmit payload to peer.';
  const pipeLines2 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const pipeShot2 = TerminalScreenshot.captureTUIFrame(pipeLines2, {
    type: 'tui',
    module: 'pipe',
    feature: 'stream-client',
    stepNumber: 2,
    slug: 'configure-client-payload',
  });
  assert.ok(existsSync(pipeShot2), `File exists: ${pipeShot2}`);

  // 2. Ports & Tunnels
  state.activeTab = 'ports';
  state.forms.focusedFieldIndex = 2;
  state.forms.servePortInput = '8080';
  state.forms.servePortAllow = '';
  state.statusMessage = 'Port Forwarding: Serving local port 8080. Enter to start tunnel.';
  const portsLines1 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const portsShot1 = TerminalScreenshot.captureTUIFrame(portsLines1, {
    type: 'tui',
    module: 'ports',
    feature: 'serve-port',
    stepNumber: 1,
    slug: 'serve-local-port',
  });
  assert.ok(existsSync(portsShot1), `File exists: ${portsShot1}`);

  state.forms.focusedFieldIndex = 5;
  state.forms.connectPortToken = 'tco2FwWCCpvssskl8qhb93847291048172938471928374918237491283749';
  state.forms.connectPortNumber = '8080';
  state.statusMessage = 'Port Forwarding: Dialing remote port 8080 via WireGuard token.';
  const portsLines2 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const portsShot2 = TerminalScreenshot.captureTUIFrame(portsLines2, {
    type: 'tui',
    module: 'ports',
    feature: 'dial-port',
    stepNumber: 2,
    slug: 'dial-remote-port',
  });
  assert.ok(existsSync(portsShot2), `File exists: ${portsShot2}`);

  // 3. SSH Server & Client
  state.activeTab = 'ssh';
  state.forms.focusedFieldIndex = 1;
  state.statusMessage = 'Userspace SSH Server: Auth-free mode active. No open firewall ports required.';
  const sshLines1 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const sshShot1 = TerminalScreenshot.captureTUIFrame(sshLines1, {
    type: 'tui',
    module: 'ssh',
    feature: 'serve-ssh',
    stepNumber: 1,
    slug: 'auth-free-ssh-server',
  });
  assert.ok(existsSync(sshShot1), `File exists: ${sshShot1}`);

  state.forms.focusedFieldIndex = 4;
  state.forms.connectSshToken = 'tco2FwWCBLlCt6WsK7tg91827391827391827391827391827391827391827';
  state.forms.connectSshCommand = 'uname -a && whoami';
  state.statusMessage = 'SSH Client: Connect to remote token and execute command.';
  const sshLines2 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const sshShot2 = TerminalScreenshot.captureTUIFrame(sshLines2, {
    type: 'tui',
    module: 'ssh',
    feature: 'client-ssh',
    stepNumber: 2,
    slug: 'ssh-client-connect',
  });
  assert.ok(existsSync(sshShot2), `File exists: ${sshShot2}`);

  // 4. Files & SFTP
  state.activeTab = 'files';
  state.forms.focusedFieldIndex = 1;
  state.forms.recvDir = './inbox';
  state.statusMessage = 'Drop Box Receiver: Listening for incoming uploads into ./inbox.';
  const filesLines1 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const filesShot1 = TerminalScreenshot.captureTUIFrame(filesLines1, {
    type: 'tui',
    module: 'files',
    feature: 'dropbox-recv',
    stepNumber: 1,
    slug: 'dropbox-inbox-receiver',
  });
  assert.ok(existsSync(filesShot1), `File exists: ${filesShot1}`);

  state.forms.focusedFieldIndex = 4;
  state.forms.serveFilesDir = '/srv/files';
  state.forms.serveFilesMode = 'ro';
  state.statusMessage = 'SFTP Server: Serving /srv/files in read-only mode.';
  const filesLines2 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const filesShot2 = TerminalScreenshot.captureTUIFrame(filesLines2, {
    type: 'tui',
    module: 'files',
    feature: 'sftp-serve',
    stepNumber: 2,
    slug: 'serve-directory-sftp',
  });
  assert.ok(existsSync(filesShot2), `File exists: ${filesShot2}`);

  // 5. Diagnostics & Ping
  state.activeTab = 'diag';
  state.forms.focusedFieldIndex = 2;
  state.forms.pingToken = 'tco2FwWCAQiQduW_yR5X19283749182739182739182739182739182739182';
  state.forms.pingUntilDirect = true;
  state.statusMessage = 'Ping Diagnostics: Probing peer latency and direct UDP upgrade path.';
  const diagLines1 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const diagShot1 = TerminalScreenshot.captureTUIFrame(diagLines1, {
    type: 'tui',
    module: 'diagnostics',
    feature: 'ping',
    stepNumber: 1,
    slug: 'ping-derp-direct',
  });
  assert.ok(existsSync(diagShot1), `File exists: ${diagShot1}`);

  state.forms.focusedFieldIndex = 4;
  state.forms.socksToken = 'tco2FwWCAQiQduW_yR5X19283749182739182739182739182739182739182';
  state.forms.socksCommand = 'curl -s http://server.tailcat:8080/';
  state.statusMessage = 'SOCKS5 Runner: Wrapping CLI curl command through userspace proxy.';
  const diagLines2 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const diagShot2 = TerminalScreenshot.captureTUIFrame(diagLines2, {
    type: 'tui',
    module: 'diagnostics',
    feature: 'socks-proxy',
    stepNumber: 2,
    slug: 'socks5-proxy-runner',
  });
  assert.ok(existsSync(diagShot2), `File exists: ${diagShot2}`);

  state.forms.focusedFieldIndex = 6;
  state.forms.parseTokenInput = 'tco2FwWCDcdWP0cMLzy-rDaTsX2Zx3nz5JAKE-hc19283749182739182739';
  state.statusMessage = 'Token Parser & Resolver: Decoding WireGuard keys and DERP region.';
  const diagLines3 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const diagShot3 = TerminalScreenshot.captureTUIFrame(diagLines3, {
    type: 'tui',
    module: 'diagnostics',
    feature: 'token-parser',
    stepNumber: 3,
    slug: 'token-parser-resolver',
  });
  assert.ok(existsSync(diagShot3), `File exists: ${diagShot3}`);

  // 6. Keys & Identities
  state.activeTab = 'keys';
  state.forms.focusedFieldIndex = 3;
  state.forms.genKeyName = 'prod-gateway';
  state.forms.genKeyRegion = 'sfo';
  state.statusMessage = 'WireGuard Keys: Generate persistent identity key with fixed sfo relay.';
  const keysLines1 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const keysShot1 = TerminalScreenshot.captureTUIFrame(keysLines1, {
    type: 'tui',
    module: 'keys',
    feature: 'genkey-default',
    stepNumber: 1,
    slug: 'generate-saved-key',
  });
  assert.ok(existsSync(keysShot1), `File exists: ${keysShot1}`);

  state.forms.focusedFieldIndex = 4;
  state.forms.genKeyClient = true;
  state.forms.genKeyName = 'ci-runner-client';
  state.statusMessage = 'Client Identity Key: Generate client key for --allow ACL enforcement.';
  const keysLines2 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const keysShot2 = TerminalScreenshot.captureTUIFrame(keysLines2, {
    type: 'tui',
    module: 'keys',
    feature: 'genkey-client',
    stepNumber: 2,
    slug: 'client-identity-key',
  });
  assert.ok(existsSync(keysShot2), `File exists: ${keysShot2}`);

  // 7. Sessions & Supervisor
  state.activeTab = 'sessions';
  state.forms.focusedFieldIndex = 0;
  state.statusMessage = 'Supervisor: 2 active background tunnels running. Press [k] to terminate focused process.';
  const sessLines1 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const sessShot1 = TerminalScreenshot.captureTUIFrame(sessLines1, {
    type: 'tui',
    module: 'sessions',
    feature: 'monitor-tunnels',
    stepNumber: 1,
    slug: 'supervisor-dashboard',
  });
  assert.ok(existsSync(sessShot1), `File exists: ${sessShot1}`);

  // 8. Settings & Plugin Manager Tab
  state.activeTab = 'web';
  state.forms.focusedFieldIndex = 7;
  state.forms.webPortInput = '3840';
  state.forms.webAutoScan = true;
  state.statusMessage = 'Web Server & Persistence: Listening on http://127.0.0.1:3840.';
  const webLines1 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const webShot1 = TerminalScreenshot.captureTUIFrame(webLines1, {
    type: 'tui',
    module: 'web',
    feature: 'web-server-controls',
    stepNumber: 1,
    slug: 'web-serving-and-persistence',
  });
  assert.ok(existsSync(webShot1), `File exists: ${webShot1}`);

  // Plugin Registry Toggle View
  state.forms.focusedFieldIndex = 0; // Focus first plugin
  state.statusMessage = 'Cordis Plugin Registry: Toggle focused plugin [webServer] with Enter.';
  const webLines2 = TailcatTUIApp.renderAppScreen(state, ctx.tailcat, ctx.webServer, ctx.pluginManager, 80);
  const webShot2 = TerminalScreenshot.captureTUIFrame(webLines2, {
    type: 'tui',
    module: 'web',
    feature: 'plugin-registry',
    stepNumber: 2,
    slug: 'settings-and-plugin-manager',
  });
  assert.ok(existsSync(webShot2), `File exists: ${webShot2}`);
});
