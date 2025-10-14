type Callbacks = {
  onOpen?(): void;
  onClose?(): void;
  onAsrResult?(text: string): void;
  onLlmResult?(text: string): void;
};

/**
 * UI 側 WebSocket クライアント。
 * TODO: @lta/shared の厳密な型とバイナリデータ扱い (TTS) を導入する。
 */
export function createWsClient(url: string, callbacks: Callbacks) {
  const socket = new WebSocket(url);

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ type: "hello", client: "character-ui", version: "0.1.0" }));
    callbacks.onOpen?.();
  });

  socket.addEventListener("close", () => {
    callbacks.onClose?.();
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data as string) as Record<string, unknown>;
      switch (data.type) {
        case "asr_result":
          callbacks.onAsrResult?.(String(data.text ?? ""));
          break;
        case "llm_result":
          callbacks.onLlmResult?.(String(data.text ?? ""));
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("[ui] ws parse error", error);
    }
  });

  return {
    close() {
      socket.close();
    },
  };
}
