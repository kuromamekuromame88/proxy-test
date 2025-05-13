const path = require('path');
const fs = require('fs').promises;

const fastify = require('fastify')({ logger: true });
const WebSocket = require('ws');

// 終点サーバーのWebSocket URL（Glitchサーバー）
const DESTINATION_WS_URL = 'wss://your-glitch-project.glitch.me/ws'; // 実際のURLに変更

// WebSocket サーバーの設定
fastify.register(require('@fastify/websocket'));

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

  // 終点サーバーにWebSocket接続
  const destinationSocket = new WebSocket(DESTINATION_WS_URL);

  // 終点サーバーへの接続が確立したら、メッセージ転送を開始
  destinationSocket.on('open', () => {
    fastify.log.info('終点サーバーへ接続成功');

    // クライアント → 終点
    clientConn.socket.on('message', (msg) => {
      fastify.log.info('クライアント → 終点:', msg.toString());
      destinationSocket.send(msg.toString());
    });

    // 終点 → クライアント
    destinationSocket.on('message', (msg) => {
      fastify.log.info('終点 → クライアント:', msg.toString());
      clientConn.socket.send(msg.toString());
    });
  });

  // 終点との接続エラー
  destinationSocket.on('error', (err) => {
    fastify.log.error('終点との接続エラー:', err);
    if (clientConn.socket && typeof clientConn.socket.close === 'function') {
      clientConn.socket.close();
    }
  });

  // クライアント接続が閉じられたとき
  clientConn.socket.on('close', () => {
    fastify.log.info('クライアント接続が閉じられました');
    if (destinationSocket.readyState === WebSocket.OPEN) {
      destinationSocket.close();
    }
  });

  // 終点接続が閉じられたとき
  destinationSocket.on('close', () => {
    fastify.log.info('終点接続が閉じられました');
    if (clientConn.socket && typeof clientConn.socket.close === 'function') {
      clientConn.socket.close();
    }
  });
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
