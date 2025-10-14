export type AvatarState = "idle" | "listening" | "thinking" | "speaking";

export type AvatarEmote = "joy" | "surprise" | "confused" | "sleepy" | "neutral";

export interface AvatarCommand {
  type: "avatar_command";
  action: "state" | "emote" | "play_clip";
  value?: string;
  clip?: string;
  layer?: string;
}

export interface AvatarContext {
  state: AvatarState;
  emote: AvatarEmote;
  clipQueue: string[];
}

// TODO: 状態遷移ガードや優先度制御を追加する。
