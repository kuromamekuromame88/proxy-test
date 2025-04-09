const path = require("path");
const fastify = require("fastify")({ logger: true });
const fastifyWebsocket = require("@fastify/websocket");
const fastifyStatic = require("@fastify/static");

// 静的ファイルの配信設定 (htmlフォルダを公開)
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "html"),
  prefix: "/", // ルートURLでhtmlフォルダのファイルをアクセス可能にする
});

// WebSocketプラグインを登録
fastify.register(fastifyWebsocket);

// `top.html` を表示
fastify.get("/", async (request, reply) => {
  return reply.sendFile("top.html"); // htmlフォルダ内のtop.htmlを配信
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
