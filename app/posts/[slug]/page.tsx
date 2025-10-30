import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { siteConfig } from "@/lib/site-config";
import { PostPageContent } from "@/components/PostPageContent";

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
    };
  }
  return {
    title: `${post.title} · ${siteConfig.name}`,
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
