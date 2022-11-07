import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import ApiHealthcheck from './api/healthcheck';
import ApiEngine from './api/engine';
import { Engine } from './engine';

export interface ApiOptions {
  engine: Engine;
  apiKey?: string;
}

export default (opts: ApiOptions) => {
  const api = Fastify({ ignoreTrailingSlash: true }).withTypeProvider<TypeBoxTypeProvider>();
  api.register(ApiEngine, {
    prefix: '/api/v1',
    engine: opts.engine,
    apiKey: opts.apiKey
  });
  api.register(ApiHealthcheck, {
    prefix: '/'
  });

  return api;
}