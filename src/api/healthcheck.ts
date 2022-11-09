export default (fastify, opts, next) => {
  fastify.get('/', async (request, reply) => {
    reply.send({
      message: 'ok',
      component: 'srt-whip-gateway',
      docs: '/api/docs',
      gui: '/ui'
    });
  });
  next();
}