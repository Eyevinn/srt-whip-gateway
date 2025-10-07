import { FastifyPluginCallback } from "fastify";
import { Type } from '@sinclair/typebox'

import { Engine } from "../engine";
import { Tx, TxStatus, TxStateChange } from "../types";

export interface ApiEngineOpts {
  engine: Engine;
  apiKey?: string;
}


const ParamsPort = Type.Object({
  port: Type.Integer({
    description: 'SRT port'
  })
})

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
        description: 'List all available transmitters',
        response: {
          200: Type.Array(Tx),
          500: Type.String({ description: 'Error message' })
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
        description: 'Obtain a transmitter resource for an SRT port',
        params: ParamsPort,
        response: {
          200: Tx,
          500: Type.String({ description: 'Error message' })
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
        description: 'Remove a transmitter for an SRT port',
        params: ParamsPort,
        response: {
          500: Type.String({ description: 'Error message' }),
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
        description: 'Create a transmitter for an SRT port',
        body: Tx,
        response: {
          201: Type.String(),
          500: Type.String({ description: 'Error message' })
        },
      }
    },
    async (request, reply) => {
      try {
        const txObject = request.body;
        await opts.engine.addTransmitter(txObject.port, 
          new URL(txObject.whipUrl), 
          txObject.passThroughUrl ? new URL(txObject.passThroughUrl) : undefined);
        reply.code(201).send('created');
      } catch (e) {
        console.error(e);
        reply.code(500).send('Exception thrown when trying to add a new transmitter');
      }
    }
  );

  fastify.put<{ Params: { port: string }, Body: TxStateChange, Reply: string }>(
    '/tx/:port/state',
    {
      schema: {
        description: 'Change state of a transmitter',
        params: ParamsPort,
        body: TxStateChange,
        response: {
          200: Type.String(),
          400: Type.String({ description: 'bad request message'}),
          500: Type.String(),
        }
      }
    },
    async (request, reply) => {
      try {
        const port = parseInt(request.params.port, 10);
        const tx = opts.engine.getTransmitter(port);
        if (request.body.desired === TxStatus.RUNNING) {
          await tx.start();
          reply.code(200).send('Transmitter started');
        } else if (request.body.desired === TxStatus.STOPPED) {
          await tx.stop({ doAwait: true });
          reply.code(200).send('Transmitter stopped');
        } else {
          reply.code(400).send('Invalid desired state provided');
        }
      } catch (e) {
        console.error(e);
        reply.code(500).send('Exception thrown when trying to change state of a transmitter');
      }
    }
  )

  next();
}

export default apiEngine;