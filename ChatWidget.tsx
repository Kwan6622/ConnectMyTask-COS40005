import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  TrashIcon,
  FaceSmileIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { api } from '../../services/api';
import { MessageBubble, type ChatRole } from './MessageBubble';
import { useAuthStore } from '../../stores/auth.store';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

type TaskFormFieldName =
  | 'title'
  | 'description'
  | 'category'
  | 'location'
  | 'budget'
  | 'deadline'
  | 'maxBids';

interface TaskFormSchema {
  page: 'task-post';
  fields: Array<{
    name: TaskFormFieldName;
    required: boolean;
    type: 'text' | 'number' | 'select' | 'datetime';
    options?: string[];
  }>;
}

interface TaskFormState {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  budget?: number;
  maxBids?: number;
  deadline?: string;
}

const CHAT_STORAGE_PREFIX = 'connectmytask-chat-history';

function createMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

function parseVndInput(rawValue: string): number | undefined {
  const digitsOnly = rawValue.replace(/[^0-9]/g, '');
  if (!digitsOnly) return undefined;
  const parsed = Number.parseInt(digitsOnly, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function parseDeadline(rawValue: string): string | undefined {
  const normalized = rawValue.trim();
  if (!normalized) return undefined;
  const dateMatch = normalized.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    const date = new Date(dateMatch[1]);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 16);
    }
  }
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 16);
  }
  return undefined;
}

const categoryKeywordMap: Array<[RegExp, string]> = [
  [/(?:\bdelivery\b|\bdeliver\b|\bshipping\b|\bcourier\b)/i, 'DELIVERY'],
  [/(?:\brepair\b|\bhome\b|\bplumbing\b|\belectrical\b|\bmechanic\b|\bcar\b|\boil\b)/i, 'HOME_REPAIR'],
  [/(?:\bit\b|\bit support\b|\btechnology\b|\bsoftware\b|\bcomputer\b)/i, 'IT_SUPPORT'],
  [/(?:\bpersonal assistant\b|\bassistant\b|\bpersonal help\b)/i, 'PERSONAL_ASSISTANT'],
  [/(?:\bmoving\b|\brelocation\b|\bpacking\b)/i, 'MOVING'],
  [/(?:\btutoring\b|\btutor\b|\bteaching\b)/i, 'TUTORING'],
  [/(?:\bcleaning\b|\bjanitor\b|\bmaid\b)/i, 'CLEANING'],
  [/(?:\bother\b|\bmisc\b|\bother service\b)/i, 'OTHER'],
];

function inferCategoryFromText(text: string): string | undefined {
  for (const [pattern, category] of categoryKeywordMap) {
    if (pattern.test(text)) {
      return category;
    }
  }
  return undefined;
}

function inferLocationFromText(text: string): string | undefined {
  const districts = [
    'district 1',
    'district 2',
    'district 3',
    'district 4',
    'district 5',
    'district 6',
    'district 7',
    'district 8',
    'district 9',
    'district 10',
    'district 11',
    'district 12',
    'binh thanh',
    'phu nhuan',
    'go vap',
    'tan binh',
    'tan phu',
    'thu duc',
    'ho chi minh',
    'hcm',
  ];
  const lowered = text.toLowerCase();
  for (const district of districts) {
    if (lowered.includes(district)) {
      return district
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
        .replace('Hcm', 'HCM');
    }
  }
  const atMatch = lowered.match(/(?:in|at)\s+([a-z0-9 ]{3,40})/);
  if (atMatch) {
    return atMatch[1].trim().replace(/\s+/g, ' ');
  }
  return undefined;
}

function shouldLeaveBlank(raw: string, field: string): boolean {
  const patterns = [
    `no ${field}`,
    `leave ${field} blank`,
    `skip ${field}`,
    `without ${field}`,
    `dont add ${field}`,
    `do not add ${field}`,
  ];
  const lowered = raw.toLowerCase();
  return patterns.some((pattern) => lowered.includes(pattern));
}

function getMessageSegments(message: string) {
  return message
    .split(/[\.\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseTaskFormUpdates(message: string, currentState: TaskFormState) {
  const normalized = message.trim();
  const replyParts: string[] = [];
  const updates: Partial<TaskFormState> = {};

  const explicitFieldPatterns: Array<{
    field: TaskFormFieldName;
    regex: RegExp;
  }> = [
    { field: 'title', regex: /(?:title|task title)\s*[:\-]\s*(.+)/i },
    { field: 'description', regex: /(?:description|details|desc)\s*[:\-]\s*(.+)/i },
    { field: 'category', regex: /(?:category|type)\s*[:\-]\s*(.+)/i },
    { field: 'location', regex: /(?:location|place|at|in)\s*[:\-]\s*(.+)/i },
    { field: 'budget', regex: /(?:budget|price|cost|pay)\s*(?:is|to|of)?\s*([\d,\.]+)/i },
    { field: 'maxBids', regex: /(?:max bids|max bid|bids)\s*(?:is|are|:)?\s*([\d]+)/i },
    { field: 'deadline', regex: /(?:deadline|due date|due)\s*(?:is|:)?\s*(.+)/i },
  ];

  for (const pattern of explicitFieldPatterns) {
    const match = normalized.match(pattern.regex);
    if (!match) continue;

    const value = match[1].trim();
    if (!value) continue;

    if (pattern.field === 'budget') {
      const parsedBudget = parseVndInput(value);
      if (parsedBudget) {
        updates.budget = parsedBudget;
        replyParts.push('budget');
      }
      continue;
    }

    if (pattern.field === 'maxBids') {
      const parsedMaxBids = Number.parseInt(value.replace(/\D/g, ''), 10);
      if (Number.isFinite(parsedMaxBids) && parsedMaxBids > 0) {
        updates.maxBids = parsedMaxBids;
        replyParts.push('max bids');
      }
      continue;
    }

    if (pattern.field === 'deadline') {
      const parsedDeadline = parseDeadline(value);
      if (parsedDeadline) {
        updates.deadline = parsedDeadline;
        replyParts.push('deadline');
      }
      continue;
    }

    if (pattern.field === 'category') {
      const category = inferCategoryFromText(value) || value.toUpperCase().replace(/\s+/g, '_');
      updates.category = category;
      replyParts.push('category');
      continue;
    }

    const normalizedFieldValue = value.replace(/\s+/g, ' ').trim();
    updates[pattern.field] = normalizedFieldValue;
    replyParts.push(pattern.field);
  }

  if (shouldLeaveBlank(normalized, 'budget')) {
    updates.budget = undefined;
    replyParts.push('budget');
  }
  if (shouldLeaveBlank(normalized, 'deadline')) {
    updates.deadline = undefined;
    replyParts.push('deadline');
  }
  if (shouldLeaveBlank(normalized, 'max bids') || shouldLeaveBlank(normalized, 'maxbid') || shouldLeaveBlank(normalized, 'bids')) {
    updates.maxBids = undefined;
    replyParts.push('max bids');
  }

  if (!updates.title && !updates.description && !updates.category && !updates.location) {
    const segments = getMessageSegments(normalized);
    if (segments.length === 1 && normalized.length > 20) {
      if (!currentState.description) {
        updates.description = normalized;
        replyParts.push('description');
      }
      if (!currentState.title && normalized.length < 80) {
        updates.title = normalized;
      }
    }
  }

  if (!updates.title && !currentState.title && /(?:need|want|help me|request|post a task|create a task)/i.test(normalized)) {
    const titleCandidate = normalized.slice(0, 80).replace(/\.$/, '');
    if (titleCandidate.length >= 10) {
      updates.title = titleCandidate;
      replyParts.push('title');
    }
  }

  if (!updates.description && !currentState.description && normalized.length > 40) {
    updates.description = normalized;
    if (!replyParts.includes('description')) {
      replyParts.push('description');
    }
  }

  if (!updates.category && !currentState.category) {
    const inferredCategory = inferCategoryFromText(normalized);
    if (inferredCategory) {
      updates.category = inferredCategory;
      if (!replyParts.includes('category')) {
        replyParts.push('category');
      }
    }
  }

  if (!updates.location && !currentState.location) {
    const inferredLocation = inferLocationFromText(normalized);
    if (inferredLocation) {
      updates.location = inferredLocation;
      if (!replyParts.includes('location')) {
        replyParts.push('location');
      }
    }
  }

  if (updates.budget === undefined && /(?:no|leave|skip|without)\s+budget/i.test(normalized)) {
    updates.budget = undefined;
    if (!replyParts.includes('budget')) replyParts.push('budget');
  }

  return {
    updates,
    replyFields: replyParts,
  };
}

export const ChatWidget: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedStoredMessages, setHasLoadedStoredMessages] = useState(false);
  const [taskFormSchema, setTaskFormSchema] = useState<TaskFormSchema | null>(null);
  const formStateRef = useRef<TaskFormState>({});
  const endRef = useRef<HTMLDivElement | null>(null);
  const storageKey = user?.id ? `${CHAT_STORAGE_PREFIX}:${user.id}` : null;

  useEffect(() => {
    const handleFormSchemaEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail || detail.page !== 'task-post') {
        setTaskFormSchema(null);
        return;
      }
      setTaskFormSchema(detail);
    };

    window.addEventListener('connectmytask-form-schema', handleFormSchemaEvent as EventListener);
    return () => window.removeEventListener('connectmytask-form-schema', handleFormSchemaEvent as EventListener);
  }, []);

  useEffect(() => {
    const handleFormStateEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail || typeof detail !== 'object') return;
      formStateRef.current = detail;
    };

    window.addEventListener('connectmytask-form-state', handleFormStateEvent as EventListener);
    return () => window.removeEventListener('connectmytask-form-state', handleFormStateEvent as EventListener);
  }, []);

  useEffect(() => {
    if (!storageKey) {
      setMessages([]);
      setHasInitialized(false);
      setHasLoadedStoredMessages(false);
      return;
    }

    let cancelled = false;

    const loadLocalMessages = () => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) {
          setMessages([]);
          setHasInitialized(false);
          setHasLoadedStoredMessages(true);
          return;
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          setMessages([]);
          setHasInitialized(false);
          setHasLoadedStoredMessages(true);
          return;
        }

        const restored = parsed
          .filter((item) => item && (item.role === 'assistant' || item.role === 'user') && typeof item.content === 'string')
          .map((item) => ({
            id: typeof item.id === 'string' && item.id.trim() ? item.id : createMessage(item.role, item.content).id,
            role: item.role as ChatRole,
            content: item.content,
          }));

        setMessages(restored);
        setHasInitialized(restored.length > 0);
        setHasLoadedStoredMessages(true);
      } catch {
        setMessages([]);
        setHasInitialized(false);
        setHasLoadedStoredMessages(true);
      }
    };

    const loadServerHistory = async () => {
      try {
        const response = await api.chat.getHistory();
        if (cancelled) return;
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          const restored = data
            .filter((item) => item && (item.role === 'assistant' || item.role === 'user') && typeof item.content === 'string')
            .map((item) => ({
              id: createMessage(item.role as ChatRole, item.content).id,
              role: item.role as ChatRole,
              content: item.content,
            }));

          setMessages(restored);
          setHasInitialized(true);
          setHasLoadedStoredMessages(true);
          return;
        }
      } catch {
        // Ignore and fallback to local storage.
      }

      if (!cancelled) {
        loadLocalMessages();
      }
    };

    loadServerHistory();

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !hasLoadedStoredMessages) return;

    if (!messages.length) {
      localStorage.removeItem(storageKey);
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [hasLoadedStoredMessages, messages, storageKey]);

  const openWidget = () => {
    setIsOpen(true);

    if (!hasInitialized) {
      setMessages([createMessage('assistant', t('chat.welcome'))]);
      setHasInitialized(true);
    }
  };

  const closeWidget = () => {
    setIsOpen(false);
  };

  const dispatchFormUpdate = (field: TaskFormFieldName, value: any) => {
    window.dispatchEvent(
      new CustomEvent('connectmytask-task-form-update', {
        detail: { field, value },
      })
    );
  };

  const handleTaskFormMessage = (message: string) => {
    if (location.pathname !== '/post-task' || !taskFormSchema) {
      return null;
    }

    const currentFormState = formStateRef.current;
    const { updates, replyFields } = parseTaskFormUpdates(message, currentFormState);
    const fieldsUpdated = Object.keys(updates) as TaskFormFieldName[];

    if (!fieldsUpdated.length) {
      const missingRequired = taskFormSchema.fields
        .filter((field) => field.required && !currentFormState[field.name])
        .map((field) => field.name);

      if (missingRequired.length > 0) {
        return {
          reply: `I can help fill the task form. I still need: ${missingRequired.join(', ')}. Please share those details.`,
        };
      }

      const missingOptional = taskFormSchema.fields
        .filter((field) => !field.required && currentFormState[field.name] == null)
        .map((field) => field.name);

      if (missingOptional.length > 0) {
        return {
          reply: `Your required fields look okay. If you want, I can also update optional fields: ${missingOptional.join(', ')}. Otherwise say no and I'll leave them blank.`,
        };
      }

      return {
        reply: 'Your task form looks ready. Tell me if you want me to update any field before submitting.',
      };
    }

    fieldsUpdated.forEach((field) => dispatchFormUpdate(field, updates[field]));

    const missingRequired = taskFormSchema.fields
      .filter((field) => field.required && (updates[field.name] === undefined ? !currentFormState[field.name] : !updates[field.name]))
      .map((field) => field.name);

    const missingOptional = taskFormSchema.fields
      .filter((field) => !field.required && currentFormState[field.name] == null && updates[field.name] == null)
      .map((field) => field.name);

    const updatedText = replyFields.length > 0 ? `Updated ${replyFields.join(', ')}.` : '';
    const requiredText = missingRequired.length > 0 ? ` I still need: ${missingRequired.join(', ')}.` : '';
    const optionalText = missingOptional.length > 0 ? ` Optional fields available: ${missingOptional.join(', ')}. Say no to leave them blank.` : '';

    return {
      reply: `${updatedText}${requiredText}${optionalText}`.trim() || 'Okay, I updated the form fields.',
    };
  };

  const clearHistory = async () => {
    const confirmed = window.confirm(t('chat.clearConfirm'));
    if (!confirmed) return;

    setMessages([]);
    setHasInitialized(false);
    if (storageKey) {
      localStorage.removeItem(storageKey);
      try {
        await api.chat.clearHistory();
      } catch {
        // Ignore failures; UI state is cleared.
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isLoading, isOpen, messages]);

  const sendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const userMessage = createMessage('user', trimmed);
    const localFormResult = handleTaskFormMessage(trimmed);
    const formAssistantMessage = localFormResult?.reply ? createMessage('assistant', localFormResult.reply) : null;
    const updatedMessages = [
      ...messages,
      userMessage,
      ...(formAssistantMessage ? [formAssistantMessage] : []),
    ];

    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.chat.send({
        message: trimmed,
        history: updatedMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });

      const reply = String(response.data?.reply || '').trim() || t('chat.fallbackError');
      setMessages((prev) => [...prev, createMessage('assistant', reply)]);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t('chat.fallbackError');
      setMessages((prev) => [...prev, createMessage('assistant', message)]);
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
          aria-label={t('chat.openAssistant')}
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          <span className="text-sm font-semibold">{t('chat.assistantLabel')}</span>
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
                aria-label={t('common.back')}
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>

              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs font-bold shrink-0">
                CMT
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{t('chat.title')}</p>
                <p className="text-xs text-blue-100 truncate">{t('chat.subtitle')}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={clearHistory}
              className="p-1 rounded-md hover:bg-white/15"
              aria-label={t('chat.clearHistory')}
              title={t('chat.clearHistory')}
            >
              <TrashIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={closeWidget}
              className="p-1 rounded-md hover:bg-white/15"
              aria-label={t('common.close')}
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
              aria-label={t('chat.attachFile')}
            >
              <PaperClipIcon className="w-4 h-4" />
            </button>

            <input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={t('chat.typeMessage')}
              className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
            />

            <button
              type="button"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label={t('chat.emoji')}
            >
              <FaceSmileIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="p-2 rounded-full bg-blue-600 text-white disabled:bg-blue-200 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              aria-label={t('chat.send')}
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
