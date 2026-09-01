import { ANSI, box } from '../ansi.js';
import { AppState } from '../state.js';
import { TailcatService } from '../../services/tailcat.service.js';

export class KeysView {
  public static render(state: AppState, service: TailcatService, width: number): string[] {
    const lines: string[] = [];
    const fIdx = state.forms.focusedFieldIndex;

    lines.push(`${ANSI.cyan}${ANSI.bold}=== WireGuard Key Management & Relays ===${ANSI.reset}`);
    lines.push(`${ANSI.gray}Manage saved identities, client authentication keys, DERP relays, and fixed regions.${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}1. Generate New Keypair${ANSI.reset}`);
    lines.push(`  [Key Name]      : ${fIdx === 0 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.genKeyName || 'default') + ' ] <' : ANSI.white + '  [ ' + (state.forms.genKeyName || 'default') + ' ]  '}${ANSI.reset} ${ANSI.gray}(default / custom name)${ANSI.reset}`);
    lines.push(`  [Region / Relay]: ${fIdx === 1 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.genKeyRegion || 'auto') + ' ] <' : ANSI.white + '  [ ' + (state.forms.genKeyRegion || 'auto') + ' ]  '}${ANSI.reset} ${ANSI.gray}(auto, region code, or derp.example.com)${ANSI.reset}`);
    lines.push(`  [Options]       : ${ANSI.gray}Client Key: ${state.forms.genKeyClient ? 'YES' : 'NO'} | Fixed Region: ${state.forms.genKeyFixed ? 'YES' : 'NO'}${ANSI.reset}`);
    lines.push(`  ${fIdx === 2 ? ANSI.cyan + ANSI.bold + '► [ GENERATE & SAVE KEY ] ◄' : ANSI.gray + '  [ GENERATE & SAVE KEY ]  '}${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}2. Key Operations${ANSI.reset}`);
    lines.push(`  ${fIdx === 3 ? ANSI.cyan + ANSI.bold + '► [ LIST SAVED KEYS ] ◄' : ANSI.gray + '  [ LIST SAVED KEYS ]  '}${ANSI.reset}`);
    lines.push(`  [Delete Key]    : ${fIdx === 4 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.deleteKeyName || 'key-name') + ' ] <' : ANSI.white + '  [ ' + (state.forms.deleteKeyName || 'key-name') + ' ]  '}${ANSI.reset}`);
    lines.push(`  ${fIdx === 5 ? ANSI.cyan + ANSI.bold + '► [ DELETE KEY ] ◄' : ANSI.gray + '  [ DELETE KEY ]  '}${ANSI.reset}`);

    return box('6. Keys & Identities', lines, width);
  }

  public static handleAction(state: AppState, service: TailcatService): string {
    const fIdx = state.forms.focusedFieldIndex;
    if (fIdx === 2) {
      const args = ['genkey'];
      if (state.forms.genKeyName) args.push(`--key=${state.forms.genKeyName}`);
      if (state.forms.genKeyRegion && state.forms.genKeyRegion !== 'auto') args.push(`--region=${state.forms.genKeyRegion}`);
      if (state.forms.genKeyClient) args.push('--client');
      if (state.forms.genKeyFixed) args.push('--fixed-region');

      const result = service.executeOneShot(args);
      return result.success ? `Key Generated:\n${result.output}` : `Error: ${result.output}`;
    } else if (fIdx === 3) {
      const result = service.executeOneShot(['genkey', '--list']);
      return result.success ? `Saved Keys:\n${result.output}` : `Error listing keys: ${result.output}`;
    } else if (fIdx === 5) {
      if (!state.forms.deleteKeyName) return 'Error: Key name required to delete';
      const result = service.executeOneShot(['genkey', '--delete', `--key=${state.forms.deleteKeyName}`]);
      return result.success ? `Key [${state.forms.deleteKeyName}] deleted.` : `Error deleting key: ${result.output}`;
    }
    return 'Action navigated';
  }
}
