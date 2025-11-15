import { io, Socket } from "socket.io-client";
import type { SocketEvent } from "../types/common";

type EventHandler = (ev: SocketEvent) => void;

class SocketService {
  private socket: Socket | null = null;
  private handlers = new Set<EventHandler>();
  private bc: BroadcastChannel | null = null;
  private isLeader = false;
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;

  private readonly maxAttempts = 5;
  private readonly baseDelay = 500; // ms

  private handleBcMessage = (ev: MessageEvent) => {
    const data = ev.data;
    if (!data || !data.type) return;
    switch (data.type) {
      case "request-leader":
        if (this.isLeader) this.bc!.postMessage({ type: "iam-leader" });
        break;
      case "iam-leader":
        this.isLeader = false;
        if (this.reconnectTimeout) {
          window.clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        break;
      case "release-leader":
        this.tryClaimLeader();
        break;
      case "socket-event":
        if (!this.isLeader && this.handlers)
          this.handlers.forEach((h) => h(data.payload));
        break;
      case "emit":
        if (this.isLeader && this.socket?.connected) {
          this.socket.emit(data.event, data.payload);
        }
        break;
    }
  };

  initBroadcastChannel() {
    try {
      this.bc = new BroadcastChannel("ws-leader");
      this.bc.addEventListener("message", this.handleBcMessage);
      window.addEventListener("beforeunload", () => {
        this.bc?.postMessage({ type: "release-leader" });
      });
    } catch {
      this.bc = null;
    }
  }

  async tryClaimLeader() {
    if (!this.bc) return (this.isLeader = true);
    // random small delay to avoid collision
    const jitter = Math.floor(Math.random() * 100); // 0-100ms
    this.bc.postMessage({ type: "request-leader" });
    let answered = false;
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === "iam-leader") answered = true;
    };
    this.bc.addEventListener("message", onMsg);
    await new Promise((res) => setTimeout(res, 250 + jitter));
    this.bc.removeEventListener("message", onMsg);
    if (!answered) {
      this.isLeader = true;
      this.bc.postMessage({ type: "iam-leader" });
    } else this.isLeader = false;
  }

  registerEventHandler(cb: EventHandler) {
    this.handlers.add(cb);
    return () => this.handlers.delete(cb);
  }

  connect() {
    if (!this.bc) this.initBroadcastChannel();

    this.tryClaimLeader().then(() => {
      if (!this.isLeader) {
        return;
      }
      this.openSocket();
    });
  }

  private openSocket() {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_API_SOCKET_URL!, {
      transports: ["websocket"],
      withCredentials: true,
      reconnection: false,
      upgrade: true,
    });

    this.socket.on("connect", () => {
      if (this.reconnectTimeout) {
        window.clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.reconnectAttempts = 0;

      console.info("[SocketService] connected", this.socket?.id);
      // heartbeat handled by socket.io, but you can implement custom ping
    });

    this.socket.on("disconnect", (reason: any) => {
      console.warn("[SocketService] disconnected", reason);
      if (this.isLeader) this.scheduleReconnect();
    });

    this.socket.on("connect_error", (err: any) => {
      console.error("[SocketService] connect_error", err);
      if (this.isLeader) this.scheduleReconnect();
    });

    this.socket.on("event", (ev: SocketEvent) => {
      if (this.handlers) this.handlers.forEach((h) => h(ev));
      if (this.bc) this.bc.postMessage({ type: "socket-event", payload: ev });
    });
  }

private scheduleReconnect() {
  // already at or above limit?
  if (this.reconnectAttempts >= this.maxAttempts) {
    console.error("[SocketService] max reconnect attempts reached");
    return;
  }

  // if a reconnect is already scheduled, don't schedule another
  if (this.reconnectTimeout !== null) {
    console.debug("[SocketService] reconnect already scheduled, skipping");
    return
}

  // increment attempt count first so log shows the attempt number
  this.reconnectAttempts += 1;
  console.log("[SocketService] scheduling reconnect attempt", this.reconnectAttempts);

  const jitter = Math.random() * 200;
  const delay = Math.min(30000, this.baseDelay * 2 ** (this.reconnectAttempts - 1)) + jitter;

  // store the timer id so we can cancel it if needed
  this.reconnectTimeout = window.setTimeout(() => {
    this.reconnectTimeout = null; // clear the pending flag
    // only try to open the socket if we're still leader
    if (this.isLeader) {
      this.openSocket();
    } else {
      console.debug("[SocketService] not leader at reconnect time — skipping openSocket");
    }
  }, delay);
}


  emit(event: string, payload: any) {
    if (this.socket?.connected && this.isLeader) {
      this.socket.emit(event, payload);
      return;
    }

    if (this.bc) {
      this.bc.postMessage({ type: "emit", event, payload });
      return;
    }
    console.warn(
      "SocketService not connected and no BroadcastChannel to forward emit."
    );
  }

  disconnect() {
    if (this.bc) this.bc.postMessage({ type: "release-leader" });
    this.isLeader = false;
    this.socket?.disconnect();
    this.socket = null;
  }
}

export default new SocketService();
