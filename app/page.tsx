import LetterCloud from "@/components/LetterCloud";
import { getAllPosts } from "@/lib/posts";
import type { PostSummary } from "@/lib/posts";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const RECENT_POST_LIMIT = 5;
const HEADLINE_POST_SLUG = process.env.NEXT_PUBLIC_HEADLINE_POST_SLUG;

function selectHeadlinePost(posts: PostSummary[]): PostSummary | null {
  if (posts.length === 0) {
    return null;
  }

  if (HEADLINE_POST_SLUG) {
    const matched = posts.find((post) => post.slug === HEADLINE_POST_SLUG);
    if (matched) {
      return matched;
    }
  }

  return posts[0] ?? null;
}

function selectRecentPosts(posts: PostSummary[], headlinePost: PostSummary | null): PostSummary[] {
  return posts
    .filter((post) => (headlinePost ? post.slug !== headlinePost.slug : true))
    .slice(0, RECENT_POST_LIMIT);
}

export default async function Page({ searchParams }: PageProps) {
  const allPosts = await getAllPosts();
  const headlinePost = selectHeadlinePost(allPosts);
  const recentPosts = selectRecentPosts(allPosts, headlinePost);
  const viewParam = searchParams?.view;
  const view = Array.isArray(viewParam) ? viewParam[0] : viewParam;
  const initialBlogView = view === "blog";

  return (
    <LetterCloud
      headlinePost={headlinePost}
      recentPosts={recentPosts}
      initialBlogView={initialBlogView}
    />
  );
}
