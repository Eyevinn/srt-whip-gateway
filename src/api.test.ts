import api from "./api";
import { Engine } from "./engine";
import { TxStatus } from "./types";

describe('API', () => {
  let engine: Engine;

  beforeEach(() => {
    engine = new Engine();
  });

  test('returns healtheck response on /', async () => {
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
    const app = api({ engine });
    let response = await app.inject({
      method: 'GET',
      url: '/api/v1/tx'
    });
    expect(response.statusCode).toEqual(200);
    let body = await response.json();
    expect(body).toEqual([]);

    engine.addTransmitter(9999, new URL('http://whip/dummy'));
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
});