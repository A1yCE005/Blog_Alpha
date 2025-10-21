import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import rehypeSanitize, {
  defaultSchema,
  type Options as RehypeSanitizeOptions,
} from "rehype-sanitize";
import { visit } from "unist-util-visit";
import type { Element, Properties, Root } from "hast";

const KATEX_MATHML_TAGS = [
  "annotation",
  "math",
  "menclose",
  "merror",
  "mfrac",
  "mglyph",
  "mi",
  "mn",
  "mo",
  "mover",
  "mpadded",
  "mphantom",
  "mprescripts",
  "mroot",
  "mrow",
  "ms",
  "mscarries",
  "mscarry",
  "msgroup",
  "msline",
  "mstyle",
  "mspace",
  "msqrt",
  "msub",
  "msubsup",
  "msup",
  "mtable",
  "mtd",
  "mtext",
  "mtr",
  "munder",
  "munderover",
  "none",
  "semantics",
];

const SAFE_TOKEN = /^[a-zA-Z0-9_-]+$/;
const SAFE_STYLE = /^[-:;,%0-9a-zA-Z. ()]*$/;

const elementClassMap: Record<string, string> = {
  h1: "text-4xl font-semibold tracking-tight text-zinc-100 sm:text-5xl",
  h2: "mt-12 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl",
  h3: "mt-8 text-2xl font-semibold tracking-tight text-zinc-100",
  h4: "mt-6 text-xl font-semibold tracking-tight text-zinc-100",
  p: "leading-relaxed text-zinc-300",
  a: "font-medium text-violet-300 underline decoration-violet-300/60 underline-offset-4 transition-colors duration-200 hover:text-violet-200",
  ul: "list-disc space-y-3 pl-6 text-zinc-300",
  ol: "list-decimal space-y-3 pl-6 text-zinc-300",
  li: "leading-relaxed",
  blockquote: "border-l-4 border-violet-400/40 pl-4 text-lg italic text-zinc-200",
  img: "mx-auto my-8 w-full max-w-3xl rounded-2xl border border-white/10 bg-zinc-900/40 object-contain",
  table: "w-full border-collapse text-left text-sm text-zinc-200",
  thead: "bg-white/5",
  tr: "border-b border-white/10",
  th: "px-4 py-3 font-semibold uppercase tracking-[0.2em] text-zinc-100",
  td: "px-4 py-3 text-zinc-300 align-top",
  code: "text-sm",
  pre: "overflow-x-auto rounded-2xl bg-zinc-900/80 px-5 py-5 text-sm",
  hr: "my-12 border-t border-white/10",
};

function appendClassNames(node: Element, className: string) {
  if (!className) {
    return;
  }
  const classesToAdd = className.split(/\s+/).filter(Boolean);
  if (classesToAdd.length === 0) {
    return;
  }
  const properties = (node.properties ??= {} as Properties);
  const existing = properties.className;
  const current = Array.isArray(existing)
    ? existing.slice()
    : typeof existing === "string"
      ? existing.split(/\s+/).filter(Boolean)
      : [];
  const merged = new Set([...current, ...classesToAdd]);
  properties.className = Array.from(merged);
}

function rehypeApplyTailwindClasses() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      const baseClass = elementClassMap[node.tagName];
      if (node.tagName === "code" && parent && parent.type === "element" && parent.tagName !== "pre") {
        appendClassNames(node, "rounded bg-zinc-800/70 px-1.5 py-1 text-sm text-violet-200");
        return;
      }
      if (baseClass) {
        appendClassNames(node, baseClass);
      }
      if (node.tagName === "img") {
        const props = (node.properties ??= {} as Properties);
        if (!("loading" in props)) {
          props.loading = "lazy";
        }
        if (!("decoding" in props)) {
          props.decoding = "async";
        }
      }
    });
  };
}

function rehypeWrapTables() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (!parent || index == null) {
        return;
      }
      if (node.tagName !== "table") {
        return;
      }
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: {
          className: [
            "my-8",
            "overflow-x-auto",
            "rounded-2xl",
            "border",
            "border-white/10",
          ],
        },
        children: [node],
      } satisfies Element;
    });
  };
}

export const markdownSanitizeSchema: RehypeSanitizeOptions = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "mark",
    "sub",
    ...KATEX_MATHML_TAGS,
  ],
  attributes: {
    ...defaultSchema.attributes,
    annotation: [
      ...(defaultSchema.attributes?.annotation ?? []),
      "encoding",
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", SAFE_TOKEN],
    ],
    math: [
      ...(defaultSchema.attributes?.math ?? []),
      "display",
      "xmlns",
    ],
    menclose: [
      ...(defaultSchema.attributes?.menclose ?? []),
      "notation",
    ],
    mstyle: [
      ...(defaultSchema.attributes?.mstyle ?? []),
      "displaystyle",
      "mathcolor",
      "scriptlevel",
    ],
    mtable: [
      ...(defaultSchema.attributes?.mtable ?? []),
      "columnalign",
      "columnspacing",
      "rowspacing",
    ],
    mo: [
      ...(defaultSchema.attributes?.mo ?? []),
      "fence",
      "lspace",
      "rspace",
      "stretchy",
    ],
    path: [
      ...(defaultSchema.attributes?.path ?? []),
      "d",
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ["ariaHidden", "true"],
      ["className", SAFE_TOKEN],
      ["style", SAFE_STYLE],
    ],
    svg: [
      ...(defaultSchema.attributes?.svg ?? []),
      "height",
      "preserveAspectRatio",
      "viewBox",
      "width",
      "xmlns",
    ],
  },
};

export async function compileMarkdownToHtml(source: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex, { strict: false })
    .use(rehypeHighlight, { ignoreMissing: true })
    .use(rehypeSanitize, markdownSanitizeSchema)
    .use(rehypeApplyTailwindClasses)
    .use(rehypeWrapTables)
    .use(rehypeStringify)
    .process(source);

  return String(file);
}
