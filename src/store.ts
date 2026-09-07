import fs from 'fs';
import path from 'path';

import { logger } from './util/logger';

/**
 * The persisted configuration for a single transmitter. This is intentionally
 * only the *configuration* required to re-create a transmitter on startup - the
 * runtime status (TxStatus) is deliberately not persisted as it re-derives when
 * the transmitter is re-spawned.
 */
export interface TransmitterConfig {
  port: number;
  whipUrl: string;
  passThroughUrl?: string;
}

/**
 * Store abstraction for transmitter configuration. The Engine writes through to
 * a store on add/remove and reloads from it on startup.
 */
export interface TransmitterStore {
  load(): Promise<TransmitterConfig[]>;
  save(configs: TransmitterConfig[]): Promise<void>;
}

/**
 * A no-op store used when persistence is not desired (e.g. in unit tests that
 * construct an Engine without a backing store). Nothing is written to disk and
 * load always returns an empty set.
 */
export class InMemoryTransmitterStore implements TransmitterStore {
  private configs: TransmitterConfig[] = [];

  async load(): Promise<TransmitterConfig[]> {
    return this.configs.slice();
  }

  async save(configs: TransmitterConfig[]): Promise<void> {
    this.configs = configs.slice();
  }
}

/**
 * Persists transmitter configuration to a JSON file under a configurable data
 * directory. This is intentionally simple - a single JSON document holding the
 * full set of configured transmitters, rewritten on every change.
 */
export class FileTransmitterStore implements TransmitterStore {
  private filePath: string;

  constructor(dataDir: string, fileName = 'transmitters.json') {
    this.filePath = path.join(dataDir, fileName);
  }

  getFilePath(): string {
    return this.filePath;
  }

  async load(): Promise<TransmitterConfig[]> {
    try {
      const raw = await fs.promises.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        logger.warn(
          `Ignoring transmitter store at ${this.filePath}: expected an array`
        );
        return [];
      }
      return parsed as TransmitterConfig[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        // No store yet - first run.
        return [];
      }
      logger.warn(
        `Failed to read transmitter store at ${this.filePath}: ${err}`
      );
      return [];
    }
  }

  async save(configs: TransmitterConfig[]): Promise<void> {
    await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });
    const tmpPath = `${this.filePath}.tmp`;
    await fs.promises.writeFile(tmpPath, JSON.stringify(configs, null, 2), 'utf-8');
    await fs.promises.rename(tmpPath, this.filePath);
  }
}
