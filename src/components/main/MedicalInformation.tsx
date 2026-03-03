import { Edit, Printer, FileText, AlertTriangle, ClipboardList } from 'lucide-react';
import { Tile, TileEmptyState } from '../common';
import type { ClinicalSummary, AllergyIntolerance, Condition, MedicationStatement, MedicalInfo } from '../../types';
import './MedicalInformation.scss';

interface MedicalInformationProps {
  clinicalSummary?: ClinicalSummary | null;
  // Legacy props for backward compatibility
  medicalInfo?: MedicalInfo | null;
  nhsNumber?: string;
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
  medicalInfo,
  nhsNumber,
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

  // Use FHIR data if available, otherwise fall back to legacy
  const hasFhirData = clinicalSummary && (
    clinicalSummary.allergies.length > 0 ||
    clinicalSummary.conditions.length > 0 ||
    clinicalSummary.medications.length > 0
  );

  const displayNhsNumber = clinicalSummary?.nhsNumber || nhsNumber || medicalInfo?.nhsNumber;
  const legacyInfo = clinicalSummary?.legacyMedicalInfo || medicalInfo || {};

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
          <span className="medical-info__value">{legacyInfo.bloodType || 'N/A'}</span>
        </div>
        <div className="medical-info__field">
          <span className="medical-info__label">NHS Number</span>
          <span className="medical-info__value">{displayNhsNumber || 'N/A'}</span>
        </div>
        <div className="medical-info__field">
          <span className="medical-info__label">GP Practice</span>
          <span className="medical-info__value">{legacyInfo.gpPractice || 'N/A'}</span>
        </div>
      </div>

      {/* Medications Section */}
      <div className="medical-info__section">
        <span className="medical-info__section-label">Current Medications</span>
        <div className="medical-info__tags">
          {hasFhirData && clinicalSummary?.medications.filter(m => m.status === 'active').map((med) => {
            const display = getMedicationDisplay(med);
            return (
              <span key={med._id} className="medical-info__tag medical-info__tag--medication">
                {display.name}
                {display.dosage && <span className="medical-info__tag-detail">{display.dosage}</span>}
              </span>
            );
          })}
          {!hasFhirData && legacyInfo.medications?.map((med, index) => (
            <span key={index} className="medical-info__tag medical-info__tag--medication">
              {med}
            </span>
          ))}
          {(hasFhirData
            ? clinicalSummary?.medications.filter(m => m.status === 'active').length === 0
            : (!legacyInfo.medications || legacyInfo.medications.length === 0)
          ) && (
            <span className="medical-info__empty">No medications recorded</span>
          )}
        </div>
      </div>

      {/* Allergies Section */}
      <div className="medical-info__section">
        <span className="medical-info__section-label">Allergies</span>
        <div className="medical-info__tags">
          {hasFhirData && clinicalSummary?.allergies.map((allergy) => {
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
          {!hasFhirData && legacyInfo.allergies?.map((allergy, index) => (
            <span key={index} className="medical-info__tag medical-info__tag--allergy">
              {allergy}
            </span>
          ))}
          {(hasFhirData
            ? clinicalSummary?.allergies.length === 0
            : (!legacyInfo.allergies || legacyInfo.allergies.length === 0)
          ) && (
            <span className="medical-info__empty">No allergies recorded</span>
          )}
        </div>
      </div>

      {/* Conditions Section */}
      <div className="medical-info__section">
        <span className="medical-info__section-label">Medical Conditions</span>
        <div className="medical-info__tags">
          {hasFhirData && clinicalSummary?.conditions.map((condition) => {
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
          {!hasFhirData && legacyInfo.conditions?.map((condition, index) => (
            <span key={index} className="medical-info__tag medical-info__tag--condition">
              {condition}
            </span>
          ))}
          {(hasFhirData
            ? clinicalSummary?.conditions.length === 0
            : (!legacyInfo.conditions || legacyInfo.conditions.length === 0)
          ) && (
            <span className="medical-info__empty">No conditions recorded</span>
          )}
        </div>
      </div>
    </Tile>
  );
};
