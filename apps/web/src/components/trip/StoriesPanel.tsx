import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { api } from "../../lib/api";
import { useStore } from "../../stores/RootStore";
import type { TripStory } from "@friendinerary/types";
import {
  BookOpen, Plus, Eye, Share2, Loader2, X, Check, Globe
} from "lucide-react";
import toast from "react-hot-toast";

const StoriesPanel = observer(({ tripId }: { tripId: string }) => {
  const { auth, settings } = useStore();
  const [stories, setStories] = useState<TripStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [creating, setCreating] = useState(false);

  const loadStories = async () => {
    try {
      const { data } = await api.get<{ data: TripStory[] }>(`/trips/${tripId}/stories`);
      setStories(data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, [tripId]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post<{ data: TripStory }>(`/trips/${tripId}/stories`, {
        title,
        content,
        summary: summary || null,
      });
      setStories((prev) => [data.data, ...prev]);
      setTitle("");
      setContent("");
      setSummary("");
      setShowCreate(false);
      toast.success("Story created!");
    } catch {
      toast.error("Failed to create story");
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (story: TripStory) => {
    try {
      const newPublished = story.publishedAt ? null : new Date().toISOString();
      await api.put(`/trips/${tripId}/stories/${story.id}`, { publishedAt: newPublished });
      setStories((prev) =>
        prev.map((s) => s.id === story.id ? { ...s, publishedAt: newPublished } : s)
      );
      toast.success(newPublished ? "Story published!" : "Story unpublished");
    } catch {
      toast.error("Failed to update story");
    }
  };

  const handleCopyShareLink = async (story: TripStory) => {
    const url = `${window.location.origin}/story/${story.shareSlug}`;
    await navigator.clipboard.writeText(url);
    toast.success("Story link copied!");
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trip Stories</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New story
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">New story</h3>
            <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
            <input
              type="text"
              className="input text-sm"
              placeholder="Our Tokyo adventure..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Summary (shown in preview)</label>
            <input
              type="text"
              className="input text-sm"
              placeholder="A short summary of your trip..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Story content</label>
            <textarea
              className="input text-sm resize-none"
              placeholder="Write about your journey..."
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !title.trim()}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              {creating ? "Creating..." : "Create story"}
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Stories list */}
      {stories.length === 0 && !showCreate ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No stories yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create a trip story to share memories with friends and family.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onPublish={() => handlePublish(story)}
              onShare={() => handleCopyShareLink(story)}
              formatDate={settings.formatDate.bind(settings)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

function StoryCard({
  story, onPublish, onShare, formatDate
}: {
  story: TripStory;
  onPublish: () => void;
  onShare: () => void;
  formatDate: (date: Date | string) => string;
}) {
  const isPublished = !!story.publishedAt;

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-purple-400 flex items-center justify-center text-white flex-shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{story.title}</p>
            {isPublished && (
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                <Globe className="w-3 h-3" />
                Public
              </span>
            )}
          </div>
          {story.summary && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{story.summary}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {formatDate(story.createdAt)}
            {story.photos.length > 0 && ` · ${story.photos.length} photos`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={onPublish}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
            isPublished
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          {isPublished ? <Check className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
          {isPublished ? "Published" : "Publish"}
        </button>

        {isPublished && (
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
          >
            <Share2 className="w-3 h-3" />
            Copy link
          </button>
        )}

        {isPublished && (
          <a
            href={`/story/${story.shareSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors ml-auto"
          >
            <Eye className="w-3 h-3" />
            View
          </a>
        )}
      </div>
    </div>
  );
}

export default StoriesPanel;
