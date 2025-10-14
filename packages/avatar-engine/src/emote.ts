import type { AvatarEmote } from "./types.js";

const emoteToClip: Record<AvatarEmote, string> = {
  joy: "emote_joy",
  surprise: "emote_surprise",
  confused: "emote_confused",
  sleepy: "emote_sleepy",
  neutral: "idle_blink",
};

export function resolveEmoteClip(emote: AvatarEmote): string {
  return emoteToClip[emote];
}

// TODO: 表情ブレンドシェイプのパラメータを返し、3D モデルに適用する。
