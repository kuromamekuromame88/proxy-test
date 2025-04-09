// 必要なモジュールをインポート
const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs').promises;

const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8081 });

wss.on("connection", (ws) => {
  console.log("connection!");
    ws.on("message", (message) => {
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});



// HTMLファイル専用フォルダのベースパスを指定
const htmlFolderPath = path.join(__dirname, 'html'); // html フォルダ

// サーバーのルート設定
fastify.get('/*', async (request, reply) => {
  const requestedPath = request.params['*'] || 'top'; // パスが空なら top.html を返す
  const filePath = path.join(htmlFolderPath, `${requestedPath}.html`); // HTML ファイルのフルパスを構築

  try {
    // HTML ファイルを読み込む
    const htmlContent = await fs.readFile(filePath, 'utf8');
    reply.type('text/html').send(htmlContent); // HTML をレスポンスとして返す
  } catch (error) {
    // ファイルが見つからない場合やエラー時の処理
    reply.code(404).type('text/html').send('<h1>404 Not Found</h1>');
  }
});

fastify.post("/*", function (request, reply) {
  const requestedPath = request.params['*'];
  console.log(requestedPath);
  if(requestedPath === "test"){
    return reply.send("aaa");
  }
  return reply.send(requestedPath);
});


// サーバー起動
fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server running at ${address}`);
});
