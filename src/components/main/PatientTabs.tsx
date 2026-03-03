import { X, Plus } from 'lucide-react';
import type { Patient } from '../../types';
import { formatPatientName } from '../../utils/formatters';
import './PatientTabs.scss';

interface ActivePatientTab {
  id: string;
  patient: Patient;
  isActive: boolean;
}

interface PatientTabsProps {
  patients: ActivePatientTab[];
  currentPatientId: string | null;
  onPatientSelect: (patientId: string) => void;
  onPatientClose: (patientId: string) => void;
  onAddPatient: () => void;
}

export const PatientTabs = ({
  patients,
  currentPatientId,
  onPatientSelect,
  onPatientClose,
  onAddPatient,
}: PatientTabsProps) => {
  return (
    <div className="patient-tabs">
      {patients.map((tab) => (
        <div
          key={tab.id}
          className={`patient-tabs__tab ${tab.id === currentPatientId ? 'active' : ''}`}
          onClick={() => onPatientSelect(tab.id)}
        >
          <span className="patient-tabs__name">{formatPatientName(tab.patient)}</span>
          {tab.isActive && <span className="patient-tabs__indicator" />}
          <button
            className="patient-tabs__close"
            onClick={(e) => {
              e.stopPropagation();
              onPatientClose(tab.id);
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button className="patient-tabs__add" onClick={onAddPatient}>
        <Plus size={16} />
      </button>
    </div>
  );
};
