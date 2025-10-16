import { useAgentStore } from "../state/store.js";
import { selectConnectionState } from "../state/selectors.js";

export function HUDStatus() {
  const connectionState = useAgentStore(selectConnectionState);

  return (
    <header className="hud-status">
      <span className="status-label">Connection:</span>
      <span className={`status-value status-${connectionState}`}>{connectionState}</span>
    </header>
  );
}

