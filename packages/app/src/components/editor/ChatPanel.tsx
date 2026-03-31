import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Bot, User, Terminal } from 'lucide-react';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';

interface ChatMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatPanelProps {
  projectId: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { subscribe } = useWebSocket();

  // Load chat history
  useEffect(() => {
    api.get<ChatMessage[]>(`/projects/${projectId}/chat`)
      .then(setMessages)
      .catch(() => {});
  }, [projectId]);

  // Listen for new messages via WebSocket
  useEffect(() => {
    const unsub = subscribe('chat:message', (data: unknown) => {
      const msg = data as ChatMessage;
      if (msg.projectId === projectId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });
    return unsub;
  }, [projectId, subscribe]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);
    try {
      await api.post(`/projects/${projectId}/chat`, { role: 'user', content: text });
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  }, [input, sending, projectId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header hint */}
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">
          Mensagens visíveis ao Claude Code via MCP
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Bot className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              Escreva instruções de edição aqui. O Claude Code pode lê-las via MCP e aplicar as mudanças.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            )}
            <div
              className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary/20 text-primary-foreground'
                  : 'bg-secondary text-foreground'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className="mt-1 text-[9px] opacity-50">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.role === 'user' && (
              <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border p-2">
        <div className="flex gap-1.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: adicione zoom no hook..."
            rows={1}
            className="flex-1 resize-none rounded border border-border bg-zinc-900 px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 rounded bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
