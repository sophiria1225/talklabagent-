/**
 * 研究室内 PDF を対象にした簡易 RAG。
 * TODO: packages/rag-core の index/search を利用し、根拠付き回答を返す。
 */
export async function ragAnswer(query: string) {
  console.log(`[rag] query (stub): ${query}`);
  return {
    answer: `（RAGスタブ）『${query}』に関するモック回答です。`,
    cites: [{ title: "Example.pdf", page: 1 }],
  };
}
