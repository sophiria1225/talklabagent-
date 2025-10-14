import { useSyncExternalStore } from "react";

export type ConnectionState = "connecting" | "connected" | "disconnected";

export interface AgentState {
  connectionState: ConnectionState;
  transcript: string;
  reaction: string;
  setConnectionState(state: ConnectionState): void;
  setTranscript(text: string): void;
  setReaction(text: string): void;
}

type Listener = () => void;

const baseState = {
  connectionState: "connecting" as ConnectionState,
  transcript: "",
  reaction: "",
};

let state: AgentState = {
  ...baseState,
  setConnectionState(value) {
    mutate({ connectionState: value });
  },
  setTranscript(value) {
    mutate({ transcript: value });
  },
  setReaction(value) {
    mutate({ reaction: value });
  },
};

const listeners = new Set<Listener>();

function mutate(partial: Partial<AgentState>) {
  state = { ...state, ...partial };
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useAgentStore<T>(selector: (state: AgentState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()));
}

// TODO: 状態永続化やデバッグツール連携を追加する（例: Redux DevTools）。
