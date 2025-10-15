import LetterCloud from "@/components/LetterCloud";
import { getAllPosts } from "@/lib/posts";


type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function Page({ searchParams }: PageProps) {
  const posts = await getAllPosts();
  const viewParam = searchParams?.view;
  const view = Array.isArray(viewParam) ? viewParam[0] : viewParam;
  const initialBlogView = view === "blog";

  return <LetterCloud posts={posts} initialBlogView={initialBlogView} />;
}
