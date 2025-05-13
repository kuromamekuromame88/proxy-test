const path = require('path');
const fs = require('fs').promises;

const fastify = require('fastify')({ logger: true });

// WebSocket サーバーの設定
fastify.register(require('@fastify/websocket'));

// HTMLフォルダのパス
const htmlFolderPath = path.join(__dirname, 'html');

fastify.get('/:page?', async (request, reply) => {
  const page = request.params.page;
  const fileName = page ? `${page}.html` : 'top.html'; // デフォルトは top.html
  const filePath = path.join(htmlFolderPath, fileName);

  try {
    const html = await fs.readFile(filePath, 'utf8');
    reply.type('text/html; charset=utf-8').send(html);
  } catch (err) {
    reply.code(404).type('text/html; charset=utf-8').send('<h1>404 Not Found</h1>');
  }
});

// クライアントとのWebSocket接続受付
fastify.get('/ws', { websocket: true }, (clientConn, req) => {
  fastify.log.info('クライアントと接続しました（中継用サーバー）');
});

// サーバー起動
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    fastify.log.info('WebSocket転送サーバー起動中...');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
