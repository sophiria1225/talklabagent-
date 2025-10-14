import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

/**
 * HTTP サーバーの最小実装。
 * TODO: Express ベースに差し替え、ルーティングやミドルウェアを整理する。
 */
export function createHttpServer() {
  return createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url === "/healthz") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not_found" }));
  });
}
