import { ANSI, box } from '../ansi.js';
import { AppState } from '../state.js';
import { TailcatService } from '../../services/tailcat.service.js';

export class FilesView {
  public static render(state: AppState, service: TailcatService, width: number): string[] {
    const lines: string[] = [];
    const fIdx = state.forms.focusedFieldIndex;

    lines.push(`${ANSI.cyan}${ANSI.bold}=== Files & SFTP Transfers ===${ANSI.reset}`);
    lines.push(`${ANSI.gray}Secure drop boxes, SFTP file serving, remote copy (scp), and directory listing.${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}1. Receive Drop Box (Write-Only Inbox)${ANSI.reset}`);
    lines.push(`  [Target Directory]: ${fIdx === 0 ? ANSI.cyan + ANSI.bold + '> [ ' + state.forms.recvDir + ' ] <' : ANSI.white + '  [ ' + state.forms.recvDir + ' ]  '}${ANSI.reset}`);
    lines.push(`  ${fIdx === 1 ? ANSI.cyan + ANSI.bold + '► [ START DROP BOX RECEIVER ] ◄' : ANSI.gray + '  [ START DROP BOX RECEIVER ]  '}${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}2. Serve Directory (SFTP Server)${ANSI.reset}`);
    lines.push(`  [Directory Path]  : ${fIdx === 2 ? ANSI.cyan + ANSI.bold + '> [ ' + state.forms.serveFilesDir + ' ] <' : ANSI.white + '  [ ' + state.forms.serveFilesDir + ' ]  '}${ANSI.reset} ${ANSI.gray}Mode: ${state.forms.serveFilesMode.toUpperCase()}${ANSI.reset}`);
    lines.push(`  ${fIdx === 3 ? ANSI.cyan + ANSI.bold + '► [ START FILE SERVER ] ◄' : ANSI.gray + '  [ START FILE SERVER ]  '}${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}3. Send File / Copy (Client)${ANSI.reset}`);
    lines.push(`  [Local File]      : ${fIdx === 4 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.sendFileSrc || 'path/to/file') + ' ] <' : ANSI.white + '  [ ' + (state.forms.sendFileSrc || 'path/to/file') + ' ]  '}${ANSI.reset}`);
    lines.push(`  [Remote Token]    : ${fIdx === 5 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.sendFileToken || 'token:') + ' ] <' : ANSI.white + '  [ ' + (state.forms.sendFileToken || 'token:') + ' ]  '}${ANSI.reset}`);
    lines.push(`  ${fIdx === 6 ? ANSI.cyan + ANSI.bold + '► [ SEND FILE (CP) ] ◄' : ANSI.gray + '  [ SEND FILE (CP) ]  '}${ANSI.reset}`);
    lines.push('');

    lines.push(`${ANSI.bold}4. List Remote Files (SFTP ls)${ANSI.reset}`);
    lines.push(`  [Remote Token]    : ${fIdx === 7 ? ANSI.cyan + ANSI.bold + '> [ ' + (state.forms.listFilesToken || 'token') + ' ] <' : ANSI.white + '  [ ' + (state.forms.listFilesToken || 'token') + ' ]  '}${ANSI.reset}`);
    lines.push(`  ${fIdx === 8 ? ANSI.cyan + ANSI.bold + '► [ LIST REMOTE FILES (LS) ] ◄' : ANSI.gray + '  [ LIST REMOTE FILES (LS) ]  '}${ANSI.reset}`);

    return box('4. Files & SFTP', lines, width);
  }

  public static handleAction(state: AppState, service: TailcatService): string {
    const fIdx = state.forms.focusedFieldIndex;
    if (fIdx === 1) {
      const session = service.spawnSession('recv-files', ['recv', state.forms.recvDir || './inbox']);
      return `Started Drop Box receiver [${session.id}]`;
    } else if (fIdx === 3) {
      const flag = state.forms.serveFilesMode === 'rw' 
        ? `--files=${state.forms.serveFilesDir}:rw` 
        : `--files=${state.forms.serveFilesDir}`;
      const session = service.spawnSession('serve-files', ['serve', flag, 'files']);
      return `Started File Server [${session.id}]`;
    } else if (fIdx === 6) {
      if (!state.forms.sendFileSrc || !state.forms.sendFileToken) {
        return 'Error: Local file and Remote Token required';
      }
      const remote = state.forms.sendFileToken.endsWith(':') ? state.forms.sendFileToken : `${state.forms.sendFileToken}:`;
      const session = service.spawnSession('send-files', ['cp', state.forms.sendFileSrc, remote]);
      return `Copying ${state.forms.sendFileSrc} to remote [${session.id}]`;
    } else if (fIdx === 8) {
      if (!state.forms.listFilesToken) {
        return 'Error: Remote Token required to list files';
      }
      const result = service.executeOneShot(['ls', '-l', state.forms.listFilesToken]);
      return result.success ? `Files:\n${result.output}` : `Error listing files: ${result.output}`;
    }
    return 'Action navigated';
  }
}
