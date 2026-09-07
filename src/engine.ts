import { Transmitter } from './transmitter';
import { TxStatus } from './types';
import {
  InMemoryTransmitterStore,
  TransmitterConfig,
  TransmitterStore
} from './store';

export interface EngineOptions {
  store?: TransmitterStore;
}

export class Engine {
  private transmitters: Map<number, Transmitter>;
  private store: TransmitterStore;

  constructor(opts: EngineOptions = {}) {
    this.transmitters = new Map<number, Transmitter>();
    this.store = opts.store ? opts.store : new InMemoryTransmitterStore();
  }

  /**
   * Reload previously configured transmitters from the backing store. Should be
   * called on startup, before the API starts serving requests. Only the
   * configuration is restored - runtime status re-derives when a transmitter is
   * (re-)started.
   */
  async load(): Promise<void> {
    const configs = await this.store.load();
    for (const config of configs) {
      if (this.transmitters.has(config.port)) {
        continue;
      }
      const transmitter = new Transmitter(
        config.port,
        new URL(config.whipUrl),
        config.passThroughUrl ? new URL(config.passThroughUrl) : undefined
      );
      this.transmitters.set(config.port, transmitter);
    }
  }

  private async persist(): Promise<void> {
    const configs: TransmitterConfig[] = [];
    this.transmitters.forEach((tx) => {
      const whipUrl = tx.getWhipUrl();
      const passThroughUrl = tx.getPassThroughUrl();
      configs.push({
        port: tx.getPort(),
        whipUrl: whipUrl.toString(),
        passThroughUrl: passThroughUrl ? passThroughUrl.toString() : undefined
      });
    });
    await this.store.save(configs);
  }

  async addTransmitter(srtPort: number, whipUrl: URL, passThroughUrl?: URL, mockSpawn?): Promise<Transmitter> {
    if (this.transmitters.get(srtPort)) {
      throw new Error(`A transmitter for port ${srtPort} already exists`);
    }
    const transmitter = new Transmitter(srtPort, whipUrl, passThroughUrl, mockSpawn);
    this.transmitters.set(srtPort, transmitter);
    await this.persist();
    return transmitter;
  }

  async removeTransmitter(srtPort: number) {
    const tx = this.transmitters.get(srtPort);
    if (tx) {
      if ([ TxStatus.STOPPED, TxStatus.FAILED, TxStatus.IDLE ].includes(tx.getStatus())) {
        this.transmitters.delete(srtPort);
        await this.persist();
      } else {
        throw new Error(`Failed to remove transmitter for port ${srtPort} as it is active`);
      }
    }
  }

  getTransmitter(srtPort: number): Transmitter {
    const tx = this.transmitters.get(srtPort);
    return tx;
  }

  getAllTransmitters(): Transmitter[] {
    const transmitters = [];
    this.transmitters.forEach((tx) => transmitters.push(tx));
    return transmitters;
  }

  removeAllTransmitters(): void {
    this.transmitters.clear();
  }
}
