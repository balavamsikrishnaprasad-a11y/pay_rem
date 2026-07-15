import React, { useState, useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import useRazorpay from 'react-razorpay';

interface UPIPaymentModalProps {
  defaultAmount?: number;
  defaultPayeeVpa?: string;
  defaultPayeeName?: string;
  defaultNote?: string;
  onSuccess: (details: { amount: number; payeeName: string; payeeVpa: string; note: string; upiAppUsed: string; referenceNumber: string }) => void;
  onCancel: () => void;
}

export default function UPIPaymentModal({ defaultAmount, defaultPayeeVpa, defaultPayeeName, defaultNote, onSuccess, onCancel }: UPIPaymentModalProps) {
  const [Razorpay] = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    amount: defaultAmount ? defaultAmount.toString() : '',
    payeeName: defaultPayeeName || '',
    note: defaultNote || ''
  });

  const handlePayment = async () => {
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) {
      setError("Razorpay Key ID is not configured. Please add VITE_RAZORPAY_KEY_ID to your environment variables.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    // In a real application, you should create an order from your backend.
    // For this demonstration, we are using Razorpay checkout without an order_id (which works for simple payments with standard test keys, but is restricted in live mode).
    const options = {
      key: keyId,
      amount: (Number(formData.amount) * 100).toString(), // amount in paise
      currency: "INR",
      name: formData.payeeName || "PaymentMemory",
      description: formData.note || "Transaction",
      handler: function (response: any) {
        setIsProcessing(false);
        onSuccess({
          amount: Number(formData.amount),
          payeeName: formData.payeeName,
          payeeVpa: 'Razorpay',
          note: formData.note,
          upiAppUsed: 'razorpay',
          referenceNumber: response.razorpay_payment_id
        });
      },
      prefill: {
        name: "",
        email: "",
        contact: ""
      },
      notes: {
        address: "PaymentMemory"
      },
      theme: {
        color: "#10b981"
      }
    };

    try {
      const rzp = new Razorpay(options);
      
      rzp.on("payment.failed", function (response: any) {
        setIsProcessing(false);
        setError(`Payment Failed: ${response.error.description}`);
      });
      
      rzp.open();
    } catch (err: any) {
      setIsProcessing(false);
      setError("Failed to initialize Razorpay: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-semibold text-lg">Secure Payment</h3>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text-secondary)]">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Payee Name</label>
            <input 
              type="text" 
              required 
              value={formData.payeeName} 
              onChange={e => setFormData({...formData, payeeName: e.target.value})} 
              className="w-full bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow" 
              placeholder="e.g., John Doe" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Amount (₹)</label>
            <input 
              type="number" 
              required 
              value={formData.amount} 
              onChange={e => setFormData({...formData, amount: e.target.value})} 
              className="w-full text-2xl font-semibold bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Note (Optional)</label>
            <input 
              type="text" 
              value={formData.note} 
              onChange={e => setFormData({...formData, note: e.target.value})} 
              className="w-full bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow" 
              placeholder="e.g., Rent" 
            />
          </div>
          
          <div className="pt-4">
            <button 
              onClick={handlePayment}
              disabled={isProcessing || !formData.amount || !formData.payeeName}
              className={`w-full font-medium py-3 rounded-xl border border-transparent transition-all text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-emerald-500/20`}
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Proceed to Pay'
              )}
            </button>
            <p className="text-xs text-[var(--text-secondary)] text-center mt-5 flex items-center justify-center gap-1">
              Secured by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
