import { createCapture } from "./audio/capture.js";
import { createVad } from "./audio/vad.webrtc.js";
import { connect } from "./transport/ws.js";

const nodeProcess =
  (globalThis as { process?: { env?: Record<string, string | undefined>; exitCode?: number } })
    .process;

const WS_URL = nodeProcess?.env?.LTA_WS_URL ?? "ws://localhost:8787";

async function main() {
  const transport = connect(WS_URL);
  const capture = createCapture();
  const vad = createVad();

  transport.send({ type: "hello", client: "windows", version: "0.1.0" });

  capture.onChunk((chunk) => {
    vad.process(chunk);
    for (const event of vad.flush()) {
      if (event.type === "frame") {
        transport.send({ type: "vad", event: "frame", ts: event.ts, frame: event.frame });
      } else {
        transport.send({ type: "vad", event: event.type, ts: event.ts });
      }
    }
  });

  await capture.start();

  // TODO: 実デバイス入力とイベントループを結び付け、終了シグナルで stop/close する。
  setTimeout(async () => {
    await capture.stop();
    transport.close();
  }, 2000);
}

void main().catch((error) => {
  console.error("[client] fatal", error);
  if (nodeProcess) {
    nodeProcess.exitCode = 1;
  }
});
