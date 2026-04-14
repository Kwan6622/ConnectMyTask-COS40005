import React from 'react';

type ChatRole = 'assistant' | 'user';

interface MessageBubbleProps {
  role: ChatRole;
  content: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content }) => {
  const isAssistant = role === 'assistant';

  return (
    <div className={`flex w-full ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[82%] flex items-end gap-2 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        {isAssistant && (
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
            AI
          </div>
        )}

        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
            isAssistant
              ? 'bg-white border border-blue-100 text-slate-700 rounded-bl-md'
              : 'bg-blue-600 text-white rounded-br-md'
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
};

export type { ChatRole };
