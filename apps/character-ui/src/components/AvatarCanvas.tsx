import { useAgentStore } from "../state/store.js";
import { selectReaction } from "../state/selectors.js";

export function AvatarCanvas() {
  const reaction = useAgentStore(selectReaction);

  return (
    <section className="avatar-canvas">
      <div className="avatar-placeholder" aria-label="avatar placeholder">
        🤖
      </div>
      <p className="avatar-reaction">{reaction || "待機中..."}</p>
    </section>
  );
}

// TODO: 実際のアバターアニメーション (Lottie/Spine/WebGL) を統合する。
