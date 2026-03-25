import { makeAutoObservable, runInAction } from "mobx";
import { io as connectSocket, type Socket } from "socket.io-client";
import type { Collaborator, ActiveUser } from "@friendinerary/types";
import { api } from "../lib/api";
import type { RootStore } from "./RootStore";

export class CollaborationStore {
  collaborators: Collaborator[] = [];
  activeUsers: ActiveUser[] = [];
  socket: Socket | null = null;
  connectedTripId: string | null = null;

  constructor(private root: RootStore) {
    makeAutoObservable(this);
  }

  connectToTrip(tripId: string) {
    if (this.connectedTripId === tripId && this.socket?.connected) return;

    const token = this.root.auth.accessToken;
    if (!token) return;

    if (this.socket) this.socket.disconnect();

    this.socket = connectSocket(import.meta.env["VITE_API_URL"] as string ?? "http://localhost:4000", {
      auth: { token },
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      this.socket?.emit("join_trip", { tripId });
      runInAction(() => (this.connectedTripId = tripId));
    });

    this.socket.on("active_users", (users: ActiveUser[]) => {
      runInAction(() => (this.activeUsers = users));
    });

    this.socket.on("user_joined", (user: ActiveUser) => {
      runInAction(() => {
        if (!this.activeUsers.find((u) => u.userId === user.userId)) {
          this.activeUsers.push(user);
        }
      });
    });

    this.socket.on("user_left", ({ userId }: { userId: string }) => {
      runInAction(() => {
        this.activeUsers = this.activeUsers.filter((u) => u.userId !== userId);
      });
    });

    // Forward all trip mutation events to TripStore
    const forwardEvents = [
      "section_created", "section_updated", "section_deleted", "sections_reordered",
      "place_item_added", "place_item_updated", "place_item_deleted", "place_items_reordered",
      "trip_updated", "vote_cast",
    ];

    for (const event of forwardEvents) {
      this.socket.on(event, (data: unknown) => {
        this.root.trips.applySocketEvent(event, data);
      });
    }

    this.socket.on("expense_added", (data: unknown) => {
      this.root.budget.expenses.push(data as never);
    });

    this.socket.on("disconnect", () => {
      runInAction(() => (this.connectedTripId = null));
    });
  }

  disconnectFromTrip() {
    if (this.socket) {
      this.socket.emit("leave_trip", { tripId: this.connectedTripId });
      this.socket.disconnect();
      this.socket = null;
    }
    runInAction(() => {
      this.connectedTripId = null;
      this.activeUsers = [];
    });
  }

  async loadCollaborators(tripId: string) {
    const { data } = await api.get<{ data: Collaborator[] }>(`/trips/${tripId}/collaborators`);
    runInAction(() => (this.collaborators = data.data));
  }

  async inviteCollaborator(tripId: string, email: string, permission: "view" | "edit") {
    const { data } = await api.post<{ data: Collaborator }>(`/trips/${tripId}/collaborators`, {
      email,
      permission,
    });
    runInAction(() => this.collaborators.push(data.data));
    return data.data;
  }

  async removeCollaborator(tripId: string, userId: string) {
    await api.delete(`/trips/${tripId}/collaborators/${userId}`);
    runInAction(() => {
      this.collaborators = this.collaborators.filter((c) => c.userId !== userId);
    });
  }

  async generateShareLink(tripId: string, permission: "view" | "edit") {
    const { data } = await api.post<{ data: { url: string; token: string } }>(
      `/trips/${tripId}/share-link`,
      { permission }
    );
    return data.data;
  }
}
