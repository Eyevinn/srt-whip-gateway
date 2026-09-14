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
    // Backward compatibility: docs and gui links must be preserved
    expect(body.docs).toEqual('/api/docs');
    expect(body.gui).toEqual('/ui');
  });

  test('healthcheck returns 200 when all transmitters are running/idle', async () => {
    const engine = new Engine();
    const app = api({ engine });
    const mockSpawn = MockSpawn();
    let t;
    mockSpawn.setDefault((cb) => {
      // Stay running for a while so status remains RUNNING during the check
      t = setTimeout(() => {
        return cb(0);
      }, 2000);
    });
    // One idle transmitter and one running transmitter
    await engine.addTransmitter(7001, new URL('http://whip/idle'));
    const tx = await engine.addTransmitter(
      7002,
      new URL('http://whip/running'),
      undefined,
      mockSpawn
    );
    await tx.start();

    const response = await app.inject({
      method: 'GET',
      url: '/'
    });
    expect(response.statusCode).toEqual(200);
    const body = await response.json();
    expect(body.message).toEqual('ok');
    expect(body.docs).toEqual('/api/docs');
    expect(body.gui).toEqual('/ui');
    expect(body.transmitters.total).toEqual(2);
    expect(body.transmitters.failed).toEqual(0);
    clearTimeout(t);
  });

  test('healthcheck returns non-2xx when a transmitter has failed', async () => {
    const engine = new Engine();
    const app = api({ engine });
    const mockSpawn = MockSpawn();
    mockSpawn.setDefault((cb) => {
      // Exit with a non-zero code immediately to mark the transmitter FAILED
      return cb(1);
    });
    const tx = await engine.addTransmitter(
      7003,
      new URL('http://whip/failing'),
      undefined,
      mockSpawn
    );
    await tx.start();
    // Wait for the process 'exit' handler to flip the status to FAILED
    await tx.waitFor({ desiredStatus: [TxStatus.FAILED] });

    const response = await app.inject({
      method: 'GET',
      url: '/'
    });
    expect(response.statusCode).toBeGreaterThanOrEqual(300);
    const body = await response.json();
    expect(body.message).toEqual('unhealthy');
    // Backward compatibility preserved even in the unhealthy response
    expect(body.docs).toEqual('/api/docs');
    expect(body.gui).toEqual('/ui');
    expect(body.transmitters.failed).toBeGreaterThanOrEqual(1);
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
        status: TxStatus.IDLE
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
    // @fastify/swagger-ui v5 serves the docs UI directly at the route prefix
    // (fastify-4 era swagger-ui v1 responded with a 302 redirect instead).
    const response = await app.inject({
      method: 'GET',
      url: '/api/docs'
    });
    expect(response.statusCode).toEqual(200);
    // The generated OpenAPI spec is still served under the docs route.
    const spec = await app.inject({
      method: 'GET',
      url: '/api/docs/json'
    });
    expect(spec.statusCode).toEqual(200);
    expect(spec.json().info.title).toEqual('SRT WHIP Gateway API');
  });

  test('can start a transmitter', async () => {
    const engine = new Engine();
    const app = api({ engine });
    const mockSpawn = MockSpawn();
    let t;
    mockSpawn.setDefault((cb) => {
      // Exit 1 after 2 sec
      t = setTimeout(() => { return cb(1); }, 2000);
    });
    await engine.addTransmitter(1234, new URL('https://whip/channel/dummy'), undefined, mockSpawn);
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
    clearTimeout(t);
  });

  test('can stop a transmitter that is active', async () => {
    const engine = new Engine();
    const app = api({ engine });
    const mockSpawn = MockSpawn();
    let t;
    mockSpawn.setDefault((cb) => {
      // Exit 1 after 2 sec
      t = setTimeout(() => { return cb(1); }, 2000);
    });
    mockSpawn.setSignals({ 'SIGKILL': true });
    const tx = await engine.addTransmitter(1234, new URL('https://whip/channel/dummy'), undefined, mockSpawn);
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
    clearTimeout(t);
  });
});