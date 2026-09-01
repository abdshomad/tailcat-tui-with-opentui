import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const simulateScript = resolve(__dirname, '../scripts/simulate.sh');

test('Tailcat Multi-Node Network Simulation Suite', { timeout: 180000 }, async () => {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(simulateScript, ['--all'], {
      stdio: 'inherit',
      env: { ...process.env, DERP_MODE: process.env.DERP_MODE || 'local' }
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`Simulation suite exited with error code ${code}`));
      }
    });

    child.on('error', (err) => {
      rejectPromise(err);
    });
  });
});
