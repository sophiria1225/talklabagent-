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
        case "tts_result": {
          const b64 = String(data.wavBase64 ?? "");
          if (b64) {
            const binary = atob(b64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i += 1) {
              bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes.buffer], { type: "audio/wav" });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.addEventListener("ended", () => {
              URL.revokeObjectURL(url);
            });
            void audio.play();
          }
          break;
        }
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
