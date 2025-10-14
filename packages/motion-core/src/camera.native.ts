export interface NativeCameraOptions {
  device?: string;
  width?: number;
  height?: number;
  fps?: number;
}

export interface NativeCameraHandle {
  open(): Promise<void>;
  close(): Promise<void>;
}

/**
 * ネイティブカメラ制御のスタブ。
 * TODO: Electron/Node-API を利用して DirectShow/Media Foundation へ接続する。
 */
export function createNativeCamera(_options: NativeCameraOptions = {}): NativeCameraHandle {
  return {
    async open() {
      console.warn("[motion-native] open camera (stub)");
    },
    async close() {
      console.warn("[motion-native] close camera (stub)");
    },
  };
}
