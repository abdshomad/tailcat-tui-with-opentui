import { ANSI, box } from '../ansi.js';
import { AppState } from '../state.js';
import { TailcatService } from '../../services/tailcat.service.js';

export class PipeView {
  public static render(state: AppState, service: TailcatService, width: number): string[] {
    const lines: string[] = [];
    const fIdx = state.forms.focusedFieldIndex;

    lines.push(`${ANSI.cyan}${ANSI.bold}=== Pipe Stdin / Stdout Stream ===${ANSI.reset}`);
    lines.push(`${ANSI.gray}Create raw bidirectional data streams over Tailscale WireGuard/DERP data plane.${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}Mode 1: Start Stream Server (Listener)${ANSI.reset}`);
    lines.push(`  [Key Profile] : ${fIdx === 0 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.pipeServerKey || 'new') + ' ] <' : ANSI.white + '  [ ' + (state.forms.pipeServerKey || 'new') + ' ]  '}${ANSI.reset} ${ANSI.gray}(Type 'new' or saved key name)${ANSI.reset}`);
    lines.push(`  ${fIdx === 1 ? ANSI.cyan + ANSI.bold + '► [ START STREAM SERVER ] ◄' : ANSI.gray + '  [ START STREAM SERVER ]  '}${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}Mode 2: Connect Stream Client (Sender)${ANSI.reset}`);
    lines.push(`  [Target Token]: ${fIdx === 2 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.pipeClientToken || 'Paste tc... or tcom... token') + ' ] <' : ANSI.white + '  [ ' + (state.forms.pipeClientToken || 'Paste tc... or tcom... token') + ' ]  '}${ANSI.reset}`);
    lines.push(`  [Payload Text]: ${fIdx === 3 ? ANSI.cyan + ANSI.bold + '> [ ' + state.forms.pipeClientMessage + ' ] <' : ANSI.white + '  [ ' + state.forms.pipeClientMessage + ' ]  '}${ANSI.reset}`);
    lines.push(`  ${fIdx === 4 ? ANSI.cyan + ANSI.bold + '► [ SEND PAYLOAD / CONNECT ] ◄' : ANSI.gray + '  [ SEND PAYLOAD / CONNECT ]  '}${ANSI.reset}`);
    lines.push('');

    // Active pipe sessions info
    const pipeSessions = service.getSessions().filter(s => s.type === 'pipe-server' || s.type === 'pipe-client');
    if (pipeSessions.length > 0) {
      lines.push(`${ANSI.cyan}${ANSI.bold}Active Stream Sessions (${pipeSessions.length}):${ANSI.reset}`);
      for (const s of pipeSessions.slice(-2)) {
        lines.push(`  • [${s.id}] Status: ${ANSI.cyan}${s.status.toUpperCase()}${ANSI.reset} Token: ${ANSI.white}${s.token || '(discovering...)'}${ANSI.reset}`);
        if (s.logs.length > 0) {
          lines.push(`    ${ANSI.gray}Last log: ${s.logs[s.logs.length - 1]}${ANSI.reset}`);
        }
      }
    }

    return box('1. Pipe & Stream', lines, width);
  }

  public static handleAction(state: AppState, service: TailcatService): string {
    const fIdx = state.forms.focusedFieldIndex;
    if (fIdx === 1) {
      const args: string[] = [];
      if (state.forms.pipeServerKey && state.forms.pipeServerKey !== 'new') {
        args.push(`--key=${state.forms.pipeServerKey}`);
      }
      const session = service.spawnSession('pipe-server', args);
      return `Started pipe stream server [${session.id}]`;
    } else if (fIdx === 4) {
      if (!state.forms.pipeClientToken) {
        return 'Error: Target token required to connect';
      }
      const session = service.spawnSession('pipe-client', [state.forms.pipeClientToken]);
      if (session.process && state.forms.pipeClientMessage) {
        session.process.stdin?.write(state.forms.pipeClientMessage + '\n');
      }
      return `Started pipe client to token [${session.id}]`;
    }
    return 'Select a button [START STREAM SERVER] or [SEND PAYLOAD] and press Enter';
  }
}
