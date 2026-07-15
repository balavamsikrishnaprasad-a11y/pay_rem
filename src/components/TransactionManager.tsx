import React, { useState, useEffect } from 'react';
import { listenToTransactions, addTransaction, Transaction } from '../lib/db';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Receipt, Camera, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';
import ReceiptScanner from './ReceiptScanner';
import UPIPaymentModal from './UPIPaymentModal';

export default function TransactionManager() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amount: '',
    category: '',
    merchant: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  useEffect(() => {
    const unsub = listenToTransactions(setTxs);
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;

    await addTransaction({
      type: formData.type,
      amount: Number(formData.amount),
      category: formData.category,
      merchant: formData.merchant,
      date: formData.date,
      note: formData.note,
      source: 'manual'
    });
    
    setIsAdding(false);
    setFormData({ ...formData, amount: '', category: '', merchant: '', note: '' });
  };

  const filtered = txs.filter(t => 
    (t.merchant?.toLowerCase() || '').includes(search.toLowerCase()) || 
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    (t.note?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Transactions</h2>
          <p className="text-[var(--text-secondary)]">Manage your income and expenses</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setIsScanning(!isScanning); setIsAdding(false); }} 
            className="flex items-center gap-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-4 py-2 rounded-xl transition-colors font-medium"
          >
            <Camera size={18} />
            <span className="hidden sm:inline">Scan</span>
          </button>
          <button 
            onClick={() => { setIsAdding(!isAdding); setIsScanning(false); }} 
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-colors font-medium"
          >
            {isAdding ? 'Cancel' : <><Plus size={18} /><span>Add New</span></>}
          </button>
        </div>
      </div>

      {isScanning && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-200">
          <ReceiptScanner onSuccess={() => setIsScanning(false)} onCancel={() => setIsScanning(false)} />
        </div>
      )}

      {isAdding && (
        <div className="glass-card p-6 animate-in slide-in-from-top-4 fade-in duration-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4 mb-4">
              {['expense', 'income', 'transfer'].map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="type" 
                    value={type} 
                    checked={formData.type === type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="capitalize">{type}</span>
                </label>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input type="text" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Groceries" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Merchant / Source</label>
                <input type="text" value={formData.merchant} onChange={e => setFormData({...formData, merchant: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Amazon" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Note</label>
              <input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Optional details..." />
            </div>

            <div className="flex gap-4 mt-4">
              <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-colors">
                Save Transaction
              </button>
              <button 
                type="button" 
                onClick={() => setShowUpiModal(true)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Smartphone size={18} />
                Pay via UPI
              </button>
            </div>
          </form>
        </div>
      )}

      {showUpiModal && (
        <UPIPaymentModal
          defaultAmount={formData.amount ? Number(formData.amount) : undefined}
          defaultNote={formData.note}
          defaultPayeeName={formData.merchant}
          onSuccess={async (details) => {
            await addTransaction({
              type: 'expense',
              amount: details.amount,
              category: formData.category || 'General',
              merchant: details.payeeName,
              date: formData.date || new Date().toISOString().split('T')[0],
              note: details.note,
              source: 'upi',
              upiAppUsed: details.upiAppUsed,
              referenceNumber: details.referenceNumber
            });
            setShowUpiModal(false);
            setIsAdding(false);
            setFormData({ ...formData, amount: '', category: '', merchant: '', note: '' });
          }}
          onCancel={() => setShowUpiModal(false)}
        />
      )}

      <div className="flex-1 glass-card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[var(--card-border)] flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions..." 
              className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-[var(--card-border)] rounded-xl py-2 pl-10 pr-4 focus:outline-none"
            />
          </div>
          <button className="p-2 bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <Filter size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-[var(--text-secondary)] space-y-2">
              <Receipt size={32} className="opacity-20" />
              <p>No transactions found.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      t.type === 'expense' ? 'bg-red-500/10 text-red-500' : 
                      t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                    )}>
                      {t.type === 'expense' ? <ArrowDownRight size={18} /> : 
                       t.type === 'income' ? <ArrowUpRight size={18} /> : <Receipt size={18} />}
                    </div>
                    <div>
                      <p className="font-medium">{t.merchant || t.category}</p>
                      <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                        <span>{t.date}</span>
                        {t.merchant && <span>• {t.category}</span>}
                        {t.referenceNumber && <span className="font-mono opacity-60">• {t.referenceNumber}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {t.receiptUrl && (
                      <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="hidden sm:block">
                        <img src={t.receiptUrl} alt="Receipt" className="w-10 h-10 object-cover rounded-lg border border-[var(--card-border)] hover:opacity-80 transition-opacity" />
                      </a>
                    )}
                    <div className="text-right">
                      <p className={cn(
                        "font-semibold",
                        t.type === 'expense' ? 'text-red-500' : 
                        t.type === 'income' ? 'text-emerald-500' : 'text-blue-500'
                      )}>
                        {t.type === 'expense' ? '-' : '+'}{t.type === 'transfer' ? '' : '₹'}{t.amount.toLocaleString()}
                      </p>
                      {t.source === 'gmail' && <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full mt-1 inline-block">Gmail</span>}
                      {t.source === 'upi' && <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full mt-1 inline-block">{t.upiAppUsed || 'UPI'}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
