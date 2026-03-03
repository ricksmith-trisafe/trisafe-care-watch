import { useState } from 'react';
import { AlertOctagon, X, Loader2 } from 'lucide-react';
import { useGetOutcomeCodesQuery, useAcknowledgeAlarmMutation } from '../../services/telecareApi';
import type { TelecareAlarm } from '../../services/telecareApi';
import './AlarmAcknowledgeModal.scss';

interface AlarmAcknowledgeModalProps {
  isOpen: boolean;
  alarm: TelecareAlarm | null;
  onClose: () => void;
  onSuccess: (alarmId: number) => void;
}

export const AlarmAcknowledgeModal = ({
  isOpen,
  alarm,
  onClose,
  onSuccess,
}: AlarmAcknowledgeModalProps) => {
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [notes, setNotes] = useState('');

  const { data: outcomeCodes = [], isLoading: isLoadingCodes } = useGetOutcomeCodesQuery();
  const [acknowledgeAlarm, { isLoading: isSubmitting }] = useAcknowledgeAlarmMutation();

  if (!isOpen || !alarm) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOutcome) return;

    try {
      await acknowledgeAlarm({
        alarmId: alarm.id,
        outcomeCode: selectedOutcome,
        notes: notes.trim() || undefined,
      }).unwrap();

      // Reset form
      setSelectedOutcome('');
      setNotes('');

      // Notify parent of success
      onSuccess(alarm.id);
    } catch (error) {
      console.error('Failed to acknowledge alarm:', error);
    }
  };

  const handleClose = () => {
    setSelectedOutcome('');
    setNotes('');
    onClose();
  };

  // Format time for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="alarm-ack-modal__overlay" onClick={handleClose}>
      <div className="alarm-ack-modal" onClick={(e) => e.stopPropagation()}>
        <button className="alarm-ack-modal__close" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="alarm-ack-modal__header">
          <div className="alarm-ack-modal__icon">
            <AlertOctagon size={24} />
          </div>
          <h2 className="alarm-ack-modal__title">Acknowledge Alarm</h2>
        </div>

        <div className="alarm-ack-modal__details">
          <div className="alarm-ack-modal__detail">
            <span className="alarm-ack-modal__detail-label">Type</span>
            <span className="alarm-ack-modal__detail-value">{alarm.alarmType || 'Unknown'}</span>
          </div>
          <div className="alarm-ack-modal__detail">
            <span className="alarm-ack-modal__detail-label">Service User</span>
            <span className="alarm-ack-modal__detail-value">{alarm.user?.name || 'Unknown'}</span>
          </div>
          <div className="alarm-ack-modal__detail">
            <span className="alarm-ack-modal__detail-label">Device</span>
            <span className="alarm-ack-modal__detail-value">{alarm.deviceId}</span>
          </div>
          <div className="alarm-ack-modal__detail">
            <span className="alarm-ack-modal__detail-label">Received</span>
            <span className="alarm-ack-modal__detail-value">{formatTime(alarm.receivedAt)}</span>
          </div>
        </div>

        <form className="alarm-ack-modal__form" onSubmit={handleSubmit}>
          <div className="alarm-ack-modal__field">
            <label className="alarm-ack-modal__label" htmlFor="outcome">
              Outcome <span className="alarm-ack-modal__required">*</span>
            </label>
            {isLoadingCodes ? (
              <div className="alarm-ack-modal__loading">
                <Loader2 size={16} className="alarm-ack-modal__spinner" />
                <span>Loading outcomes...</span>
              </div>
            ) : (
              <select
                id="outcome"
                className="alarm-ack-modal__select"
                value={selectedOutcome}
                onChange={(e) => setSelectedOutcome(e.target.value)}
                required
              >
                <option value="">Select an outcome...</option>
                {outcomeCodes.map((code) => (
                  <option key={code.code} value={code.code}>
                    {code.label}
                  </option>
                ))}
              </select>
            )}
            {selectedOutcome && outcomeCodes.find(c => c.code === selectedOutcome)?.requires_followup && (
              <span className="alarm-ack-modal__followup-notice">
                This outcome requires follow-up action
              </span>
            )}
          </div>

          <div className="alarm-ack-modal__field">
            <label className="alarm-ack-modal__label" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              className="alarm-ack-modal__textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this alarm..."
              rows={3}
            />
          </div>

          <div className="alarm-ack-modal__actions">
            <button
              type="button"
              className="alarm-ack-modal__btn alarm-ack-modal__btn--cancel"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="alarm-ack-modal__btn alarm-ack-modal__btn--submit"
              disabled={!selectedOutcome || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="alarm-ack-modal__spinner" />
                  <span>Acknowledging...</span>
                </>
              ) : (
                <span>Acknowledge Alarm</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
