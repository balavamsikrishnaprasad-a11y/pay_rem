import React, { useRef, useState } from 'react';
import { Camera, Upload, Loader2, X } from 'lucide-react';
import { getUserId, addTransaction } from '../lib/db';

interface ReceiptScannerProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ReceiptScanner({ onSuccess, onCancel }: ReceiptScannerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<any | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Str = reader.result as string;
        setImagePreview(base64Str);
        
        const mimeType = file.type;
        const base64Data = base64Str.split(',')[1];

        try {
          const res = await fetch('/api/gemini/scan-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data, mimeType })
          });

          if (!res.ok) throw new Error('Failed to scan receipt');
          
          const { results } = await res.json();
          setDraft(results);
        } catch (err: any) {
          setError(err.message || 'Error scanning receipt');
        } finally {
          setLoading(false);
        }
      };
    } catch (err: any) {
      setError('Error reading file');
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!draft || !imagePreview) return;
    setLoading(true);
    try {
      const uid = getUserId();
      // Store image directly as base64 string for this prototype
      const receiptUrl = imagePreview;

      // Create transaction
      await addTransaction({
        type: 'expense',
        amount: draft.totalAmount || 0,
        category: 'Uncategorized',
        date: draft.date || new Date().toISOString().split('T')[0],
        source: 'receipt-scan',
        merchant: draft.merchant || 'Unknown Merchant',
        paymentMethod: draft.paymentMethod || '',
        note: `Tax: ${draft.taxAmount || 0}\nItems: ${draft.lineItems?.map((i: any) => `${i.name} (${i.price})`).join(', ')}`,
        receiptUrl
      });
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
      setLoading(false);
    }
  };

  if (draft) {
    return (
      <div className="glass-card p-6 w-full max-w-lg mx-auto mt-4">
        <h3 className="text-xl font-semibold mb-4">Confirm Receipt Details</h3>
        
        {imagePreview && (
          <img src={imagePreview} alt="Receipt preview" className="w-full h-48 object-cover rounded-xl mb-6" />
        )}

        <div className="space-y-4 text-sm mb-6">
          <div className="flex justify-between border-b border-[var(--card-border)] pb-2">
            <span className="text-[var(--text-secondary)]">Merchant</span>
            <span className="font-medium">{draft.merchant}</span>
          </div>
          <div className="flex justify-between border-b border-[var(--card-border)] pb-2">
            <span className="text-[var(--text-secondary)]">Total Amount</span>
            <span className="font-medium">₹{draft.totalAmount}</span>
          </div>
          <div className="flex justify-between border-b border-[var(--card-border)] pb-2">
            <span className="text-[var(--text-secondary)]">Tax</span>
            <span className="font-medium">₹{draft.taxAmount || 0}</span>
          </div>
          <div className="flex justify-between border-b border-[var(--card-border)] pb-2">
            <span className="text-[var(--text-secondary)]">Date</span>
            <span className="font-medium">{draft.date}</span>
          </div>
          
          {draft.lineItems && draft.lineItems.length > 0 && (
            <div className="pt-2">
              <span className="text-[var(--text-secondary)] block mb-2">Line Items</span>
              <ul className="space-y-1">
                {draft.lineItems.map((item: any, i: number) => (
                  <li key={i} className="flex justify-between text-xs">
                    <span>{item.name}</span>
                    <span>₹{item.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex gap-4">
          <button onClick={() => setDraft(null)} disabled={loading} className="flex-1 px-4 py-2 border border-[var(--card-border)] rounded-xl text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            Discard
          </button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm & Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 w-full max-w-lg mx-auto text-center space-y-6 mt-4 relative">
      <button onClick={onCancel} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)]">
        <X size={20} />
      </button>

      <h3 className="text-xl font-semibold">Scan a Receipt</h3>
      <p className="text-[var(--text-secondary)] text-sm">Upload a photo or PDF to automatically extract merchant, date, and items.</p>
      
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <input 
        type="file" 
        accept="image/*,application/pdf" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={40} className="animate-spin text-emerald-500 mb-4" />
          <p className="text-[var(--text-secondary)] animate-pulse">Analyzing receipt with Gemini AI...</p>
        </div>
      ) : (
        <div className="flex gap-4 justify-center">
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--card-border)] rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group w-40">
            <Upload size={32} className="text-[var(--text-secondary)] group-hover:text-emerald-500 mb-2" />
            <span className="text-sm font-medium">Upload File</span>
          </button>
          
          <button onClick={() => { /* Mobile devices can handle 'capture' attribute, but let's just use same input for now */ fileInputRef.current?.click(); }} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--card-border)] rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group w-40">
            <Camera size={32} className="text-[var(--text-secondary)] group-hover:text-emerald-500 mb-2" />
            <span className="text-sm font-medium">Take Photo</span>
          </button>
        </div>
      )}
    </div>
  );
}
