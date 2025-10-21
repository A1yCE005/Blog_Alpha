import type { Element, Parent, Root } from "hast";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema, type Options } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";

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
] as const;

const SAFE_TOKEN = /^[a-zA-Z0-9_-]+$/;
const SAFE_STYLE = /^[-:;,%0-9a-zA-Z. ()]*$/;

const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "mark",
    "sub",
    "sup",
    ...KATEX_MATHML_TAGS,
  ],
  attributes: {
    ...defaultSchema.attributes,
    annotation: [
      ...(defaultSchema.attributes?.annotation ?? []),
      "encoding",
    ],
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      "href",
      "rel",
      "target",
      ["className", SAFE_TOKEN],
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", SAFE_TOKEN],
    ],
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      ["className", SAFE_TOKEN],
    ],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      "src",
      "alt",
      "title",
      "loading",
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
    pre: [
      ...(defaultSchema.attributes?.pre ?? []),
      ["className", SAFE_TOKEN],
      "data-language",
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
    table: [
      ...(defaultSchema.attributes?.table ?? []),
      ["className", SAFE_TOKEN],
    ],
    td: [
      ...(defaultSchema.attributes?.td ?? []),
      ["className", SAFE_TOKEN],
    ],
    th: [
      ...(defaultSchema.attributes?.th ?? []),
      ["className", SAFE_TOKEN],
    ],
    tr: [
      ...(defaultSchema.attributes?.tr ?? []),
      ["className", SAFE_TOKEN],
    ],
    ul: [
      ...(defaultSchema.attributes?.ul ?? []),
      ["className", SAFE_TOKEN],
    ],
    ol: [
      ...(defaultSchema.attributes?.ol ?? []),
      ["className", SAFE_TOKEN],
    ],
    li: [
      ...(defaultSchema.attributes?.li ?? []),
      ["className", SAFE_TOKEN],
    ],
    blockquote: [
      ...(defaultSchema.attributes?.blockquote ?? []),
      ["className", SAFE_TOKEN],
    ],
    h1: [
      ...(defaultSchema.attributes?.h1 ?? []),
      ["className", SAFE_TOKEN],
    ],
    h2: [
      ...(defaultSchema.attributes?.h2 ?? []),
      ["className", SAFE_TOKEN],
    ],
    h3: [
      ...(defaultSchema.attributes?.h3 ?? []),
      ["className", SAFE_TOKEN],
    ],
    h4: [
      ...(defaultSchema.attributes?.h4 ?? []),
      ["className", SAFE_TOKEN],
    ],
    h5: [
      ...(defaultSchema.attributes?.h5 ?? []),
      ["className", SAFE_TOKEN],
    ],
    h6: [
      ...(defaultSchema.attributes?.h6 ?? []),
      ["className", SAFE_TOKEN],
    ],
    p: [
      ...(defaultSchema.attributes?.p ?? []),
      ["className", SAFE_TOKEN],
    ],
  },
} satisfies Options;

const ELEMENT_CLASS_MAP: Record<string, string> = {
  h1: "text-4xl font-semibold tracking-tight text-zinc-100 sm:text-5xl",
  h2: "mt-12 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl",
  h3: "mt-8 text-2xl font-semibold tracking-tight text-zinc-100",
  p: "leading-relaxed text-zinc-300",
  a: "font-medium text-violet-300 underline decoration-violet-300/60 underline-offset-4 transition-colors duration-200 hover:text-violet-200",
  ul: "list-disc space-y-3 pl-6 text-zinc-300",
  ol: "list-decimal space-y-3 pl-6 text-zinc-300",
  li: "leading-relaxed",
  blockquote: "border-l-4 border-violet-400/40 pl-4 text-lg italic text-zinc-200",
  img: "mx-auto my-8 w-full max-w-3xl rounded-2xl border border-white/10 bg-zinc-900/40 object-contain",
  table: "w-full border-collapse text-left text-sm text-zinc-200",
  th: "bg-white/5 px-4 py-3 font-semibold uppercase tracking-[0.2em] text-zinc-100",
  td: "px-4 py-3 text-zinc-300",
  code: "text-sm",
  pre: "overflow-x-auto rounded-2xl bg-zinc-900/80 px-5 py-5 text-sm",
  hr: "my-12 border-t border-white/10",
};

function pushClassName(node: Element, className: string) {
  if (!className) return;
  const props = (node.properties ??= {});
  const existing = props.className;
  const tokens = className.split(" ").filter(Boolean);
  if (Array.isArray(existing)) {
    props.className = [...existing, ...tokens];
  } else if (typeof existing === "string") {
    props.className = `${existing} ${className}`.trim();
  } else {
    props.className = tokens;
  }
}

function rehypeEnhanceElements() {
  return function transformer(tree: Root) {
    visit(tree, "element", (node, index, parent) => {
      const element = node as Element | undefined;
      if (!element || typeof element.tagName !== "string") {
        return;
      }

      const parentNode = parent as Parent | undefined;

      if (element.tagName === "table" && parentNode && typeof index === "number") {
        const wrapper: Element = {
          type: "element",
          tagName: "div",
          properties: {
            className: ["my-8", "overflow-x-auto", "rounded-2xl", "border", "border-white/10"],
          },
          children: [element],
        };
        (parentNode.children as Array<Element | any>)[index] = wrapper;
        // continue to allow class map to run on table
      }

      if (element.tagName === "img") {
        element.properties = {
          ...(element.properties ?? {}),
          loading: element.properties?.loading ?? "lazy",
        };
      }

      if (element.tagName === "code") {
        const parentTag =
          parentNode && parentNode.type === "element"
            ? (parentNode as Element).tagName
            : null;
        if (parentTag !== "pre") {
          pushClassName(element, "rounded bg-zinc-800/70 px-1.5 py-1 text-sm text-violet-200");
        }
      }

      if (element.tagName === "pre") {
        const codeChild = element.children?.find(
          (child): child is Element => child.type === "element" && child.tagName === "code",
        );
        if (codeChild) {
          const classList = codeChild.properties?.className;
          const languageToken = Array.isArray(classList)
            ? classList.find((value) => typeof value === "string" && value.startsWith("language-"))
            : typeof classList === "string"
              ? classList.split(/\s+/).find((value) => value.startsWith("language-"))
              : undefined;
          if (languageToken) {
            const language = String(languageToken).replace(/^language-/, "");
            element.properties = {
              ...(element.properties ?? {}),
              dataLanguage: language,
            };
          }
        }
      }

      const mappedClass = ELEMENT_CLASS_MAP[element.tagName];
      if (mappedClass) {
        pushClassName(element, mappedClass);
      }
    });
  };
}

export async function compileMarkdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeHighlight)
    .use(rehypeEnhanceElements)
    .use(rehypeSanitize, markdownSanitizeSchema)
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}
