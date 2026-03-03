import { Phone, PhoneOff, Pause, Mic, MicOff, ArrowRightLeft, PhoneOutgoing, CheckCircle } from 'lucide-react';
import './CallControls.scss';

interface CallControlsProps {
  hasIncomingCall: boolean;
  isOnCall: boolean;
  isInAfterCall: boolean;
  isOnHold: boolean;
  isMuted: boolean;
  onAnswer: () => void;
  onHangUp: () => void;
  onHold: () => void;
  onMute: () => void;
  onTransfer: () => void;
  onDial: () => void;
  onGoAvailable: () => void;
}

export const CallControls = ({
  hasIncomingCall,
  isOnCall,
  isInAfterCall,
  isOnHold,
  isMuted,
  onAnswer,
  onHangUp,
  onHold,
  onMute,
  onTransfer,
  onDial,
  onGoAvailable,
}: CallControlsProps) => {
  return (
    <div className="call-controls">
      <span className="call-controls__label">Call Controls</span>

      <div className="call-controls__primary">
        <button
          className="call-controls__btn call-controls__btn--answer"
          onClick={onAnswer}
          disabled={!hasIncomingCall}
        >
          <Phone size={18} />
          <span>Answer</span>
        </button>
        <button
          className="call-controls__btn call-controls__btn--end"
          onClick={onHangUp}
          disabled={!isOnCall}
        >
          <PhoneOff size={18} />
          <span>End</span>
        </button>
        <button
          className={`call-controls__btn call-controls__btn--hold ${isOnHold ? 'active' : ''}`}
          onClick={onHold}
          disabled={!isOnCall}
        >
          <Pause size={18} />
          <span>Hold</span>
        </button>
      </div>

      <div className="call-controls__secondary">
        <button
          className={`call-controls__btn call-controls__btn--secondary ${isMuted ? 'active' : ''}`}
          onClick={onMute}
          disabled={!isOnCall}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          <span>Mute</span>
        </button>
        <button
          className="call-controls__btn call-controls__btn--secondary"
          disabled
        >
          <PhoneOutgoing size={16} />
          <span>Speaker</span>
        </button>
      </div>

      <div className="call-controls__actions">
        <button
          className="call-controls__btn call-controls__btn--action"
          onClick={onTransfer}
          disabled={!isOnCall}
        >
          <ArrowRightLeft size={16} />
          <span>Transfer</span>
        </button>
        <button
          className="call-controls__btn call-controls__btn--action"
          onClick={onDial}
        >
          <Phone size={16} />
          <span>Dial</span>
        </button>
      </div>

      {isInAfterCall && (
        <div className="call-controls__after-call">
          <button
            className="call-controls__btn call-controls__btn--available"
            onClick={onGoAvailable}
          >
            <CheckCircle size={18} />
            <span>Go Available</span>
          </button>
        </div>
      )}
    </div>
  );
};
