import React, { useEffect, useRef, useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  FaceSmileIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { api } from '../../services/api';
import { MessageBubble, type ChatRole } from './MessageBubble';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const WELCOME_TEXT =
  'Welcome to ConnectMyTask AI Assistant. How can I help you today?';

const FALLBACK_ERROR_TEXT =
  'Sorry, I could not process that request right now. Please try again in a moment.';

function createMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const openWidget = () => {
    setIsOpen(true);

    // First open -> inject one clean welcome message for demo clarity.
    if (!hasInitialized) {
      setMessages([createMessage('assistant', WELCOME_TEXT)]);
      setHasInitialized(true);
    }
  };

  const closeWidget = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isLoading, isOpen, messages]);

  const sendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const currentHistory = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setMessages((prev) => [...prev, createMessage('user', trimmed)]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.chat.send({
        message: trimmed,
        history: currentHistory,
      });

      const reply = String(response.data?.reply || '').trim() || FALLBACK_ERROR_TEXT;
      setMessages((prev) => [...prev, createMessage('assistant', reply)]);
    } catch {
      setMessages((prev) => [...prev, createMessage('assistant', FALLBACK_ERROR_TEXT)]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {!isOpen && (
        <button
          type="button"
          onClick={openWidget}
          className="group flex items-center gap-2 rounded-full bg-blue-600 text-white px-4 py-3 shadow-xl hover:bg-blue-700 transition-colors"
          aria-label="Open ConnectMyTask AI Assistant"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </button>
      )}

      <div
        className={`absolute bottom-0 right-0 w-[360px] max-w-[calc(100vw-1.25rem)] h-[560px] max-h-[calc(100vh-1.5rem)] rounded-2xl border border-blue-100 bg-white shadow-2xl overflow-hidden origin-bottom-right transition-all duration-300 ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={closeWidget}
                className="md:hidden p-1 rounded-md hover:bg-white/15"
                aria-label="Back"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>

              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs font-bold shrink-0">
                CMT
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">ConnectMyTask AI Assistant</p>
                <p className="text-xs text-blue-100 truncate">Chat with us!</p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeWidget}
              className="p-1 rounded-md hover:bg-white/15"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="h-[calc(100%-62px-74px)] overflow-y-auto bg-slate-50 px-3 py-4 space-y-3 hide-scrollbar">
          {messages.map((message) => (
            <MessageBubble key={message.id} role={message.role} content={message.content} />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[82%] flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                  AI
                </div>
                <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-white border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1.5 bg-slate-50">
            <button
              type="button"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Attach file"
            >
              <PaperClipIcon className="w-4 h-4" />
            </button>

            <input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Type your message..."
              className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
            />

            <button
              type="button"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Emoji"
            >
              <FaceSmileIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="p-2 rounded-full bg-blue-600 text-white disabled:bg-blue-200 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
