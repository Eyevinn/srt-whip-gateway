import { FastifyPluginCallback } from "fastify";
import { Type } from '@sinclair/typebox'

import { Engine } from "../engine";
import { Tx, TxType } from "../transmitter";

export interface ApiEngineOpts {
  engine: Engine;
  apiKey?: string;
}

const apiEngine: FastifyPluginCallback<ApiEngineOpts> = (fastify, opts, next) => {
  const engine = opts.engine;
  let apiKey = '';
  if (opts.apiKey) {
    apiKey = opts.apiKey;
  }

  fastify.addHook('preHandler', async (request, reply) => {
    if (apiKey) {
      if (request.headers['x-api-key'] !== apiKey) {
        reply.code(403).send({ message: 'Invalid API-key provided' });
      }
    }
  });

  fastify.get<{ Reply: TxType[]|string }>(
    '/tx', 
    { 
      schema: { 
        response: {
          200: Type.Array(Tx),
          500: Type.String()
        }
      }
    },
    async (request, reply) => {
      try {
        const transmitters = engine.getAllTransmitters();
        const body = [];
        transmitters.forEach(tx => {
          body.push({
            port: tx.getPort(),
            whipUrl: tx.getWhipUrl().toString(),
            status: tx.getStatus() 
          });
        })
        reply.status(200).send(body);
      } catch (e) {
        reply.code(500).send('Exception thrown when trying to list all transmitters');
      }
    }
  );
  next();
}

export default apiEngine;