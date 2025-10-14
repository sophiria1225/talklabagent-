/**
 * @lta/server のエントリーポイント。
 * 重要な箇所は TODO として残し、手早く動作確認できる最小構成を用意する。
 */

import { createHttpServer } from "./http.js";
import { createWsServer } from "./ws.js";
import { loadConfig } from "./config.js";
import { buildPipeline } from "./pipeline/pipeline.js";

const config = loadConfig();

const httpServer = createHttpServer();

httpServer.listen(config.port, () => {
  console.log(`[server] HTTP/WS listening on :${config.port}`);
});

const pipeline = buildPipeline(config);
createWsServer(httpServer, pipeline);

// TODO: pipeline.warmup() を用意し、ASR/LLM/TTS/RAG の初期化を待ってから受信を開始する

// TODO: SIGINT/SIGTERM を捕まえて graceful shutdown を実装し、HTTP/WS/Pipeline を順に閉じる
