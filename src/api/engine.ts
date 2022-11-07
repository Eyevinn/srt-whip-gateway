import { FastifyPluginCallback } from "fastify";
import { Type } from '@sinclair/typebox'

import { Engine } from "../engine";
import { Tx } from "../types";

export interface ApiEngineOpts {
  engine: Engine;
  apiKey?: string;
}

const apiEngine: FastifyPluginCallback<ApiEngineOpts> = (fastify, opts, next) => {
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
        const transmitters = opts.engine.getAllTransmitters();
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

  fastify.get<{ Params: { port: string }, Reply: Tx|string }>(
    '/tx/:port',
    {
      schema: {
        response: {
          200: Tx,
          500: Type.String()
        }
      }
    },
    async (request, reply) => {
      try {
        const port = parseInt(request.params.port, 10);
        const tx = opts.engine.getTransmitter(port);
        if (!tx) {
          reply.code(404).send(`No transmitter for port ${port} was found`);
          return;
        }
        reply.code(200).send(tx.getObject());
      } catch (e) {
        console.error(e);
        reply.code(500).send('Exception thrown when trying to get a transmitter');
      }
    }
  );

  fastify.delete<{ Params: { port: string }, Reply: string }>(
    '/tx/:port',
    {
      schema: {
        response: {
          500: Type.String(),
        }
      }
    },
    async (request, reply) => {
      try {
        const port = parseInt(request.params.port, 10);
        opts.engine.removeTransmitter(port);
        reply.code(204);
      } catch (e) {
        console.error(e);
        reply.code(500).send('Exception thrown when trying to delete a transmitter');
      }
    }
  )

  fastify.post<{ Body: Tx, Reply: string }>(
    '/tx',
    {
      schema: {
        body: Tx,
        response: {
          201: Type.String(),
          500: Type.String()
        }
      }
    },
    async (request, reply) => {
      try {
        const txObject = request.body;
        await opts.engine.addTransmitter(txObject.port, new URL(txObject.whipUrl));
        reply.code(201).send('created');
      } catch (e) {
        console.error(e);
        reply.code(500).send('Exception thrown when trying to add a new transmitter');
      }
    }
  );

  next();
}

export default apiEngine;