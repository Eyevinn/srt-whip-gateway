export enum TxStatus {
  IDLE,
  RUNNING,
  STOPPED
}

export class Transmitter {
  private srtPort: number;
  private whipURL: URL;
  private status: TxStatus;

  constructor(srtPort: number, whipUrl: URL) {
    this.srtPort = srtPort;
    this.whipURL = whipUrl;
    this.status = TxStatus.IDLE;
  }

  getStatus(): TxStatus {
    return this.status;
  }
}