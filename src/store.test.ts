import fs from 'fs';
import os from 'os';
import path from 'path';

import { Engine } from './engine';
import { FileTransmitterStore } from './store';
import { logger } from './util/logger';

describe('Transmitter config persistence', () => {
  let dataDir: string;

  beforeAll(() => {
    logger.level = 'error';
  });

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'srt-whip-gw-'));
  });

  afterEach(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  test('added transmitters survive a restart (reload returns the same set)', async () => {
    const store = new FileTransmitterStore(dataDir);
    const engine = new Engine({ store });
    await engine.addTransmitter(1234, new URL('https://whip/channel/a'));
    await engine.addTransmitter(2345, new URL('https://whip/channel/b'), new URL('srt://dummy:9000'));

    // Simulate a process restart: a brand new Engine on the same store.
    const restarted = new Engine({ store: new FileTransmitterStore(dataDir) });
    await restarted.load();

    const ports = restarted
      .getAllTransmitters()
      .map((tx) => tx.getPort())
      .sort((a, b) => a - b);
    expect(ports).toEqual([1234, 2345]);

    const tx = restarted.getTransmitter(2345);
    expect(tx.getWhipUrl().toString()).toEqual('https://whip/channel/b');
    expect(tx.getPassThroughUrl().toString()).toEqual('srt://dummy:9000');
  });

  test('a removed transmitter is not resurrected after a restart', async () => {
    const store = new FileTransmitterStore(dataDir);
    const engine = new Engine({ store });
    await engine.addTransmitter(1234, new URL('https://whip/channel/a'));
    await engine.addTransmitter(2345, new URL('https://whip/channel/b'));
    await engine.removeTransmitter(1234);

    const restarted = new Engine({ store: new FileTransmitterStore(dataDir) });
    await restarted.load();

    const ports = restarted.getAllTransmitters().map((tx) => tx.getPort());
    expect(ports).toEqual([2345]);
    expect(restarted.getTransmitter(1234)).toBeUndefined();
  });

  test('runtime status is not persisted (reloaded transmitters are idle)', async () => {
    const store = new FileTransmitterStore(dataDir);
    const engine = new Engine({ store });
    await engine.addTransmitter(1234, new URL('https://whip/channel/a'));

    const restarted = new Engine({ store: new FileTransmitterStore(dataDir) });
    await restarted.load();

    const tx = restarted.getTransmitter(1234);
    // status re-derives to IDLE on reload; it is not read from the store
    expect(tx.getObject().status).toEqual('idle');
  });

  test('load on a fresh data directory yields no transmitters', async () => {
    const engine = new Engine({ store: new FileTransmitterStore(dataDir) });
    await engine.load();
    expect(engine.getAllTransmitters().length).toEqual(0);
  });
});
