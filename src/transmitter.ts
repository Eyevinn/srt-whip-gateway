import { logger } from './util/logger';
import { spawn } from 'child_process';

import { Tx, TxStatus } from './types';

export class Transmitter {
  private srtPort: number;
  private whipURL: URL;
  private passThroughURL: URL;
  private status: TxStatus;
  private processSpawner;
  private process;

  constructor(srtPort: number, whipUrl: URL, passThroughUrl?: URL, processSpawner?) {
    this.srtPort = srtPort;
    this.whipURL = whipUrl;
    this.passThroughURL = passThroughUrl;
    this.status = TxStatus.IDLE;
    this.process = undefined;

    this.processSpawner = processSpawner ? processSpawner : spawn;
  }

  getObject(): Tx {
    return {
      port: this.srtPort,
      whipUrl: this.whipURL.toString(),
      passThroughUrl: this.passThroughURL ? this.passThroughURL.toString() : undefined,
      status: this.status
    }
  }

  getPort(): number {
    return this.srtPort;
  }

  getWhipUrl(): URL {
    return this.whipURL;
  }

  getPassThroughUrl(): URL {
    return this.passThroughURL;
  }

  getStatus(): TxStatus {
    return this.status;
  }

  async start() {
    logger.info(`[${this.srtPort}]: Starting transmission to ${this.whipURL.href}`);

    const opts = [
      '-a', '0.0.0.0',
      '-p', this.srtPort,
      '-u', this.whipURL.href,
      '-s'
    ];
    if (this.passThroughURL) {
      opts.push(
        '-r', this.passThroughURL.hostname,
        '-o', this.passThroughURL.port.toString()
      );
    }
    this.process = this.processSpawner('whip-mpegts', opts);
    this.status = TxStatus.RUNNING;
    logger.info(`[${this.srtPort}]: Transmitter is running`);

    this.process.stdout.on('data', data => { logger.debug(`[${this.srtPort}]: ${data}`)});
    this.process.stderr.on('data', data => { logger.debug(`[${this.srtPort}]: ${data}`)});
    this.process.on('exit', code => {
      logger.info(`[${this.srtPort}]: Transmitter has stopped (${code||0})`);
      logger.debug(this.process.spawnargs);
      if (code > 0) {
        logger.info(`[${this.srtPort}]: Transmitter has unintentionally stopped`);
        this.status = TxStatus.FAILED;
      } else {
        this.status = TxStatus.STOPPED;
      }
    });
  }

  async stop({ doAwait } : { doAwait: boolean }) {
    logger.info(`[${this.srtPort}]: Stopping transmission to ${this.whipURL.href}`);
    if (this.process) {
      this.process.kill('SIGKILL');
    } else {
      this.status = TxStatus.STOPPED;
    }
    if (doAwait) {
      await this.waitFor({ desiredStatus: [TxStatus.STOPPED, TxStatus.FAILED ] });
    }
  }

  waitFor({ desiredStatus }: { desiredStatus: TxStatus[] } ): Promise<void> {
    return new Promise((resolve) => {
      const t = setInterval(() => {
        if (desiredStatus.includes(this.status)) {
          clearInterval(t);
          resolve();
        }
      }, 500);
    })
  }
}