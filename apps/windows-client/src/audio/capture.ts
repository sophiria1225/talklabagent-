export interface AudioChunk {
  pcm: ArrayBuffer;
  sampleRate: number;
  channels: number;
  frameMs: number;
}

export interface CaptureController {
  start(): Promise<void>;
  stop(): Promise<void>;
  onChunk(callback: (chunk: AudioChunk) => void): void;
}

/**
 * Windows ネイティブキャプチャのスタブ実装。
 * TODO: node-record-lpcm16 や WASAPI バインディングで実装を置き換える。
 */
export function createCapture(): CaptureController {
  let listener: ((chunk: AudioChunk) => void) | undefined;
  let running = false;

  return {
    async start() {
      running = true;
      console.log("[capture] start (stub)");
      if (listener) emitSilenceFrame(listener);
    },
    async stop() {
      running = false;
      console.log("[capture] stop (stub)");
    },
    onChunk(callback) {
      listener = callback;
      if (running && listener) {
        emitSilenceFrame(listener);
      }
    },
  };
}

function emitSilenceFrame(listener: (chunk: AudioChunk) => void) {
  const frame = new ArrayBuffer(320);
  listener({ pcm: frame, sampleRate: 16000, channels: 1, frameMs: 20 });
}
