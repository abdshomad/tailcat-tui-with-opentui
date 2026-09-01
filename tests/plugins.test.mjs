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
});
