import React, { useState, useEffect, useRef } from 'react';
import { listenToDocuments, addDocument, Document, getUserId } from '../lib/db';
import { Folder, Plus, FileText, Search, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function DocumentsVault() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'receipt' as Document['category'],
    file: null as File | null
  });

  useEffect(() => {
    const unsub = listenToDocuments(setDocuments);
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileUrl = reader.result as string;
        await addDocument({
          title: formData.title,
          category: formData.category,
          fileUrl,
          uploadedDate: new Date().toISOString()
        });
        setIsAdding(false);
        setFormData({ title: '', category: 'receipt', file: null });
        setLoading(false);
      };
      reader.readAsDataURL(formData.file);
    } catch (error) {
      console.error('Error uploading document:', error);
      setLoading(false);
    }
  };

  const filtered = documents.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) &&
    (categoryFilter === 'all' || d.category === categoryFilter)
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Documents Vault</h2>
          <p className="text-[var(--text-secondary)]">Securely store and organize your financial files</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)} 
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-colors font-medium"
        >
          {isAdding ? 'Cancel' : <><Plus size={18} /><span>Upload</span></>}
        </button>
      </div>

      {isAdding && (
        <div className="glass-card p-6 animate-in slide-in-from-top-4 fade-in duration-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Document Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., 2023 Tax Return" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize">
                  {['receipt', 'invoice', 'tax', 'insurance', 'bank_statement', 'warranty'].map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div 
              className="border-2 border-dashed border-[var(--card-border)] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setFormData({ ...formData, file, title: formData.title || file.name.split('.')[0] });
                }}
              />
              <FileText size={32} className="text-[var(--text-secondary)] mb-2" />
              <p className="font-medium text-sm">{formData.file ? formData.file.name : 'Click to select a file'}</p>
            </div>

            <button type="submit" disabled={loading || !formData.file} className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors mt-4 flex justify-center items-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Upload Document'}
            </button>
          </form>
        </div>
      )}

      <div className="flex-1 flex flex-col glass-card overflow-hidden">
        <div className="p-4 border-b border-[var(--card-border)] flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..." 
              className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-[var(--card-border)] rounded-xl py-2 pl-10 pr-4 focus:outline-none"
            />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-black/5 dark:bg-white/5 border border-transparent focus:border-[var(--card-border)] rounded-xl py-2 px-4 focus:outline-none capitalize">
            <option value="all">All Categories</option>
            {['receipt', 'invoice', 'tax', 'insurance', 'bank_statement', 'warranty'].map(t => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] space-y-2">
              <Folder size={48} className="opacity-20 mb-2" />
              <p>No documents found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map(doc => (
                <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-xl border border-[var(--card-border)] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" title={doc.title}>{doc.title}</p>
                      <p className="text-xs text-[var(--text-secondary)] capitalize mt-1">{doc.category.replace('_', ' ')}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
