import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

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

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeKatex, { output: "htmlAndMathml", strict: false })
  .use(rehypeHighlight, { ignoreMissing: true })
  .use(rehypeSanitize, markdownSanitizeSchema)
  .use(rehypeStringify, { allowDangerousHtml: true });

const compiledCache = new Map<string, Promise<string>>();

export async function compileMarkdown(markdown: string): Promise<string> {
  const cached = compiledCache.get(markdown);
  if (cached) {
    return cached;
  }

  const processing = processor
    .process(markdown)
    .then((file) => String(file))
    .catch((error) => {
      compiledCache.delete(markdown);
      throw error;
    });

  compiledCache.set(markdown, processing);
  return processing;
}
