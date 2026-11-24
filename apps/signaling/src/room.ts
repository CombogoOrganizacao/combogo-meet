import {
  Server,
  routePartykitRequest,
  type Connection,
  type WSMessage,
} from "partyserver";

type Env = {
  RoomServer: DurableObjectNamespace;
  API_FINALIZE_URL?: string;
};

type JoinMessage = { type: "join"; name: string };
type LeaveMessage = { type: "leave" };
type SignalMessage = { type: "signal"; to: string; data: unknown };
type EndForAllMessage = { type: "end-for-all" };
type ChatMessage = { type: "chat"; text: string };
type IncomingMessage =
  | JoinMessage
  | LeaveMessage
  | SignalMessage
  | EndForAllMessage
  | ChatMessage;

export class RoomServer extends Server<Env> {
  names = new Map<string, string>();

  onMessage(sender: Connection, message: WSMessage) {
    if (typeof message !== "string") return;

    let msg: IncomingMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    switch (msg.type) {
      case "join": {
        const isNewParticipant = !this.names.has(sender.id);
        this.names.set(sender.id, msg.name);
        const peers = [...this.names.entries()]
          .filter(([id]) => id !== sender.id)
          .map(([id, name]) => ({ id, name }));
        sender.send(JSON.stringify({ type: "peers", peers }));
        if (isNewParticipant) {
          this.broadcastExcept(sender.id, {
            type: "peer-joined",
            id: sender.id,
            name: msg.name,
          });
        }
        break;
      }

      case "signal": {
        const target = this.getConnection(msg.to);
        target?.send(
          JSON.stringify({ type: "signal", from: sender.id, data: msg.data })
        );
        break;
      }

      case "chat": {
        const name = this.names.get(sender.id) ?? "Alguém";
        this.broadcast(
          JSON.stringify({
            type: "chat",
            id: crypto.randomUUID(),
            from: sender.id,
            name,
            text: msg.text,
            ts: Date.now(),
          })
        );
        break;
      }

      case "leave": {
        this.handleDeparture(sender.id);
        break;
      }

      case "end-for-all": {
        this.broadcast(JSON.stringify({ type: "room-closed" }));
        this.notifyApiRoomClosed();
        break;
      }
    }
  }

  onClose(conn: Connection) {
    this.handleDeparture(conn.id);
  }

  private handleDeparture(id: string) {
    if (!this.names.delete(id)) return;
    this.broadcastExcept(id, { type: "peer-left", id });
    if (this.names.size === 0) {
      this.notifyApiRoomClosed();
    }
  }

  private broadcastExcept(exceptId: string, payload: unknown) {
    this.broadcast(JSON.stringify(payload), [exceptId]);
  }

  private async notifyApiRoomClosed() {
    const url = this.env.API_FINALIZE_URL || "";
    if (!url) return;
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: this.name }),
      });
    } catch {
      // best-effort
    }
  }
}

export default {
  async fetch(request: Request, env: Env) {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;