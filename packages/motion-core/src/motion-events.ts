import type { MotionEvent, PoseFrame } from "./types.js";
import { detectGesture } from "./gesture.js";

export interface MotionEventEmitter {
  pushPose(frame: PoseFrame): void;
  flush(): MotionEvent[];
}

/**
 * ポーズデータをイベントに変換するスタブ。
 * TODO: イベントバスと統合し、バッチ処理や閾値制御を追加する。
 */
export function createMotionEventEmitter(source: "webcam" | "imu" | "other"): MotionEventEmitter {
  const buffer: PoseFrame[] = [];

  return {
    pushPose(frame) {
      buffer.push(frame);
    },
    flush() {
      const gesture = detectGesture(buffer);
      const events: MotionEvent[] = buffer.map((pose) => ({
        type: "motion_event",
        source,
        ts: pose.timestamp,
        pose,
        gesture,
      }));
      buffer.length = 0;
      return events;
    },
  };
}
