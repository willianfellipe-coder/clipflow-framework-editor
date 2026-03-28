type Listener = (data: unknown) => void;

class WSClient {
  private socket: WebSocket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private _isConnected = false;
  private onConnectionChange: ((connected: boolean) => void) | null = null;

  connect(url: string) {
    if (this.socket) return;

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this._isConnected = true;
        this.reconnectDelay = 1000;
        this.onConnectionChange?.(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const { event: eventName, data } = JSON.parse(event.data);
          const listeners = this.listeners.get(eventName);
          if (listeners) {
            for (const listener of listeners) {
              listener(data);
            }
          }
        } catch {
          // Ignore malformed messages
        }
      };

      this.socket.onclose = () => {
        this._isConnected = false;
        this.socket = null;
        this.onConnectionChange?.(false);
        this.scheduleReconnect(url);
      };

      this.socket.onerror = () => {
        this.socket?.close();
      };
    } catch {
      this.scheduleReconnect(url);
    }
  }

  private scheduleReconnect(url: string) {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(url);
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this._isConnected = false;
  }

  on(event: string, callback: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  setConnectionChangeHandler(handler: (connected: boolean) => void) {
    this.onConnectionChange = handler;
  }

  get isConnected() {
    return this._isConnected;
  }
}

export const wsClient = new WSClient();
