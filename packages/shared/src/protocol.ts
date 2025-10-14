export type HelloMessage = {
  type: "hello";
  client: string;
  version: string;
};

export type PingMessage = {
  type: "ping";
};

export type VadStartMessage = {
  type: "vad";
  event: "start";
  ts: number;
};

export type VadFrameMessage = {
  type: "vad";
  event: "frame";
  ts: number;
  frame: AudioFrame;
};

export type VadEndMessage = {
  type: "vad";
  event: "end";
  ts: number;
};

export type RagQueryMessage = {
  type: "rag_query";
  query: string;
};

export type ClientMessage =
  | HelloMessage
  | PingMessage
  | VadStartMessage
  | VadFrameMessage
  | VadEndMessage
  | RagQueryMessage;

export type AsrResultMessage = {
  type: "asr_result";
  text: string;
};

export type LlmResultMessage = {
  type: "llm_result";
  text: string;
};

export type TtsResultMessage = {
  type: "tts_result";
  wavBase64: string;
};

export type RagResultMessage = {
  type: "rag_result";
  answer: string;
  cites: Array<{ title: string; page?: number; note?: string }>;
};

export type ErrorMessage = {
  type: "error";
  message: string;
};

export type ServerMessage =
  | AsrResultMessage
  | LlmResultMessage
  | TtsResultMessage
  | RagResultMessage
  | ErrorMessage
  | { type: "hello_ack"; server: string; version: string }
  | { type: "pong" };

export interface AudioFrame {
  pcm: ArrayBuffer;
  sampleRate: number;
  channels: number;
  frameMs: number;
}

// TODO: プロトコルバージョニングとメッセージスキーマ検証を導入する。
