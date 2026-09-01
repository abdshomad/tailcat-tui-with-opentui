import { Context, Service } from 'cordis';
import { TailcatSession } from './session.types.js';

export interface PeerMetrics {
  nodeKey?: string;
  lastPingMs?: number;
  relayType?: 'DERP' | 'Direct' | 'Unknown';
  totalBytesSent?: number;
  totalBytesReceived?: number;
}

export class MetricsCollectorPlugin extends Service {
  static name = 'metricsCollector';
  static inject = ['tailcat'];
  private metrics: Map<string, PeerMetrics> = new Map();
  private pingCount: number = 0;

  constructor(ctx: Context) {
    super(ctx, 'metricsCollector', true);

    this.ctx.on('tailcat/session-log', ({ session, text }: { session: TailcatSession; text: string }) => {
      this.parseMetrics(session, text);
    });
  }

  static apply(ctx: Context): void {
    ctx.provide('metricsCollector');
    ctx.metricsCollector = new MetricsCollectorPlugin(ctx);
  }

  public getMetricsSummary(): { trackedPeers: number; totalPings: number } {
    return {
      trackedPeers: this.metrics.size,
      totalPings: this.pingCount,
    };
  }

  public getPeerMetrics(sessionId: string): PeerMetrics | undefined {
    return this.metrics.get(sessionId);
  }

  private parseMetrics(session: TailcatSession, logText: string): void {
    // Parse ping latency: pong in 1.4ms via DERP(sfo) or via IP
    if (logText.includes('pong in')) {
      this.pingCount++;
      const matchMs = logText.match(/pong in ([\d\.]+)(ms|µs|s)/);
      const isDirect = logText.includes('via') && !logText.includes('via DERP');
      
      let lat = 0;
      if (matchMs) {
        lat = parseFloat(matchMs[1]);
        if (matchMs[2] === 'µs') lat = lat / 1000;
        if (matchMs[2] === 's') lat = lat * 1000;
      }

      this.metrics.set(session.id, {
        lastPingMs: lat,
        relayType: isDirect ? 'Direct' : 'DERP',
      });
    }
  }
}
