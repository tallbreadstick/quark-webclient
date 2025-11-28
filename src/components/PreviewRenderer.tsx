import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css"; // KaTeX CSS

type MarkdownWithMathProps = {
  value: string;
};

export default function PreviewRenderer({ value }: MarkdownWithMathProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      children={value}
    />
  );
}
