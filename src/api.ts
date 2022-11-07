import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
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
  api.register(cors, {});
  api.register(swagger, {
    swagger: {
      info: {
        title: 'SRT WHIP Gateway API',
        description: 'API to manage SRT/WHIP transmitters',
        version: 'v1'
      },
      securityDefinitions: {
        apiKey: {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header'
        }
      },
    }
  });
  api.register(swaggerUI, {
    routePrefix: '/api/docs'
  });
    
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