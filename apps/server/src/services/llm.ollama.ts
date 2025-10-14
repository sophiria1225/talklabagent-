/**
 * Ollama などの LLM 推論呼び出し。
 * TODO: ストリーミング応答とエラー再試行を実装し、プロンプトを構成する。
 */
export async function callLLM(text: string): Promise<string> {
  console.log(`[llm] prompt (stub): ${text}`);
  return `（LLMスタブ）「${text}」に応答しました。`;
}
