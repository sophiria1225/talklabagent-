export interface WebCameraConfig {
  width?: number;
  height?: number;
  deviceId?: string;
}

export interface WebCameraHandle {
  start(): Promise<MediaStream>;
  stop(): void;
}

/**
 * ブラウザ用カメラキャプチャのスタブ。
 * TODO: 実際の getUserMedia を呼び出し、エラーハンドリングを実装する。
 */
export function createWebCamera(_config: WebCameraConfig = {}): WebCameraHandle {
  return {
    async start() {
      console.warn("[motion-webcam] getUserMedia not implemented in stub");
      return new MediaStream();
    },
    stop() {
      // no-op
    },
  };
}
