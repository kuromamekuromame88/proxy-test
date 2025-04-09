const fastify = require("fastify")({ logger: true });
const fastifyWebsocket = require("@fastify/websocket");

// WebSocketプラグインを登録
fastify.register(fastifyWebsocket);

// 通常のHTTPリクエスト（ブラウザアクセス用）
fastify.get("/", async (request, reply) => {
  return { message: "This is a WebSocket + HTTP server using Fastify!" };
});

// WebSocketエンドポイント
fastify.register(async function (fastify) {
  fastify.get("/ws", { websocket: true }, (connection, req) => {
    console.log("Client connected!");

    connection.socket.on("message", (message) => {
      console.log("Received:", message.toString());
      connection.socket.send("Server received: " + message.toString());
    });

    connection.socket.on("close", () => {
      console.log("Client disconnected.");
    });
  });
});

// サーバー起動
const start = async () => {
  try {
    await fastify.listen({ port: 10000, host: "0.0.0.0" });
    console.log("Server running on port 10000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
