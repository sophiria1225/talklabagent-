import { WebSocketServer, type RawData, type WebSocket } from "ws";
import type { Server } from "node:http";
import type { Pipeline, AudioFrame } from "./pipeline/pipeline.js";

type ClientMessage =
  | { type: "hello"; client?: string; version?: string }
  | { type: "vad"; event: "start" | "frame" | "end"; ts?: number; frame?: AudioFrame }
  | { type: "rag_query"; query: string }
  | { type: "ping" };

type ServerMessage =
  | { type: "hello_ack"; server: string; version: string }
  | { type: "asr_result"; text: string }
  | { type: "llm_result"; text: string }
  | { type: "tts_result"; wavBase64: string }
  | { type: "rag_result"; answer: string; cites: Array<{ title: string; page?: number; note?: string }> }
  | { type: "pong" }
  | { type: "error"; message: string };

/**
 * WebSocket サーバーを HTTP サーバーに紐付ける。
 * TODO: @lta/shared の正式な型を import し、この暫定型を置き換える。
 */
export function createWsServer(httpServer: Server, pipeline: Pipeline) {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws) => {
    console.log("[ws] client connected");
    const frames: AudioFrame[] = [];

    ws.on("message", async (raw) => {
      const message = parseClientMessage(raw);
      if (!message) {
        send(ws, { type: "error", message: "invalid_payload" });
        return;
      }

      try {
        switch (message.type) {
          case "hello":
            send(ws, { type: "hello_ack", server: "server", version: "0.1.0" });
            break;
          case "ping":
            send(ws, { type: "pong" });
            break;
          case "vad":
            handleVadEvent(message, frames, ws, pipeline);
            break;
          case "rag_query": {
            const rag = await pipeline.rag(message.query);
            send(ws, { type: "rag_result", answer: rag.answer, cites: rag.cites });
            break;
          }
        }
      } catch (error) {
        console.error("[ws] pipeline error", error);
        send(ws, { type: "error", message: "pipeline_failure" });
        frames.length = 0;
      }
    });

    ws.on("close", () => {
      console.log("[ws] client disconnected");
    });
  });

  return wss;
}

function handleVadEvent(
  message: Extract<ClientMessage, { type: "vad" }>,
  frames: AudioFrame[],
  ws: WebSocket,
  pipeline: Pipeline,
) {
  switch (message.event) {
    case "start":
      frames.length = 0;
      break;
    case "frame":
      if (message.frame) {
        // TODO: バイナリ転送（ArrayBuffer）をサポートし、JSON 経由の一時オブジェクトを取り除く。
        frames.push(message.frame);
      }
      break;
    case "end":
      if (frames.length === 0) {
        send(ws, { type: "error", message: "empty_audio_frames" });
        return;
      }
      const capturedFrames = [...frames];
      frames.length = 0;
      void processVadFrames(capturedFrames, ws, pipeline);
      break;
  }
}

async function processVadFrames(frames: AudioFrame[], ws: WebSocket, pipeline: Pipeline) {
  try {
    const asrText = await pipeline.asr(frames);
    send(ws, { type: "asr_result", text: asrText });

    const llmText = await pipeline.llm(asrText);
    send(ws, { type: "llm_result", text: llmText });

    const wav = await pipeline.tts(llmText);
    const wavBase64 = toBase64(wav);
    send(ws, { type: "tts_result", wavBase64 });
  } catch (error) {
    console.error("[ws] pipeline chain error", error);
    send(ws, { type: "error", message: "vad_pipeline_failure" });
  }
}

function parseClientMessage(raw: RawData): ClientMessage | undefined {
  try {
    const decoded = JSON.parse(raw.toString());
    if (decoded && typeof decoded.type === "string") {
      return decoded as ClientMessage;
    }
  } catch (error) {
    console.warn("[ws] failed to parse message", error);
  }
  return undefined;
}

function send(ws: WebSocket, message: ServerMessage) {
  // TODO: JSON シリアライズ時の ArrayBuffer 取り扱いを @lta/shared で統一する。
  ws.send(JSON.stringify(message));
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const encoder = (globalThis as { btoa?: (input: string) => string }).btoa;
  if (typeof encoder === "function") {
    return encoder(binary);
  }

  const nodeBufferFactory = (globalThis as {
    Buffer?: { from(data: string, encoding: string): { toString(encoding: string): string } };
  }).Buffer;
  if (nodeBufferFactory) {
    return nodeBufferFactory.from(binary, "binary").toString("base64");
  }

  console.warn("[ws] No base64 encoder available, returning empty string.");
  return "";
}
