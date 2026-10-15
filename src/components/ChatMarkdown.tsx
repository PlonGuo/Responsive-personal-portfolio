'use client';

import { memo } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const plugins = [remarkGfm];
const components: Components = {
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
  table: ({ children }) => <div className="chat-table-scroll"><table>{children}</table></div>,
};

export default memo(function ChatMarkdown({ content }: { content: string }) {
  return <div className="chat-markdown text-sm">
    <Markdown remarkPlugins={plugins} components={components} skipHtml disallowedElements={['img']}>
      {content}
    </Markdown>
  </div>;
});
