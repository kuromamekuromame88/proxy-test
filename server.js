const WebSocket = require('ws');
const http = require('http');

// Renderの環境変数からポートを取得（ローカルでは 3000 を使う）
const PORT = process.env.PORT || 3000;

// HTTP サーバーを作成（Renderでは必須）
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebSocket Relay Server is running.\n");
});

// WebSocket サーバーを HTTP サーバーにアタッチ
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log(`クライアント接続: ${req.socket.remoteAddress}`);

  ws.on('message', (message) => {
    console.log(`受信: ${message}`);
    // ここで中継処理を行う（例: 中継先に転送）
    ws.send(`Echo: ${message}`);
  });

  ws.on('close', () => {
    console.log("クライアント切断");
  });

  ws.on('error', (err) => {
    console.error("エラー:", err);
  });
});

// サーバー起動
server.listen(PORT, () => {
  console.log(`Render対応 WebSocketサーバー起動: ポート ${PORT}`);
});
