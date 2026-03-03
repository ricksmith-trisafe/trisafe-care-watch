import { useState } from 'react';
import { Phone, AlertCircle, PhoneCall } from 'lucide-react';
import { CurrentPatient } from './CurrentPatient';
import { CallControls } from './CallControls';
import { QuickActions } from './QuickActions';
import { DeviceStatus } from './DeviceStatus';
import { RecentAlerts } from './RecentAlerts';
import type { Patient, Device, AgentStatus } from '../../types';
import type { AlarmEscalationData } from '../../hooks/useSocket';
import './LeftSidebar.scss';

// UK phone number regex - matches 07xxx, +447xxx, or 447xxx formats
const UK_PHONE_REGEX = /^(?:(?:\+44|44|0)7\d{9})$/;

// Validate and normalize UK phone number to +44 format
const normalizeUKPhoneNumber = (phone: string): { valid: boolean; normalized: string } => {
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Check if it matches UK mobile format
  if (!UK_PHONE_REGEX.test(cleaned)) {
    return { valid: false, normalized: '' };
  }

  // Normalize to +44 format
  if (cleaned.startsWith('+44')) {
    return { valid: true, normalized: cleaned };
  } else if (cleaned.startsWith('44')) {
    return { valid: true, normalized: '+' + cleaned };
  } else if (cleaned.startsWith('0')) {
    return { valid: true, normalized: '+44' + cleaned.slice(1) };
  }

  return { valid: false, normalized: '' };
};

interface LeftSidebarProps {
  patient: Patient | null;
  devices: Device[];
  agentStatus: AgentStatus;
  isOnHold: boolean;
  isMuted: boolean;
  onAnswer: () => void;
  onHangUp: () => void;
  onHold: () => void;
  onMute: () => void;
  onTransfer: () => void;
  onDial: () => void;
  onMakeCall: (phoneNumber: string) => void;
  onGoAvailable: () => void;
  onRequestCamera: () => void;
  onDispatchEmergency: () => void;
  onContactWarden: () => void;
  onTriggerEmergencyCall: () => void;
  isEmergencyCallLoading?: boolean;
  isVideoConnecting?: boolean;
  isVideoConnected?: boolean;
  escalatedAlarms?: AlarmEscalationData[];
  onClearEscalation?: (alarmId: number) => void;
}

export const LeftSidebar = ({
  patient,
  devices,
  agentStatus,
  isOnHold,
  isMuted,
  onAnswer,
  onHangUp,
  onHold,
  onMute,
  onTransfer,
  onDial,
  onMakeCall,
  onGoAvailable,
  onRequestCamera,
  onDispatchEmergency,
  onContactWarden,
  onTriggerEmergencyCall,
  isEmergencyCallLoading = false,
  isVideoConnecting = false,
  isVideoConnected = false,
  escalatedAlarms = [],
  onClearEscalation,
}: LeftSidebarProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const hasIncomingCall = agentStatus === 'INCOMING';
  const isOnCall = agentStatus === 'INCOMING' || agentStatus === 'OUTGOING' || agentStatus === 'HOLD';
  const isInAfterCall = agentStatus === 'AFTER_CALL';

  const handleMakeCall = () => {
    const number = phoneNumber.trim();
    if (!number) return;

    const { valid, normalized } = normalizeUKPhoneNumber(number);

    if (!valid) {
      setPhoneError('Enter a valid UK mobile number');
      return;
    }

    console.log('Making call to:', normalized);
    setPhoneError('');
    onMakeCall(normalized);
    setPhoneNumber('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
    if (phoneError) setPhoneError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && phoneNumber.trim()) {
      handleMakeCall();
    }
  };

  return (
    <aside className="left-sidebar">
      <CurrentPatient patient={patient} agentStatus={agentStatus} />

      {patient && !isOnCall && !isInAfterCall && (
        <div className="left-sidebar__emergency-call">
          <button
            className="left-sidebar__emergency-call-btn"
            onClick={onTriggerEmergencyCall}
            disabled={isEmergencyCallLoading}
          >
            <PhoneCall size={16} />
            <span>{isEmergencyCallLoading ? 'Calling...' : 'Emergency Call Patient'}</span>
          </button>
        </div>
      )}

      <CallControls
        hasIncomingCall={hasIncomingCall}
        isOnCall={isOnCall}
        isInAfterCall={isInAfterCall}
        isOnHold={isOnHold}
        isMuted={isMuted}
        onAnswer={onAnswer}
        onHangUp={onHangUp}
        onHold={onHold}
        onMute={onMute}
        onTransfer={onTransfer}
        onDial={onDial}
        onGoAvailable={onGoAvailable}
      />

      <div className="left-sidebar__outbound">
        <span className="left-sidebar__outbound-label">Outbound Call</span>
        <div className="left-sidebar__outbound-input">
          <input
            type="tel"
            placeholder="07700 900123"
            className={`left-sidebar__phone-input ${phoneError ? 'left-sidebar__phone-input--error' : ''}`}
            value={phoneNumber}
            onChange={handlePhoneChange}
            onKeyDown={handleKeyDown}
          />
        </div>
        {phoneError && (
          <div className="left-sidebar__phone-error">
            <AlertCircle size={12} />
            <span>{phoneError}</span>
          </div>
        )}
        <button
          className="left-sidebar__call-btn"
          onClick={handleMakeCall}
          disabled={!phoneNumber.trim()}
        >
          <Phone size={16} />
          <span>Make Call</span>
        </button>
      </div>

      <QuickActions
        isOnCall={isOnCall}
        onRequestCamera={onRequestCamera}
        onDispatchEmergency={onDispatchEmergency}
        onContactWarden={onContactWarden}
        isVideoConnecting={isVideoConnecting}
        isVideoConnected={isVideoConnected}
      />

      <DeviceStatus devices={devices} isOnCall={isOnCall} />

      <RecentAlerts
        isOnCall={isOnCall}
        escalatedAlarms={escalatedAlarms}
        onClearEscalation={onClearEscalation}
      />
    </aside>
  );
};
