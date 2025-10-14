import { useEffect } from "react";
import { AvatarCanvas } from "../components/AvatarCanvas.js";
import { HUDStatus } from "../components/HUDStatus.js";
import { ReactionBubble } from "../components/ReactionBubble.js";
import { useAgentStore } from "../state/store.js";
import { createWsClient } from "../services/wsClient.js";

const nodeProcess =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;

const WS_URL = nodeProcess?.env?.LTA_WS_URL ?? "ws://localhost:8787";

export function App() {
  const setConnectionState = useAgentStore((state) => state.setConnectionState);
  const setTranscript = useAgentStore((state) => state.setTranscript);
  const setReaction = useAgentStore((state) => state.setReaction);

  useEffect(() => {
    const client = createWsClient(WS_URL, {
      onOpen: () => setConnectionState("connected"),
      onClose: () => setConnectionState("disconnected"),
      onAsrResult: (text) => setTranscript(text),
      onLlmResult: (text) => setReaction(text),
    });

    return () => {
      client.close();
    };
  }, [setConnectionState, setTranscript, setReaction]);

  return (
    <div className="app">
      <HUDStatus />
      <AvatarCanvas />
      <ReactionBubble />
    </div>
  );
}
