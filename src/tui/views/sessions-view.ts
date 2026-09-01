import { ANSI, box } from '../ansi.js';
import { AppState } from '../state.js';
import { TailcatService } from '../../services/tailcat.service.js';

export class SessionsView {
  public static render(state: AppState, service: TailcatService, width: number): string[] {
    const lines: string[] = [];
    const sessions = service.getSessions();

    lines.push(`${ANSI.cyan}${ANSI.bold}=== Active Tunnels & Process Supervisor ===${ANSI.reset}`);
    lines.push(`${ANSI.gray}Manage background tunnels, monitor connection tokens, inspect live stdout/stderr streams.${ANSI.reset}`);
    lines.push('');

    if (sessions.length === 0) {
      lines.push(`${ANSI.gray}No active sessions running. Launch actions in tabs [1] - [6].${ANSI.reset}`);
      return box('7. Active Sessions', lines, width);
    }

    lines.push(`${ANSI.bold}Session List (Navigate with Up/Down, Press 'k' to Kill selected):${ANSI.reset}`);
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      const isSelected = state.selectedSessionId === s.id || (state.selectedSessionId === null && i === sessions.length - 1);
      const prefix = isSelected ? `${ANSI.cyan}${ANSI.bold}► ` : '  ';
      const statusText = `${ANSI.cyan}${s.status.toUpperCase()}${ANSI.reset}`;
      const tokenText = `${ANSI.white}${s.token || '-'}${ANSI.reset}`;
      lines.push(`${prefix}[${s.id}] Type: ${s.type.padEnd(12)} Status: ${statusText.padEnd(10)}${ANSI.reset} Token: ${tokenText}${ANSI.reset}`);
    }

    const currentSession = sessions.find(s => s.id === state.selectedSessionId) || sessions[sessions.length - 1];
    if (currentSession) {
      lines.push('');
      lines.push(`${ANSI.bold}Live Logs for [${currentSession.id}] (${currentSession.command}):${ANSI.reset}`);
      const recentLogs = currentSession.logs.slice(-6);
      if (recentLogs.length === 0) {
        lines.push(`  ${ANSI.gray}(waiting for output...)${ANSI.reset}`);
      } else {
        for (const logLine of recentLogs) {
          lines.push(`  ${ANSI.gray}│ ${logLine}${ANSI.reset}`);
        }
      }
    }

    return box('7. Active Sessions', lines, width);
  }

  public static handleAction(state: AppState, service: TailcatService, key: string): string {
    const sessions = service.getSessions();
    if (sessions.length === 0) return 'No sessions';

    if (key === 'k') {
      const target = state.selectedSessionId || sessions[sessions.length - 1].id;
      const killed = service.killSession(target);
      return killed ? `Session [${target}] terminated.` : `Could not kill [${target}]`;
    }
    return 'Action performed';
  }
}
