import { test } from 'node:test';
import assert from 'node:assert';
import { Context } from 'cordis';
import { TailcatService } from '../dist/services/tailcat.service.js';
import { TailcatWebPlugin } from '../dist/services/web-server.plugin.js';
import { PluginManagerService } from '../dist/services/plugin-manager.service.js';
import { PortScanner } from '../dist/utils/port-scanner.js';
import { DaemonManager } from '../dist/utils/daemon-manager.js';
import { createInitialState } from '../dist/tui/state.js';
import { WebView } from '../dist/tui/views/web-view.js';

test('PortScanner detects port availability and auto-resolves free port', async () => {
  const isFree = await PortScanner.isPortAvailable(3955);
  assert.strictEqual(typeof isFree, 'boolean');

  const resolved = await PortScanner.resolvePort('auto', true);
  assert.ok(resolved >= 3840 && resolved <= 3940);
});

test('DaemonManager loads and saves configuration safely', () => {
  const cfg = DaemonManager.loadConfig();
  assert.ok(typeof cfg.preferredPort === 'string');

  const updated = DaemonManager.saveConfig({ preferredPort: '3849', autoScan: true });
  assert.strictEqual(updated.preferredPort, '3849');
  assert.strictEqual(updated.autoScan, true);
});

test('TailcatWebPlugin starts, detects auto port, and shuts down cleanly', async () => {
  const ctx = new Context();
  ctx.plugin(TailcatService);
  ctx.plugin(TailcatWebPlugin);

  let startEventPort = 0;
  ctx.on('tailcat/web-started', ({ port }) => {
    startEventPort = port;
  });

  const bound = await ctx.webServer.listenAuto(3960, true);
  assert.strictEqual(bound, 3960);
  assert.strictEqual(startEventPort, 3960);
  assert.strictEqual(ctx.webServer.getStatus(), 'online');

  await ctx.webServer.stop();
  assert.strictEqual(ctx.webServer.getStatus(), 'offline');
});

test('WebView renders and executes action handlers', async () => {
  const ctx = new Context();
  ctx.plugin(TailcatService);
  ctx.plugin(TailcatWebPlugin);
  ctx.plugin(PluginManagerService);
  const state = createInitialState();

  const lines = WebView.render(state, ctx.webServer, 80, ctx.pluginManager);
  assert.ok(lines.some(l => l.includes('Settings & Plugin Manager')));

  // Test toggle auto-scan (field index 6)
  state.forms.focusedFieldIndex = 6;
  const msg1 = await WebView.handleAction(state, ctx.webServer, ctx.pluginManager);
  assert.ok(msg1.includes('Auto-scan port toggled'));

  // Test start web server (field index 7)
  state.forms.focusedFieldIndex = 7;
  state.forms.webPortInput = '3970';
  const msg2 = await WebView.handleAction(state, ctx.webServer, ctx.pluginManager);
  assert.ok(msg2.includes('Web server started on http://127.0.0.1:3970'));

  // Test stop web server
  const msg3 = await WebView.handleAction(state, ctx.webServer, ctx.pluginManager);
  assert.ok(msg3.includes('Web server stopped'));
});
