import type { ReactNode } from 'react';
import { LuX } from 'react-icons/lu';
import { typeScale } from '../../theme';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export const Modal = ({ open, onClose, title, children }: ModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded border border-black bg-white p-6 shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          {title && <h2 className={typeScale.panelTitle}>{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted transition-colors hover:text-ink"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};
