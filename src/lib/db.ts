import { db, auth } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { Transaction, Bill, Budget, UserProfile, Account, Document } from '../types';

export * from '../types';

// Helpers
export const getUserId = () => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  return auth.currentUser.uid;
};

// Listeners
export const listenToTransactions = (callback: (txs: Transaction[]) => void) => {
  const q = query(collection(db, 'transactions'), where('uid', '==', getUserId()));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    callback(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  });
};

export const listenToBills = (callback: (bills: Bill[]) => void) => {
  const q = query(collection(db, 'bills'), where('uid', '==', getUserId()));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
    callback(data.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
  });
};

export const listenToBudgets = (callback: (budgets: Budget[]) => void) => {
  const q = query(collection(db, 'budgets'), where('uid', '==', getUserId()));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
    callback(data);
  });
};

export const listenToAccounts = (callback: (accs: Account[]) => void) => {
  const q = query(collection(db, 'accounts'), where('uid', '==', getUserId()));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
    callback(data);
  });
};

export const listenToDocuments = (callback: (docs: Document[]) => void) => {
  const q = query(collection(db, 'documents'), where('uid', '==', getUserId()));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
    callback(data.sort((a, b) => new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime()));
  });
};

// Writers
export const addTransaction = async (data: Omit<Transaction, 'uid' | 'createdAt' | 'updatedAt' | 'id'>) => {
  const docRef = doc(collection(db, 'transactions'));
  const now = new Date().toISOString();
  await setDoc(docRef, { ...data, uid: getUserId(), createdAt: now, updatedAt: now });
};

export const updateTransaction = async (id: string, data: Partial<Transaction>) => {
  const docRef = doc(db, 'transactions', id);
  await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
};

export const deleteTransaction = async (id: string) => {
  await deleteDoc(doc(db, 'transactions', id));
};

export const addBill = async (data: Omit<Bill, 'uid' | 'createdAt' | 'updatedAt' | 'id'>) => {
  const docRef = doc(collection(db, 'bills'));
  const now = new Date().toISOString();
  await setDoc(docRef, { ...data, uid: getUserId(), createdAt: now, updatedAt: now });
};

export const updateBill = async (id: string, data: Partial<Bill>) => {
  const docRef = doc(db, 'bills', id);
  await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
};

export const addBudget = async (data: Omit<Budget, 'uid' | 'createdAt' | 'updatedAt' | 'id'>) => {
  const docRef = doc(collection(db, 'budgets'));
  const now = new Date().toISOString();
  await setDoc(docRef, { ...data, uid: getUserId(), createdAt: now, updatedAt: now });
};

export const addAccount = async (data: Omit<Account, 'uid' | 'createdAt' | 'updatedAt' | 'id'>) => {
  const docRef = doc(collection(db, 'accounts'));
  const now = new Date().toISOString();
  await setDoc(docRef, { ...data, uid: getUserId(), createdAt: now, updatedAt: now });
};

export const updateAccount = async (id: string, data: Partial<Account>) => {
  const docRef = doc(db, 'accounts', id);
  await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
};

export const addDocument = async (data: Omit<Document, 'uid' | 'createdAt' | 'updatedAt' | 'id'>) => {
  const docRef = doc(collection(db, 'documents'));
  const now = new Date().toISOString();
  await setDoc(docRef, { ...data, uid: getUserId(), createdAt: now, updatedAt: now });
};

export const deleteDocument = async (id: string) => {
  await deleteDoc(doc(db, 'documents', id));
};
