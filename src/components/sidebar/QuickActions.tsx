import { Video, VideoOff, Loader2, AlertTriangle, Shield } from 'lucide-react';
import './QuickActions.scss';

interface QuickActionsProps {
  isOnCall: boolean;
  onRequestCamera: () => void;
  onDispatchEmergency: () => void;
  onContactWarden: () => void;
  isVideoConnecting?: boolean;
  isVideoConnected?: boolean;
}

export const QuickActions = ({
  isOnCall,
  onRequestCamera,
  onDispatchEmergency,
  onContactWarden,
  isVideoConnecting = false,
  isVideoConnected = false,
}: QuickActionsProps) => {
  // Determine camera button state
  const getCameraButtonContent = () => {
    if (isVideoConnecting) {
      return (
        <>
          <Loader2 size={16} className="quick-actions__spinner" />
          <span>Connecting Video...</span>
        </>
      );
    }
    if (isVideoConnected) {
      return (
        <>
          <VideoOff size={16} />
          <span>Video Connected</span>
        </>
      );
    }
    return (
      <>
        <Video size={16} />
        <span>Request Camera Access</span>
      </>
    );
  };

  return (
    <div className={`quick-actions ${!isOnCall ? 'quick-actions--disabled' : ''}`}>
      <span className="quick-actions__label">Quick Actions</span>

      <div className="quick-actions__buttons">
        <button
          className={`quick-actions__btn quick-actions__btn--camera ${isVideoConnected ? 'quick-actions__btn--connected' : ''}`}
          onClick={onRequestCamera}
          disabled={!isOnCall || isVideoConnecting || isVideoConnected}
        >
          {getCameraButtonContent()}
        </button>
        <button
          className="quick-actions__btn quick-actions__btn--emergency"
          onClick={onDispatchEmergency}
          disabled={!isOnCall}
        >
          <AlertTriangle size={16} />
          <span>Dispatch Emergency</span>
        </button>
        <button
          className="quick-actions__btn quick-actions__btn--warden"
          onClick={onContactWarden}
          disabled={!isOnCall}
        >
          <Shield size={16} />
          <span>Contact Warden</span>
        </button>
      </div>
    </div>
  );
};
