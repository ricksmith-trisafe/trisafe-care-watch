import { useState } from 'react';
import { AlertTriangle, Heart, Bell, AlertOctagon, CheckCircle, Loader2 } from 'lucide-react';
import { useGetAlarmsQuery } from '../../services/telecareApi';
import type { TelecareAlarm } from '../../services/telecareApi';
import type { AlarmEscalationData } from '../../hooks/useSocket';
import { AlarmAcknowledgeModal } from './AlarmAcknowledgeModal';
import './RecentAlerts.scss';

interface RecentAlertsProps {
  isOnCall: boolean;
  escalatedAlarms?: AlarmEscalationData[];
  onClearEscalation?: (alarmId: number) => void;
}

export const RecentAlerts = ({
  isOnCall,
  escalatedAlarms = [],
  onClearEscalation
}: RecentAlertsProps) => {
  const [selectedAlarm, setSelectedAlarm] = useState<TelecareAlarm | null>(null);
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);

  const { data: alarms = [], isLoading, refetch } = useGetAlarmsQuery(
    { acknowledged: false, limit: 10 },
    { pollingInterval: 30000 }
  );

  // Format time ago from ISO timestamp
  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Map alarm type to display type
  const getAlarmDisplayType = (alarmType: string): 'fall' | 'heart_rate' | 'emergency' => {
    const type = alarmType?.toLowerCase() || '';
    if (type.includes('fall')) return 'fall';
    if (type.includes('heart') || type.includes('vital')) return 'heart_rate';
    return 'emergency';
  };

  // Get icon for alarm type
  const getAlertIcon = (type: 'fall' | 'heart_rate' | 'emergency') => {
    switch (type) {
      case 'fall':
        return AlertTriangle;
      case 'heart_rate':
        return Heart;
      default:
        return AlertTriangle;
    }
  };

  // Handle acknowledge button click
  const handleAcknowledgeClick = (alarm: TelecareAlarm) => {
    setSelectedAlarm(alarm);
    setShowAcknowledgeModal(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowAcknowledgeModal(false);
    setSelectedAlarm(null);
  };

  // Handle successful acknowledgment
  const handleAcknowledgeSuccess = (alarmId: number) => {
    handleModalClose();
    // Clear from escalated alarms if present
    onClearEscalation?.(alarmId);
    // Refetch alarms list
    refetch();
  };

  // Show escalated alarms prominently regardless of call status
  if (escalatedAlarms.length > 0) {
    return (
      <>
        <div className="recent-alerts recent-alerts--has-escalations">
          <span className="recent-alerts__label">
            <AlertOctagon size={14} className="recent-alerts__label-icon" />
            Escalated Alarms ({escalatedAlarms.length})
          </span>

          <div className="recent-alerts__list">
            {escalatedAlarms.map((escalation) => {
              // Find the full alarm data if available
              const fullAlarm = alarms.find(a => a.id === escalation.alarmId);

              return (
                <div
                  key={escalation.alarmId}
                  className={`recent-alerts__item recent-alerts__item--escalated recent-alerts__item--${escalation.priority}`}
                >
                  <div className="recent-alerts__icon recent-alerts__icon--escalated">
                    <AlertOctagon size={14} />
                  </div>
                  <div className="recent-alerts__content">
                    <div className="recent-alerts__header">
                      <span className="recent-alerts__title">
                        {escalation.priority === 'critical' ? 'CRITICAL: ' : 'URGENT: '}
                        {escalation.alarm.type || 'Alarm'}
                      </span>
                      <span className="recent-alerts__time">{formatTimeAgo(escalation.alarm.receivedAt)}</span>
                    </div>
                    <span className="recent-alerts__location">
                      {escalation.user?.name || escalation.deviceId}
                    </span>
                    <div className="recent-alerts__escalation-info">
                      <span className="recent-alerts__tier">Tier {escalation.tier}</span>
                      {escalation.retryCount > 0 && (
                        <span className="recent-alerts__retry">Retry {escalation.retryCount}</span>
                      )}
                    </div>
                    <button
                      className="recent-alerts__acknowledge"
                      onClick={() => {
                        if (fullAlarm) {
                          handleAcknowledgeClick(fullAlarm);
                        } else {
                          // Create a minimal alarm object for modal
                          handleAcknowledgeClick({
                            id: escalation.alarmId,
                            deviceId: escalation.deviceId,
                            alarmType: escalation.alarm.type,
                            alarmCode: escalation.alarm.code,
                            user: escalation.user || { name: 'Unknown', address: '', phone: '' },
                            receivedAt: escalation.alarm.receivedAt,
                            acknowledged: false,
                          });
                        }
                      }}
                      title="Acknowledge alarm"
                    >
                      <CheckCircle size={12} />
                      <span>Acknowledge</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AlarmAcknowledgeModal
          isOpen={showAcknowledgeModal}
          alarm={selectedAlarm}
          onClose={handleModalClose}
          onSuccess={handleAcknowledgeSuccess}
        />
      </>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="recent-alerts">
        <span className="recent-alerts__label">Recent Alerts</span>
        <div className="recent-alerts__empty">
          <Loader2 size={16} className="recent-alerts__spinner" />
          <span>Loading alerts...</span>
        </div>
      </div>
    );
  }

  // Show empty state when no call and no alarms
  if (!isOnCall && alarms.length === 0) {
    return (
      <div className="recent-alerts recent-alerts--empty">
        <span className="recent-alerts__label">Recent Alerts</span>
        <div className="recent-alerts__empty">
          <Bell size={16} />
          <span>No alerts to display</span>
        </div>
      </div>
    );
  }

  // Show alarms from API
  return (
    <>
      <div className="recent-alerts">
        <span className="recent-alerts__label">
          {alarms.length > 0 ? `Unacknowledged Alarms (${alarms.length})` : 'Recent Alerts'}
        </span>

        {alarms.length === 0 ? (
          <div className="recent-alerts__empty">
            <Bell size={16} />
            <span>No pending alarms</span>
          </div>
        ) : (
          <div className="recent-alerts__list">
            {alarms.map((alarm) => {
              const displayType = getAlarmDisplayType(alarm.alarmType);
              const Icon = getAlertIcon(displayType);

              return (
                <div key={alarm.id} className={`recent-alerts__item ${displayType}`}>
                  <div className="recent-alerts__icon">
                    <Icon size={14} />
                  </div>
                  <div className="recent-alerts__content">
                    <div className="recent-alerts__header">
                      <span className="recent-alerts__title">
                        {alarm.alarmType || 'Alarm'}
                      </span>
                      <span className="recent-alerts__time">{formatTimeAgo(alarm.receivedAt)}</span>
                    </div>
                    <span className="recent-alerts__location">
                      {alarm.user?.name || alarm.deviceId}
                    </span>
                    <button
                      className="recent-alerts__acknowledge"
                      onClick={() => handleAcknowledgeClick(alarm)}
                      title="Acknowledge alarm"
                    >
                      <CheckCircle size={12} />
                      <span>Acknowledge</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlarmAcknowledgeModal
        isOpen={showAcknowledgeModal}
        alarm={selectedAlarm}
        onClose={handleModalClose}
        onSuccess={handleAcknowledgeSuccess}
      />
    </>
  );
};
