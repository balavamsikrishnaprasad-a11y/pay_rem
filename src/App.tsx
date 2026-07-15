import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from './lib/firebase';
import { LayoutDashboard, Receipt, CalendarDays, Wallet, Bot, Moon, Sun, Settings } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import Dashboard from './components/Dashboard';
import Copilot from './components/Copilot';
import TransactionManager from './components/TransactionManager';
import FinancialCalendar from './components/FinancialCalendar';
import BudgetManager from './components/BudgetManager';
import DocumentsVault from './components/DocumentsVault';
import { Target, TrendingUp, Folder, PieChart, Search, Bell } from 'lucide-react';
import GlobalSearch from './components/GlobalSearch';
import NotificationsCenter from './components/NotificationsCenter';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u) => { setUser(u); setLoading(false); setAuthError(null); },
      () => { setUser(null); setLoading(false); }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setAuthError(null);
      await googleSignIn();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setAuthError("Sign-in popup was closed. Redirecting to sign in...");
      } else {
        setAuthError(err.message || "Failed to sign in.");
      }
    }
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-navy-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 border-t-transparent animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading PaymentMemory...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] p-4">
        <div className="glass-card p-8 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet size={32} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">PaymentMemory</h1>
          <p className="text-[var(--text-secondary)]">Remember Every Payment. Master Every Financial Decision.</p>
          
          {authError && (
            <div className="bg-red-500/10 text-red-500 text-sm p-4 rounded-xl flex items-start gap-3 text-left">
              <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{authError}</span>
            </div>
          )}

          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-navy-800 text-gray-900 dark:text-white border border-gray-200 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors py-3 px-4 rounded-xl font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
          
          <p className="text-xs text-[var(--text-secondary)] opacity-80 pt-2">
            Having trouble signing in? Try clicking the "Open in new tab" icon (↗) in the top right corner.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'transactions', icon: Receipt, label: 'Transactions' },
    { id: 'budgets', icon: Wallet, label: 'Budgets' },
    { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
    { id: 'documents', icon: Folder, label: 'Documents' },
    { id: 'copilot', icon: Bot, label: 'Copilot' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[var(--card-border)] bg-[var(--card-bg)] p-4 justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Wallet size={18} />
            </div>
            <span className="font-semibold text-lg tracking-tight">PaymentMemory</span>
          </div>
          <nav className="space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  activeTab === tab.id 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                    : "text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between px-3">
            <span className="text-sm text-[var(--text-secondary)]">Theme</span>
            <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
              {isDark ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
          <div className="glass-card p-3 flex items-center gap-3">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Avatar" className="w-10 h-10 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              <button onClick={logout} className="text-xs text-red-500 hover:underline">Sign out</button>
            </div>
            <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pb-20 md:pb-0 flex flex-col">
        {/* Top Header with Global Search and Notifications */}
        <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--card-border)] p-4 flex items-center justify-between md:justify-end gap-4">
          <div className="flex-1 max-w-xl hidden md:block">
            <GlobalSearch onResultClick={setActiveTab} />
          </div>
          <div className="flex items-center gap-2">
            <div className="md:hidden flex-1">
               <GlobalSearch onResultClick={setActiveTab} />
            </div>
            <NotificationsCenter />
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-8 max-w-5xl mx-auto h-full w-full"
          >
            {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
            {activeTab === 'transactions' && <TransactionManager />}
            {activeTab === 'budgets' && <BudgetManager />}
            {activeTab === 'calendar' && <FinancialCalendar />}
            {activeTab === 'documents' && <DocumentsVault />}
            {activeTab === 'copilot' && <Copilot />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-card rounded-none border-x-0 border-b-0 flex items-center justify-around p-2 z-50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors",
              activeTab === tab.id ? "text-emerald-500" : "text-[var(--text-secondary)]"
            )}
          >
            <tab.icon size={20} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
