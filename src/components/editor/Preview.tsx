import React, { useEffect, useState } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';

/**
 * Preview Component
 * Renders the markdown content as HTML in a side-by-side view.
 * It uses the 'unified' ecosystem as required by Spec 3.1.
 */
interface PreviewProps {
  content: string;
}

const Preview: React.FC<PreviewProps> = ({ content }) => {
  const [html, setHtml] = useState('');

  useEffect(() => {
    // Basic markdown processing pipeline
    unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeStringify)
      .process(content)
      .then((file) => {
        setHtml(String(file));
      })
      .catch((err) => {
        console.error('Markdown processing error:', err);
      });
  }, [content]);

  return (
    <div 
      className="prose prose-stone max-w-[68ch] mx-auto p-10 font-serif text-primary"
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
};

export default Preview;
