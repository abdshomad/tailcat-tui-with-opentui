import { createServer } from 'node:net';

export class PortScanner {
  public static isPortAvailable(port: number, host = '127.0.0.1'): Promise<boolean> {
    return new Promise((resolve) => {
      const server = createServer();
      server.unref();

      server.on('error', () => {
        resolve(false);
      });

      server.listen(port, host, () => {
        server.close(() => {
          resolve(true);
        });
      });
    });
  }

  public static async findAvailablePort(startPort = 3840, maxPort = 3940, host = '127.0.0.1'): Promise<number> {
    for (let p = startPort; p <= maxPort; p++) {
      const available = await this.isPortAvailable(p, host);
      if (available) {
        return p;
      }
    }
    throw new Error(`No available port found in range ${startPort}-${maxPort}`);
  }

  public static async resolvePort(preferredPortInput: string | number | 'auto', autoScan = true): Promise<number> {
    if (preferredPortInput === 'auto' || preferredPortInput === '' || preferredPortInput === 0) {
      return this.findAvailablePort(3840);
    }

    const portNum = typeof preferredPortInput === 'string' ? parseInt(preferredPortInput, 10) : preferredPortInput;
    if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
      return this.findAvailablePort(3840);
    }

    const isAvail = await this.isPortAvailable(portNum);
    if (isAvail) {
      return portNum;
    }

    if (autoScan) {
      return this.findAvailablePort(portNum + 1);
    }

    throw new Error(`Port ${portNum} is already in use and auto-scan is disabled`);
  }
}
