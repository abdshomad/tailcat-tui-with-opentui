import { ANSI, box } from '../ansi.js';
import { AppState } from '../state.js';
import { TailcatService } from '../../services/tailcat.service.js';

export class PortsView {
  public static render(state: AppState, service: TailcatService, width: number): string[] {
    const lines: string[] = [];
    const fIdx = state.forms.focusedFieldIndex;

    lines.push(`${ANSI.cyan}${ANSI.bold}=== Port Forwarding & Tunnels ===${ANSI.reset}`);
    lines.push(`${ANSI.gray}Expose local TCP ports (e.g. 8080, 8443, or all) or connect to remote ports.${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}Mode 1: Expose Local Ports (Server)${ANSI.reset}`);
    lines.push(`  [Ports to Serve]: ${fIdx === 0 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.servePortInput || '8080') + ' ] <' : ANSI.white + '  [ ' + (state.forms.servePortInput || '8080') + ' ]  '}${ANSI.reset} ${ANSI.gray}(e.g. 8080, 8443 or 'all')${ANSI.reset}`);
    lines.push(`  [Allowlist ACL] : ${fIdx === 1 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.servePortAllow || '(none - public token)') + ' ] <' : ANSI.gray + '  [ ' + (state.forms.servePortAllow || '(none - public token)') + ' ]  '}${ANSI.reset} ${ANSI.gray}(e.g. nodekey:...)${ANSI.reset}`);
    lines.push(`  ${fIdx === 2 ? ANSI.cyan + ANSI.bold + '► [ START PORT SERVER ] ◄' : ANSI.gray + '  [ START PORT SERVER ]  '}${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}Mode 2: Connect to Remote Port (Client)${ANSI.reset}`);
    lines.push(`  [Target Token]  : ${fIdx === 3 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.connectPortToken || 'Paste token') + ' ] <' : ANSI.white + '  [ ' + (state.forms.connectPortToken || 'Paste token') + ' ]  '}${ANSI.reset}`);
    lines.push(`  [Port Number]   : ${fIdx === 4 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.connectPortNumber || '8080') + ' ] <' : ANSI.white + '  [ ' + (state.forms.connectPortNumber || '8080') + ' ]  '}${ANSI.reset}`);
    lines.push(`  ${fIdx === 5 ? ANSI.cyan + ANSI.bold + '► [ DIAL REMOTE PORT ] ◄' : ANSI.gray + '  [ DIAL REMOTE PORT ]  '}${ANSI.reset}`);
    lines.push('');

    const portSessions = service.getSessions().filter(s => s.type === 'serve-port' || s.type === 'connect-port');
    if (portSessions.length > 0) {
      lines.push(`${ANSI.cyan}${ANSI.bold}Active Port Tunnels (${portSessions.length}):${ANSI.reset}`);
      for (const s of portSessions.slice(-2)) {
        lines.push(`  • [${s.id}] ${s.type} -> ${ANSI.cyan}${s.status.toUpperCase()}${ANSI.reset} Token: ${ANSI.white}${s.token || '-'}${ANSI.reset}`);
      }
    }

    return box('2. Ports & Tunnels', lines, width);
  }

  public static handleAction(state: AppState, service: TailcatService): string {
    const fIdx = state.forms.focusedFieldIndex;
    if (fIdx === 2) {
      const args = ['serve'];
      if (state.forms.servePortAllow) {
        args.push(`--allow=${state.forms.servePortAllow}`);
      }
      args.push(state.forms.servePortInput || '8080');
      const session = service.spawnSession('serve-port', args);
      return `Started port server for [${state.forms.servePortInput}] -> [${session.id}]`;
    } else if (fIdx === 5) {
      if (!state.forms.connectPortToken) {
        return 'Error: Target token required to connect to remote port';
      }
      const session = service.spawnSession('connect-port', [
        state.forms.connectPortToken,
        state.forms.connectPortNumber || '8080',
      ]);
      return `Dialing remote port ${state.forms.connectPortNumber} [${session.id}]`;
    }
    return 'Action navigated';
  }
}
