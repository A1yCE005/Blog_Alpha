import LetterCloud from "@/components/LetterCloud";
import { getAllPosts } from "@/lib/posts";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const MAX_HOME_POSTS = 6;

export default async function Page({ searchParams }: PageProps) {
  const posts = (await getAllPosts()).slice(0, MAX_HOME_POSTS);
  const viewParam = searchParams?.view;
  const view = Array.isArray(viewParam) ? viewParam[0] : viewParam;
  const initialBlogView = view === "blog";

  return <LetterCloud posts={posts} initialBlogView={initialBlogView} />;
}
