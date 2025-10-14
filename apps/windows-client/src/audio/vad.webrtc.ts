import type { AudioChunk } from "./capture.js";

export type VadEvent =
  | { type: "start"; ts: number }
  | { type: "frame"; ts: number; frame: AudioChunk }
  | { type: "end"; ts: number };

export interface VadController {
  process(chunk: AudioChunk): void;
  flush(): VadEvent[];
}

/**
 * WebRTC VAD のスタブ。実際の判定ロジックは未実装。
 * TODO: wasm-webrtcvad などで有声区間検出を実装し、閾値を設定する。
 */
export function createVad(): VadController {
  const events: VadEvent[] = [];
  let active = false;

  return {
    process(chunk) {
      const ts = Date.now();
      if (!active) {
        active = true;
        events.push({ type: "start", ts });
      }
      events.push({ type: "frame", ts, frame: chunk });
    },
    flush() {
      if (active) {
        events.push({ type: "end", ts: Date.now() });
        active = false;
      }
      const copy = [...events];
      events.length = 0;
      return copy;
    },
  };
}
