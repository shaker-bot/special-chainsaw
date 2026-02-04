"use client";

import { FeedItem } from "@/types/feed";
import FeedCard from "./FeedCard";

interface FeedGridProps {
  items: FeedItem[];
}

export default function FeedGrid({ items }: FeedGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-on-surface-dim">No posts to display</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
