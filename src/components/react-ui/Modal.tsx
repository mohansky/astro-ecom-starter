import React from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className
}: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'modal-box max-w-sm',
    md: 'modal-box max-w-2xl',
    lg: 'modal-box max-w-4xl',
    xl: 'modal-box max-w-6xl'
  };

  return (
    <div className="modal modal-open">
      <div
        className="modal-backdrop bg-black/50"
        onClick={onClose}
      />
      <div className={cn(sizeClasses[size], className)}>
        {title && (
          <div className="modal-header flex items-center justify-between pb-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="btn btn-sm btn-circle btn-ghost"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        )}
        <div className="modal-content py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;