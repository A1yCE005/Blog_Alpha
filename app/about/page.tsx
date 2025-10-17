import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PostPageContent } from "@/components/PostPageContent";
import { getPostBySlug } from "@/lib/posts";

const ABOUT_POST_SLUG = "about/about";
const PAGE_TITLE = "About · Letter Cloud Blog";

const loadAboutPost = cache(async () => {
  const post = await getPostBySlug(ABOUT_POST_SLUG);
  if (!post) {
    notFound();
  }
  return { ...post, slug: "about" };
});

export async function generateMetadata(): Promise<Metadata> {
  const post = await loadAboutPost();
  return {
    title: PAGE_TITLE,
    description: post.excerpt,
  };
}

export default async function AboutPage() {
  const post = await loadAboutPost();
  return <PostPageContent post={post} />;
}
