import MockSpawn from 'mock-spawn';

import api from "./api";
import { Engine } from "./engine";
import { TxStatus } from "./types";

describe('API', () => {
  test('returns healtheck response on /', async () => {
    const engine = new Engine();
    const app = api({ engine });
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });
    expect(response.statusCode).toEqual(200);
    const body = await response.json();
    expect(body.message).toEqual('ok');
  });

  test('can return a list of all transmitters', async () => {
    const engine = new Engine();
    const app = api({ engine });
    let response = await app.inject({
      method: 'GET',
      url: '/api/v1/tx'
    });
    expect(response.statusCode).toEqual(200);
    let body = await response.json();
    expect(body).toEqual([]);

    await engine.addTransmitter(9999, new URL('http://whip/dummy'));
    response = await app.inject({
      method: 'GET',
      url: '/api/v1/tx'
    });
    expect(response.statusCode).toEqual(200);
    body = await response.json();
    expect(body.length).toEqual(1);
    expect(body[0].port).toEqual(9999);
    expect(body[0].whipUrl).toEqual('http://whip/dummy');
    expect(body[0].status).toEqual(TxStatus.IDLE);
  });

  test('can create a new transmitter', async () => {
    const engine = new Engine();
    const app = api({ engine });
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/tx',
      payload: {
        port: 9898,
        whipUrl: 'http://whip/dummy',
        status: TxStatus.IDLE,
        mode: 1
      }
    });
    expect(response.statusCode).toEqual(201);
    expect(engine.getAllTransmitters().length).toEqual(1);
  });

  test('can create a new transmitter with passthrough url', async () => {
    const engine = new Engine();
    const app = api({ engine });
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/tx',
      payload: {
        port: 9898,
        whipUrl: 'http://whip/dummy',
        passThroughUrl: 'srt://127.0.0.1:9899',
        mode: 2,
        status: TxStatus.IDLE
      }
    });
    expect(response.statusCode).toEqual(201);
    expect(engine.getAllTransmitters().length).toEqual(1);
    const tx = engine.getTransmitter(9898);
    expect(tx.getPassThroughUrl().toString()).toEqual('srt://127.0.0.1:9899');
  });

  test('can return a specific transmitter', async () => {
    const engine = new Engine();
    const app = api({ engine });
    await engine.addTransmitter(9191, new URL('http://whip/dummy'));
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/tx/9191'
    });
    expect(response.statusCode).toEqual(200);
    const body = await response.json();
    expect(body.port).toEqual(9191);
    expect(body.whipUrl).toEqual('http://whip/dummy');
    expect(body.passThroughUrl).not.toBeDefined();
  });

  test('can return a specific transmitter that has a passthrough url', async () => {
    const engine = new Engine();
    const app = api({ engine });
    await engine.addTransmitter(9191, new URL('http://whip/dummy'), new URL('srt://dummy:1234'));
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/tx/9191'
    });
    expect(response.statusCode).toEqual(200);
    const body = await response.json();
    expect(body.port).toEqual(9191);
    expect(body.whipUrl).toEqual('http://whip/dummy');
    expect(body.passThroughUrl).toBeDefined();
  });  

  test('can delete a transmitter', async () => {
    const engine = new Engine();
    const app = api({ engine });
    await engine.addTransmitter(9191, new URL('http://whip/dummy'));
    expect(engine.getTransmitter(9191)).toBeDefined();

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/tx/9191'
    });
    expect(response.statusCode).toEqual(204);
    const tx = engine.getTransmitter(9191);
    expect(tx).toBeUndefined();
  });

  test('provides swagger documentation', async () => {
    const engine = new Engine();
    const app = api({ engine });
    const response = await app.inject({
      method: 'GET',
      url: '/api/docs'
    });
    expect(response.statusCode).toEqual(302);
  });

  test('can start a transmitter', async () => {
    const engine = new Engine();
    const app = api({ engine });
    const mockSpawn = MockSpawn();
    let t;
    mockSpawn.setDefault((cb: (exitCode: number) => void) => {
      // Exit 1 after 2 sec
      t = setTimeout(() => { return cb(1); }, 2000);
    });
    mockSpawn.setSignals({ 'SIGKILL': true });
    const tx = await engine.addTransmitter(1234, new URL('https://whip/channel/dummy'), undefined, undefined, undefined, undefined, mockSpawn);
    let response = await app.inject({
      method: 'PUT',
      url: '/api/v1/tx/1234/state',
      payload: {
        desired: TxStatus.RUNNING
      }
    });
    expect(response.statusCode).toEqual(200);
    response = await app.inject({
      method: 'GET',
      url: '/api/v1/tx/1234'
    });
    const body = await response.json();
    expect(body.status).toEqual(TxStatus.RUNNING);
    // Clean up
    await tx.stop({ doAwait: true });
    if (t) clearTimeout(t);
  });

  test('can stop a transmitter that is active', async () => {
    const engine = new Engine();
    const app = api({ engine });
    const mockSpawn = MockSpawn();
    let t;
    mockSpawn.setDefault((cb: (exitCode: number) => void) => {
      // Exit 1 after 2 sec
      t = setTimeout(() => { return cb(1); }, 2000);
    });
    mockSpawn.setSignals({ 'SIGKILL': true });
    const tx = await engine.addTransmitter(1234, new URL('https://whip/channel/dummy'), undefined, undefined, undefined, undefined, mockSpawn);
    await tx.start();
    let response = await app.inject({
      method: 'PUT',
      url: '/api/v1/tx/1234/state',
      payload: {
        desired: TxStatus.STOPPED
      }
    });
    expect(response.statusCode).toEqual(200);
    response = await app.inject({
      method: 'GET',
      url: '/api/v1/tx/1234'
    });
    const body = await response.json();
    expect(body.status).toEqual(TxStatus.STOPPED);
    if (t) clearTimeout(t);
  });
});