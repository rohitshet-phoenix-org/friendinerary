import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { MapPin, Calendar, ChevronLeft, Camera } from "lucide-react";
import { format } from "date-fns";
import type { TripStory } from "@friendinerary/types";

export default function StoryPage() {
  const { shareSlug } = useParams<{ shareSlug: string }>();
  const [story, setStory] = useState<TripStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!shareSlug) return;
    api
      .get<{ data: TripStory }>(`/stories/public/${shareSlug}`)
      .then(({ data }) => setStory(data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [shareSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950">
        <MapPin className="w-16 h-16 text-gray-200" />
        <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">Story not found</h1>
        <p className="text-gray-400">This story may have been removed or made private.</p>
        <Link to="/" className="btn-primary mt-2">Go home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero */}
      <div className="relative h-72 md:h-96 bg-gradient-to-br from-brand-400 to-purple-500 overflow-hidden">
        {story.coverPhotoUrl && (
          <img
            src={story.coverPhotoUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-medium text-white/70 mb-1 uppercase tracking-wide">Friendinerary Story</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{story.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
              {story.authorName && (
                <span>By {story.authorName}</span>
              )}
              {story.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(story.createdAt), "MMMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {story.summary && (
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-10 italic border-l-4 border-brand-400 pl-4">
            {story.summary}
          </p>
        )}

        {/* Photos grid */}
        {story.photos && story.photos.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Photos</h2>
              <span className="text-sm text-gray-400">({story.photos.length})</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {story.photos.map((photo) => (
                <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="card p-6 text-center mt-10">
          <div className="text-3xl mb-3">✈️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Plan your own adventure</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create collaborative trip itineraries with Friendinerary — free forever.
          </p>
          <Link to="/signup" className="btn-primary">
            Start planning for free
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-4 h-4" />
            Back to Friendinerary
          </Link>
        </div>
      </div>
    </div>
  );
}
