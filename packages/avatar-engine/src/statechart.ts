import type { AvatarContext, AvatarState, AvatarCommand } from "./types.js";

export interface Statechart {
  dispatch(command: AvatarCommand): void;
  getContext(): AvatarContext;
}

/**
 * アバターの状態遷移を管理する簡易ステートマシン。
 * TODO: xstate などのライブラリへ移行し、複雑な遷移を定義する。
 */
export function createStatechart(): Statechart {
  const context: AvatarContext = {
    state: "idle",
    emote: "neutral",
    clipQueue: [],
  };

  return {
    dispatch(command) {
      switch (command.action) {
        case "state":
          context.state = (command.value as AvatarState) ?? "idle";
          break;
        case "emote":
          context.emote = (command.value as AvatarContext["emote"]) ?? "neutral";
          break;
        case "play_clip":
          if (command.clip) {
            context.clipQueue.push(command.clip);
          }
          break;
        default:
          break;
      }
    },
    getContext() {
      return { ...context, clipQueue: [...context.clipQueue] };
    },
  };
}
