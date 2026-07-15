import React, { useEffect, useState } from 'react';
import { listenToTransactions, listenToBills, listenToBudgets, listenToAccounts, Transaction, Bill, Budget, Account } from '../lib/db';
import { ArrowUpRight, ArrowDownRight, AlertCircle, Plus, Sparkles, Wallet, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [prediction, setPrediction] = useState<any>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  useEffect(() => {
    const unsubTxs = listenToTransactions(setTxs);
    const unsubBills = listenToBills(setBills);
    const unsubBudgets = listenToBudgets(setBudgets);
    const unsubAccs = listenToAccounts(setAccounts);
    return () => { unsubTxs(); unsubBills(); unsubBudgets(); unsubAccs(); };
  }, []);

  useEffect(() => {
    const getPrediction = async () => {
      if (txs.length === 0) return;
      setLoadingPrediction(true);
      try {
        const res = await fetch('/api/gemini/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: txs.slice(0, 50), budgets })
        });
        const data = await res.json();
        setPrediction(data.results || data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPrediction(false);
      }
    };
    // Fetch predictions on load, debounce it or only run if not fetched
    if (!prediction) {
      getPrediction();
    }
  }, [txs, budgets]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthTxs = txs.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const income = thisMonthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expenses = thisMonthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  const assets = accounts.filter(a => ['bank', 'cash', 'property', 'vehicle'].includes(a.type)).reduce((acc, a) => acc + a.balance, 0);
  const liabilities = accounts.filter(a => ['loan', 'credit_card', 'mortgage', 'personal_debt'].includes(a.type)).reduce((acc, a) => acc + a.balance, 0);
  const netWorth = assets - liabilities;

  const budgetTotal = budgets.reduce((acc, b) => acc + b.limit, 0);
  const budgetSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const budgetData = [
    { name: 'Spent', value: budgetSpent, color: '#10b981' },
    { name: 'Remaining', value: Math.max(budgetTotal - budgetSpent, 0), color: 'rgba(16, 185, 129, 0.2)' }
  ];

  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const healthScore = Math.min(Math.max(Math.round(savingsRate + 50), 0), 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
          <p className="text-[var(--text-secondary)]">Your financial summary for this month</p>
        </div>
        <button onClick={() => onNavigate('transactions')} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-colors font-medium">
          <Plus size={18} />
          <span>New Transaction</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <p className="text-[var(--text-secondary)] font-medium text-sm flex items-center gap-2">
            <PieChartIcon size={16} /> Balance
          </p>
          <h3 className="text-3xl font-semibold tracking-tight mt-2 text-emerald-500">₹{netWorth.toLocaleString()}</h3>
        </div>
        <div className="glass-card p-5">
          <p className="text-[var(--text-secondary)] font-medium text-sm flex items-center gap-2">
            <Wallet size={16} /> Accounts
          </p>
          <h3 className="text-3xl font-semibold tracking-tight mt-2 text-blue-500">{accounts.length}</h3>
        </div>
        <div className="glass-card p-5">
          <p className="text-[var(--text-secondary)] font-medium text-sm flex items-center gap-2">
            <ArrowUpRight size={16} className="text-emerald-500" /> Income (Month)
          </p>
          <h3 className="text-2xl font-semibold tracking-tight mt-2">₹{income.toLocaleString()}</h3>
        </div>
        <div className="glass-card p-5">
          <p className="text-[var(--text-secondary)] font-medium text-sm flex items-center gap-2">
            <ArrowDownRight size={16} className="text-red-500" /> Expenses (Month)
          </p>
          <h3 className="text-2xl font-semibold tracking-tight mt-2">₹{expenses.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-3 flex flex-col">
          <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-500" /> AI Predictions
          </h3>
          <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-xl p-4 overflow-hidden relative">
            {loadingPrediction ? (
              <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                <span className="text-[var(--text-secondary)]">Analyzing patterns...</span>
              </div>
            ) : prediction?.notEnoughHistory ? (
              <div className="text-[var(--text-secondary)] text-sm">
                {prediction.message}
              </div>
            ) : prediction ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed">{prediction.cashFlowOutlook}</p>
                {prediction.warnings?.length > 0 && (
                  <ul className="space-y-2 mt-4">
                    {prediction.warnings.map((w: string, i: number) => (
                      <li key={i} className="text-xs text-red-500 flex items-start gap-2">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {w}
                      </li>
                    ))}
                  </ul>
                )}
                {prediction.forecastByCategory && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Next Month Forecast</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {prediction.forecastByCategory.slice(0, 3).map((f: any, i: number) => (
                        <div key={i} className="bg-black/5 dark:bg-white/5 p-2 rounded-lg text-sm">
                          <p className="truncate text-[var(--text-secondary)]">{f.category}</p>
                          <p className="font-medium">₹{f.predictedAmount}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[var(--text-secondary)] text-sm text-center">AI insights will appear here once you have some transaction history.</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
           <h3 className="font-medium text-lg mb-4 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => onNavigate('transactions')}>Recent Transactions</h3>
           <div className="space-y-4">
             {txs.slice(0, 5).map(t => (
               <div key={t.id} className="flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors cursor-pointer" onClick={() => onNavigate('transactions')}>
                 <div className="flex flex-col">
                   <span className="font-medium">{t.merchant || t.category}</span>
                   <span className="text-xs text-[var(--text-secondary)]">{t.date}</span>
                 </div>
                 <span className={t.type === 'expense' ? 'text-red-500' : 'text-emerald-500 font-medium'}>
                   {t.type === 'expense' ? '-' : '+'}₹{t.amount.toLocaleString()}
                 </span>
               </div>
             ))}
             {txs.length === 0 && (
               <div className="text-sm text-[var(--text-secondary)] text-center py-4">No transactions yet. Add one!</div>
             )}
           </div>
        </div>
        
        <div className="glass-card p-6 flex flex-col justify-center items-center">
            <h3 className="font-medium text-lg mb-4 w-full text-left">Financial Health</h3>
            <div className="w-40 h-40 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ value: healthScore, color: '#10b981' }, { value: 100 - healthScore, color: 'rgba(16, 185, 129, 0.1)' }]} 
                    dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={70} startAngle={90} endAngle={-270} stroke="none">
                    <Cell fill="#10b981" />
                    <Cell fill="rgba(16, 185, 129, 0.1)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-semibold">{healthScore}</span>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-4">Based on savings rate and budget adherence</p>
        </div>
      </div>
    </div>
  );
}
