"use client";

import { FeedItem } from "@/types/feed";

interface FeedCardProps {
  item: FeedItem;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

export default function FeedCard({ item }: FeedCardProps) {
  return (
    <article className="group rounded-xl border border-edge bg-surface p-6 shadow-lg backdrop-blur-xl transition-transform hover:scale-[1.02]">
      {/* Author Info */}
      <div className="mb-4 flex items-center gap-3">
        {item.author.avatar ? (
          <img
            src={item.author.avatar}
            alt={item.author.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-sm font-medium text-on-surface">
            {item.author.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-on-surface">
            {item.author.name}
          </div>
          <div className="text-xs text-on-surface-dim">
            @{item.author.username}
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="mb-4 text-on-surface">{item.content}</p>

      {/* Image (if present) */}
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt="Post content"
          className="mb-4 w-full rounded-lg object-cover"
          loading="lazy"
        />
      )}

      {/* Footer: Timestamp and Engagement */}
      <div className="flex items-center justify-between border-t border-edge pt-3">
        <span className="text-xs text-on-surface-faint">
          {formatTimestamp(item.timestamp)}
        </span>
        <div className="flex items-center gap-4 text-xs text-on-surface-dim">
          <span className="flex items-center gap-1">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {item.likes}
          </span>
          <span className="flex items-center gap-1">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {item.comments}
          </span>
        </div>
      </div>
    </article>
  );
}
