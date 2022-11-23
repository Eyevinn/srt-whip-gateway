import { Transmitter } from './transmitter';
import { TxStatus } from './types';

export class Engine {
  private transmitters: Map<number, Transmitter>;

  constructor() {
    this.transmitters = new Map<number, Transmitter>();
  }

  async addTransmitter(srtPort: number, whipUrl: URL, passThroughUrl?: URL, mockSpawn?): Promise<Transmitter> {
    if (this.transmitters.get(srtPort)) {
      throw new Error(`A transmitter for port ${srtPort} already exists`);
    }
    const transmitter = new Transmitter(srtPort, whipUrl, passThroughUrl, mockSpawn);
    this.transmitters.set(srtPort, transmitter);
    return transmitter;
  }

  async removeTransmitter(srtPort: number) {
    const tx = this.transmitters.get(srtPort);
    if (tx) {
      if ([ TxStatus.STOPPED, TxStatus.FAILED, TxStatus.IDLE ].includes(tx.getStatus())) {
        this.transmitters.delete(srtPort);
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