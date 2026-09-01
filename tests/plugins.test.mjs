import test from 'node:test';
import assert from 'node:assert/strict';
import { Context } from 'cordis';
import { TailcatService } from '../dist/services/tailcat.service.js';
import { PluginManagerService } from '../dist/services/plugin-manager.service.js';
import { FileLoggerPlugin } from '../dist/services/file-logger.plugin.js';
import { AutoPortScannerPlugin } from '../dist/services/auto-port-scanner.plugin.js';
import { MetricsCollectorPlugin } from '../dist/services/metrics-collector.plugin.js';
import { TailcatWebPlugin } from '../dist/services/web-server.plugin.js';

test('Cordis Plugin Registry and Dynamic Lifecycle Management', async (t) => {
  const ctx = new Context();
  ctx.plugin(TailcatService);
  ctx.plugin(PluginManagerService);

  await t.test('PluginManager registers all 4 modular plugins', () => {
    const plugins = ctx.pluginManager.listPlugins();
    assert.equal(plugins.length, 4);
    assert.deepEqual(plugins.map(p => p.name).sort(), [
      'autoPortScanner',
      'fileLogger',
      'metricsCollector',
      'webServer'
    ].sort());
  });

  await t.test('Enables plugins dynamically', () => {
    const ok = ctx.pluginManager.enablePlugin('fileLogger', false);
    assert.equal(ok, true);
    assert.equal(ctx.pluginManager.isPluginEnabled('fileLogger'), true);
    assert.ok(ctx.fileLogger);
    assert.ok(ctx.fileLogger.getLogDir());
  });

  await t.test('AutoPortScanner plugin resolves available port', async () => {
    ctx.pluginManager.enablePlugin('autoPortScanner', false);
    assert.ok(ctx.autoPortScanner);
    const port = await ctx.autoPortScanner.allocatePort(3950);
    assert.ok(port >= 3950);
  });

  await t.test('MetricsCollector tracks ping events', () => {
    ctx.pluginManager.enablePlugin('metricsCollector', false);
    assert.ok(ctx.metricsCollector);

    // Emit fake ping log event
    ctx.emit('tailcat/session-log', {
      session: { id: 'test-ping-session' },
      text: 'pong in 1.8ms via DERP(sfo)',
    });

    const summary = ctx.metricsCollector.getMetricsSummary();
    assert.equal(summary.totalPings, 1);
    assert.equal(summary.trackedPeers, 1);

    const m = ctx.metricsCollector.getPeerMetrics('test-ping-session');
    assert.equal(m.lastPingMs, 1.8);
    assert.equal(m.relayType, 'DERP');
  });

  await t.test('Disables and disposes plugin cleanly at runtime', () => {
    assert.equal(ctx.pluginManager.isPluginEnabled('fileLogger'), true);

    let eventFired = false;
    ctx.on('tailcat/plugin-disabled', ({ name }) => {
      if (name === 'fileLogger') eventFired = true;
    });

    const disabled = ctx.pluginManager.disablePlugin('fileLogger', false);
    assert.equal(disabled, true);
    assert.equal(ctx.pluginManager.isPluginEnabled('fileLogger'), false);
    assert.equal(eventFired, true);
  });

  await t.test('Toggle plugin toggles state between enabled and disposed', () => {
    // Current state is disabled
    assert.equal(ctx.pluginManager.isPluginEnabled('fileLogger'), false);

    const enabledNow = ctx.pluginManager.togglePlugin('fileLogger');
    assert.equal(enabledNow, true);
    assert.equal(ctx.pluginManager.isPluginEnabled('fileLogger'), true);

    const disabledNow = ctx.pluginManager.togglePlugin('fileLogger');
    assert.equal(disabledNow, false);
    assert.equal(ctx.pluginManager.isPluginEnabled('fileLogger'), false);
  });

  await t.test('FileLogger custom directory and session log path resolution', () => {
    ctx.pluginManager.enablePlugin('fileLogger', false);
    const customDir = '/tmp/tailcat-test-logs';
    ctx.fileLogger.setLogDir(customDir);
    assert.equal(ctx.fileLogger.getLogDir(), customDir);
    const sessionLogPath = ctx.fileLogger.getSessionLogPath('session-abc');
    assert.ok(sessionLogPath.includes('session-session-abc.log'));

    // Emit log to test write
    ctx.emit('tailcat/session-log', {
      session: { id: 'session-abc' },
      text: 'custom log line test',
    });
    assert.ok(ctx.fileLogger.getActiveLogsCount() > 0);
  });

  await t.test('MetricsCollector multi-peer aggregation, percentiles, and reset', () => {
    ctx.pluginManager.enablePlugin('metricsCollector', false);
    ctx.metricsCollector.resetMetrics();

    ctx.emit('tailcat/session-log', {
      session: { id: 'peer-1' },
      text: 'pong in 2.0ms via DERP(sfo)',
    });
    ctx.emit('tailcat/session-log', {
      session: { id: 'peer-2' },
      text: 'pong in 4.0ms via 192.168.1.5:41641',
    });

    const summary = ctx.metricsCollector.getMetricsSummary();
    assert.equal(summary.totalPings, 2);
    assert.equal(summary.trackedPeers, 2);
    assert.equal(summary.avgLatencyMs, 3.0);

    const all = ctx.metricsCollector.getAllMetrics();
    assert.equal(all['peer-1'].relayType, 'DERP');
    assert.equal(all['peer-2'].relayType, 'Direct');

    ctx.metricsCollector.resetMetrics();
    assert.equal(ctx.metricsCollector.getMetricsSummary().totalPings, 0);
    assert.equal(ctx.metricsCollector.getMetricsSummary().trackedPeers, 0);
  });

  await t.test('TailcatWebPlugin exposes REST API endpoints (/api/status, /api/metrics, /api/sessions, /api/action)', async () => {
    ctx.pluginManager.enablePlugin('webServer', false);
    const port = await ctx.webServer.listenAuto(3985, true);

    // 1. Test /api/status
    const statusRes = await fetch(`http://127.0.0.1:${port}/api/status`);
    assert.equal(statusRes.status, 200);
    const statusJson = await statusRes.json();
    assert.equal(statusJson.status, 'online');
    assert.equal(statusJson.port, port);

    // 2. Test /api/metrics
    const metricsRes = await fetch(`http://127.0.0.1:${port}/api/metrics`);
    assert.equal(metricsRes.status, 200);
    const metricsJson = await metricsRes.json();
    assert.ok(typeof metricsJson.totalPings === 'number');

    // 3. Test /api/sessions
    const sessionsRes = await fetch(`http://127.0.0.1:${port}/api/sessions`);
    assert.equal(sessionsRes.status, 200);
    const sessionsJson = await sessionsRes.json();
    assert.ok(Array.isArray(sessionsJson));

    // 4. Test /api/action POST
    const actionRes = await fetch(`http://127.0.0.1:${port}/api/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ping', target: 'tcTestToken' })
    });
    assert.equal(actionRes.status, 200);
    const actionJson = await actionRes.json();
    assert.equal(actionJson.success, true);
    assert.equal(actionJson.action, 'ping');

    await ctx.webServer.stop();
  });
});
