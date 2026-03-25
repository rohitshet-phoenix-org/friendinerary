// WebSocket event types for real-time collaboration

export type SocketEvent =
  // Connection
  | "join_trip"
  | "leave_trip"
  | "user_joined"
  | "user_left"
  // Sections
  | "section_created"
  | "section_updated"
  | "section_deleted"
  | "sections_reordered"
  // Place Items
  | "place_item_added"
  | "place_item_updated"
  | "place_item_deleted"
  | "place_items_reordered"
  // Trip
  | "trip_updated"
  // Expenses
  | "expense_added"
  | "expense_updated"
  | "expense_deleted"
  // Reservations
  | "reservation_added"
  | "reservation_updated"
  | "reservation_deleted"
  // Votes
  | "vote_cast"
  // Cursor (presence)
  | "cursor_moved"
  | "user_typing";

export interface SocketPayload<T = unknown> {
  tripId: string;
  userId: string;
  displayName: string;
  event: SocketEvent;
  data: T;
  timestamp: string;
}

export interface ActiveUser {
  userId: string;
  displayName: string;
  profilePhoto: string | null;
  connectedAt: string;
}
