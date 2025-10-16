import type { AudioFrame } from "@lta/shared/src/protocol.js";

export type RoomChunk = AudioFrame;

export interface RoomSource {
  start(): Promise<void>;
  stop(): Promise<void>;
  onChunk(callback: (chunk: RoomChunk) => void): void;
}

/**
 * 部屋マイク用キャプチャのスタブ実装。
 * TODO: SoX や PortAudio を利用して実際のマイク入力を取得する。
 */
export function createRoomSource(): RoomSource {
  let listener: ((chunk: RoomChunk) => void) | undefined;
  let running = false;

  return {
    async start() {
      running = true;
      console.log("[room-source] start (stub)");
      if (listener) emitSilence(listener);
    },
    async stop() {
      running = false;
      console.log("[room-source] stop (stub)");
    },
    onChunk(callback) {
      listener = callback;
      if (running && listener) emitSilence(listener);
    },
  };
}

function emitSilence(listener: (chunk: RoomChunk) => void) {
  listener({
    pcm: new ArrayBuffer(320),
    sampleRate: 16000,
    channels: 1,
    frameMs: 20,
    encoding: "LINEAR16",
  });
}
