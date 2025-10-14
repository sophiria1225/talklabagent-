export interface Metrics {
  recordLatency(stage: "asr" | "llm" | "tts" | "rag", durationMs: number): void;
}

/**
 * シンプルな標準出力メトリクス。
 * TODO: OpenTelemetry などに接続できるようアダプタを差し替える。
 */
export function createMetrics(): Metrics {
  return {
    recordLatency(stage, durationMs) {
      // 粗い可視化のためのログ。ノイジーになったら削除・差し替えを検討する。
      console.log(`[metrics] ${stage} ${durationMs.toFixed(1)}ms`);
    },
  };
}
