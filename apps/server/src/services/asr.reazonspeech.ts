import type { AudioFrame } from "../pipeline/pipeline.js";

/**
 * ReazonSpeech 連携用の ASR 呼び出し。
 * TODO: 実際の API エンドポイントへ PCM バッファを POST する。
 */
export async function callASR(frames: AudioFrame[]): Promise<string> {
  console.log(`[asr] received ${frames.length} frames (stub)`);
  return "（ASRスタブ）音声を文字起こししました。";
}
