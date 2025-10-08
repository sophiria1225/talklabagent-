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

---

## 10. 新機能: 画面キャラクター表示 & ユーザーの**動き/モーション**に反応する拡張

> 目的：マイク入力とは独立に、**カメラ/センサーからのモーション**で反応する UI と、**AIキャラクターの画面アニメーション**を追加する。
>
> 方針：モノレポの分離原則を保つため、**UIアプリは apps/**、コア処理は **packages/** に配置。イベントは `packages/shared` のプロトコル拡張でやり取り。

### 10.1 追加ディレクトリ（全体像）

```
apps/
  ├─ character-ui/                 # 画面にAIキャラクターを表示・アニメーション（Web/Electron）
  │  ├─ src/
  │  │  ├─ main.tsx               # Vite/Electronのエントリ（Webのみでも可）
  │  │  ├─ app/App.tsx            # ルート。WS接続・状態管理・レイアウト
  │  │  ├─ components/
  │  │  │  ├─ AvatarCanvas.tsx    # キャラ描画（Lottie/Spine/Canvas/WebGL いずれか）
  │  │  │  ├─ ReactionBubble.tsx  # 吹き出し（LLM応答/エモート）
  │  │  │  └─ HUDStatus.tsx       # FPS/遅延/接続などのメータ
  │  │  ├─ state/
  │  │  │  ├─ store.ts            # Zustand/Recoil等のUI状態
  │  │  │  └─ selectors.ts
  │  │  ├─ services/
  │  │  │  ├─ wsClient.ts         # WSクライアント（@lta/shared のプロトコル準拠）
  │  │  │  └─ animator.ts         # モーション→アニメーション遷移ロジック
  │  │  └─ assets/
  │  │     ├─ animations/         # Lottie JSON / Spine / sprite sheets
  │  │     └─ sounds/              # SE/BGM（必要なら）
  │  ├─ index.html
  │  ├─ tsconfig.json
  │  ├─ package.json
  │  └─ vite.config.ts             # Webビルド用（Electron併用時は electron-vite 等）
  │
packages/
  ├─ motion-core/                  # カメラ/センサー入力→ポーズ/ジェスチャ推定のコア
  │  ├─ src/
  │  │  ├─ camera.web.ts          # WebカメラからVideoFrame取得（Web）
  │  │  ├─ camera.native.ts       # OpenCV/MediaPipe等（ネイティブ/Electron）
  │  │  ├─ pose-estimator.ts      # MediaPipe/MoveNet等の推定器（抽象）
  │  │  ├─ gesture.ts             # ポーズ系列→抽象ジェスチャ（wave, nod, thumbs-up...）
  │  │  ├─ motion-events.ts       # 推定結果→イベント発火（Observer/EventEmitter）
  │  │  └─ types.ts               # Pose, Landmark, Gesture 定義
  │  ├─ tsconfig.json
  │  └─ package.json
  │
  ├─ avatar-engine/               # キャラクターの表情/モーション状態機械＋アニメーション命令
  │  ├─ src/
  │  │  ├─ statechart.ts          # xstate 等で「Idle→Listening→Thinking→Speaking→Emote」
  │  │  ├─ mapper.ts              # Gesture/Event → AnimationClip へのマッピング
  │  │  ├─ emote.ts               # エモート（喜/驚/困/眠）API
  │  │  └─ types.ts               # クリップ名, レイヤ, パラメータ定義
  │  ├─ tsconfig.json
  │  └─ package.json
  │
  └─ event-bus/                   # クライアント間/プロセス間のイベント共通バス
     ├─ src/
     │  ├─ bus.ts                 # mitt/EventEmitter ラッパ & 型付き publish/subscribe
     │  └─ topics.ts              # トピック名の定数化（"motion:*", "avatar:*" など）
     ├─ tsconfig.json
     └─ package.json
```

> 役割分担の意図：
>
> * **UI (apps/character-ui)** は描画と受信イベントに集中。
> * **motion-core** は入力デバイスや推定モデル差替えを吸収。
> * **avatar-engine** は“どのイベントでどの表情/モーションに遷移するか”の知能部分。
> * **event-bus** は将来 Electron/マルチプロセス化した際の拡張点。

### 10.2 プロトコル拡張（packages/shared）

`packages/shared/src/protocol.ts` に **モーション系**と**アバター制御系**の型を追加：

```ts
export type MotionEvent = {
  type: "motion_event";
  source: "webcam" | "imu" | "other";
  ts: number;
  /** 例: 顔/骨格ランドマークの一部 */
  pose?: { keypoints: Array<{ name: string; x: number; y: number; z?: number; score?: number }>; };
  gesture?: { kind: "wave" | "nod" | "shake" | "thumbs_up" | "none"; score?: number };
};

export type AvatarCommand =
  | { type: "avatar_command"; action: "state"; value: "idle" | "listening" | "thinking" | "speaking" }
  | { type: "avatar_command"; action: "emote"; value: "joy" | "surprise" | "confused" | "sleepy" }
  | { type: "avatar_command"; action: "play_clip"; clip: string; layer?: string };

export type ServerMessage =
  | AsrResult | LlmResult | TtsResult | RagResult
  | { type: "error"; message: string }
  | AvatarCommand; // サーバからUIへ表情/状態指示

export type ClientMessage =
  | ClientHello | VadEvent | AsrRequest | LlmRequest | TtsRequest | RagQuery
  | MotionEvent; // クライアント（UI or センサー）からサーバへ
```

### 10.3 server 側の最小対応

`apps/server/src/ws.ts` にモーション受信をハンドルし、必要に応じて **AvatarCommand** をブロードキャスト：

```ts
case "motion_event": {
  // 例: "wave" を検出したら UI にエモート指示
  if (msg.gesture?.kind === "wave" && msg.gesture.score && msg.gesture.score > 0.7) {
    sendAll({ type: "avatar_command", action: "emote", value: "joy" });
  }
  break;
}
```

### 10.4 apps/character-ui の主なファイル詳細

* `components/AvatarCanvas.tsx` … Lottie/Spine/Canvas いずれかのレンダラ。`avatar-engine` から来る **AnimationClip** を再生。
* `services/wsClient.ts` … `ServerMessage` を購読し、`AvatarCommand` に応じて state を更新。
* `services/animator.ts` … UI内部のアニメーション制御（話速/口パク、まばたき、待機モーション）。
* `state/store.ts` … `avatarState`（idle/listening/thinking/speaking）、`currentEmote`、`clipQueue` 等を保持。

### 10.5 motion-core の主なファイル詳細

* `camera.web.ts` … `getUserMedia` で `HTMLVideoElement | VideoFrame` を取得、ワーカに渡す。
* `pose-estimator.ts` … MediaPipe/MoveNet の結果を **Pose** 型に正規化。
* `gesture.ts` … ポーズ系列→"wave"/"nod" などの高レベル **Gesture** に分類。
* `motion-events.ts` … 一定間隔で **MotionEvent** を publish（WS送信 or event-bus）。

### 10.6 avatar-engine の主なファイル詳細

* `statechart.ts` … xstate 等で状態遷移（`idle→listening→thinking→speaking`）。
* `mapper.ts` … `Gesture`/`AvatarCommand`→ `AnimationClip` のマッピングテーブル。
* `emote.ts` … エモート API（UI側からも直接呼べる）。

### 10.7 依存追加（例）

* UI（Web想定）: `react`, `react-dom`, `zustand`, `lottie-web` or `@esotericsoftware/spine-webgl`
* 推定器: `@mediapipe/tasks-vision` or `@tensorflow-models/pose-detection`
* 状態機械（任意）: `xstate`

### 10.8 起動例

* サーバ： `pnpm dev:server`
* UI（Web）：

  ```bash
  pnpm --filter @lta/character-ui dev
  # http://localhost:5173 を開くとキャラ表示。WSで :8787 と接続。
  ```
* モーション送信：UI内で `motion-core` を呼び出し、一定間隔で `MotionEvent` を WS 送信。

### 10.9 将来拡張

* **視線/表情（FaceMesh/Emotion）** を加え、注視検出で "listening" 遷移を強化。
* **手指キーポイント** によるリッチジェスチャ（OK/ピース/指差し）。
* **センサー融合**：IMU（M5Stack 等）→ `source:"imu"` で `MotionEvent` 発火。
* **音声なし対話**：ジェスチャのみでメニュー操作・RAGクエリ発火（例：手を上げて「質問モード」）。

---

## 11. README 追記用テンプレート（画面キャラクター表示 & モーション反応機能）

> この節は **README.md にそのまま貼り付け** できるよう、構成・ファイル一覧・最小コード・起動方法までを1箇所にまとめています。

### 11.1 ディレクトリ構成（追加分）

```
apps/
  character-ui/                 # 画面にAIキャラクターを表示・アニメーション（Web/Electron）
    src/
      main.tsx                 # Vite/Electronのエントリ（Webのみでも可）
      app/App.tsx              # ルート。WS接続・状態管理・レイアウト
      components/
        AvatarCanvas.tsx       # キャラ描画（Lottie/Spine/Canvas/WebGL いずれか）
        ReactionBubble.tsx     # 吹き出し（LLM応答/エモート）
        HUDStatus.tsx          # FPS/遅延/接続などのメータ
      state/
        store.ts               # Zustand/Recoil等のUI状態
        selectors.ts
      services/
        wsClient.ts            # WSクライアント（@lta/shared のプロトコル準拠）
        animator.ts            # モーション→アニメーション遷移ロジック
      assets/
        animations/            # Lottie JSON / Spine / sprite sheets
        sounds/                # SE/BGM（必要なら）
    index.html
    tsconfig.json
    package.json
    vite.config.ts             # Webビルド用（Electron併用時は electron-vite 等）

packages/
  motion-core/                  # カメラ/センサー入力→ポーズ/ジェスチャ推定のコア
    src/
      camera.web.ts            # WebカメラからVideoFrame取得（Web）
      camera.native.ts         # OpenCV/MediaPipe等（ネイティブ/Electron）
      pose-estimator.ts        # MediaPipe/MoveNet等の推定器（抽象）
      gesture.ts               # ポーズ系列→抽象ジェスチャ（wave, nod, thumbs-up...）
      motion-events.ts         # 推定結果→イベント発火（Observer/EventEmitter）
      types.ts                 # Pose, Landmark, Gesture 定義
    tsconfig.json
    package.json

  avatar-engine/               # キャラクターの表情/モーション状態機械＋アニメーション命令
    src/
      statechart.ts            # xstate 等で「Idle→Listening→Thinking→Speaking→Emote」
      mapper.ts                # Gesture/Event → AnimationClip へのマッピング
      emote.ts                 # エモート（喜/驚/困/眠）API
      types.ts                 # クリップ名, レイヤ, パラメータ定義
    tsconfig.json
    package.json

  event-bus/                   # クライアント間/プロセス間のイベント共通バス
    src/
      bus.ts                   # mitt/EventEmitter ラッパ & 型付き publish/subscribe
      topics.ts                # トピック名の定数化（"motion:*", "avatar:*" など）
    tsconfig.json
    package.json
```

### 11.2 役割の要約

* **apps/character-ui**: 描画/UI。WSでサーバと接続し、`AvatarCommand` を受けて表情/モーション変更。
* **packages/motion-core**: カメラ/IMU等の入力→ポーズ推定→ジェスチャ認識→`MotionEvent` 発火。
* **packages/avatar-engine**: 状態機械とアニメーションマッピングの知能層。
* **packages/event-bus**: 型付きイベント配信（将来のElectron/マルチプロセス化を見据える）。

### 11.3 共有プロトコルの拡張（`packages/shared/src/protocol.ts`）

```ts
export type MotionEvent = {
  type: "motion_event";
  source: "webcam" | "imu" | "other";
  ts: number;
  pose?: { keypoints: Array<{ name: string; x: number; y: number; z?: number; score?: number }>; };
  gesture?: { kind: "wave" | "nod" | "shake" | "thumbs_up" | "none"; score?: number };
};

export type AvatarCommand =
  | { type: "avatar_command"; action: "state"; value: "idle" | "listening" | "thinking" | "speaking" }
  | { type: "avatar_command"; action: "emote"; value: "joy" | "surprise" | "confused" | "sleepy" }
  | { type: "avatar_command"; action: "play_clip"; clip: string; layer?: string };

export type ServerMessage =
  | AsrResult | LlmResult | TtsResult | RagResult
  | { type: "error"; message: string }
  | AvatarCommand; // サーバ→UI：表情/状態指示

export type ClientMessage =
  | ClientHello | VadEvent | AsrRequest | LlmRequest | TtsRequest | RagQuery
  | MotionEvent; // UI/センサー→サーバ：モーション報告
```

### 11.4 サーバ側の最小対応（`apps/server/src/ws.ts`）

```ts
case "motion_event": {
  // 例: wave を高信頼で検出したら喜びエモートをUIに指示
  if (msg.gesture?.kind === "wave" && (msg.gesture.score ?? 0) > 0.7) {
    sendAll({ type: "avatar_command", action: "emote", value: "joy" });
  }
  break;
}
```

> 実際には `sendAll` で UI セッションにだけ送る、セッション識別の導入などを検討してください。

### 11.5 `apps/character-ui` の主な実装ポイント

* `services/wsClient.ts`: WS 接続、`ServerMessage` 受信、`AvatarCommand` に応じて UI 状態を更新。
* `components/AvatarCanvas.tsx`: Lottie/Spine/Canvas/WebGL で `AnimationClip` を再生。口パク/まばたき/待機モーション等を `animator.ts` から制御。
* `state/store.ts`: `avatarState`（idle/listening/thinking/speaking）、`currentEmote`、`clipQueue` を保持。

### 11.6 `packages/motion-core` の主な実装ポイント

* `camera.web.ts`: `getUserMedia` で `VideoFrame` 取得、WebWorker に送出。
* `pose-estimator.ts`: MediaPipe/MoveNet等の出力を共通 `Pose` 型に正規化。
* `gesture.ts`: キーポイント系列→`wave`/`nod`/`thumbs_up` などへ分類。
* `motion-events.ts`: 一定周期で `MotionEvent` を publish（WS送信 or event-bus）。

### 11.7 依存関係の例

* UI: `react`, `react-dom`, `zustand`, `lottie-web` または `@esotericsoftware/spine-webgl`
* 推定器: `@mediapipe/tasks-vision` または `@tensorflow-models/pose-detection`
* 状態機械（任意）: `xstate`

### 11.8 セットアップ & 起動

```bash
# 依存取得
pnpm install

# サーバ起動（:8787）
pnpm dev:server

# キャラクターUIを起動（Web想定）
pnpm --filter @lta/character-ui dev
# → http://localhost:5173 を開く
```

### 11.9 将来拡張のヒント

* 視線/表情（FaceMesh/Emotion）で注視検出→`listening` 遷移。
* 手指キーポイントでリッチジェスチャ（OK/ピース/指差し）。
* IMU（M5Stack 等）と融合：`source:"imu"` で `MotionEvent` を送信。
* **音声なし対話**：ジェスチャのみでメニュー操作・RAGクエリ発火（例：手を上げて「質問モード」）。
