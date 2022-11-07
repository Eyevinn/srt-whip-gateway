import api from "./api";
import { Engine } from "./engine";

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
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/tx'
    });
    expect(response.statusCode).toEqual(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });
});