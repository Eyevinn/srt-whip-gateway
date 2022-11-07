import { FastifyPluginCallback } from "fastify";
import { Type } from '@sinclair/typebox'

import { Engine } from "../engine";
import { Tx } from "../types";

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

  fastify.get<{ Reply: Tx[]|string }>(
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
          body.push(tx.getObject());
        })
        reply.status(200).send(body);
      } catch (e) {
        console.error(e);
        reply.code(500).send('Exception thrown when trying to list all transmitters');
      }
    }
  );

  fastify.post<{ Body: Tx, Reply: Tx|string }>(
    '/tx',
    {
      schema: {
        response: {
          201: Tx,
          500: Type.String()
        }
      }
    },
    async (request, reply) => {
      try {
        const txObject = request.body;
        const tx = await engine.addTransmitter(txObject.port, new URL(txObject.whipUrl));
        reply.code(201).send(tx.getObject());
      } catch (e) {
        console.error(e);
        reply.code(500).send('Exception thrown when trying to add a new transmitter');
      }
    }
  )
  next();
}

export default apiEngine;