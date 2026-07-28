export interface Subscriber {
  unsubscribe(): void;
}

export interface EventListener {
  id: string;
  callback: EventCallback,
}
export type EventCallback = (...args: any[]) => void;

export class EventHandler<T = string> {
  _listeners = new Map<T, EventListener[]>();

  addEventListener(event: T, id: string, callback: EventCallback, removeIfExists: boolean = false): Subscriber {
    let listeners = this._listeners.get(event);
    if (!listeners) {
      listeners = [];
      this._listeners.set(event, listeners);
    }

    if (removeIfExists) {
      this.removeEventListener(event, id);
    }

    const existing = listeners.find(l => l.id === id);
    if (!existing) {
      listeners.push({
        id,
        callback,
      });
    }

    return {
      unsubscribe: () => this.removeEventListener(event, id)
    };
  }

  removeEventListener(event: T, id: string): boolean {
    const listeners = this._listeners.get(event);
    if (!listeners) {
      return false;
    }

    const index = listeners.findIndex(l => l.id === id);
    if (index !== -1) {
      listeners.splice(index, 1);
      return true;
    }

    return false;
  }

  dispatchEvent(event: T, ...args: any[]): void {
    const listeners = this._listeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener.callback(...args);
      }
    }
  }
}