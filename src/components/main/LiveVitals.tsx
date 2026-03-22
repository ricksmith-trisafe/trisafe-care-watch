import { Heart, Moon, Footprints, HeartPulse, FileText, Activity, type LucideIcon } from 'lucide-react';
import { Tile, TileEmptyState } from '../common';
import type { Vitals, SleepSummary, ActivitySummary, EcgSummary } from '../../types';
import './LiveVitals.scss';

interface LiveVitalsProps {
  vitals: Vitals | null;
  sleep: SleepSummary | null;
  activity: ActivitySummary | null;
  ecg: EcgSummary | null;
  hasActivePatient?: boolean;
  isLoading?: boolean;
  onViewHealthReport?: () => void;
}

interface VitalCardProps {
  icon: LucideIcon;
  iconClass: string;
  value: string | number;
  label: string;
  sublabel?: string;
  status?: string;
  statusLabel?: string;
  cardStatus?: string;
}

const VitalCard = ({ icon: Icon, iconClass, value, label, sublabel, status, statusLabel, cardStatus = '' }: VitalCardProps) => (
  <div className={`live-vitals__card ${cardStatus}`}>
    <div className={`live-vitals__card-icon ${iconClass}`}>
      <Icon size={20} />
    </div>
    <div className="live-vitals__card-content">
      <span className="live-vitals__card-value">{value}</span>
      <span className="live-vitals__card-label">{label}</span>
      {sublabel && <span className="live-vitals__card-sublabel">{sublabel}</span>}
    </div>
    {status && statusLabel && (
      <span className={`live-vitals__status-badge ${status}`}>{statusLabel}</span>
    )}
  </div>
);

const formatSleepDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const formatEcgClassification = (classification: string) => {
  const labels: Record<string, string> = {
    sinus_rhythm: 'Sinus Rhythm',
    atrial_fibrillation: 'AFib Detected',
    inconclusive: 'Inconclusive',
    low_heart_rate: 'Low HR',
    high_heart_rate: 'High HR',
    high_heart_rate_no_afib: 'High HR (No AFib)',
    atrial_fibrillation_high_heart_rate: 'AFib + High HR',
    poor_recording: 'Poor Recording',
  };
  return labels[classification] ?? classification;
};

const getEcgStatus = (classification: string) => {
  if (classification === 'sinus_rhythm') return 'normal';
  if (classification === 'atrial_fibrillation' || classification === 'atrial_fibrillation_high_heart_rate') return 'high';
  return 'elevated';
};

export const LiveVitals = ({ vitals, sleep, activity, ecg, /* hasActivePatient = false, */ isLoading = false, onViewHealthReport }: LiveVitalsProps) => {
  // if (!hasActivePatient) {
  //   return (
  //     <Tile title="Live Vitals Monitoring" icon={Activity}>
  //       <TileEmptyState
  //         icon={Activity}
  //         title="No active patient"
  //         description="Vitals will appear when a patient is selected"
  //       />
  //     </Tile>
  //   );
  // }

  if (!isLoading && !vitals && !sleep && !activity && !ecg) {
    return (
      <Tile title="Live Vitals Monitoring" icon={Activity}>
        <TileEmptyState
          icon={Activity}
          title="No vitals data"
          description="No Withings readings have been recorded for this patient"
        />
      </Tile>
    );
  }

  const getHeartRateStatus = (rate: number) => {
    if (rate < 60) return 'low';
    if (rate > 100) return 'high';
    return 'normal';
  };

  const hrStatus = vitals?.heartRate ? getHeartRateStatus(vitals.heartRate) : 'normal';
  const ecgStatus = ecg?.classification ? getEcgStatus(ecg.classification) : 'normal';

  return (
    <Tile
      title="Live Vitals Monitoring"
      icon={Activity}
      className="live-vitals"
      actions={[
        { label: 'View Health Report', icon: FileText, onClick: onViewHealthReport },
      ]}
    >
      <div className="live-vitals__grid">
        <VitalCard
          icon={Heart}
          iconClass="heart"
          value={vitals?.heartRate ?? '—'}
          label="Heart Rate (bpm)"
          cardStatus={hrStatus}
          status={hrStatus}
          statusLabel={hrStatus === 'normal' ? 'Normal' : hrStatus === 'high' ? 'Alert' : 'Low'}
        />
        <VitalCard
          icon={Moon}
          iconClass="sleep"
          value={sleep?.duration != null ? formatSleepDuration(sleep.duration) : '—'}
          label="Sleep"
          sublabel={sleep?.score != null ? `Score: ${sleep.score}` : undefined}
          cardStatus={sleep?.duration != null ? 'normal' : ''}
        />
        <VitalCard
          icon={HeartPulse}
          iconClass="ecg"
          value={ecg?.heartRate ?? '—'}
          label="ECG (bpm)"
          sublabel={ecg?.classification ? formatEcgClassification(ecg.classification) : undefined}
          cardStatus={ecgStatus}
          status={ecg?.classification ? ecgStatus : undefined}
          statusLabel={ecg?.classification ? (ecgStatus === 'normal' ? 'Normal' : ecgStatus === 'high' ? 'Alert' : 'Review') : undefined}
        />
        <VitalCard
          icon={Footprints}
          iconClass="activity"
          value={activity?.steps != null ? activity.steps.toLocaleString() : '—'}
          label="Steps"
          sublabel={activity?.calories != null ? `${Math.round(activity.calories).toLocaleString()} kcal` : undefined}
          cardStatus="normal"
        />
      </div>
    </Tile>
  );
};
