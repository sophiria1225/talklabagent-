export type AnimatorState = "idle" | "listening" | "thinking" | "speaking";

export interface AnimatorController {
  setState(state: AnimatorState): void;
  getState(): AnimatorState;
}

/**
 * アニメーション管理の簡易スタブ。
 * TODO: Lottie などのアニメーションエンジンと連携し、逐次更新を行う。
 */
export function createAnimator(): AnimatorController {
  let state: AnimatorState = "idle";

  return {
    setState(next) {
      state = next;
      console.log(`[animator] state -> ${state}`);
    },
    getState() {
      return state;
    },
  };
}
