import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Receipt, Wallet } from 'lucide-react';
import { listenToTransactions, listenToBills, listenToDocuments, Transaction, Bill, Document } from '../lib/db';
import { cn } from '../lib/utils';

export default function GlobalSearch({ onResultClick }: { onResultClick: (tab: string) => void }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [txs, setTxs] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);

  useEffect(() => {
    const u1 = listenToTransactions(setTxs);
    const u2 = listenToBills(setBills);
    const u3 = listenToDocuments(setDocs);
    return () => { u1(); u2(); u3(); };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = [];
  if (query.length > 2) {
    const q = query.toLowerCase();
    
    txs.filter(t => (t.merchant?.toLowerCase() || '').includes(q) || t.category.toLowerCase().includes(q) || (t.note?.toLowerCase() || '').includes(q)).forEach(t => {
      results.push({ type: 'transaction', id: t.id, title: t.merchant || t.category, subtitle: `₹${t.amount}`, icon: Receipt, tab: 'transactions' });
    });
    
    bills.filter(b => b.name.toLowerCase().includes(q)).forEach(b => {
      results.push({ type: 'bill', id: b.id, title: b.name, subtitle: `₹${b.amount}`, icon: Wallet, tab: 'calendar' });
    });

    docs.filter(d => d.title.toLowerCase().includes(q)).forEach(d => {
      results.push({ type: 'document', id: d.id, title: d.title, subtitle: d.category, icon: FileText, tab: 'documents' });
    });
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 text-[var(--text-secondary)]" size={18} />
        <input 
          type="text" 
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search anything (Cmd+K)" 
          className="w-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-transparent focus:border-emerald-500 rounded-full py-2 pl-10 pr-4 focus:outline-none transition-colors"
        />
      </div>

      {isOpen && query.length > 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-center text-[var(--text-secondary)] text-sm">No results found for "{query}"</div>
          ) : (
            <ul className="py-2">
              {results.map((r: any, i) => (
                <li key={`${r.type}-${r.id}-${i}`}>
                  <button 
                    onClick={() => {
                      onResultClick(r.tab);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                  >
                    <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg text-[var(--text-secondary)]">
                      <r.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-[var(--text-secondary)] capitalize">{r.type} • {r.subtitle}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
