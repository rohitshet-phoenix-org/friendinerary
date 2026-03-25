import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { X, Link2, Mail, Trash2, Crown } from "lucide-react";
import toast from "react-hot-toast";

interface InviteModalProps {
  tripId: string;
}

const InviteModal = observer(({ tripId }: InviteModalProps) => {
  const { ui, collaboration } = useStore();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("edit");
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await collaboration.inviteCollaborator(tripId, email.trim(), permission);
      setEmail("");
      toast.success(`Invitation sent to ${email}`);
    } catch {
      toast.error("User not found or already a collaborator");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const link = await collaboration.generateShareLink(tripId, permission);
      await navigator.clipboard.writeText(link.url);
      toast.success("Share link copied!");
    } catch {
      toast.error("Failed to generate link");
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    await collaboration.removeCollaborator(tripId, userId);
    toast.success("Collaborator removed");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invite collaborators</h2>
          <button onClick={() => ui.closeInviteModal()} className="btn-ghost p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Invite by email */}
          <form onSubmit={handleInvite}>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invite by email</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className="input pl-9"
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as "view" | "edit")}
                className="input w-28"
              >
                <option value="edit">Can edit</option>
                <option value="view">Can view</option>
              </select>
            </div>
            <button type="submit" disabled={loading || !email.trim()} className="btn-primary w-full mt-2">
              {loading ? "Inviting..." : "Send invite"}
            </button>
          </form>

          {/* Share link */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Or share a link</p>
            <button onClick={handleCopyLink} className="btn-secondary w-full flex items-center justify-center gap-2">
              <Link2 className="w-4 h-4" />
              Copy invite link
            </button>
          </div>

          {/* Collaborators list */}
          {collaboration.collaborators.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {collaboration.collaborators.length} collaborator{collaboration.collaborators.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {collaboration.collaborators.map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-400 flex items-center justify-center text-white text-sm font-medium">
                      {c.displayName[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{c.email}</p>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {c.permission}
                    </span>
                    <button onClick={() => handleRemove(c.userId, c.displayName)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default InviteModal;
