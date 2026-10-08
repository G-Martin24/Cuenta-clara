import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Eliminar definitivamente',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 stroke-[2]" />
          </div>

          <h3 className="text-center text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {message}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>{loading ? 'Eliminando...' : confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
