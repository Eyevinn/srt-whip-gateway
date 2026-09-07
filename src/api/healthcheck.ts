import { FastifyPluginCallback } from 'fastify';

import { Engine } from '../engine';
import { TxStatus } from '../types';

export interface ApiHealthcheckOpts {
  engine: Engine;
}

const apiHealthcheck: FastifyPluginCallback<ApiHealthcheckOpts> = (
  fastify,
  opts,
  next
) => {
  fastify.get('/', async (request, reply) => {
    const transmitters = opts.engine.getAllTransmitters();

    const counts = {
      idle: 0,
      running: 0,
      stopped: 0,
      failed: 0
    };
    transmitters.forEach((tx) => {
      const status = tx.getStatus();
      if (status === TxStatus.IDLE) {
        counts.idle++;
      } else if (status === TxStatus.RUNNING) {
        counts.running++;
      } else if (status === TxStatus.STOPPED) {
        counts.stopped++;
      } else if (status === TxStatus.FAILED) {
        counts.failed++;
      }
    });

    // Unhealthy when at least one transmitter has failed. Zero transmitters or
    // transmitters that are only idle/running/stopped are considered healthy.
    const healthy = counts.failed === 0;

    reply.code(healthy ? 200 : 503).send({
      message: healthy ? 'ok' : 'unhealthy',
      component: 'srt-whip-gateway',
      docs: '/api/docs',
      gui: '/ui',
      transmitters: {
        total: transmitters.length,
        ...counts
      }
    });
  });
  next();
};

export default apiHealthcheck;
