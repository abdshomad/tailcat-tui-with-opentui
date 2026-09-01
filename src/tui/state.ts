export type TabId = 'pipe' | 'ports' | 'ssh' | 'files' | 'diag' | 'keys' | 'sessions' | 'web';

export interface FormState {
  // Pipe tab
  pipeServerKey: string;
  pipeClientToken: string;
  pipeClientMessage: string;

  // Ports tab
  servePortInput: string;
  servePortAllow: string;
  connectPortToken: string;
  connectPortNumber: string;

  // SSH tab
  serveSshAllow: string;
  connectSshToken: string;
  connectSshCommand: string;

  // Files tab
  recvDir: string;
  serveFilesDir: string;
  serveFilesMode: 'ro' | 'rw';
  sendFileSrc: string;
  sendFileToken: string;
  listFilesToken: string;

  // Diag tab
  pingToken: string;
  pingUntilDirect: boolean;
  socksToken: string;
  socksCommand: string;
  parseTokenInput: string;

  // Keys tab
  genKeyName: string;
  genKeyRegion: string;
  genKeyClient: boolean;
  genKeyFixed: boolean;
  deleteKeyName: string;

  // Web & Settings tab
  webPortInput: string;
  webAutoScan: boolean;
  webAutoStart: boolean;
  webPersistServing: boolean;
  selectedPluginIndex: number;

  // Active form field index
  focusedFieldIndex: number;
}

export interface AppState {
  activeTab: TabId;
  statusMessage: string;
  statusType: 'info' | 'success' | 'warning' | 'error';
  selectedSessionId: string | null;
  forms: FormState;
}

export function createInitialState(): AppState {
  return {
    activeTab: 'pipe',
    statusMessage: 'Ready. Use 1-8 to switch tabs, Tab to navigate fields, Enter to run, [w] to toggle Web Server.',
    statusType: 'info',
    selectedSessionId: null,
    forms: {
      pipeServerKey: 'new',
      pipeClientToken: '',
      pipeClientMessage: 'hello from tailcat tui',

      servePortInput: '8080',
      servePortAllow: '',
      connectPortToken: '',
      connectPortNumber: '8080',

      serveSshAllow: '',
      connectSshToken: '',
      connectSshCommand: '',

      recvDir: './inbox',
      serveFilesDir: '.',
      serveFilesMode: 'ro',
      sendFileSrc: '',
      sendFileToken: '',
      listFilesToken: '',

      pingToken: '',
      pingUntilDirect: true,
      socksToken: '',
      socksCommand: 'curl http://server.tailcat:8081/',
      parseTokenInput: '',

      genKeyName: 'default',
      genKeyRegion: 'auto',
      genKeyClient: false,
      genKeyFixed: false,
      deleteKeyName: '',

      webPortInput: '3840',
      webAutoScan: true,
      webAutoStart: false,
      webPersistServing: false,
      selectedPluginIndex: 0,

      focusedFieldIndex: 0,
    },
  };
}
