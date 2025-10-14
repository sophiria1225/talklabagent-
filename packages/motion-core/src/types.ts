export interface PoseKeypoint {
  name: string;
  x: number;
  y: number;
  z?: number;
  score?: number;
}

export interface PoseFrame {
  keypoints: PoseKeypoint[];
  timestamp: number;
}

export type GestureKind = "wave" | "nod" | "shake" | "thumbs_up" | "none";

export interface GestureResult {
  kind: GestureKind;
  confidence: number;
}

export interface MotionEvent {
  type: "motion_event";
  source: "webcam" | "imu" | "other";
  ts: number;
  pose?: PoseFrame;
  gesture?: GestureResult;
}

// TODO: 骨格スキーマのバージョニングを追加し、MediaPipe との互換性を明確化する。
