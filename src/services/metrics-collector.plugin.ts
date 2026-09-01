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

  public getMetricsSummary(): { trackedPeers: number; totalPings: number; avgLatencyMs?: number } {
    const latencies: number[] = [];
    for (const m of this.metrics.values()) {
      if (m.lastPingMs !== undefined) {
        latencies.push(m.lastPingMs);
      }
    }
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : undefined;

    return {
      trackedPeers: this.metrics.size,
      totalPings: this.pingCount,
      avgLatencyMs: avgLatency ? parseFloat(avgLatency.toFixed(2)) : undefined,
    };
  }

  public getPeerMetrics(sessionId: string): PeerMetrics | undefined {
    return this.metrics.get(sessionId);
  }

  public getAllMetrics(): Record<string, PeerMetrics> {
    const obj: Record<string, PeerMetrics> = {};
    for (const [k, v] of this.metrics.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  public resetMetrics(): void {
    this.metrics.clear();
    this.pingCount = 0;
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
