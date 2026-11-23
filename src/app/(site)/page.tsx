// Home page: server wrapper that loads CMS data (cached, tag "posts") for the client UI.
import HomeClient from "./home-client";
import { getLatestPosts } from "@/lib/posts/public";

export default async function HomePage() {
  const latestPosts = await getLatestPosts(4);
  return <HomeClient latestPosts={latestPosts} />;
}
