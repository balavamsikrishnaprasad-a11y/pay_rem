import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertCircle, Info, Wallet } from 'lucide-react';
import { listenToBills, listenToBudgets, Bill, Budget } from '../lib/db';
import { cn } from '../lib/utils';
import { format, differenceInDays } from 'date-fns';

export default function NotificationsCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [hasPermission, setHasPermission] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u1 = listenToBills(setBills);
    const u2 = listenToBudgets(setBudgets);
    return () => { u1(); u2(); };
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

  // Compute notifications locally
  const notifications: any[] = [];
  const today = new Date();

  bills.forEach(b => {
    if (b.status === 'pending') {
      const days = differenceInDays(new Date(b.dueDate), today);
      if (days >= 0 && days <= 3) {
        notifications.push({
          id: `bill-${b.id}`,
          type: 'warning',
          icon: Wallet,
          title: 'Bill Due Soon',
          message: `${b.name} (₹${b.amount}) is due in ${days} days.`,
          date: new Date().toISOString()
        });
      }
    }
  });

  budgets.forEach(b => {
    const pct = (b.spent / b.limit) * 100;
    if (pct >= 90) {
      notifications.push({
        id: `budget-${b.id}`,
        type: 'alert',
        icon: AlertCircle,
        title: 'Budget Alert',
        message: `You've used ${pct.toFixed(0)}% of your ${b.category} budget.`,
        date: new Date().toISOString()
      });
    }
  });

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setHasPermission(true);
      // We would register FCM here ideally, but as requested it shouldn't block functionality.
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--text-secondary)] hover:text-emerald-500"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--bg-primary)]"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <span className="text-xs font-medium bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full">
                {notifications.length} New
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-secondary)] flex flex-col items-center">
                <Bell size={32} className="opacity-20 mb-2" />
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {notifications.map(n => (
                  <li key={n.id} className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl flex items-start gap-3 transition-colors">
                    <div className={cn(
                      "p-2 rounded-lg flex-shrink-0 mt-1",
                      n.type === 'alert' ? "bg-red-500/10 text-red-500" :
                      n.type === 'warning' ? "bg-amber-500/10 text-amber-500" :
                      "bg-blue-500/10 text-blue-500"
                    )}>
                      <n.icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {!hasPermission && ("Notification" in window) && Notification.permission !== "granted" && (
            <div className="p-4 bg-black/5 dark:bg-white/5 border-t border-[var(--card-border)]">
              <p className="text-xs text-[var(--text-secondary)] mb-2">Enable push notifications to never miss an alert.</p>
              <button onClick={requestNotificationPermission} className="w-full text-xs font-medium bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 transition-colors">
                Enable Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
