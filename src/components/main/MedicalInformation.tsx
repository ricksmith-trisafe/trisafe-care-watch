import { Edit, Printer, FileText, AlertTriangle, ClipboardList } from 'lucide-react';
import { Tile, TileEmptyState } from '../common';
import type { ClinicalSummary, AllergyIntolerance, Condition, MedicationStatement } from '../../types';
import './MedicalInformation.scss';

interface MedicalInformationProps {
  clinicalSummary?: ClinicalSummary | null;
  hasActivePatient?: boolean;
  onEdit?: () => void;
  isLoading?: boolean;
}

// Helper to get display text from CodeableConcept
const getCodeableConceptDisplay = (concept?: { coding?: { display?: string }[]; text?: string }): string => {
  if (!concept) return 'Unknown';
  return concept.text || concept.coding?.[0]?.display || 'Unknown';
};

// Helper to get allergy display info
const getAllergyDisplay = (allergy: AllergyIntolerance) => ({
  name: getCodeableConceptDisplay(allergy.code),
  criticality: allergy.criticality,
  category: allergy.category?.[0],
  status: allergy.clinicalStatus?.coding?.[0]?.code,
});

// Helper to get condition display info
const getConditionDisplay = (condition: Condition) => ({
  name: getCodeableConceptDisplay(condition.code),
  status: condition.clinicalStatus?.coding?.[0]?.code,
  severity: condition.severity?.coding?.[0]?.display || condition.severity?.text,
});

// Helper to get medication display info
const getMedicationDisplay = (med: MedicationStatement) => ({
  name: getCodeableConceptDisplay(med.medicationCodeableConcept),
  status: med.status,
  dosage: med.dosage?.[0]?.text,
});

export const MedicalInformation = ({
  clinicalSummary,
  hasActivePatient = false,
  onEdit,
  isLoading = false,
}: MedicalInformationProps) => {
  // Show empty state when no active patient
  if (!hasActivePatient) {
    return (
      <Tile title="Medical Information" icon={ClipboardList}>
        <TileEmptyState
          icon={FileText}
          title="No active patient"
          description="Medical records will appear when a patient is selected"
        />
      </Tile>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Tile title="Medical Information" icon={ClipboardList}>
        <div className="medical-info__loading">
          <span>Loading clinical data...</span>
        </div>
      </Tile>
    );
  }

  const activeMedications = clinicalSummary?.medications.filter(m => m.status === 'active') || [];
  const allergies = clinicalSummary?.allergies || [];
  const conditions = clinicalSummary?.conditions || [];

  return (
    <Tile
      title="Medical Information"
      icon={ClipboardList}
      actions={[
        { label: 'Edit', icon: Edit, onClick: onEdit },
        { label: 'Print', icon: Printer },
      ]}
    >
      <div className="medical-info__grid">
        <div className="medical-info__field">
          <span className="medical-info__label">Blood Type</span>
          <span className="medical-info__value">{clinicalSummary?.bloodType || 'N/A'}</span>
        </div>
        <div className="medical-info__field">
          <span className="medical-info__label">NHS Number</span>
          <span className="medical-info__value">{clinicalSummary?.nhsNumber || 'N/A'}</span>
        </div>
        <div className="medical-info__field">
          <span className="medical-info__label">GP Practice</span>
          <span className="medical-info__value">{clinicalSummary?.gpPractice || 'N/A'}</span>
        </div>
      </div>

      {/* Medications Section */}
      <div className="medical-info__section">
        <span className="medical-info__section-label">Current Medications</span>
        <div className="medical-info__tags">
          {activeMedications.map((med) => {
            const display = getMedicationDisplay(med);
            return (
              <span key={med._id} className="medical-info__tag medical-info__tag--medication">
                {display.name}
                {display.dosage && <span className="medical-info__tag-detail">{display.dosage}</span>}
              </span>
            );
          })}
          {activeMedications.length === 0 && (
            <span className="medical-info__empty">No medications recorded</span>
          )}
        </div>
      </div>

      {/* Allergies Section */}
      <div className="medical-info__section">
        <span className="medical-info__section-label">Allergies</span>
        <div className="medical-info__tags">
          {allergies.map((allergy) => {
            const display = getAllergyDisplay(allergy);
            const isHighCriticality = display.criticality === 'high';
            return (
              <span
                key={allergy._id}
                className={`medical-info__tag medical-info__tag--allergy ${isHighCriticality ? 'medical-info__tag--critical' : ''}`}
              >
                {isHighCriticality && <AlertTriangle size={12} />}
                {display.name}
                {display.category && <span className="medical-info__tag-category">({display.category})</span>}
              </span>
            );
          })}
          {allergies.length === 0 && (
            <span className="medical-info__empty">No allergies recorded</span>
          )}
        </div>
      </div>

      {/* Conditions Section */}
      <div className="medical-info__section">
        <span className="medical-info__section-label">Medical Conditions</span>
        <div className="medical-info__tags">
          {conditions.map((condition) => {
            const display = getConditionDisplay(condition);
            const isActive = display.status === 'active';
            return (
              <span
                key={condition._id}
                className={`medical-info__tag medical-info__tag--condition ${!isActive ? 'medical-info__tag--resolved' : ''}`}
              >
                {display.name}
                {display.severity && <span className="medical-info__tag-detail">({display.severity})</span>}
                {!isActive && <span className="medical-info__tag-status">(resolved)</span>}
              </span>
            );
          })}
          {conditions.length === 0 && (
            <span className="medical-info__empty">No conditions recorded</span>
          )}
        </div>
      </div>
    </Tile>
  );
};
