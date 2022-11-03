import MockSpawn from 'mock-spawn';
import { Transmitter, TxStatus } from './transmitter';
import { logger } from "./util/logger";

describe('Transmitter', () => {
  beforeAll(() => {
    logger.level = 'error';
  });

  test('has state idle when created', () => {
    const tx = new Transmitter(9999, new URL('http://dummy/url'));
    expect(tx.getStatus()).toEqual(TxStatus.IDLE);
  });

  test('has state running when started', async () => {
    const mockSpawn = MockSpawn();
    mockSpawn.setDefault((cb) => {
      setTimeout(() => { return cb(1); }, 600);
    });
    const tx = new Transmitter(9999, new URL('http://dummy/url'), mockSpawn);
    await tx.start();
    await tx.waitFor({ desiredStatus: [ TxStatus.RUNNING ] });
    expect(tx.getStatus()).toEqual(TxStatus.RUNNING);
  });

  test('has state failed if process fails to start', async () => {
    const mockSpawn = MockSpawn();
    mockSpawn.setDefault((cb) => {
      setTimeout(() => { return cb(1); }, 600);
    });
    const tx = new Transmitter(9999, new URL('http://dummy/url'), mockSpawn);
    await tx.start();
    await tx.waitFor({ desiredStatus: [ TxStatus.RUNNING ] });
    await tx.waitFor({ desiredStatus: [ TxStatus.FAILED ] });
    expect(tx.getStatus()).toEqual(TxStatus.FAILED);
  });

  test('has state stopped if transmitter is intentionally stopped', async () => {
    const mockSpawn = MockSpawn();
    let t;
    mockSpawn.setDefault((cb) => {
      // Exit 1 after 2 sec
      t = setTimeout(() => { return cb(1); }, 2000);
    });
    mockSpawn.setSignals({ 'SIGKILL': true });
    const tx = new Transmitter(9999, new URL('http://dummy/url'), mockSpawn);
    await tx.start();
    await tx.waitFor({ desiredStatus: [ TxStatus.RUNNING ]});
    await tx.stop({ doAwait: false });
    await tx.waitFor({ desiredStatus: [ TxStatus.STOPPED ] });
    expect(tx.getStatus()).toEqual(TxStatus.STOPPED);
    clearTimeout(t);
  });
});