import type { AvatarCommand } from "./types.js";

export interface GestureInput {
  kind: string;
  confidence: number;
}

/**
 * ジェスチャーイベントをアバターコマンドへ変換するスタブ。
 * TODO: 実際のマッピングテーブルや学習済みモデルを適用する。
 */
export function mapGestureToCommand(input: GestureInput): AvatarCommand | undefined {
  if (input.kind === "wave" && input.confidence > 0.7) {
    return { type: "avatar_command", action: "emote", value: "joy" };
  }
  if (input.kind === "nod" && input.confidence > 0.6) {
    return { type: "avatar_command", action: "state", value: "listening" };
  }
  return undefined;
}
