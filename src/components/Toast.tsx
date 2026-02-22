'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
}

interface ToastContextType {
    addToast: (type: Toast['type'], message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => { } });

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: Toast['type'], message: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div style={{
                position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                display: 'flex', flexDirection: 'column', gap: 8,
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} style={{
                        padding: '12px 20px',
                        borderRadius: 'var(--radius-md, 8px)',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 500,
                        minWidth: 280,
                        maxWidth: 420,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        animation: 'toastIn 0.3s ease',
                        background: toast.type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)'
                            : toast.type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                : toast.type === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                    : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    }}>
                        <span style={{ marginRight: 8 }}>
                            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}
                        </span>
                        {toast.message}
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes toastIn {
                    from { transform: translateX(100px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </ToastContext.Provider>
    );
}
