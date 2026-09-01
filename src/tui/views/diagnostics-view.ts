import { ANSI, box } from '../ansi.js';
import { AppState } from '../state.js';
import { TailcatService } from '../../services/tailcat.service.js';

export class DiagnosticsView {
  public static render(state: AppState, service: TailcatService, width: number): string[] {
    const lines: string[] = [];
    const fIdx = state.forms.focusedFieldIndex;

    lines.push(`${ANSI.cyan}${ANSI.bold}=== Network Diagnostics & Tunnels ===${ANSI.reset}`);
    lines.push(`${ANSI.gray}Ping DERP/Direct paths, SOCKS5 proxy commands, Exit node, Token inspection.${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}1. Ping Connectivity (DERP vs Direct Path)${ANSI.reset}`);
    lines.push(`  [Target Token]  : ${fIdx === 0 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.pingToken || 'Paste token or domain') + ' ] <' : ANSI.white + '  [ ' + (state.forms.pingToken || 'Paste token or domain') + ' ]  '}${ANSI.reset} ${ANSI.gray}Until-Direct: ${state.forms.pingUntilDirect ? 'YES' : 'NO'}${ANSI.reset}`);
    lines.push(`  ${fIdx === 1 ? ANSI.cyan + ANSI.bold + '► [ RUN PING ] ◄' : ANSI.gray + '  [ RUN PING ]  '}${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}2. SOCKS5 Proxy Command Runner${ANSI.reset}`);
    lines.push(`  [Tunnel Token]  : ${fIdx === 2 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.socksToken || '(optional if in url)') + ' ] <' : ANSI.white + '  [ ' + (state.forms.socksToken || '(optional if in url)') + ' ]  '}${ANSI.reset}`);
    lines.push(`  [Exec Command]  : ${fIdx === 3 ? ANSI.cyan + ANSI.bold + '> [ ' + state.forms.socksCommand + ' ] <' : ANSI.white + '  [ ' + state.forms.socksCommand + ' ]  '}${ANSI.reset}`);
    lines.push(`  ${fIdx === 4 ? ANSI.cyan + ANSI.bold + '► [ EXECUTE VIA SOCKS5 ] ◄' : ANSI.gray + '  [ EXECUTE VIA SOCKS5 ]  '}${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}3. Parse / Resolve Connection Token${ANSI.reset}`);
    lines.push(`  [Token Input]   : ${fIdx === 5 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.parseTokenInput || 'Paste token to inspect') + ' ] <' : ANSI.white + '  [ ' + (state.forms.parseTokenInput || 'Paste token to inspect') + ' ]  '}${ANSI.reset}`);
    lines.push(`  ${fIdx === 6 ? ANSI.cyan + ANSI.bold + '► [ PARSE TOKEN (JSON) ] ◄' : ANSI.gray + '  [ PARSE TOKEN (JSON) ]  '}${ANSI.reset}  ${fIdx === 7 ? ANSI.cyan + ANSI.bold + '► [ RESOLVE FULL TOKEN ] ◄' : ANSI.gray + '  [ RESOLVE FULL TOKEN ]  '}${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}4. Run Exit Node Server${ANSI.reset}`);
    lines.push(`  ${fIdx === 8 ? ANSI.cyan + ANSI.bold + '► [ SERVE AS EXIT NODE ] ◄' : ANSI.gray + '  [ SERVE AS EXIT NODE ]  '}${ANSI.reset}`);

    return box('5. Network & Diagnostics', lines, width);
  }

  public static handleAction(state: AppState, service: TailcatService): string {
    const fIdx = state.forms.focusedFieldIndex;
    if (fIdx === 1) {
      if (!state.forms.pingToken) return 'Error: Ping target token required';
      const args = ['ping'];
      if (state.forms.pingUntilDirect) args.push('--until-direct');
      args.push(state.forms.pingToken);
      const session = service.spawnSession('ping', args);
      return `Started Ping to ${state.forms.pingToken} [${session.id}]`;
    } else if (fIdx === 4) {
      const parts = state.forms.socksCommand.split(' ');
      const args = ['socks'];
      if (state.forms.socksToken) args.push(state.forms.socksToken);
      args.push(...parts);
      const session = service.spawnSession('socks', args);
      return `Executed SOCKS command [${session.id}]`;
    } else if (fIdx === 6) {
      if (!state.forms.parseTokenInput) return 'Error: Token required to parse';
      const result = service.executeOneShot(['parse', state.forms.parseTokenInput]);
      return result.output;
    } else if (fIdx === 7) {
      if (!state.forms.parseTokenInput) return 'Error: Token required to resolve';
      const result = service.executeOneShot(['resolve', state.forms.parseTokenInput]);
      return `Resolved token:\n${result.output}`;
    } else if (fIdx === 8) {
      const session = service.spawnSession('exit-node', ['serve', 'exit-node']);
      return `Started Exit Node [${session.id}]`;
    }
    return 'Action navigated';
  }
}
