import { FeedItem } from "@/types/feed";

const sampleContent = [
  "Just finished an amazing hike this morning! The views were absolutely breathtaking.",
  "Check out this new recipe I tried today - homemade sourdough bread!",
  "Working on an exciting new project. Can't wait to share more details soon!",
  "Beautiful sunset tonight. Sometimes we need to stop and appreciate the little things.",
  "Finally completed my first marathon! It was tough but so worth it.",
  "Trying out a new coffee shop in town. The atmosphere here is incredible!",
  "Reading an amazing book right now. Highly recommend it to everyone!",
  "Just adopted a new puppy! Meet Charlie, the newest member of our family.",
  "Spent the weekend camping in the mountains. Disconnecting was exactly what I needed.",
  "Learning a new programming language. The syntax is quite different but fascinating!",
  "Made some progress on my garden today. The tomatoes are finally starting to grow!",
  "Attended an incredible concert last night. The energy was electric!",
  "Cooked dinner for friends tonight. Nothing beats good food and great company.",
  "Started a new workout routine. Feeling sore but motivated!",
  "Explored a new hiking trail today. Found some hidden waterfalls!",
  "Working from a café today. Change of scenery does wonders for productivity.",
  "Just finished restoring this vintage chair. The before and after is amazing!",
  "Tried photography for the first time. Here's my first attempt at landscape shots.",
  "Volunteered at the local animal shelter today. Such a rewarding experience!",
  "Finally organized my workspace. A clean desk really does make a difference!",
];

const sampleAuthors = [
  { name: "Alex Johnson", username: "alexj" },
  { name: "Sam Chen", username: "samchen" },
  { name: "Jordan Rivera", username: "jrivera" },
  { name: "Taylor Kim", username: "tkim" },
  { name: "Casey Martinez", username: "cmartinez" },
  { name: "Morgan Lee", username: "mlee" },
  { name: "Riley Anderson", username: "randerson" },
  { name: "Avery Thompson", username: "athompson" },
  { name: "Jamie Wilson", username: "jwilson" },
  { name: "Drew Garcia", username: "dgarcia" },
  { name: "Quinn Davis", username: "qdavis" },
  { name: "Skylar Brown", username: "sbrown" },
];

export function generateMockFeedData(count: number = 12): FeedItem[] {
  const items: FeedItem[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const author = sampleAuthors[Math.floor(Math.random() * sampleAuthors.length)];
    const content = sampleContent[Math.floor(Math.random() * sampleContent.length)];

    // Generate timestamps ranging from 1 hour to 7 days ago
    const hoursAgo = Math.floor(Math.random() * 168) + 1; // 1 to 168 hours (7 days)
    const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    // Random engagement metrics
    const likes = Math.floor(Math.random() * 500) + 1;
    const comments = Math.floor(Math.random() * 100);

    items.push({
      id: `feed-item-${i}-${Date.now()}`,
      author: {
        name: author.name,
        username: author.username,
        avatar: null, // No avatars for mock data
      },
      content,
      timestamp,
      likes,
      comments,
      // Randomly add images to some posts (30% chance)
      imageUrl: Math.random() > 0.7 ? undefined : undefined, // Keep undefined for now
    });
  }

  // Sort by timestamp (newest first)
  return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
