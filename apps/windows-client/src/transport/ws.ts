import WebSocket from "ws";

export interface ClientTransport {
  send<T extends object>(message: T): void;
  close(): void;
}

/**
 * WebSocket クライアントを初期化する。
 * TODO: 再接続制御やバックオフ、バイナリ送受信を実装する。
 */
export function connect(url: string): ClientTransport {
  const ws = new WebSocket(url);

  ws.on("open", () => {
    console.log(`[client] connected to ${url}`);
  });

  ws.on("message", (data) => {
    console.log("[client] message", data.toString());
  });

  ws.on("close", () => {
    console.log("[client] disconnected");
  });

  ws.on("error", (error) => {
    console.error("[client] socket error", error);
  });

  return {
    send(message) {
      ws.send(JSON.stringify(message));
    },
    close() {
      ws.close();
    },
  };
}
