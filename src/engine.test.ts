import MockSpawn from 'mock-spawn';

import { Engine } from './engine';
import { TxStatus } from './types';
import { logger } from "./util/logger";

describe('Engine', () => {
  let engine: Engine;

  beforeAll(() => {
    engine = new Engine();
    logger.level = 'error';
  });

  afterEach(() => {
    engine.removeAllTransmitters();
  });

  test('transmitter is idle after creation', async () => {
    const tx = await engine.addTransmitter(1234, new URL('https://whip/channel/dummy'));
    expect(tx.getStatus()).toEqual(TxStatus.IDLE);
  });

  test('does not allow two transmitters for the same srt port', async () => {
    await engine.addTransmitter(9999, new URL('https://whip/channel/dummy'));
    await expect(engine.addTransmitter(9999, new URL('https://whip/channel/dummy')))
      .rejects.toThrow(); 
  });

  test('does not remove an active transmitter', async () => {
    const mockSpawn = MockSpawn();
    let t;
    mockSpawn.setDefault((cb: (exitCode: number) => void) => {
      // Exit 1 after 2 sec
      t = setTimeout(() => { return cb(1); }, 2000);
    });
    mockSpawn.setSignals({ 'SIGKILL': true });
    const tx = await engine.addTransmitter(1234, new URL('https://whip/channel/dummy'), undefined, undefined, undefined, undefined, mockSpawn);
    await tx.start();
    await tx.waitFor({ desiredStatus: [ TxStatus.RUNNING ]});
    await expect(engine.removeTransmitter(1234)).rejects.toThrow();
    // Clean up the running transmitter
    await tx.stop({ doAwait: true });
    if (t) clearTimeout(t);
  });

  test('can return a list of all transmitters', async () => {
    await engine.addTransmitter(1234, new URL('https://whip/channel/dummy'));
    await engine.addTransmitter(2345, new URL('https://whip/channel/dummy'));
    await engine.addTransmitter(3456, new URL('https://whip/channel/dummy'));
    expect(engine.getAllTransmitters().length).toEqual(3);
  });

  test('can get a specific transmitter', async () => {
    await engine.addTransmitter(1234, new URL('https://whip/channel/dummy'));
    const tx = engine.getTransmitter(1234);
    expect(tx.getPort()).toEqual(1234);
    expect(tx.getWhipUrl().toString()).toEqual('https://whip/channel/dummy');
  });
});
