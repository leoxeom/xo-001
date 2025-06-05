'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastProps = {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

type ToastContextType = {
  toast: (props: Omit<ToastProps, 'id'>) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = (props: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...props }]);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <Toaster toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const toastVariants = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const getToastStyles = (type: ToastProps['type'] = 'info') => {
  switch (type) {
    case 'success':
      return {
        borderColor: 'border-green-500',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        shadow: 'shadow-neon-green'
      };
    case 'error':
      return {
        borderColor: 'border-red-500',
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        shadow: 'shadow-neon-pink'
      };
    case 'warning':
      return {
        borderColor: 'border-amber-500',
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        shadow: 'shadow-amber-500/30'
      };
    case 'info':
    default:
      return {
        borderColor: 'border-tertiary-500',
        icon: <Info className="h-5 w-5 text-tertiary-500" />,
        shadow: 'shadow-neon-blue'
      };
  }
};

function Toast({ toast, dismiss }: { toast: ToastProps; dismiss: (id: string) => void }) {
  const { id, title, description, type = 'info', duration = 5000, action } = toast;
  const styles = getToastStyles(type);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismiss(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, dismiss]);

  return (
    <motion.div
      layout
      key={id}
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`glassmorphism-dark border ${styles.borderColor} rounded-lg p-4 w-full max-w-sm flex items-start gap-3 ${styles.shadow}`}
    >
      <div className="flex-shrink-0 pt-0.5">{styles.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-xs font-medium text-primary-400 hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => dismiss(id)}
        className="flex-shrink-0 ml-4 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <span className="sr-only">Fermer</span>
        <X className="h-5 w-5" />
      </button>
    </motion.div>
  );
}

export function Toaster({ toasts, dismiss }: { toasts: ToastProps[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} dismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Export un composant React pour faciliter l'importation
import React from 'react';
export { ToastProvider as default };
