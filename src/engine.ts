import { Transmitter } from "./transmitter";

export class Engine {
  private transmitters: Map<number, Transmitter>;

  constructor() {
    this.transmitters = new Map<number, Transmitter>();
  }

  async addTransmitter(srtPort: number, whipUrl: URL) {
    if (this.transmitters.get(srtPort)) {
      throw new Error(`A transmitter for port ${srtPort} already exists`);
    }
    const transmitter = new Transmitter(srtPort, whipUrl);
    this.transmitters.set(srtPort, transmitter);
    return transmitter;
  }
  
}