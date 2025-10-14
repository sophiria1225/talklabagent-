import { readIndex } from "./storage.fs.js";
import { embedText } from "./embed.js";

export interface SearchResult {
  title: string;
  page: number;
  score: number;
}

/**
 * ベクトル検索のスタブ。
 * TODO: 実際の距離計算 (cosine/inner product) と上位フィルタリングを実装する。
 */
export async function search(rootDir: string, query: string): Promise<SearchResult[]> {
  const index = await readIndex(rootDir);
  if (!index) return [];

  const queryEmbedding = await embedText(query);

  return index.map((entry, i) => ({
    title: entry.id,
    page: i + 1,
    score: dot(entry.embedding, queryEmbedding),
  }));
}

function dot(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < length; i++) sum += a[i] * b[i];
  return sum;
}
