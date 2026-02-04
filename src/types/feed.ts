export interface FeedItem {
  id: string;
  author: {
    name: string;
    avatar: string | null;
    username: string;
  };
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  imageUrl?: string;
}
