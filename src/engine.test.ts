import MockSpawn from 'mock-spawn';

import { Engine } from './engine';
import { TxStatus } from './transmitter';
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
    mockSpawn.setDefault((cb) => {
      // Exit 1 after 2 sec
      t = setTimeout(() => { return cb(1); }, 2000);
    });
    const tx = await engine.addTransmitter(1234, new URL('https://whip/channel/dummy'), mockSpawn);
    await tx.start();
    await tx.waitFor({ desiredStatus: [ TxStatus.RUNNING ]});
    await expect(engine.removeTransmitter(1234)).rejects.toThrow();
    clearTimeout(t);
  });

  test('can return a list of all transmitters', async () => {
    await engine.addTransmitter(1234, new URL('https://whip/channel/dummy'));
    await engine.addTransmitter(2345, new URL('https://whip/channel/dummy'));
    await engine.addTransmitter(3456, new URL('https://whip/channel/dummy'));
    expect(engine.getAllTransmitters().length).toEqual(3);
  });
});
