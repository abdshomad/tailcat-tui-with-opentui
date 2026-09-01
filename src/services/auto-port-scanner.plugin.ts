import { Context, Service } from 'cordis';
import { PortScanner } from '../utils/port-scanner.js';

export class AutoPortScannerPlugin extends Service {
  static name = 'autoPortScanner';
  private autoScanEnabled: boolean = true;
  private lastResolvedPort: number | null = null;

  constructor(ctx: Context) {
    super(ctx, 'autoPortScanner', true);
  }

  static apply(ctx: Context): void {
    ctx.provide('autoPortScanner');
    ctx.autoPortScanner = new AutoPortScannerPlugin(ctx);
  }

  public isEnabled(): boolean {
    return this.autoScanEnabled;
  }

  public setEnabled(val: boolean): void {
    this.autoScanEnabled = val;
  }

  public async allocatePort(preferred: string | number | 'auto' = 3840): Promise<number> {
    const port = await PortScanner.resolvePort(preferred, this.autoScanEnabled);
    this.lastResolvedPort = port;
    return port;
  }

  public getLastResolvedPort(): number | null {
    return this.lastResolvedPort;
  }
}
