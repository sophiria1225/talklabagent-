import { useAgentStore } from "../state/store.js";
import { selectTranscript } from "../state/selectors.js";

export function ReactionBubble() {
  const transcript = useAgentStore(selectTranscript);

  return (
    <aside className="reaction-bubble">
      <h2>Transcript</h2>
      <p>{transcript || "音声入力待ち"}</p>
    </aside>
  );
}
