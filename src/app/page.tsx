import Header from "./components/Header";
import FeedGrid from "./components/FeedGrid";
import { generateMockFeedData } from "@/lib/mockData";

export default async function Home() {
  const feedItems = generateMockFeedData();

  return (
    <div className="min-h-screen pt-20">
      <Header />
      <main className="py-8">
        <FeedGrid items={feedItems} />
      </main>
    </div>
  );
}
