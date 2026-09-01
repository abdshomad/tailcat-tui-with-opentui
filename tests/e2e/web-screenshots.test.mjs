import { test } from 'node:test';
import assert from 'node:assert';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Context } from 'cordis';
import { TailcatService } from '../../dist/services/tailcat.service.js';
import { TailcatWebPlugin } from '../../dist/services/web-server.plugin.js';
import { PluginManagerService } from '../../dist/services/plugin-manager.service.js';
import { WebScreenshot } from '../../dist/utils/web-screenshot.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsWebDir = resolve(__dirname, '../../docs/web');

test('E2E Web Screenshots & Documentation Generator with Full Features', async () => {
  mkdirSync(docsWebDir, { recursive: true });

  const ctx = new Context();
  ctx.plugin(TailcatService);
  ctx.plugin(TailcatWebPlugin);
  ctx.plugin(PluginManagerService);
  ctx.pluginManager.initFromConfig();

  // Create sample active sessions to showcase supervisor table in web UI
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

  const port = await ctx.webServer.listen(3842);
  const baseUrl = `http://127.0.0.1:${port}`;

  const webModules = [
    {
      tab: 'pipe',
      num: '01',
      id: 'pipe',
      title: 'Pipe & Raw Stream',
      feature: 'stream-server',
      slug: 'web-pipe-server',
      desc: 'Create raw bidirectional data streams over Tailscale WireGuard/DERP data plane for streaming payloads or terminal pipes between peers.'
    },
    {
      tab: 'ports',
      num: '02',
      id: 'ports',
      title: 'Ports & Tunnels',
      feature: 'serve-port',
      slug: 'web-serve-port',
      desc: 'Expose local TCP ports (8080, 8443, or all) to remote peers through userspace tunnels without altering firewall or routing tables.'
    },
    {
      tab: 'ssh',
      num: '03',
      id: 'ssh',
      title: 'Auth-Free SSH Server',
      feature: 'serve-ssh',
      slug: 'web-ssh-server',
      desc: 'Userspace SSH daemon providing auth-free or WireGuard-ACL protected remote terminal access without inbound firewall holes.'
    },
    {
      tab: 'files',
      num: '04',
      id: 'files',
      title: 'Files & Drop Box Inbox',
      feature: 'dropbox-recv',
      slug: 'web-files-dropbox',
      desc: 'Secure drop box receiver (`tailcat recv /inbox`) accepting encrypted file uploads via SCP / SFTP.'
    },
    {
      tab: 'diag',
      num: '05',
      id: 'diagnostics',
      title: 'Network Diagnostics & Ping',
      feature: 'ping',
      slug: 'web-diagnostics-ping',
      desc: 'Inspect network latency and DERP relay vs direct UDP paths across Tailcat peers.'
    },
    {
      tab: 'keys',
      num: '06',
      id: 'keys',
      title: 'Key Management & Identities',
      feature: 'genkey-default',
      slug: 'web-keys-genkey',
      desc: 'Manage persistent WireGuard identity keypairs, generate stable tokens, and configure custom DERP relays.'
    },
    {
      tab: 'sessions',
      num: '07',
      id: 'sessions',
      title: 'Active Sessions & Process Supervisor',
      feature: 'monitor-tunnels',
      slug: 'web-sessions-monitor',
      desc: 'Real-time dashboard monitoring background tunnels, connection tokens, process status, and lifecycle controls.'
    }
  ];

  try {
    const docList = [];

    for (const mod of webModules) {
      const shotPath = await WebScreenshot.captureUrlToWebp(`${baseUrl}/?tab=${mod.tab}`, {
        type: 'web',
        module: mod.id,
        feature: mod.feature,
        stepNumber: 1,
        slug: mod.slug,
      });

      assert.ok(existsSync(shotPath), `File exists: ${shotPath}`);

      // Define per-module Mermaid diagram
      const mermaidDiagrams = {
        'pipe': `\`\`\`mermaid
flowchart LR
    Browser["Browser Client (/?tab=pipe)"] -->|POST /api/pipe/start| WebPlugin["TailcatWebPlugin (3840)"]
    WebPlugin --> TailcatSvc["TailcatService"]
    TailcatSvc --> Proc["tailcat pipe"]
    Proc -.-> Net["WireGuard / DERP Stream"]
    Browser -.->|GET /api/sessions (poll)| WebPlugin
\`\`\``,
        'ports': `\`\`\`mermaid
flowchart LR
    Browser["Browser Client (/?tab=ports)"] -->|POST /api/ports/serve| WebPlugin["TailcatWebPlugin (3840)"]
    WebPlugin --> Scanner["AutoPortScannerPlugin"]
    WebPlugin --> TailcatSvc["TailcatService"]
    TailcatSvc --> Proc["tailcat serve-port"]
    Proc -.-> Net["Userspace TCP Netstack"]
    Browser -.->|GET /api/sessions (poll)| WebPlugin
\`\`\``,
        'ssh': `\`\`\`mermaid
flowchart LR
    Browser["Browser Client (/?tab=ssh)"] -->|POST /api/ssh/start| WebPlugin["TailcatWebPlugin (3840)"]
    WebPlugin --> TailcatSvc["TailcatService"]
    TailcatSvc --> Proc["tailcat ssh (daemon)"]
    Proc -.-> Net["WireGuard Authenticated SSH"]
    Browser -.->|GET /api/sessions (poll)| WebPlugin
\`\`\``,
        'files': `\`\`\`mermaid
flowchart LR
    Browser["Browser Client (/?tab=files)"] -->|POST /api/files/serve| WebPlugin["TailcatWebPlugin (3840)"]
    WebPlugin --> Logger["FileLoggerPlugin"]
    WebPlugin --> TailcatSvc["TailcatService"]
    TailcatSvc --> Proc["tailcat recv / serve files"]
    Proc -.-> Net["Drop Box / SFTP Channel"]
    Browser -.->|GET /api/sessions (poll)| WebPlugin
\`\`\``,
        'diag': `\`\`\`mermaid
flowchart LR
    Browser["Browser Client (/?tab=diag)"] -->|POST /api/ping| WebPlugin["TailcatWebPlugin (3840)"]
    WebPlugin --> Metrics["MetricsCollectorPlugin"]
    WebPlugin --> TailcatSvc["TailcatService"]
    TailcatSvc --> Proc["tailcat ping / token"]
    Proc -.-> Net["DERP & Direct UDP Telemetry"]
    Browser -.->|GET /api/metrics (poll)| WebPlugin
\`\`\``,
        'keys': `\`\`\`mermaid
flowchart LR
    Browser["Browser Client (/?tab=keys)"] -->|POST /api/keys/generate| WebPlugin["TailcatWebPlugin (3840)"]
    WebPlugin --> DaemonMgr["DaemonManager (config.json)"]
    WebPlugin --> TailcatSvc["TailcatService"]
    TailcatSvc --> Proc["tailcat genkey"]
    Browser -.->|GET /api/keys| WebPlugin
\`\`\``,
        'sessions': `\`\`\`mermaid
flowchart LR
    Browser["Browser Client (/?tab=sessions)"] -->|GET /api/sessions (1s)| WebPlugin["TailcatWebPlugin (3840)"]
    Browser -->|DELETE /api/sessions/:id| WebPlugin
    WebPlugin --> TailcatSvc["TailcatService (Supervisor)"]
    TailcatSvc --> Procs["Active Process Pool (SIGTERM / SIGKILL)"]
\`\`\``
      };

      const modMermaid = mermaidDiagrams[mod.id] || '';

      // Generate per-module markdown file
      const mdContent = `# Web Dashboard: ${mod.title}

${mod.desc}

> **OpenTUI Mapping**: Tab ${mod.num} | **Cordis Route**: \`/?tab=${mod.tab}\`  
> **Interactive Archify Visualizer**: [\`docs/features/core/diagrams/web-arch.html\`](../features/core/diagrams/web-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/web-arch.html)

${modMermaid}

---

## Visual Walkthrough

![${mod.title}](../../screenshots/web/${mod.id}/${mod.feature}/01-${mod.slug}.webp)

---

## Module Controls & Details
* **Route**: \`/?tab=${mod.tab}\`
* **Purpose**: ${mod.desc}
* **Supervised Sessions**: Tunnels launched through this interface appear immediately in the Active Sessions monitor table.
`;
      const mdFile = resolve(docsWebDir, `${mod.num}-${mod.id}.md`);
      writeFileSync(mdFile, mdContent, 'utf8');

      docList.push({ ...mod, mdFile: `${mod.num}-${mod.id}.md` });
    }

    // Generate docs/web/README.md index
    const indexContent = `# Tailcat Web Dashboard Visual Documentation

Comprehensive visual guide for all 7 modules in the **Cordis-powered Tailcat Web Dashboard**.

---

## 🏗️ Web Dashboard & Cordis Plugin Architecture

> **Interactive Archify Visualizer**: [\`docs/features/core/diagrams/web-arch.html\`](../features/core/diagrams/web-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/web-arch.html)  
> **Unified System Architecture**: [\`docs/features/core/diagrams/tui-web-arch.html\`](../features/core/diagrams/tui-web-arch.html) · [🌐 Live HTMLPreview](https://htmlpreview.github.io/?https://github.com/abdshomad/tailcat-tui-with-opentui/blob/main/docs/features/core/diagrams/tui-web-arch.html)

\`\`\`mermaid
flowchart TD
    subgraph KERNEL["Tailcat Core Kernel (Cordis Micro-Kernel)"]
        PluginMgr["PluginManagerService<br/>(Dynamic Fork / Dispose)"]
        WebPlugin["TailcatWebPlugin<br/>(HTTP / Web Dashboard)"]
        TailcatSvc["TailcatService<br/>(Process Supervisor)"]
        
        PluginMgr -. "fork / dispose" .-> WebPlugin
        WebPlugin --> TailcatSvc
    end

    HTTP["http://127.0.0.1:3840/<br/>(REST API + Static SPA)"]
    BrowserUI["Browser Dashboard UI<br/>(Interactive Tunnel Management)"]
    ChromeProof["Headless Chrome + ffmpeg<br/>(Visual Screenshot Generation)"]

    WebPlugin --> HTTP
    HTTP --> BrowserUI
    HTTP --> ChromeProof
\`\`\`

### 1. HTTP Server & Endpoints
* **Dashboard Interface**: Served as responsive HTML with dark-mode styling and tab navigation for modules \`pipe\`, \`ports\`, \`ssh\`, \`files\`, \`diag\`, \`keys\`, and \`sessions\`.
* **REST API (\`/api/sessions\`)**: Returns live JSON serialization of all background tunnel sessions supervised by \`TailcatService\`.
* **Dynamic Plugin Lifecycle**: Can be dynamically enabled or disposed from OpenTUI Tab 8 ("Settings & Plugin Manager") via \`ctx.pluginManager.togglePlugin('webServer')\`.
* **Port Allocation**: Automatic sequential scanning (\`PortScanner.resolvePort(3840, true)\`) finding available ports starting from \`3840\`.

---

## 📋 Modules Overview

| Module # | Module Name | Route | Documentation | Screenshot |
| :---: | :--- | :---: | :--- | :---: |
${docList.map(m => `| **${m.num}** | ${m.title} | \`/?tab=${m.tab}\` | [${m.title}](./${m.mdFile}) | ![${m.title}](../../screenshots/web/${m.id}/${m.feature}/01-${m.slug}.webp) |`).join('\n')}

---

## 🧪 Testing & Execution

\`\`\`bash
# Run Web Plugin and Plugin Manager unit tests
npm test -- tests/web-serving.test.mjs tests/plugins.test.mjs

# Re-generate all Web Dashboard screenshots and Markdown pages
npm run test:screenshots
\`\`\`
`;
    writeFileSync(resolve(docsWebDir, 'README.md'), indexContent, 'utf8');

  } finally {
    await ctx.webServer.stop();
  }
});
