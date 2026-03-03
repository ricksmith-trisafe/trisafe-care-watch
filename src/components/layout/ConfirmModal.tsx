import { AlertTriangle } from 'lucide-react';
import './ConfirmModal.scss';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'warning' | 'danger';
  showCancel?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning',
  showCancel = true,
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal__overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-modal__icon confirm-modal__icon--${variant}`}>
          <AlertTriangle size={24} />
        </div>
        <h3 className="confirm-modal__title">{title}</h3>
        <p className="confirm-modal__message">{message}</p>
        <div className={`confirm-modal__actions ${!showCancel ? 'confirm-modal__actions--single' : ''}`}>
          {showCancel && (
            <button
              className="confirm-modal__btn confirm-modal__btn--cancel"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
          )}
          <button
            className={`confirm-modal__btn confirm-modal__btn--confirm confirm-modal__btn--${variant}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
