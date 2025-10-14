type Listener<T> = (payload: T) => void;

class EventBus {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  on<T>(topic: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    const bucket = this.listeners.get(topic)!;
    bucket.add(listener as Listener<unknown>);
    return () => {
      bucket.delete(listener as Listener<unknown>);
      if (bucket.size === 0) this.listeners.delete(topic);
    };
  }

  emit<T>(topic: string, payload: T): void {
    const bucket = this.listeners.get(topic);
    if (!bucket) return;
    for (const listener of bucket) {
      (listener as Listener<T>)(payload);
    }
  }
}

const sharedBus = new EventBus();

export function onEvent<T>(topic: string, listener: Listener<T>): () => void {
  return sharedBus.on(topic, listener);
}

export function emitEvent<T>(topic: string, payload: T): void {
  sharedBus.emit(topic, payload);
}

// TODO: IPC やマルチプロセス対応のためのブロードキャスト機構を追加する。
