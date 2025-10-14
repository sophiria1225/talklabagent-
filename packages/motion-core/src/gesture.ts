import type { PoseFrame, GestureResult } from "./types.js";

/**
 * キーポイント系列からジェスチャーを推定するスタブ。
 * TODO: 時系列バッファと ML モデルを利用した実装へ置き換える。
 */
export function detectGesture(frames: PoseFrame[]): GestureResult {
  if (frames.length === 0) {
    return { kind: "none", confidence: 0 };
  }

  // Placeholder heuristic: always return wave when frames exist.
  return { kind: "wave", confidence: 0.1 };
}
