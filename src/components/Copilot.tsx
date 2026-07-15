import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { listenToTransactions, listenToBills, listenToBudgets } from '../lib/db';

export default function Copilot() {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Hi! I am your PaymentMemory Copilot. I can analyze your spending, help you find where to cut back, or summarize your month. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [txs, setTxs] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);

  useEffect(() => {
    const unsub1 = listenToTransactions(setTxs);
    const unsub2 = listenToBills(setBills);
    const unsub3 = listenToBudgets(setBudgets);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          dataContext: {
            transactions: txs,
            bills: bills,
            budgets: budgets
          }
        })
      });

      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      
      setMessages([...newMessages, { role: 'assistant', content: data.text }]);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px] glass-card overflow-hidden">
      <div className="p-4 border-b border-[var(--card-border)] bg-black/5 dark:bg-white/5 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
          <Bot size={24} />
        </div>
        <div>
          <h2 className="font-semibold text-lg">AI Copilot</h2>
          <p className="text-xs text-[var(--text-secondary)]">Powered by Gemini</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <Bot size={16} />
              </div>
            )}
            <div className={`p-4 rounded-2xl max-w-[80%] ${
              m.role === 'user' 
                ? 'bg-navy-800 dark:bg-white text-white dark:text-navy-900 rounded-tr-sm' 
                : 'bg-white dark:bg-navy-800 shadow-sm border border-[var(--card-border)] rounded-tl-sm'
            }`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-navy-800 dark:bg-white flex items-center justify-center text-white dark:text-navy-900 shrink-0">
                <User size={16} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-800 shadow-sm border border-[var(--card-border)] rounded-tl-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500/50 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500/50 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500/50 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-[var(--card-border)] bg-black/5 dark:bg-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your spending..."
            className="w-full bg-white dark:bg-navy-900 border border-[var(--card-border)] rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
