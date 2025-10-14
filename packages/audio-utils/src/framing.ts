export function frameAudio(
  buffer: Float32Array,
  sampleRate: number,
  frameMs: number,
): Float32Array[] {
  const frameSize = Math.floor((sampleRate * frameMs) / 1000);
  const frames: Float32Array[] = [];
  for (let offset = 0; offset < buffer.length; offset += frameSize) {
    frames.push(buffer.slice(offset, offset + frameSize));
  }
  return frames;
}

export function hammingWindow(length: number): Float32Array {
  const window = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    window[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (length - 1));
  }
  return window;
}

// TODO: オーバーラップ処理や STFT など分析向けの補助関数を追加する。
