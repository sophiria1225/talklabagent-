import type { PoseFrame } from "./types.js";

export interface PoseEstimator {
  estimate(videoFrame: ImageBitmap | HTMLVideoElement): Promise<PoseFrame>;
  dispose(): void;
}

/**
 * ポーズ推定器のスタブ。
 * TODO: MediaPipe / MoveNet を組み込み、GPU と CPU の切り替えを実装する。
 */
export function createPoseEstimator(): PoseEstimator {
  return {
    async estimate(_frame) {
      return { keypoints: [], timestamp: Date.now() };
    },
    dispose() {
      // no-op stub
    },
  };
}
