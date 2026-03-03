import { Activity, Heart, Phone } from 'lucide-react';
import type { Patient, AgentStatus } from '../../types';
import { formatPatientName, formatAge, getPatientIdentifier } from '../../utils/formatters';
import './CurrentPatient.scss';

interface CurrentPatientProps {
  patient: Patient | null;
  agentStatus: AgentStatus;
}

export const CurrentPatient = ({ patient, agentStatus }: CurrentPatientProps) => {
  const age = patient?.birthDate ? formatAge(patient.birthDate) : null;
  const isOnCall = agentStatus === 'INCOMING' || agentStatus === 'OUTGOING';
  const isOnHold = agentStatus === 'HOLD';
  const isInAfterCall = agentStatus === 'AFTER_CALL';
  const isActive = isOnCall || isOnHold || isInAfterCall;

  // Get status text and modifier class
  const getStatusInfo = () => {
    switch (agentStatus) {
      case 'INCOMING':
      case 'OUTGOING':
        return { text: 'On Call', modifier: '' };
      case 'HOLD':
        return { text: 'On Hold', modifier: 'current-patient__status--hold' };
      case 'AFTER_CALL':
        return { text: 'After Call', modifier: 'current-patient__status--after-call' };
      default:
        return { text: 'Waiting', modifier: 'current-patient__status--waiting' };
    }
  };

  const statusInfo = getStatusInfo();

  // Waiting state - no active call and no patient
  if (!isActive && !patient) {
    return (
      <div className="current-patient current-patient--waiting">
        <div className="current-patient__header">
          <span className="current-patient__label">Current Patient</span>
          <span className="current-patient__status current-patient__status--waiting">Waiting</span>
        </div>

        <div className="current-patient__empty">
          <div className="current-patient__empty-icon">
            <Phone size={24} />
          </div>
          <p className="current-patient__empty-text">Waiting for incoming call...</p>
          <p className="current-patient__empty-subtext">Patient info will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`current-patient ${isOnCall ? 'current-patient--active' : ''} ${isOnHold ? 'current-patient--hold' : ''} ${isInAfterCall ? 'current-patient--after-call' : ''}`}>
      <div className="current-patient__header">
        <span className="current-patient__label">Current Patient</span>
        <span className={`current-patient__status ${statusInfo.modifier}`}>
          {statusInfo.text}
        </span>
      </div>

      <div className="current-patient__info">
        <div className="current-patient__avatar">
          {patient?.photo ? (
            <img src={patient.photo} alt="" />
          ) : (
            <span>{formatPatientName(patient)?.[0] || '?'}</span>
          )}
        </div>
        <div className="current-patient__details">
          <h3 className="current-patient__name">{formatPatientName(patient)}</h3>
          <p className="current-patient__meta">
            {age !== null && `Age: ${age}`}
            {age !== null && patient?._id && ' | '}
            {patient?._id && `ID: PT-${getPatientIdentifier(patient)}`}
          </p>
          <p className="current-patient__device">Device: Smart Pendant</p>
        </div>
      </div>

      <div className="current-patient__vitals">
        <div className="current-patient__vital">
          <Activity size={14} />
          <span className="current-patient__vital-label">Blood Pressure</span>
          <span className="current-patient__vital-value">142/88</span>
        </div>
        <div className="current-patient__vital">
          <Heart size={14} />
          <span className="current-patient__vital-label">Heart Rate</span>
          <span className="current-patient__vital-value">78 bpm</span>
        </div>
      </div>
    </div>
  );
};
