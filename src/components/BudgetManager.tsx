import React, { useState, useEffect } from 'react';
import { listenToBudgets, listenToTransactions, addBudget, Budget, Transaction } from '../lib/db';
import { Plus, Target, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function BudgetManager() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    category: '',
    limit: '',
    period: 'monthly'
  });

  useEffect(() => {
    const unsub1 = listenToBudgets(setBudgets);
    const unsub2 = listenToTransactions(setTxs);
    return () => { unsub1(); unsub2(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.limit || !formData.category) return;

    await addBudget({
      category: formData.category,
      limit: Number(formData.limit),
      period: formData.period,
      spent: 0 // In a real app, you'd calculate this on the fly based on current month txs
    });
    
    setIsAdding(false);
    setFormData({ category: '', limit: '', period: 'monthly' });
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthExpenses = txs.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Budgets</h2>
          <p className="text-[var(--text-secondary)]">Keep your spending on track</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)} 
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-colors font-medium"
        >
          {isAdding ? 'Cancel' : <><Plus size={18} /><span>New Budget</span></>}
        </button>
      </div>

      {isAdding && (
        <div className="glass-card p-6 animate-in slide-in-from-top-4 fade-in duration-200">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium mb-1">Category</label>
              <input type="text" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Dining Out" />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium mb-1">Monthly Limit (₹)</label>
              <input type="number" required value={formData.limit} onChange={e => setFormData({...formData, limit: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="5000" />
            </div>
            <button type="submit" className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8 py-2.5 rounded-xl transition-colors shrink-0">
              Create Budget
            </button>
          </form>
        </div>
      )}

      {budgets.some(b => {
        const spent = thisMonthExpenses.filter(t => t.category.toLowerCase() === b.category.toLowerCase()).reduce((acc, t) => acc + t.amount, 0);
        return spent > b.limit;
      }) && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-sm">Over Budget Warning</h4>
            <p className="text-sm mt-1 opacity-90">You have exceeded your monthly spending limit in one or more categories. Please review your spending to stay on track.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center text-[var(--text-secondary)] flex flex-col items-center gap-4">
            <Target size={48} className="opacity-20" />
            <p>You haven't set up any budgets yet.<br/>Setting a budget helps you control spending and boost your Financial Health Score.</p>
          </div>
        ) : (
          budgets.map(b => {
            // Live calculation of spent amount for this category
            const spent = thisMonthExpenses
              .filter(t => t.category.toLowerCase() === b.category.toLowerCase())
              .reduce((acc, t) => acc + t.amount, 0);
            
            const percentage = Math.min((spent / b.limit) * 100, 100);
            const isOver = spent > b.limit;
            const isNear = percentage >= 80 && !isOver;

            return (
              <div key={b.id} className={cn("glass-card p-6 flex flex-col gap-4 transition-all duration-300", isOver && "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]")}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{b.category}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{b.period} limit: ₹{b.limit.toLocaleString()}</p>
                  </div>
                  {isOver && (
                    <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <AlertTriangle size={14} /> Over Budget
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">₹{spent.toLocaleString()} spent</span>
                    <span className="text-[var(--text-secondary)]">₹{Math.max(b.limit - spent, 0).toLocaleString()} left</span>
                  </div>
                  <div className="h-3 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isOver ? "bg-red-500" : isNear ? "bg-gold-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
