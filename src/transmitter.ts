import { logger } from './util/logger';
import { spawn } from 'child_process';

import { Tx, TxStatus, SrtMode } from './types';

export class Transmitter {
  private label?: string;
  private srtPort: number;
  private srtMode: SrtMode;
  private srtUrl: string;
  private whipURL: URL;
  private passThroughURL: URL;
  private noVideo: boolean;
  private status: TxStatus;
  private processSpawner;
  private process;

  constructor(srtPort: number, whipUrl: URL, passThroughUrl?: URL, srtMode?: SrtMode, srtUrl?: string, noVideo?: boolean, processSpawner?, label?: string) {
    this.label = label;
    this.srtPort = srtPort;
    this.srtMode = srtMode ? srtMode : SrtMode.LISTENER;
    this.srtUrl = srtUrl ? srtUrl : "0.0.0.0";
    this.whipURL = whipUrl;
    this.passThroughURL = passThroughUrl;
    this.noVideo = noVideo || false;
    this.status = TxStatus.IDLE;
    this.process = undefined;

    this.processSpawner = processSpawner ? processSpawner : spawn;

    const modeStr = this.srtMode === SrtMode.CALLER ? 'CALLER' : 'LISTENER';
    logger.info(`[${this.srtPort}]: Transmitter created - Mode: ${modeStr}, SRT URL: ${this.srtUrl}, WHIP URL: ${this.whipURL.href}${this.label ? `, Label: ${this.label}` : ''}`);
  }

  getObject(): Tx {
    return {
      label: this.label,
      port: this.srtPort,
      mode: this.srtMode,
      srtUrl: this.srtUrl.toString(),
      whipUrl: this.whipURL.toString(),
      passThroughUrl: this.passThroughURL ? this.passThroughURL.toString() : undefined,
      noVideo: this.noVideo,
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
    const modeStr = this.srtMode === SrtMode.CALLER ? 'CALLER' : 'LISTENER';
    logger.info(`[${this.srtPort}]: Starting transmission to ${this.whipURL.href}`);
    logger.info(`[${this.srtPort}]: SRT Mode: ${modeStr} (${this.srtMode}), SRT URL/Address: ${this.srtUrl}`);

    const opts = [
      '-a', this.srtUrl,
      '-p', this.srtPort.toString(),
      '-u', this.whipURL.href,
      '-s',
      '-m', this.srtMode.toString(),
    ];
    if (this.passThroughURL) {
      opts.push(
        '-r', this.passThroughURL.hostname,
        '-o', this.passThroughURL.port.toString()
      );
      logger.info(`[${this.srtPort}]: Passthrough enabled to ${this.passThroughURL.hostname}:${this.passThroughURL.port}`);
    }
    if (this.noVideo) {
      opts.push('--no-video');
      logger.info(`[${this.srtPort}]: Video disabled`);
    }

    logger.info(`[${this.srtPort}]: Executing: whip-mpegts ${opts.join(' ')}`);

    try {
      this.process = this.processSpawner('whip-mpegts', opts);
      logger.info(`[${this.srtPort}]: Process spawned with PID: ${this.process.pid}`);
    } catch (err) {
      logger.error(`[${this.srtPort}]: Failed to spawn process: ${err.message}`);
      this.status = TxStatus.FAILED;
      throw err;
    }

    this.status = TxStatus.RUNNING;
    logger.info(`[${this.srtPort}]: Transmitter is running`);

    this.process.stdout.on('data', (data: Buffer) => {
      const output = data.toString().trim();
      logger.info(`[${this.srtPort}] [STDOUT]: ${output}`);
    });

    this.process.stderr.on('data', (data: Buffer) => {
      const output = data.toString().trim();
      logger.warn(`[${this.srtPort}] [STDERR]: ${output}`);
    });

    this.process.on('error', (err: Error) => {
      logger.error(`[${this.srtPort}]: Process error: ${err.message}`);
      logger.error(`[${this.srtPort}]: Error stack: ${err.stack}`);
      this.status = TxStatus.FAILED;
    });

    this.process.on('exit', (code: number | null, signal: string | null) => {
      logger.info(`[${this.srtPort}]: Transmitter has stopped (exit code: ${code || 0}, signal: ${signal || 'none'})`);
      if (this.process?.spawnargs) {
        logger.info(`[${this.srtPort}]: Command was: whip-mpegts ${this.process.spawnargs.slice(1).join(' ')}`);
      }
      if (code && code > 0) {
        logger.error(`[${this.srtPort}]: Transmitter has unintentionally stopped with code ${code}`);
        this.status = TxStatus.FAILED;
      } else if (signal) {
        logger.warn(`[${this.srtPort}]: Transmitter stopped by signal: ${signal}`);
        this.status = TxStatus.STOPPED;
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