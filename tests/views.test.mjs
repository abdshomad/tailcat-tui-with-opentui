import { test } from 'node:test';
import assert from 'node:assert';
import { Context } from 'cordis';
import { TailcatService } from '../dist/services/tailcat.service.js';
import { createInitialState } from '../dist/tui/state.js';
import { PipeView } from '../dist/tui/views/pipe-view.js';
import { PortsView } from '../dist/tui/views/ports-view.js';
import { SSHView } from '../dist/tui/views/ssh-view.js';
import { FilesView } from '../dist/tui/views/files-view.js';
import { DiagnosticsView } from '../dist/tui/views/diagnostics-view.js';
import { KeysView } from '../dist/tui/views/keys-view.js';
import { SessionsView } from '../dist/tui/views/sessions-view.js';
import { TailcatTUIApp } from '../dist/tui/app.js';

test('View renderers return formatted box lines', () => {
  const ctx = new Context();
  ctx.plugin(TailcatService);
  const state = createInitialState();

  const pipeLines = PipeView.render(state, ctx.tailcat, 80);
  assert.ok(pipeLines.length > 0);
  assert.ok(pipeLines.some(l => l.includes('Pipe & Stream')));

  const portsLines = PortsView.render(state, ctx.tailcat, 80);
  assert.ok(portsLines.length > 0);
  assert.ok(portsLines.some(l => l.includes('Ports & Tunnels')));

  const sshLines = SSHView.render(state, ctx.tailcat, 80);
  assert.ok(sshLines.length > 0);
  assert.ok(sshLines.some(l => l.includes('SSH')));

  const filesLines = FilesView.render(state, ctx.tailcat, 80);
  assert.ok(filesLines.length > 0);
  assert.ok(filesLines.some(l => l.includes('Files & SFTP')));

  const diagLines = DiagnosticsView.render(state, ctx.tailcat, 80);
  assert.ok(diagLines.length > 0);
  assert.ok(diagLines.some(l => l.includes('Diagnostics')));

  const keysLines = KeysView.render(state, ctx.tailcat, 80);
  assert.ok(keysLines.length > 0);
  assert.ok(keysLines.some(l => l.includes('Keys & Identities')));

  const sessionLines = SessionsView.render(state, ctx.tailcat, 80);
  assert.ok(sessionLines.length > 0);
  assert.ok(sessionLines.some(l => l.includes('Active Sessions')));
});

test('Action handlers trigger appropriate service methods and validations', () => {
  const ctx = new Context();
  ctx.plugin(TailcatService);
  const state = createInitialState();

  // Test error validation on missing tokens
  state.forms.focusedFieldIndex = 4;
  state.forms.pipeClientToken = '';
  assert.ok(PipeView.handleAction(state, ctx.tailcat).includes('Error'));

  state.forms.focusedFieldIndex = 5;
  state.forms.connectPortToken = '';
  assert.ok(PortsView.handleAction(state, ctx.tailcat).includes('Error'));

  state.forms.focusedFieldIndex = 4;
  state.forms.connectSshToken = '';
  assert.ok(SSHView.handleAction(state, ctx.tailcat).includes('Error'));

  state.forms.focusedFieldIndex = 6;
  state.forms.sendFileSrc = '';
  assert.ok(FilesView.handleAction(state, ctx.tailcat).includes('Error'));

  state.forms.focusedFieldIndex = 1;
  state.forms.pingToken = '';
  assert.ok(DiagnosticsView.handleAction(state, ctx.tailcat).includes('Error'));

  state.forms.focusedFieldIndex = 5;
  state.forms.deleteKeyName = '';
  assert.ok(KeysView.handleAction(state, ctx.tailcat).includes('Error'));
});

test('TailcatTUIApp instantiates and renders without throwing', () => {
  const ctx = new Context();
  ctx.plugin(TailcatService);
  const app = new TailcatTUIApp(ctx.tailcat);
  assert.doesNotThrow(() => {
    app.render();
  });
});
