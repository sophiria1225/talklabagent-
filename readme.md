# LabTalkAgent TypeScript Monorepo Scaffold (v0.1)

> 研究室向けローカル完結型・学習支援×エンタメ音声対話エージェント（中間発表版）を TypeScript で実装するための、**フォルダ構成・最低限のコード雛形・共有型定義・実装ポイント**を 1 つのドキュメントにまとめたスターター。
>
> このスキャフォールドは *クライアント分散型（現状 / A）* と *サーバ集中型（目標 / B）* の両方を見据えて、**apps/** と **packages/** に分割したモノレポ構成（pnpm / workspaces）を採用します。

---

## 0. Monorepo 構成（pnpm workspaces）

```
labtalkagent/
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json               # (任意) タスク高速化用。導入しない場合は削除可
├─ tsconfig.base.json
├─ .env.example             # 共通環境変数の雛形（*実運用は .env.* に分割）
├─ README.md
│
├─ apps/
│  ├─ server/               # Node/Express + ws。ASR/LLM/TTS/RAG を編成するオーケストラ
│  │  ├─ src/
│  │  │  ├─ index.ts
│  │  │  ├─ http.ts
│  │  │  ├─ ws.ts
│  │  │  ├─ pipeline/
│  │  │  │  ├─ pipeline.ts         # VAD→ASR→LLM→TTS を抽象化
│  │  │  │  ├─ metrics.ts          # レイテンシ等の計測
│  │  │  ├─ services/
│  │  │  │  ├─ asr.reazonspeech.ts # ReazonSpeech/k2 へのアダプタ（スタブ）
│  │  │  │  ├─ llm.ollama.ts       # Ollama + gemma3 へのアダプタ（スタブ）
│  │  │  │  ├─ tts.voicevox.ts     # VOICEVOX へのアダプタ（スタブ）
│  │  │  │  ├─ rag.localpdf.ts     # 研究室 PDF の RAG（埋め込み/検索/根拠提示）
│  │  │  ├─ config.ts
│  │  │  └─ types.d.ts
│  │  ├─ tsconfig.json
│  │  ├─ package.json
│  │  └─ .env.example
│  │
│  ├─ windows-client/      # Windows 側：マイク入力→VAD→チャンク送信（WebSocket）
│  │  ├─ src/
│  │  │  ├─ index.ts
│  │  │  ├─ audio/capture.ts      # getUserMedia or node-record-lpcm16 等の抽象
│  │  │  ├─ audio/vad.webrtc.ts   # WebRTC VAD ラッパ（WASM 予定）
│  │  │  ├─ transport/ws.ts
│  │  │  ├─ ui/cli.ts             # 最初は CLI（Electron/GUI は将来）
│  │  ├─ tsconfig.json
│  │  ├─ package.json
│  │  └─ .env.example
│  │
│  └─ room-hub/            # 目標構成 B 用：部屋マイク→サーバ集中処理の入力デーモン
│     ├─ src/
│     │  ├─ index.ts
│     │  ├─ audio/roomsrc.ts      # 天井/卓上マイクからの取り込み
│     │  └─ transport/ipc.ts      # サーバ内 IPC / gRPC / Unix socket 等
│     ├─ tsconfig.json
│     ├─ package.json
│     └─ .env.example
│
├─ packages/
│  ├─ shared/               # 共有型定義・メッセージプロトコル
│  │  ├─ src/
│  │  │  ├─ protocol.ts
│  │  │  ├─ constants.ts
│  │  │  └─ utils.ts
│  │  ├─ tsconfig.json
│  │  └─ package.json
│  │
│  ├─ audio-utils/          # PCM 変換・フレーム分割などのユーティリティ
│  │  ├─ src/
│  │  │  ├─ pcm.ts
│  │  │  └─ framing.ts
│  │  ├─ tsconfig.json
│  │  └─ package.json
│  │
│  └─ rag-core/             # 埋め込み・索引・検索のコア（サーバから利用）
│     ├─ src/
│     │  ├─ embed.ts        # （初期は）local embedding or sentence-transformers への橋渡し想定
│     │  ├─ indexer.ts
│     │  ├─ search.ts
│     │  └─ storage.fs.ts   # FS ベースの簡易ストレージ（本番は SQLite/pg も可）
│     ├─ tsconfig.json
│     └─ package.json
│
└─ .vscode/
   ├─ extensions.json
   └─ settings.json
```

> **ねらい**
>
> * features をサービスごとに分離（ASR / LLM / TTS / RAG / VAD / Transport）
> * まずは **Windows クライアント（VAD→WS 送信）** と **Server（ASR→LLM→TTS→出力 & RAG）** を最小実装
> * 将来の **サーバ集中型（B）** では `apps/room-hub` を入口にして、マイク→サーバ直結へ移行

---

## 1. ルート設定ファイル（雛形）

**package.json（root）**

```json
{
  "name": "labtalkagent",
  "private": true,
  "packageManager": "pnpm@9.10.0",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "pnpm -r --filter ./apps/* --filter ./packages/* run build",
    "dev:server": "pnpm --filter @lta/server dev",
    "dev:win": "pnpm --filter @lta/windows-client dev",
    "dev:room": "pnpm --filter @lta/room-hub dev",
    "lint": "pnpm -r eslint .",
    "format": "pnpm -r prettier --write ."
  }
}
```

**pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": ["node"],
    "outDir": "dist",
    "baseUrl": "."
  }
}
```

**.env.example（root）**

```
# 共通
LTA_ENV=dev
LTA_WS_URL=ws://localhost:8787

# Server 側
ASR_ENDPOINT=http://localhost:7001
OLLAMA_ENDPOINT=http://localhost:11434
VOICEVOX_ENDPOINT=http://localhost:50021
RAG_DATA_DIR=./data/pdf
EMBED_MODEL=local-minilm

# Windows Client 側
MIC_DEVICE_INDEX=default
VAD_MODE=3
FRAME_MS=20
```

---

## 2. packages/shared: メッセージ・型定義

**packages/shared/src/protocol.ts**

```ts
export type AudioEncoding = "LINEAR16" | "FLOAT32";
export interface AudioFrame {
  /** PCM データ（16bit LE） */
  pcm: ArrayBuffer;
  /** サンプリングレート（例: 16000） */
  sampleRate: number;
  /** チャンネル数（1=mono） */
  channels: number;
  /** 1 フレームのミリ秒幅（例: 20ms） */
  frameMs: number;
  encoding: AudioEncoding;
}

export type ClientHello = {
  type: "hello";
  client: "windows" | "room-hub";
  version: string;
};

export type VadEvent = {
  type: "vad";
  event: "start" | "end" | "frame";
  frame?: AudioFrame; // event=="frame" のときのみ
  ts: number;
};

export type AsrRequest = { type: "asr_request"; audio: AudioFrame[]; lang?: "ja-JP" | "en-US" };
export type AsrResult  = { type: "asr_result"; text: string; confidence?: number };

export type LlmRequest = { type: "llm_request"; text: string; context?: any };
export type LlmResult  = { type: "llm_result"; text: string };

export type TtsRequest = { type: "tts_request"; text: string; speaker?: number };
export type TtsResult  = { type: "tts_result"; wav: ArrayBuffer };

export type RagQuery   = { type: "rag_query"; query: string };
export type RagResult  = { type: "rag_result"; answer: string; cites: Array<{title:string; page:number}> };

export type ServerMessage = AsrResult | LlmResult | TtsResult | RagResult | { type: "error"; message: string };
export type ClientMessage = ClientHello | VadEvent | AsrRequest | LlmRequest | TtsRequest | RagQuery;
```

---

## 3. apps/server: 最小実装（HTTP + WS + パイプライン）

**apps/server/package.json**

```json
{
  "name": "@lta/server",
  "type": "module",
  "version": "0.1.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc -p .",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "ws": "^8.18.0",
    "express": "^4.19.2",
    "undici": "^6.19.6"
  },
  "devDependencies": {
    "tsx": "^4.19.1",
    "typescript": "^5.6.3"
  }
}
```

**apps/server/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src"]
}
```

**apps/server/src/index.ts**

```ts
import { createHttpServer } from "./http.js";
import { createWsServer } from "./ws.js";

const http = createHttpServer();
const server = http.listen(8787, () => {
  console.log("[server] HTTP/WS listening on :8787");
});
createWsServer(server);
```

**apps/server/src/http.ts**

```ts
import express from "express";

export function createHttpServer() {
  const app = express();
  app.get("/healthz", (_req, res) => res.json({ ok: true }));
  return app;
}
```

**apps/server/src/ws.ts**

```ts
import { WebSocketServer } from "ws";
import type { Server } from "http";
import type { ClientMessage, ServerMessage, AudioFrame } from "@lta/shared/src/protocol";
import { buildPipeline } from "./pipeline/pipeline.js";

export function createWsServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws) => {
    console.log("[ws] client connected");
    const pipeline = buildPipeline();
    const frames: AudioFrame[] = [];

    ws.on("message", async (raw) => {
      const msg: ClientMessage = JSON.parse(raw.toString());
      switch (msg.type) {
        case "hello":
          console.log(`[ws] hello from ${msg.client} v${msg.version}`);
          break;
        case "vad":
          if (msg.event === "frame" && msg.frame) frames.push(msg.frame);
          if (msg.event === "end" && frames.length) {
            const asrText = await pipeline.asr(frames);
            send({ type: "asr_result", text: asrText });
            const llmText = await pipeline.llm(asrText);
            send({ type: "llm_result", text: llmText });
            const wav = await pipeline.tts(llmText);
            send({ type: "tts_result", wav });
            frames.length = 0; // reset buffer
          }
          break;
        case "rag_query": {
          const r = await pipeline.rag(msg.query);
          send({ type: "rag_result", answer: r.answer, cites: r.cites });
          break;
        }
      }
    });

    function send(msg: ServerMessage) {
      ws.send(JSON.stringify(msg));
    }
  });
}
```

**apps/server/src/pipeline/pipeline.ts**

```ts
import { callASR } from "../services/asr.reazonspeech.js";
import { callLLM } from "../services/llm.ollama.js";
import { callTTS } from "../services/tts.voicevox.js";
import { ragAnswer } from "../services/rag.localpdf.js";
import type { AudioFrame } from "@lta/shared/src/protocol";

export function buildPipeline() {
  return {
    async asr(frames: AudioFrame[]): Promise<string> {
      return callASR(frames);
    },
    async llm(text: string): Promise<string> {
      return callLLM(text);
    },
    async tts(text: string): Promise<ArrayBuffer> {
      return callTTS(text);
    },
    async rag(query: string) {
      return ragAnswer(query);
    },
  };
}
```

**apps/server/src/services/asr.reazonspeech.ts（スタブ）**

```ts
import type { AudioFrame } from "@lta/shared/src/protocol";

export async function callASR(_frames: AudioFrame[]): Promise<string> {
  // TODO: ReazonSpeech/k2 サーバに POST する
  // ここでは最初の動作確認用にモックを返す
  return "（ASRモック）音声をテキスト化しました";
}
```

**apps/server/src/services/llm.ollama.ts（スタブ）**

```ts
import { request } from "undici";

export async function callLLM(text: string): Promise<string> {
  // TODO: OLLAMA_ENDPOINT の /api/generate に POST
  // まずは echo 的にふるまう
  return `（LLMモック）あなたはこう言いました：${text}`;
}
```

**apps/server/src/services/tts.voicevox.ts（スタブ）**

```ts
export async function callTTS(text: string): Promise<ArrayBuffer> {
  // TODO: VOICEVOX の audio_query -> synthesis を実装
  // ここでは空 WAV を返す（実装時に PCM を詰める）
  return new ArrayBuffer(0);
}
```

**apps/server/src/services/rag.localpdf.ts（スタブ）**

```ts
export async function ragAnswer(query: string) {
  // TODO: packages/rag-core を用いて検索・要約・根拠抽出
  return {
    answer: `（RAGモック）『${query}』への回答です`,
    cites: [{ title: "Example.pdf", page: 3 }],
  };
}
```

---

## 4. apps/windows-client: 最小実装（CLI + WS + VAD 受け口）

**apps/windows-client/package.json**

```json
{
  "name": "@lta/windows-client",
  "type": "module",
  "version": "0.1.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc -p .",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "tsx": "^4.19.1",
    "typescript": "^5.6.3"
  }
}
```

**apps/windows-client/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src"]
}
```

**apps/windows-client/src/transport/ws.ts**

```ts
import WebSocket from "ws";
import type { ClientMessage } from "@lta/shared/src/protocol";

export function connect(url: string) {
  const ws = new WebSocket(url);
  ws.on("open", () => console.log("[client] connected"));
  ws.on("message", (buf) => console.log("[server]", buf.toString()));
  return {
    send(msg: ClientMessage) { ws.send(JSON.stringify(msg)); },
  };
}
```

**apps/windows-client/src/index.ts**

```ts
import { connect } from "./transport/ws.js";
import { setTimeout as sleep } from "node:timers/promises";

const WS_URL = process.env.LTA_WS_URL ?? "ws://localhost:8787";
const client = connect(WS_URL);

client.send({ type: "hello", client: "windows", version: "0.1.0" });

// デモ：VAD start -> frame x N -> end を疑似送信
(async () => {
  client.send({ type: "vad", event: "start", ts: Date.now() });
  for (let i = 0; i < 5; i++) {
    client.send({
      type: "vad",
      event: "frame",
      ts: Date.now(),
      frame: {
        pcm: new ArrayBuffer(320), // 例: 20ms @ 16kHz mono LINEAR16
        sampleRate: 16000,
        channels: 1,
        frameMs: 20,
        encoding: "LINEAR16",
      },
    });
    await sleep(20);
  }
  client.send({ type: "vad", event: "end", ts: Date.now() });
})();
```

> **実 VAD / 音声キャプチャ**は `audio/capture.ts` と `audio/vad.webrtc.ts` に実装予定。最初は疑似フレームでサーバ往復を確認 → 後から差し替え。

---

## 5. packages/rag-core（超簡易スタブ）

**packages/rag-core/package.json**

```json
{
  "name": "@lta/rag-core",
  "type": "module",
  "version": "0.1.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc -p ."
  },
  "devDependencies": { "typescript": "^5.6.3" }
}
```

**packages/rag-core/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src"]
}
```

**packages/rag-core/src/indexer.ts**

```ts
export async function indexPdfDir(dir: string) {
  // TODO: PDF -> page text -> embedding -> store
  console.log(`[rag] index: ${dir}`);
}
```

**packages/rag-core/src/search.ts**

```ts
export async function search(query: string) {
  // TODO: embedding(query) -> ANN 検索 -> 上位文書を返す
  return [{ title: "Example.pdf", page: 3, snippet: "..." }];
}
```

---

## 6. セットアップ手順（初心者向け）

1. Node.js を導入（LTS 推奨）
2. **pnpm** を導入（PowerShell なら `iwr https://get.pnpm.io/install.ps1 -UseBasicParsing | iex`）
3. ルートで依存を取得

   ```bash
   pnpm install
   ```
4. サーバを起動

   ```bash
   pnpm dev:server
   # → [server] HTTP/WS listening on :8787
   ```
5. Windows クライアント（疑似 VAD）を起動

   ```bash
   pnpm dev:win
   # → [client] connected
   #    [server] {"type":"asr_result",...} などが表示されれば往復できています
   ```

> **補足**: `pnpm` が見つからない場合は、インストール後に一度シェルを再起動するか、`corepack enable` → `corepack prepare pnpm@latest --activate` を実行。

---

## 7. 実装ロードマップ（A→B）

* **Step 1**: モックで往復動作（この雛形）
* **Step 2**: Windows 側に *実 VAD*（WebRTC VAD / SileroVAD 等）と *音声キャプチャ* を接続
* **Step 3**: Server 側 **ASR** を ReazonSpeech/k2 に差し替え（HTTP/GRPC）
* **Step 4**: **LLM** を Ollama（gemma3:12b）へ切替、会話コンテキスト管理
* **Step 5**: **TTS** を VOICEVOX 接続、話者切替と音量バランス調整
* **Step 6**: **RAG**（研究室 PDF）を最小導入 → 根拠リンク＆ハイライト情報を返却
* **Step 7**: **メトリクス**（レイテンシ、割り込み/Barge-in ハンドリング）
* **Step 8**: **目標 B**（サーバ集中型）用の `apps/room-hub` に部屋マイク入力を集約

---

## 8. この雛形が満たす要件（対応マッピング）

* **所内 PDF 最適化 RAG / 根拠表示** … `packages/rag-core`, `apps/server/src/services/rag.localpdf.ts`
* **VAD→ASR→LLM→TTS の連携 / 低遅延** … `apps/server/src/pipeline/*` による一貫設計
* **学習支援×エンタメ（話者切替/SE/BGM）** … `services/tts.voicevox.ts` を拡張し、SE/BGM ミキシング用の `audio-utils` を追加予定
* **クライアント分散型（A）→サーバ集中型（B）** … `apps/windows-client` と `apps/room-hub` の併存で段階的移行

---

## 9. 次に書くべき実コード（TODO）

* [ ] `windows-client/audio/capture.ts` … 実マイク取り込み（例：node-record-lpcm16 or WASAPI ラッパ）
* [ ] `windows-client/audio/vad.webrtc.ts` … WebRTC VAD WASM のバインディング
* [ ] `server/services/asr.reazonspeech.ts` … ReazonSpeech/k2 API 仕様に合わせる
* [ ] `server/services/llm.ollama.ts` … /api/generate のストリーム処理（部分返答→早口合成）
* [ ] `server/services/tts.voicevox.ts` … audio_query→synthesis のパイプライン
* [ ] `packages/rag-core` … PDF → テキスト抽出 → 埋め込み → ベクトル索引 → 検索

---

### 付録: VS Code 推奨設定

**.vscode/settings.json**

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "files.eol": "\n"
}
```

**.vscode/extensions.json**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```
