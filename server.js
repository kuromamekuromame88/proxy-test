const fastify = require('fastify')({ logger: true });
const fastifyWebsocket = require('@fastify/websocket');
const WebSocket = require('ws');

// 終点サーバーのURL（Glitchなど）
const DESTINATION_WS_URL = 'wss://tool-html.glitch.me/ws'; // ← Glitch の WebSocket URL に変更

fastify.register(fastifyWebsocket);

// クライアントとのWebSocket接続受付
fastify.get('/ws', { websocket: true }, (clientConn, req) => {
  fastify.log.info('クライアントと接続しました（Render側）');

  // 終点サーバーにWebSocket接続
  const destinationSocket = new WebSocket(DESTINATION_WS_URL);

  // 終点に接続完了したら、クライアントからのメッセージを中継
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

  // エラー処理
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
    fastify.log.info('中継サーバー起動中...');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
