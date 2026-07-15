import React, { useState, useEffect } from 'react';
import { listenToTransactions, listenToBills, listenToDocuments, addTransaction, updateBill, Transaction, Bill, Document } from '../lib/db';
import { format, getDaysInMonth, startOfMonth, addDays, getDay, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Filter, Smartphone, Check, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import UPIPaymentModal from './UPIPaymentModal';
import { markCalendarEventPaid } from '../lib/workspace';

export default function FinancialCalendar() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);

  useEffect(() => {
    const unsubTxs = listenToTransactions(setTxs);
    const unsubBills = listenToBills(setBills);
    const unsubDocs = listenToDocuments(setDocs);
    return () => { unsubTxs(); unsubBills(); unsubDocs(); };
  }, []);

  const monthStart = startOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const startDayOfWeek = getDay(monthStart);

  const days = Array.from({ length: daysInMonth }, (_, i) => addDays(monthStart, i));
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const getDayItems = (date: Date) => {
    const dayTxs = txs.filter(t => isSameDay(new Date(t.date), date));
    const dayBills = bills.filter(b => isSameDay(new Date(b.dueDate), date));
    const dayDocs = docs.filter(d => isSameDay(new Date(d.uploadedDate), date));
    return { txs: dayTxs, bills: dayBills, docs: dayDocs };
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Financial Calendar</h2>
          <p className="text-[var(--text-secondary)]">See your money across time</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl">←</button>
          <span className="font-medium w-32 text-center">{format(currentDate, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl">→</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="md:col-span-2 glass-card p-6 flex flex-col">
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-2">{d}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-1 flex-1">
            {paddingDays.map(d => (
              <div key={`pad-${d}`} className="min-h-[80px] rounded-xl opacity-20 border border-[var(--card-border)] border-dashed"></div>
            ))}
            
            {days.map(date => {
              const { txs: dayTxs, bills: dayBills, docs: dayDocs } = getDayItems(date);
              const isSelected = selectedDate && isSameDay(selectedDate, date);
              const isToday = isSameDay(date, new Date());
              
              const incomes = dayTxs.filter(t => t.type === 'income');
              const expenses = dayTxs.filter(t => t.type === 'expense');

              return (
                <button 
                  key={date.toISOString()} 
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "min-h-[80px] p-2 flex flex-col items-start border rounded-xl transition-all",
                    isSelected ? "border-emerald-500 bg-emerald-500/5 shadow-md" : "border-[var(--card-border)] bg-black/5 dark:bg-white/5 hover:border-emerald-500/30",
                    isToday && !isSelected ? "ring-2 ring-emerald-500/50" : ""
                  )}
                >
                  <span className={cn(
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                    isToday ? "bg-emerald-500 text-white" : ""
                  )}>
                    {format(date, 'd')}
                  </span>
                  
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {incomes.length > 0 && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                    {expenses.length > 0 && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                    {dayBills.length > 0 && <div className="w-2 h-2 rounded-full bg-gold-500"></div>}
                    {dayDocs.length > 0 && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-card flex flex-col overflow-hidden">
          {selectedDate ? (
            <>
              <div className="p-4 border-b border-[var(--card-border)] bg-black/5 dark:bg-white/5">
                <h3 className="font-semibold text-lg">{format(selectedDate, 'EEEE, MMMM do')}</h3>
                <p className="text-sm text-[var(--text-secondary)]">Activity for this day</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(() => {
                  const { txs: dayTxs, bills: dayBills, docs: dayDocs } = getDayItems(selectedDate);
                  if (dayTxs.length === 0 && dayBills.length === 0 && dayDocs.length === 0) {
                    return (
                      <div className="text-center text-[var(--text-secondary)] py-8 space-y-3">
                        <CalendarIcon size={32} className="mx-auto opacity-20" />
                        <p>No activity recorded for this day.</p>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      {dayBills.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">Upcoming Bills</h4>
                          <div className="space-y-2">
                            {dayBills.map(b => (
                              <div key={b.id} className="p-3 bg-gold-500/10 border border-gold-500/20 rounded-xl flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-gold-600 dark:text-gold-400">{b.name}</p>
                                    <p className="text-xs opacity-70">Due {b.status}</p>
                                  </div>
                                  <span className="font-semibold text-gold-600 dark:text-gold-400">₹{b.amount}</span>
                                </div>
                                {b.status === 'pending' && (
                                  <button 
                                    onClick={() => setPayingBill(b)}
                                    className="flex items-center justify-center gap-2 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                                  >
                                    <Smartphone size={16} /> Pay via UPI
                                  </button>
                                )}
                                {b.status === 'paid' && (
                                  <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                                    <Check size={16} /> Paid
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {dayTxs.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2 mt-4">Transactions</h4>
                          <div className="space-y-2">
                            {dayTxs.map(t => (
                              <div key={t.id} className="p-3 bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-xl flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{t.merchant || t.category}</p>
                                  <p className="text-xs text-[var(--text-secondary)]">{t.category}</p>
                                </div>
                                <span className={t.type === 'expense' ? 'text-red-500 font-medium' : 'text-emerald-500 font-medium'}>
                                  {t.type === 'expense' ? '-' : '+'}₹{t.amount.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {dayDocs.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2 mt-4">Documents</h4>
                          <div className="space-y-2">
                            {dayDocs.map(d => (
                              <a key={d.id} href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="block p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-colors">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg text-blue-500">
                                    <FileText size={20} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-blue-600 dark:text-blue-400">{d.title}</p>
                                    <p className="text-xs opacity-70 capitalize mt-1 text-blue-600 dark:text-blue-400">{d.category.replace('_', ' ')}</p>
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--text-secondary)] space-y-4">
              <CalendarIcon size={48} className="opacity-20" />
              <p>Select a day on the calendar to view its transactions and bills.</p>
            </div>
          )}
        </div>
      </div>
      
      {payingBill && (
        <UPIPaymentModal
          defaultAmount={payingBill.amount}
          defaultPayeeName={payingBill.payeeName || payingBill.name}
          defaultPayeeVpa={payingBill.payeeVpa}
          defaultNote={`Payment for ${payingBill.name}`}
          onSuccess={async (details) => {
            if (!payingBill.id) return;
            
            // Mark bill as paid
            await updateBill(payingBill.id, { 
              status: 'paid',
              payeeName: details.payeeName,
              payeeVpa: details.payeeVpa
            });
            
            // Add transaction
            await addTransaction({
              type: 'expense',
              amount: details.amount,
              category: payingBill.category || 'Bills',
              merchant: details.payeeName,
              date: new Date().toISOString().split('T')[0],
              note: details.note,
              source: 'upi',
              upiAppUsed: details.upiAppUsed,
              referenceNumber: details.referenceNumber
            });
            
            if (payingBill.calendarEventId) {
              try {
                await markCalendarEventPaid(payingBill.calendarEventId, payingBill.name);
              } catch (e) {
                console.error('Failed to update calendar event', e);
              }
            }
            
            setPayingBill(null);
          }}
          onCancel={() => setPayingBill(null)}
        />
      )}
    </div>
  );
}
