/**
 * VOICEVOX などの TTS 呼び出し。
 * TODO: audio_query -> synthesis の 2 段階 API フローを実装する。
 */
export async function callTTS(text: string): Promise<ArrayBuffer> {
  console.log(`[tts] synthesis request (stub): ${text}`);
  return new ArrayBuffer(0);
}
