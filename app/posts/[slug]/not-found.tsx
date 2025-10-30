import Link from "next/link";

export default function PostNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-20 text-center text-zinc-200">
      <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-300/80">404</p>
      <h1 className="mt-4 text-3xl font-semibold">We lost this story in the storm.</h1>
      <p className="mt-4 max-w-md text-sm text-zinc-400">
        The article you were looking for has drifted out of range. Return to the cloud to browse the latest dispatches.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-zinc-100 transition-colors duration-base ease-standard hover:border-brand-400/60 hover:text-brand-200"
      >
        <span aria-hidden>←</span> Back to home
      </Link>
    </div>
  );
}
