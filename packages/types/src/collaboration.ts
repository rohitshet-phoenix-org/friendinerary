export type CollaboratorPermission = "view" | "edit";

export interface Collaborator {
  id: string;
  tripId: string;
  userId: string;
  displayName: string;
  profilePhoto: string | null;
  email: string;
  permission: CollaboratorPermission;
  joinedAt: string;
}

export interface PlaceVote {
  id: string;
  placeItemId: string;
  userId: string;
  displayName: string;
  vote: "up" | "down";
  createdAt: string;
}

export interface InviteCollaboratorPayload {
  email: string;
  permission: CollaboratorPermission;
}

export interface CollaboratorShareLink {
  token: string;
  permission: CollaboratorPermission;
  expiresAt: string | null;
  url: string;
}
