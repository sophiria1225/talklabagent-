import type { AgentState } from "./store.js";

export const selectConnectionState = (state: AgentState) => state.connectionState;
export const selectTranscript = (state: AgentState) => state.transcript;
export const selectReaction = (state: AgentState) => state.reaction;
