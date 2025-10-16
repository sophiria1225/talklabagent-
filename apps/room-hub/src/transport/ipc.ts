import type { ClientMessage } from "@lta/shared/src/protocol.js";
import WebSocket from "ws";

export interface IpcTransport {
  open(): void;
  send(message: ClientMessage): void;
  close(): void;
}

/**
 * サーバー内部で利用する IPC/WebSocket ラッパー。
 * TODO: Unix ソケット / gRPC など環境に応じた実装へ差し替え可能にする。
 */
export function createIpcTransport(target: string): IpcTransport {
  let socket: WebSocket | undefined;

  return {
    open() {
      socket = new WebSocket(target);
      socket.on("open", () => console.log(`[room-hub] ipc connected: ${target}`));
      socket.on("close", () => console.log("[room-hub] ipc closed"));
      socket.on("error", (err) => console.error("[room-hub] ipc error", err));
    },
    send(message) {
      socket?.send(JSON.stringify(message));
    },
    close() {
      socket?.close();
    },
  };
}
