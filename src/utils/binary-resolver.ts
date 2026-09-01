import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export interface BinaryResolution {
  path: string | null;
  source: 'system-path' | 'local-bin' | 'submodule-source' | 'missing';
  available: boolean;
  version?: string;
  error?: string;
}

export class BinaryResolver {
  private static cachedResult: BinaryResolution | null = null;

  public static resolveTailcatBinary(forceRefresh = false): BinaryResolution {
    if (this.cachedResult && !forceRefresh) {
      return this.cachedResult;
    }

    // 1. Check PATH
    try {
      const pathResult = execSync('which tailcat', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      if (pathResult && existsSync(pathResult)) {
        const resolution: BinaryResolution = {
          path: pathResult,
          source: 'system-path',
          available: true,
          version: this.getBinaryVersion(pathResult),
        };
        this.cachedResult = resolution;
        return resolution;
      }
    } catch {
      // Ignored: not in PATH
    }

    // 2. Check local bin/tailcat
    const localBinPath = resolve(process.cwd(), 'bin', 'tailcat');
    if (existsSync(localBinPath)) {
      const resolution: BinaryResolution = {
        path: localBinPath,
        source: 'local-bin',
        available: true,
        version: this.getBinaryVersion(localBinPath),
      };
      this.cachedResult = resolution;
      return resolution;
    }

    // 3. Check if we can build from submodule
    const submoduleMain = resolve(process.cwd(), 'tailcat', 'cmd', 'tailcat', 'main.go');
    if (existsSync(submoduleMain)) {
      // Check if go is available to build
      try {
        execSync('which go', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
        const buildTarget = resolve(process.cwd(), 'bin', 'tailcat');
        try {
          execSync(`go build -o "${buildTarget}" ./tailcat/cmd/tailcat`, {
            cwd: process.cwd(),
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
          });
          if (existsSync(buildTarget)) {
            const resolution: BinaryResolution = {
              path: buildTarget,
              source: 'submodule-source',
              available: true,
              version: this.getBinaryVersion(buildTarget),
            };
            this.cachedResult = resolution;
            return resolution;
          }
        } catch (err: any) {
          return {
            path: null,
            source: 'missing',
            available: false,
            error: `Failed to compile tailcat submodule: ${err?.message || err}`,
          };
        }
      } catch {
        // Go not available
      }
    }

    const resolution: BinaryResolution = {
      path: null,
      source: 'missing',
      available: false,
      error: 'tailcat binary not found in PATH, bin/, or Go toolchain',
    };
    this.cachedResult = resolution;
    return resolution;
  }

  private static getBinaryVersion(binaryPath: string): string {
    try {
      const result = spawnSync(binaryPath, ['--help'], { encoding: 'utf-8' });
      const output = (result.stdout || '') + (result.stderr || '');
      const firstLine = output.split('\n')[0] || 'tailcat';
      return firstLine.trim();
    } catch {
      return 'tailcat (custom)';
    }
  }
}
