#!/usr/bin/env node
import { Context } from 'cordis';
import { TailcatService } from './services/tailcat.service.js';
import { PluginManagerService } from './services/plugin-manager.service.js';
import { TailcatTUIApp } from './tui/app.js';
import { DaemonManager } from './utils/daemon-manager.js';

export async function main() {
  const args = process.argv.slice(2);

  // CLI Action: Stop Daemon
  if (args.includes('--stop-daemon')) {
    const res = DaemonManager.stopDaemon();
    console.log(res.message);
    process.exit(res.success ? 0 : 1);
  }

  // CLI Action: Start Detached Daemon
  if (args.includes('--daemon')) {
    const portArg = args.find(a => a.startsWith('--web-port='))?.split('=')[1] || '3840';
    const autoScan = !args.includes('--no-auto-scan');

    const ctx = new Context();
    ctx.plugin(TailcatService);
    ctx.plugin(PluginManagerService);
    ctx.pluginManager.initFromConfig();

    try {
      const boundPort = await ctx.webServer.listenAuto(portArg, autoScan);
      console.log(`Tailcat Web Daemon running on http://127.0.0.1:${boundPort} (PID: ${process.pid})`);

      process.on('SIGTERM', async () => {
        if (ctx.webServer) await ctx.webServer.stop();
        DaemonManager.clearPidFile();
        process.exit(0);
      });
      process.on('SIGINT', async () => {
        if (ctx.webServer) await ctx.webServer.stop();
        DaemonManager.clearPidFile();
        process.exit(0);
      });
    } catch (err: any) {
      console.error(`Failed to start daemon: ${err?.message || err}`);
      DaemonManager.clearPidFile();
      process.exit(1);
    }
    return;
  }

  // Interactive TUI mode with optional --web
  const ctx = new Context();
  ctx.plugin(TailcatService);
  ctx.plugin(PluginManagerService);
  ctx.pluginManager.initFromConfig();

  if (args.includes('--web') && ctx.webServer) {
    const portArg = args.find(a => a.startsWith('--web-port='))?.split('=')[1] || '3840';
    try {
      const boundPort = await ctx.webServer.listenAuto(portArg, true);
      console.log(`Web server started on http://127.0.0.1:${boundPort}`);
    } catch (err: any) {
      console.error(`Web server failed: ${err?.message || err}`);
    }
  }

  const app = new TailcatTUIApp(ctx.tailcat, ctx.webServer, ctx.pluginManager);
  await app.start();

  process.on('SIGINT', () => {
    app.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    app.stop();
    process.exit(0);
  });
}

if (process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'))) {
  main();
}
