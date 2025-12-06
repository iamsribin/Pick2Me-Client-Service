import { io, Socket } from "socket.io-client";
import { handleLogout, startRefresh } from "../utils/auth";
import axios from "axios";
import { toast } from "../hooks/use-toast";

const API_VERSION = import.meta.env.VITE_API_VERSION ?? "v2";
const API_URL = `${import.meta.env.VITE_API_GATEWAY_URL}/${API_VERSION}`;

type Handler = (...args: any[]) => void;
type EventName = string;

class SocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<EventName, Set<Handler>> = new Map();
  private bc: BroadcastChannel | null = null;
  private isLeader = false;
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;

  private readonly maxAttempts = 5;
  private readonly baseDelay = 500;

  /* ---------- BroadcastChannel handling ---------- */

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
        console.log("release leader");

        this.tryClaimLeader();
        break;

      case "socket-event":
        this.invokeLocalHandlers(data.event, data.payload);
        break;

      case "emit":
        console.log("leader get event to emit=", data.event);
        if (this.isLeader && this.socket?.connected) {
          this.socket.emit(data.event, data.payload);
        }
        break;
    }
  };

  private initBroadcastChannel() {
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

  /* ---------- Leader election ---------- */

  async tryClaimLeader() {
    if (!this.bc) return (this.isLeader = true);
    const jitter = Math.floor(Math.random() * 100);

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
      console.log("Claimed leadership");
      this.bc.postMessage({ type: "iam-leader" });
    } else {
      console.log("leader false");
      this.isLeader = false;
    }
  }

  /* ---------- Public API to register handlers ---------- */

  on(event: EventName, handler: Handler) {
    let set = this.eventHandlers.get(event);
    if (!set) {
      set = new Set();
      this.eventHandlers.set(event, set);
    }
    set.add(handler);

    if (this.isLeader && this.socket && set.size === 1) {
      this.attachSocketListenerForEvent(event);
    }

    return () => {
      set!.delete(handler);
      if (set!.size === 0) {
        this.eventHandlers.delete(event);

        this.detachSocketListenerForEvent(event);
      }
    };
  }

  private invokeLocalHandlers(event: EventName, payload: any) {
    const set = this.eventHandlers.get(event);
    if (!set) return;
    for (const h of set) {
      try {
        h(payload);
      } catch (err) {
        console.error("[SocketService] handler error", err);
      }
    }
  }

  /* ---------- Socket connection lifecycle ---------- */

  connect() {
    if (!this.bc) this.initBroadcastChannel();

    this.tryClaimLeader().then(() => {
      if (!this.isLeader) return;
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

      for (const event of this.eventHandlers.keys()) {
        this.attachSocketListenerForEvent(event);
      }
    });

    this.socket.on("disconnect", (reason: any) => {
      console.warn("[SocketService] disconnected", reason);
      if (this.isLeader) this.scheduleReconnect();
    });

    this.socket.on("connect_error", async (err: any) => {
      const msg = (err && err.message) || "";

      if (msg.includes("token_expired") || msg.includes("no_access_token")) {
        try {
          await startRefresh(async () => {
            await axios.get(`${API_URL}/refresh`, { withCredentials: true });
          });
          if (this.isLeader) this.scheduleReconnect();
        } catch (refreshErr) {
          console.log("logout err socket",refreshErr);
          
          await handleLogout();
        }
        return;
      }

      if(msg.includes("user_blocked")){
        toast({
          title:"User Blocked",
          description:"Your account has been blocked. Please contact support for more information.",
          variant: "error",
        });
        await handleLogout();
        return;
      }

      if (
        msg.includes("no_cookies") ||
        msg.includes("user_blocked") ||
        msg.includes("invalid_token") ||
        msg.includes("auth_error") 
      ) {
        toast({
          title:msg,
          description:
            "Looks like you're not authorized. Try refreshing the page or logging in again.",
          variant: "warning",
        });
        return;
      }


      console.error("[SocketService] connect_error (unknown)", err);
      if (this.isLeader) this.scheduleReconnect();
    });
  }

  //only call if isLeader and socket connected
  private attachSocketListenerForEvent(event: string) {
    if (!this.socket) return;

    const wrapper = (payload: any) => {
      this.invokeLocalHandlers(event, payload);
      if (this.bc)
        this.bc.postMessage({ type: "socket-event", event, payload });
    };

    this.socket.on(event, wrapper);

    (this as any).__socketWrappers =
      (this as any).__socketWrappers || new Map();
    (this as any).__socketWrappers.set(event, wrapper);
  }

  private detachSocketListenerForEvent(event: string) {
    if (!this.socket) return;
    const map: Map<string, Handler> = (this as any).__socketWrappers;
    if (!map) return;
    const wrapper = map.get(event);
    if (wrapper) {
      this.socket.off(event, wrapper);
      map.delete(event);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxAttempts) {
      console.log("Max reconnect attempts reached");
      return;
    }
    if (this.reconnectTimeout !== null) return;

    this.reconnectAttempts += 1;
    const jitter = Math.random() * 200;
    const delay =
      Math.min(30000, this.baseDelay * 2 ** (this.reconnectAttempts - 1)) +
      jitter;

    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.isLeader) this.openSocket();
    }, delay);
  }

  /* ---------- Emit (cross-tab safe) ---------- */

  emit(event: string, payload: any) {
    if (this.socket?.connected && this.isLeader) {
      this.socket.emit(event, payload);
      return;
    }

    if (this.bc) {
      console.log("asking to the leader to emit");
      this.bc.postMessage({ type: "emit", event, payload });
      return;
    }
    toast({
      description:
        "SocketService not connected and no BroadcastChannel to forward emit.",
      variant: "error",
    });
  }

  disconnect() {
    if (this.bc) this.bc.postMessage({ type: "release-leader" });
    this.isLeader = false;
    this.socket?.disconnect();
    this.socket = null;
  }
}

export default new SocketService();
