import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { PostPageContent } from "@/components/PostPageContent";

type PageProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return {
      title: "Post not found",
    };
  }
  return {
    title: `${post.title} · Lighthouse`,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <PostPageContent post={post} />;
}
