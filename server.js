const fastify = require("fastify")({ logger: true });
const fastifyWebsocket = require("@fastify/websocket");
const querystring = require('querystring');

const WebSocket = require("ws");  // 別サーバーへの接続用にwsライブラリを使用

// WebSocket中継先のサーバーURL
const targetWebSocketServerUrl = "wss://tool-html.glitch.me";  // ここを中継先サーバーに変更

// WebSocketプラグインを登録
fastify.register(fastifyWebsocket);

// WebSocket接続時の処理
fastify.get("/ws", { websocket: true }, (connection, req) => {
    console.log("Client connected!");

    // 別のWebSocketサーバーへの接続
    const targetSocket = new WebSocket(targetWebSocketServerUrl);

    targetSocket.on("open", () => {
        console.log("Connected to the target WebSocket server.");

        // クライアントからのメッセージを受信して、ターゲットサーバーに転送
        connection.socket.on("message", (message) => {
            console.log("Received from client:", message.toString());
            targetSocket.send(message);  // 中継先にメッセージを送信
        });

        // 中継先からのメッセージを受信して、クライアントに返す
        targetSocket.on("message", (message) => {
            console.log("Received from target WebSocket server:", message.toString());
            connection.socket.send(message);  // クライアントに返送
        });
    });

    targetSocket.on("error", (err) => {
        console.error("Error connecting to target WebSocket server:", err);
    });

    // WebSocketの接続が閉じられたときの処理
    connection.socket.on("close", () => {
        console.log("Client disconnected.");
        targetSocket.close();  // 中継先サーバーとの接続も閉じる
    });
});

fastify.post('/', async (request, reply) => {
  let body = request.body;

  // FastifyのContent-Typeパーサが application/json を期待するので、
  // x-www-form-urlencoded の場合、自前でparseが必要かも（オプション設定次第）
  if (typeof body === 'string') {
    body = querystring.parse(body);
  }

  if (!body || Object.keys(body).length === 0) {
    console.log("No post data");
    return reply.send(); // 空で終了
  }

  console.log("post:" + body.type);

  if (body.type === "wake") {
    console.log("Woke up in post");
    return reply.send();
  }

  reply.send();
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
