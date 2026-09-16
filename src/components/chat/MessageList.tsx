import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { useChat } from '../../contexts/ChatContext';
import { ActionConfirmationCard } from './ActionConfirmationCard';

export function MessageList() {
  const { messages, confirmToolProposal } = useChat();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
      {messages.map((message, index) => (
        <div key={`${message.role}-${index}`} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
          <div className={`max-w-[78%] break-words rounded-lg px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'bg-blue-500/75 text-white' : 'bg-white/10 text-white/90'}`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                p: ({ children }) => <p className="whitespace-pre-wrap [&:not(:first-child)]:mt-3">{children}</p>,
                ul: ({ children }) => <ul className="ml-4 list-disc space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="ml-4 list-decimal space-y-1">{children}</ol>,
                a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="text-blue-300 underline underline-offset-2">{children}</a>,
                code: ({ children }) => <code className="rounded bg-black/25 px-1 py-0.5 font-mono text-[0.9em]">{children}</code>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          {message.tool_proposal && (
            <div className="w-full max-w-[85%]">
              <ActionConfirmationCard
                proposal={message.tool_proposal}
                onConfirm={() => confirmToolProposal(index, 'confirm')}
                onCancel={() => confirmToolProposal(index, 'cancel')}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
