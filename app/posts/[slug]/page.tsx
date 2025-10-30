import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostPageContent } from "@/components/PostPageContent";
import { siteConfig } from "@/config/site";
import { getAllPosts, getPostBySlug } from "@/lib/posts";

type PageProps = {
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
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
      description: siteConfig.description,
    };
  }
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostPage({ params, searchParams }: PageProps) {
  const { slug } = params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const fromParam =
    typeof searchParams?.from === "string"
      ? searchParams.from
      : Array.isArray(searchParams?.from)
        ? searchParams?.from[0]
        : undefined;
  const archivePageParam =
    typeof searchParams?.archivePage === "string"
      ? searchParams.archivePage
      : Array.isArray(searchParams?.archivePage)
        ? searchParams.archivePage[0]
        : undefined;

  const backHref =
    fromParam === "archive"
      ? archivePageParam
        ? `/archive?page=${encodeURIComponent(archivePageParam)}`
        : "/archive"
      : "/?view=blog";

  return <PostPageContent post={post} backHref={backHref} />;
}
