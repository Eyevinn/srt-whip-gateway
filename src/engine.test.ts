import { Engine } from './engine';
import { TxStatus } from './transmitter';

describe('Engine', () => {
  let engine: Engine;

  beforeAll(() => {
    engine = new Engine();
  });

  test('transmitter is idle after creation', async () => {
    const tx = await engine.addTransmitter(1234, new URL('https://whip/channel/dummy'));
    expect(tx.getStatus()).toEqual(TxStatus.IDLE);
  });

  test('does not allow two transmitters for the same srt port', async () => {
    await engine.addTransmitter(9999, new URL('https://whip/channel/dummy'));
    await expect(engine.addTransmitter(9999, new URL('https://whip/channel/dummy'))).rejects.toThrow(); 
  });
});
