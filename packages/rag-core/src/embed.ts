export type Embedding = number[];

/**
 * 簡易埋め込み計算のスタブ。
 * TODO: sentence-transformers や OpenAI Embeddings のクライアントを利用する。
 */
export async function embedText(text: string): Promise<Embedding> {
  const hash = [...text].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return [hash % 1_000, text.length];
}
