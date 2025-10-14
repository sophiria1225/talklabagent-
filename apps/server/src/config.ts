/**
 * サーバー設定を一元的に読み込むユーティリティ。
 * TODO: zod などでスキーマ検証を加え、型安全な環境変数管理にする。
 */

export interface ServerConfig {
  port: number;
  serviceEndpoints: {
    asr?: string;
    llm?: string;
    tts?: string;
    rag?: string;
  };
}

const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export function loadConfig(): ServerConfig {
  return {
    port: readPort(),
    serviceEndpoints: {
      asr: env.LTA_ASR_ENDPOINT,
      llm: env.LTA_LLM_ENDPOINT,
      tts: env.LTA_TTS_ENDPOINT,
      rag: env.LTA_RAG_ENDPOINT,
    },
  };
}

function readPort(): number {
  const raw = env.LTA_SERVER_PORT ?? env.PORT ?? "8787";
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  console.warn(`[config] Invalid port "${raw}" detected. Falling back to 8787.`);
  return 8787;
}
