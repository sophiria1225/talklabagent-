import type { AudioFrame } from "./protocol.js";

export function createEmptyAudioFrame(): AudioFrame {
  return {
    pcm: new ArrayBuffer(320),
    sampleRate: 16000,
    channels: 1,
    frameMs: 20,
    encoding: "LINEAR16",
  };
}

export function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  if (typeof btoa === "function") {
    return btoa(binary);
  }

  const nodeBuffer = (globalThis as {
    Buffer?: { from(data: string, encoding: string): { toString(encoding: string): string } };
  }).Buffer;

  if (nodeBuffer) {
    return nodeBuffer.from(binary, "binary").toString("base64");
  }

  return "";
}

// TODO: ArrayBuffer ←→ Float32Array の変換など、音声処理補助を追加する。
