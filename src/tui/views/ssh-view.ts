import { ANSI, box } from '../ansi.js';
import { AppState } from '../state.js';
import { TailcatService } from '../../services/tailcat.service.js';

export class SSHView {
  public static render(state: AppState, service: TailcatService, width: number): string[] {
    const lines: string[] = [];
    const fIdx = state.forms.focusedFieldIndex;

    lines.push(`${ANSI.cyan}${ANSI.bold}=== Auth-Free & Protected SSH ===${ANSI.reset}`);
    lines.push(`${ANSI.gray}Userspace SSH daemon and client over WireGuard tunnels without open ports.${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}Mode 1: Start Auth-Free SSH Server${ANSI.reset}`);
    lines.push(`  [Allow Client NodeKey]: ${fIdx === 0 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.serveSshAllow || '(none - auth-free)') + ' ] <' : ANSI.gray + '  [ ' + (state.forms.serveSshAllow || '(none - auth-free)') + ' ]  '}${ANSI.reset}`);
    lines.push(`  ${fIdx === 1 ? ANSI.cyan + ANSI.bold + '► [ START SSH SERVER ] ◄' : ANSI.gray + '  [ START SSH SERVER ]  '}${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}Mode 2: Connect SSH Client${ANSI.reset}`);
    lines.push(`  [Target Token/DNS]    : ${fIdx === 2 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.connectSshToken || 'Paste token or domain') + ' ] <' : ANSI.white + '  [ ' + (state.forms.connectSshToken || 'Paste token or domain') + ' ]  '}${ANSI.reset}`);
    lines.push(`  [Command (optional)]  : ${fIdx === 3 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.connectSshCommand || '(interactive shell)') + ' ] <' : ANSI.white + '  [ ' + (state.forms.connectSshCommand || '(interactive shell)') + ' ]  '}${ANSI.reset}`);
    lines.push(`  ${fIdx === 4 ? ANSI.cyan + ANSI.bold + '► [ LAUNCH SSH CLIENT ] ◄' : ANSI.gray + '  [ LAUNCH SSH CLIENT ]  '}${ANSI.reset}`);
    lines.push('');

    const sshSessions = service.getSessions().filter(s => s.type === 'serve-ssh' || s.type === 'ssh-client');
    if (sshSessions.length > 0) {
      lines.push(`${ANSI.cyan}${ANSI.bold}Active SSH Sessions (${sshSessions.length}):${ANSI.reset}`);
      for (const s of sshSessions.slice(-2)) {
        lines.push(`  • [${s.id}] Status: ${ANSI.cyan}${s.status.toUpperCase()}${ANSI.reset} Token: ${ANSI.white}${s.token || '-'}${ANSI.reset}`);
      }
    }

    return box('3. SSH & Remote Exec', lines, width);
  }

  public static handleAction(state: AppState, service: TailcatService): string {
    const fIdx = state.forms.focusedFieldIndex;
    if (fIdx === 1) {
      const args = ['serve'];
      if (state.forms.serveSshAllow) {
        args.push(`--allow=${state.forms.serveSshAllow}`);
      }
      args.push('no-auth-ssh');
      const session = service.spawnSession('serve-ssh', args);
      return `Started SSH Server [${session.id}]`;
    } else if (fIdx === 4) {
      if (!state.forms.connectSshToken) {
        return 'Error: Target token required to connect via SSH';
      }
      const args = ['ssh', state.forms.connectSshToken];
      if (state.forms.connectSshCommand) {
        args.push(state.forms.connectSshCommand);
      }
      const session = service.spawnSession('ssh-client', args);
      return `Launched SSH client [${session.id}]`;
    }
    return 'Action navigated';
  }
}
