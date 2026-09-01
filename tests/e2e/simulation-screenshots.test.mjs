import { test } from 'node:test';
import assert from 'node:assert';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TerminalScreenshot } from '../../dist/utils/terminal-screenshot.js';
import { ANSI, box } from '../../dist/tui/ansi.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsSimDir = resolve(__dirname, '../../docs/simulation');

test('E2E Simulation Screenshots & Documentation Generator', async () => {
  mkdirSync(docsSimDir, { recursive: true });

  const simulationScenarios = [
    {
      num: '01',
      id: '01-pipe-stream',
      title: 'Pipe & Raw Stream Simulation',
      desc: 'Simulates raw bidirectional stream transmission between node-server listener and node-client payload sender over isolated WireGuard/DERP channel.',
      steps: [
        {
          num: 1,
          slug: 'server-listener-start',
          title: 'Step 1: Server Listener Startup',
          terminalTitle: 'node-server: tailcat (listening)',
          lines: [
            `${ANSI.cyan}# Selected bootstrap relay region 900, Docker Local DERP${ANSI.reset}`,
            `${ANSI.green}# 🐈 Server listening with new address: tcomFwWCDL7Zb1b5CUGFWy0yJOWhs1wLom6OOJlBO0NwVptowtVGFrWCCOlZJ0...${ANSI.reset}`,
            `{"listenAddr":"tcomFwWCDL7Zb1b5CUGFWy0yJOWhs1wLom6OOJlBO0NwVptowtVGFrWCCOlZJ0..."}`,
            `${ANSI.yellow}(waiting for client connection...)${ANSI.reset}`
          ]
        },
        {
          num: 2,
          slug: 'client-send-payload',
          title: 'Step 2: Client Dials & Streams Payload',
          terminalTitle: 'node-client: tailcat <token>',
          lines: [
            `${ANSI.cyan}$ echo "Hello Tailcat Pipe Stream 1740984000" | tailcat --derpmap-url=http://derper:3341/derpmap.json tcomFwWCDL7Zb1b5CUGF...${ANSI.reset}`,
            `${ANSI.green}Connecting to peer via DERP(local)...${ANSI.reset}`,
            `${ANSI.green}WireGuard handshake completed in 1.4ms.${ANSI.reset}`,
            `Payload delivered successfully.`
          ]
        },
        {
          num: 3,
          slug: 'server-payload-received',
          title: 'Step 3: Server Unblocks & Outputs Data',
          terminalTitle: 'node-server: stdout stream received',
          lines: [
            `${ANSI.green}# Connection accepted from peer nodekey:840398fd7c...${ANSI.reset}`,
            `${ANSI.brightYellow}Hello Tailcat Pipe Stream 1740984000${ANSI.reset}`,
            `${ANSI.cyan}# Stream closed cleanly by client. Exiting.${ANSI.reset}`
          ]
        }
      ]
    },
    {
      num: '02',
      id: '02-port-forward',
      title: 'Port Forwarding (8080) Simulation',
      desc: 'Exposes local HTTP service on port 8080 through the tunnel, dialed directly by remote client over userspace netstack.',
      steps: [
        {
          num: 1,
          slug: 'serve-local-port',
          title: 'Step 1: Start Port Forwarder Daemon',
          terminalTitle: 'node-server: tailcat serve 8080',
          lines: [
            `${ANSI.cyan}# Starting local HTTP echo daemon on port 8080...${ANSI.reset}`,
            `${ANSI.green}# 🐈 Server listening with new address: tcABggx-47Y6OEyJOWhs1wLom6OOJlBO0NwVptowtVGFrWCCOlZJ0...${ANSI.reset}`,
            `{"listenAddr":"tcABggx-47Y6OEyJOWhs1wLom6OOJlBO0NwVptowtVGFrWCCOlZJ0..."}`
          ]
        },
        {
          num: 2,
          slug: 'dial-forwarded-port',
          title: 'Step 2: Client Dials Remote Port',
          terminalTitle: 'node-client: tailcat <token> 8080',
          lines: [
            `${ANSI.cyan}$ printf 'GET /index.html HTTP/1.0\\r\\nHost: localhost\\r\\n\\r\\n' | tailcat tcABggx... 8080${ANSI.reset}`,
            `${ANSI.green}HTTP/1.0 200 OK${ANSI.reset}`,
            `Content-Type: text/html`,
            `Content-Length: 36`,
            ``,
            `${ANSI.brightYellow}HTTP 200 OK from Tailcat Local Port${ANSI.reset}`
          ]
        }
      ]
    },
    {
      num: '03',
      id: '03-auth-free-ssh',
      title: 'Auth-Free SSH Server & Remote Exec Simulation',
      desc: 'Spawns userspace auth-free SSH daemon without inbound firewall ports and runs remote commands over WireGuard tunnel.',
      steps: [
        {
          num: 1,
          slug: 'start-ssh-server',
          title: 'Step 1: Launch Auth-Free SSH Daemon',
          terminalTitle: 'node-server: tailcat serve no-auth-ssh',
          lines: [
            `${ANSI.cyan}# Starting embedded SSH server (gliderssh userspace daemon)...${ANSI.reset}`,
            `${ANSI.green}# 🐈 Server listening with new address: tcDhpEgndp2zdfyJOWhs1wLom6OOJlBO0NwVptowtVGFrWCCOlZJ0...${ANSI.reset}`,
            `{"listenAddr":"tcDhpEgndp2zdfyJOWhs1wLom6OOJlBO0NwVptowtVGFrWCCOlZJ0..."}`
          ]
        },
        {
          num: 2,
          slug: 'client-exec-command',
          title: 'Step 2: Client Executes Remote Command',
          terminalTitle: 'node-client: tailcat ssh <token> "cmd"',
          lines: [
            `${ANSI.cyan}$ tailcat ssh tcDhpEgndp2zdf... 'echo AUTH_FREE_SSH_OK; whoami; uname -s'${ANSI.reset}`,
            `${ANSI.green}AUTH_FREE_SSH_OK${ANSI.reset}`,
            `root`,
            `Linux`
          ]
        }
      ]
    },
    {
      num: '04',
      id: '04-file-sftp',
      title: 'Files, Drop Box & SFTP Transfers Simulation',
      desc: 'Simulates write-only drop box receiver (`tailcat recv /inbox`) and SFTP directory server (`tailcat serve files`) with `tailcat cp` and `tailcat ls`.',
      steps: [
        {
          num: 1,
          slug: 'dropbox-inbox-listen',
          title: 'Step 1: Start Drop Box Inbox Receiver',
          terminalTitle: 'node-server: tailcat recv /inbox',
          lines: [
            `${ANSI.cyan}# Initialized drop box directory at /inbox (write-only)...${ANSI.reset}`,
            `${ANSI.green}# 🐈 Server listening with new address: tcRecvDropBoxToken12345...${ANSI.reset}`,
            `Ready to receive encrypted file uploads.`
          ]
        },
        {
          num: 2,
          slug: 'dropbox-file-upload',
          title: 'Step 2: Client Copies File into Drop Box',
          terminalTitle: 'node-client: tailcat cp sample.txt <token>:',
          lines: [
            `${ANSI.cyan}$ tailcat cp /tmp/sample_upload.txt tcRecvDropBoxToken12345:${ANSI.reset}`,
            `sample_upload.txt          100%   34     0.1KB/s   00:00`,
            `${ANSI.green}Upload complete. File deposited into /inbox/sample_upload.txt.${ANSI.reset}`
          ]
        },
        {
          num: 3,
          slug: 'sftp-directory-serve',
          title: 'Step 3: Serve SFTP Files Directory',
          terminalTitle: 'node-server: tailcat serve --files=/srv/files:ro files',
          lines: [
            `${ANSI.cyan}# Serving directory /srv/files (read-only) via SFTP...${ANSI.reset}`,
            `${ANSI.green}# 🐈 Server listening with new address: tcSftpServerToken67890...${ANSI.reset}`
          ]
        },
        {
          num: 4,
          slug: 'sftp-list-download',
          title: 'Step 4: Client Explores & Downloads File',
          terminalTitle: 'node-client: tailcat ls & tailcat cp',
          lines: [
            `${ANSI.cyan}$ tailcat ls tcSftpServerToken67890...${ANSI.reset}`,
            `-rw-r--r-- 1 root root 28 Sep 2 03:58 readme_doc.txt`,
            `${ANSI.cyan}$ tailcat cp tcSftpServerToken67890...:readme_doc.txt /tmp/downloaded_doc.txt${ANSI.reset}`,
            `${ANSI.green}Downloaded successfully: "Served file via Tailcat SFTP"${ANSI.reset}`
          ]
        }
      ]
    },
    {
      num: '05',
      id: '05-ping-diagnostics',
      title: 'Network Diagnostics & Ping Simulation',
      desc: 'Probes peer latency and validates DERP relay paths vs direct peer-to-peer UDP punch.',
      steps: [
        {
          num: 1,
          slug: 'ping-target-listen',
          title: 'Step 1: Start Diagnostics Target Listener',
          terminalTitle: 'node-server: tailcat serve 8080',
          lines: [
            `${ANSI.cyan}# 🐈 Diagnostics peer listening on region 900 (Docker Local DERP)...${ANSI.reset}`,
            `${ANSI.green}# Connection Token: tcPingTarget98765...${ANSI.reset}`
          ]
        },
        {
          num: 2,
          slug: 'ping-latency-pong',
          title: 'Step 2: Client Measures Ping Latency',
          terminalTitle: 'node-client: tailcat ping <token>',
          lines: [
            `${ANSI.cyan}$ tailcat ping --until-direct tcPingTarget98765...${ANSI.reset}`,
            `${ANSI.green}pong in 1.4ms via DERP(local)${ANSI.reset}`,
            `${ANSI.green}pong in 0.8ms via 172.27.0.2:41641 (direct UDP path)${ANSI.reset}`
          ]
        }
      ]
    },
    {
      num: '06',
      id: '06-socks5-proxy',
      title: 'SOCKS5 Userspace Proxy Runner Simulation',
      desc: 'Routes arbitrary CLI commands (like curl) through a transient userspace SOCKS5 proxy tunnel.',
      steps: [
        {
          num: 1,
          slug: 'socks-service-listen',
          title: 'Step 1: Start Target HTTP Endpoint',
          terminalTitle: 'node-server: HTTP on 8080 + tailcat serve 8080',
          lines: [
            `${ANSI.cyan}# HTTP Echo Server listening on localhost:8080${ANSI.reset}`,
            `${ANSI.green}# 🐈 Tunnel listening on address: tcSocksTarget11223...${ANSI.reset}`
          ]
        },
        {
          num: 2,
          slug: 'socks-curl-request',
          title: 'Step 2: Route Curl through SOCKS5 Proxy',
          terminalTitle: 'node-client: tailcat socks <token> curl ...',
          lines: [
            `${ANSI.cyan}$ tailcat socks tcSocksTarget11223... curl -s http://server.tailcat:8080/index.html${ANSI.reset}`,
            `${ANSI.brightYellow}SOCKS5_PROXY_SUCCESS_RESPONSE${ANSI.reset}`,
            `${ANSI.green}Proxied via userspace gVisor netstack successfully.${ANSI.reset}`
          ]
        }
      ]
    },
    {
      num: '07',
      id: '07-key-management-acl',
      title: 'Key Management & WireGuard ACL Simulation',
      desc: 'Restricts server access to approved client public keys (`--allow=nodekey:...`) and validates rejection of unauthorized handshakes.',
      steps: [
        {
          num: 1,
          slug: 'generate-client-key',
          title: 'Step 1: Generate Client Identity Keypair',
          terminalTitle: 'node-client: tailcat genkey --client',
          lines: [
            `${ANSI.cyan}$ tailcat genkey --client --key=client-default${ANSI.reset}`,
            `# wrote file to ~/.config/tailcat/keys/client-default.private.json`,
            `${ANSI.brightYellow}nodekey:840398fd7c2d2fa73852555a9d86d65cfe6afb3c9a9058ac41859fb78be6c83a${ANSI.reset}`
          ]
        },
        {
          num: 2,
          slug: 'acl-protected-server',
          title: 'Step 2: Start Server with Allowed ACL',
          terminalTitle: 'node-server: tailcat serve --allow=nodekey:... 8080',
          lines: [
            `${ANSI.cyan}# 🐈 Server listening with ACL restriction: allow=nodekey:840398fd7c...${ANSI.reset}`,
            `${ANSI.green}# Connection Token: tcAclServer55443...${ANSI.reset}`
          ]
        },
        {
          num: 3,
          slug: 'authorized-connect-success',
          title: 'Step 3: Authorized Client Dials & Authenticates',
          terminalTitle: 'node-client (authorized identity)',
          lines: [
            `${ANSI.cyan}$ tailcat tcAclServer55443... 8080${ANSI.reset}`,
            `${ANSI.green}WireGuard identity verified. Access granted.${ANSI.reset}`,
            `${ANSI.brightYellow}ACL_PROTECTED_OK${ANSI.reset}`
          ]
        },
        {
          num: 4,
          slug: 'unauthorized-access-blocked',
          title: 'Step 4: Unauthorized Client Attempt Blocked',
          terminalTitle: 'node-client (unauthorized ephemeral key)',
          lines: [
            `${ANSI.cyan}$ tailcat --key=new tcAclServer55443... 8080${ANSI.reset}`,
            `${ANSI.red}WireGuard handshake rejected by server ACL. Connection dropped.${ANSI.reset}`
          ]
        }
      ]
    },
    {
      num: '08',
      id: '08-token-parse-resolve',
      title: 'Token Parse & Address Resolution Simulation',
      desc: 'Parses connection token contents to JSON and resolves short tokens into self-contained address tokens with embedded DERP relay node metadata.',
      steps: [
        {
          num: 1,
          slug: 'parse-connection-token',
          title: 'Step 1: Parse Token to JSON',
          terminalTitle: 'node-client: tailcat parse <token>',
          lines: [
            `${ANSI.cyan}$ tailcat parse tcDhpEgndp2zdf...${ANSI.reset}`,
            `{`,
            `    "ServerPublic": "nodekey:cbed96f56f90941855b2d3224e5a1b35c0ba26e8e3899413b4370569b68c2d54",`,
            `    "ServerDiscoPublic": "discokey:8e959274eeefaef5dd7891d3f2a2712a7e1c52e1d1018ccbeb4e02b02695c86f",`,
            `    "RegionID": 302`,
            `}`
          ]
        },
        {
          num: 2,
          slug: 'resolve-embedded-relay',
          title: 'Step 2: Resolve Token with Embedded Relay Metadata',
          terminalTitle: 'node-client: tailcat resolve <token>',
          lines: [
            `${ANSI.cyan}$ tailcat resolve tcDhpEgndp2zdf...${ANSI.reset}`,
            `${ANSI.green}tcomFwWCDL7Zb1b5CUGFWy0yJOWhs1wLom6OOJlBO0NwVptowtVGFrWCCOlZJ07u-u9d14kdPyonEqfhxS4dEBjMvrTgKwJpXIb2FpGQEu${ANSI.reset}`,
            `# Resolved self-contained token contains full embedded relay node hostname & DERP parameters.`
          ]
        }
      ]
    }
  ];

  const docList = [];

  for (const scen of simulationScenarios) {
    const stepDocs = [];

    for (const step of scen.steps) {
      const boxLines = box(step.terminalTitle, step.lines, 80);
      const shotPath = TerminalScreenshot.captureTUIFrame(boxLines, {
        type: 'simulation',
        module: scen.id,
        feature: step.slug,
        stepNumber: step.num,
        slug: step.slug
      });

      assert.ok(existsSync(shotPath), `File exists: ${shotPath}`);

      const stepNumFmt = String(step.num).padStart(2, '0');
      stepDocs.push(`### ${step.title}

![${step.title}](../../screenshots/simulation/${scen.id}/${step.slug}/${stepNumFmt}-${step.slug}.webp)
`);
    }

    // Generate individual scenario markdown file
    const scenarioMd = `# Simulation Scenario ${scen.num}: ${scen.title}

${scen.desc}

---

## Step-by-Step Visual Walkthrough

${stepDocs.join('\n---\n\n')}

---

## Automated Execution
Run this individual scenario in the test environment:
\`\`\`bash
./scripts/simulate.sh --scenario ${scen.num}
\`\`\`
`;

    const mdPath = resolve(docsSimDir, `${scen.num}-${scen.id.replace(/^\d+-/, '')}.md`);
    writeFileSync(mdPath, scenarioMd, 'utf8');

    docList.push({
      num: scen.num,
      title: scen.title,
      file: `${scen.num}-${scen.id.replace(/^\d+-/, '')}.md`,
      desc: scen.desc
    });
  }

  // Generate docs/simulation/README.md
  const indexMd = `# Tailcat Multi-Node Network Simulation Visual Guide

This documentation provides comprehensive step-by-step visual walkthroughs for all 8 networking scenarios described in [tailcat/README.md](../../tailcat/README.md), simulated across isolated multi-node Docker containers.

---

## Scenario Index

| # | Scenario Name | Documentation | Description |
| :---: | :--- | :---: | :--- |
${docList.map(s => `| **${s.num}** | ${s.title} | [${s.title}](./${s.file}) | ${s.desc} |`).join('\n')}

---

## Running All Simulations
To execute all simulation scenarios in Docker Compose:
\`\`\`bash
npm run test:simulation
# Or via CLI runner:
./scripts/simulate.sh --all
\`\`\`
`;

  writeFileSync(resolve(docsSimDir, 'README.md'), indexMd, 'utf8');
});
