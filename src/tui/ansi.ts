export const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',
  inverse: '\x1b[7m',
  
  // Colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Bright Colors
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Backgrounds
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
  bgGray: '\x1b[100m',

  // Cursor & Screen
  clearScreen: '\x1b[2J',
  cursorHome: '\x1b[H',
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
  enterAltScreen: '\x1b[?1049h',
  leaveAltScreen: '\x1b[?1049l',
};

export function box(title: string, lines: string[], width = 80): string[] {
  const result: string[] = [];
  const innerWidth = width - 4;
  const titleDisplay = title ? ` [ ${ANSI.bold}${title}${ANSI.reset} ] ` : '';
  const topBorder = `┌─${titleDisplay}${'─'.repeat(Math.max(0, innerWidth - (title ? title.length + 4 : 0)))}┐`;
  result.push(topBorder);

  for (const line of lines) {
    const rawLen = line.replace(/\x1b\[[0-9;]*m/g, '').length;
    const padding = ' '.repeat(Math.max(0, innerWidth - rawLen + 2));
    result.push(`│ ${line}${padding}│`);
  }

  result.push(`└${'─'.repeat(innerWidth + 2)}┘`);
  return result;
}
