import LetterCloud from "@/components/LetterCloud";
import { getAllPosts } from "@/lib/posts";

export default async function Page() {
  const posts = await getAllPosts();
  return <LetterCloud posts={posts} />;
}
