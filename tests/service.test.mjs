import { test } from 'node:test';
import assert from 'node:assert';
import { Context } from 'cordis';
import { TailcatService } from '../dist/services/tailcat.service.js';
import { BinaryResolver } from '../dist/utils/binary-resolver.js';

test('BinaryResolver should detect status', () => {
  const info = BinaryResolver.resolveTailcatBinary();
  assert.ok(info !== null);
  assert.ok(typeof info.source === 'string');
});

test('TailcatService initializes in Cordis Context', () => {
  const ctx = new Context();
  ctx.plugin(TailcatService);
  assert.ok(ctx.tailcat instanceof TailcatService);
  const info = ctx.tailcat.getBinaryInfo();
  assert.ok(info !== undefined);
});

test('TailcatService executes and manages mock / echo sessions', async () => {
  const ctx = new Context();
  ctx.plugin(TailcatService);

  let sessionCreatedCalled = false;
  ctx.on('tailcat/session-created', (session) => {
    sessionCreatedCalled = true;
    assert.strictEqual(session.type, 'custom');
  });

  // Test custom execution via node process
  ctx.tailcat.setCustomBinaryPath(process.execPath);
  const session = ctx.tailcat.spawnSession('custom', ['-e', 'console.log("tcomFwWCCcjS5nKNqAod034nWoJZW0LZqDhhC8U_dKdnDRYQ8uNGFpGQEu hello");']);
  
  assert.strictEqual(session.status, 'running');
  assert.strictEqual(sessionCreatedCalled, true);

  await new Promise((resolve) => setTimeout(resolve, 300));

  assert.strictEqual(session.status, 'completed');
  assert.strictEqual(session.token, 'tcomFwWCCcjS5nKNqAod034nWoJZW0LZqDhhC8U_dKdnDRYQ8uNGFpGQEu');
  assert.ok(session.logs.some(l => l.includes('hello')));
});
