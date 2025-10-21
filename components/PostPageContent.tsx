import type { PostContent } from "@/lib/posts";

import { PostPageShell } from "./PostPageShell";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

type PostPageContentProps = {
  post: PostContent;
  backHref?: string;
};

export function PostPageContent({ post, backHref = "/?view=blog" }: PostPageContentProps) {
  const formattedDate = dateFormatter.format(new Date(post.date));

  return (
    <PostPageShell slug={post.slug} backHref={backHref}>
      <div className="flex flex-col gap-5">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-300/80">
          {formattedDate}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">{post.title}</h1>
        <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">{post.readingTime}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 px-3 py-1 text-[0.7rem] font-semibold text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <article
        className="mt-12 flex flex-col gap-6 text-base text-zinc-200"
        dangerouslySetInnerHTML={{ __html: post.compiledHtml }}
      />
    </PostPageShell>
  );
}
