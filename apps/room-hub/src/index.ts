import type { RoomAudioMessage } from "@lta/shared/src/protocol.js";
import { createRoomSource } from "./audio/roomsrc.js";
import { createIpcTransport } from "./transport/ipc.js";

const nodeProcess =
  (globalThis as { process?: { env?: Record<string, string | undefined>; exitCode?: number } })
    .process;

const ipcTarget = nodeProcess?.env?.LTA_ROOM_IPC ?? "ws://localhost:8787";

async function main() {
  const transport = createIpcTransport(ipcTarget);
  const roomSource = createRoomSource();

  transport.open();

  roomSource.onChunk((chunk) => {
    const message: RoomAudioMessage = { type: "room_audio", payload: chunk };
    transport.send(message);
  });

  await roomSource.start();

  // TODO: ルームセンサーイベントやモニタリングを統合し、終了条件を設ける。
  setTimeout(async () => {
    await roomSource.stop();
    transport.close();
  }, 2000);
}

void main().catch((error) => {
  console.error("[room-hub] fatal", error);
  if (nodeProcess) {
    nodeProcess.exitCode = 1;
  }
});
