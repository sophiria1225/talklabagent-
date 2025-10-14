import { performance } from "node:perf_hooks";
import { callASR } from "../services/asr.reazonspeech.js";
import { callLLM } from "../services/llm.ollama.js";
import { callTTS } from "../services/tts.voicevox.js";
import { ragAnswer } from "../services/rag.localpdf.js";
import { createMetrics } from "./metrics.js";
import type { ServerConfig } from "../config.js";

export interface AudioFrame {
  pcm: ArrayBuffer;
  sampleRate: number;
  channels: number;
  frameMs: number;
  encoding: string;
}

export interface RagResult {
  answer: string;
  cites: Array<{ title: string; page?: number; note?: string }>;
}

export interface Pipeline {
  asr(frames: AudioFrame[]): Promise<string>;
  llm(text: string): Promise<string>;
  tts(text: string): Promise<ArrayBuffer>;
  rag(query: string): Promise<RagResult>;
}

/**
 * パイプラインの初期化。
 * TODO: config に応じてサービスの差し替えや依存の DI を実装する。
 */
export function buildPipeline(_config: ServerConfig): Pipeline {
  const metrics = createMetrics();

  return {
    async asr(frames: AudioFrame[]): Promise<string> {
      const start = performance.now();
      const result = await callASR(frames);
      metrics.recordLatency("asr", performance.now() - start);
      return result;
    },
    async llm(text: string): Promise<string> {
      const start = performance.now();
      const result = await callLLM(text);
      metrics.recordLatency("llm", performance.now() - start);
      return result;
    },
    async tts(text: string): Promise<ArrayBuffer> {
      const start = performance.now();
      const result = await callTTS(text);
      metrics.recordLatency("tts", performance.now() - start);
      return result;
    },
    async rag(query: string): Promise<RagResult> {
      const start = performance.now();
      const result = await ragAnswer(query);
      metrics.recordLatency("rag", performance.now() - start);
      return result;
    },
  };
}
