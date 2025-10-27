import MockSpawn from 'mock-spawn';
import { TxStatus } from './types';
import { Transmitter } from './transmitter';
import { logger } from "./util/logger";

describe('Transmitter', () => {
  let transmitters: Transmitter[] = [];

  beforeAll(() => {
    logger.level = 'error';
  });

  afterEach(async () => {
    // Clean up all transmitters after each test
    for (const tx of transmitters) {
      if (tx.getStatus() === TxStatus.RUNNING) {
        await tx.stop({ doAwait: true });
      }
    }
    transmitters = [];
  });

  test('has state idle when created', () => {
    const tx = new Transmitter(9999, new URL('http://dummy/url'));
    expect(tx.getStatus()).toEqual(TxStatus.IDLE);
  });

  test('has state running when started', async () => {
    let t;
    const mockSpawn = MockSpawn();
    mockSpawn.setDefault((cb: (exitCode: number) => void) => {
      t = setTimeout(() => { return cb(1); }, 600);
    });
    mockSpawn.setSignals({ 'SIGKILL': true });
    const tx = new Transmitter(9999, new URL('http://dummy/url'), undefined, undefined, undefined, undefined, mockSpawn);
    transmitters.push(tx);
    await tx.start();
    await tx.waitFor({ desiredStatus: [ TxStatus.RUNNING ] });
    expect(tx.getStatus()).toEqual(TxStatus.RUNNING);
    if (t) clearTimeout(t);
  });

  test('can be created with a passthrough url', async () => {
    let t;
    const mockSpawn = MockSpawn();
    mockSpawn.setDefault((cb: (exitCode: number) => void) => {
      t = setTimeout(() => { return cb(1); }, 600);
    });
    const tx = new Transmitter(9999, new URL('http://dummy/url'), new URL('srt://dummy:1234'), undefined, undefined, undefined, mockSpawn);
    expect(tx.getPassThroughUrl()).toBeDefined();
    expect(tx.getPassThroughUrl().toString()).toEqual('srt://dummy:1234');
    clearTimeout(t);
  });

  test('has state failed if process fails to start', async () => {
    let t;
    const mockSpawn = MockSpawn();
    mockSpawn.setDefault((cb: (exitCode: number) => void) => {
      t = setTimeout(() => { return cb(1); }, 600);
    });
    const tx = new Transmitter(9999, new URL('http://dummy/url'), undefined, undefined, undefined, undefined, mockSpawn);
    transmitters.push(tx);
    await tx.start();
    await tx.waitFor({ desiredStatus: [ TxStatus.RUNNING ] });
    await tx.waitFor({ desiredStatus: [ TxStatus.FAILED ] });
    expect(tx.getStatus()).toEqual(TxStatus.FAILED);
    if (t) clearTimeout(t);
  });

  test('has state stopped if transmitter is intentionally stopped', async () => {
    const mockSpawn = MockSpawn();
    let t;
    mockSpawn.setDefault((cb: (exitCode: number) => void) => {
      // Exit 1 after 2 sec
      t = setTimeout(() => { return cb(1); }, 2000);
    });
    mockSpawn.setSignals({ 'SIGKILL': true });
    const tx = new Transmitter(9999, new URL('http://dummy/url'), undefined, undefined, undefined, undefined, mockSpawn);
    transmitters.push(tx);
    await tx.start();
    await tx.waitFor({ desiredStatus: [ TxStatus.RUNNING ]});
    await tx.stop({ doAwait: false });
    await tx.waitFor({ desiredStatus: [ TxStatus.STOPPED ] });
    expect(tx.getStatus()).toEqual(TxStatus.STOPPED);
    if (t) clearTimeout(t);
  });
});