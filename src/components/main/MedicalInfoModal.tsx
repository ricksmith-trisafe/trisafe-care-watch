import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { ClinicalSummary, AllergyIntolerance, Condition, MedicationStatement, MedicalInfo } from '../../types';
import './MedicalInfoModal.scss';

// Form data types for FHIR resources
export interface AllergyFormItem {
  id?: string;
  _id?: string;
  name: string;
  criticality: 'low' | 'high' | 'unable-to-assess';
  category: 'food' | 'medication' | 'environment' | 'biologic';
  isNew?: boolean;
  toDelete?: boolean;
}

export interface ConditionFormItem {
  id?: string;
  _id?: string;
  name: string;
  status: 'active' | 'resolved';
  isNew?: boolean;
  toDelete?: boolean;
}

export interface MedicationFormItem {
  id?: string;
  _id?: string;
  name: string;
  dosage: string;
  status: 'active' | 'stopped';
  isNew?: boolean;
  toDelete?: boolean;
}

export interface ClinicalFormData {
  bloodType: string;
  nhsNumber: string;
  gpPractice: string;
  allergies: AllergyFormItem[];
  conditions: ConditionFormItem[];
  medications: MedicationFormItem[];
}

interface MedicalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClinicalFormData) => void;
  clinicalSummary?: ClinicalSummary | null;
  // Legacy props for backward compatibility
  initialData?: MedicalInfo | null;
  nhsNumber?: string;
  isLoading?: boolean;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const ALLERGY_CATEGORIES: AllergyFormItem['category'][] = ['medication', 'food', 'environment', 'biologic'];
const CRITICALITY_OPTIONS: AllergyFormItem['criticality'][] = ['low', 'high', 'unable-to-assess'];

// Helper to extract display text from CodeableConcept
const getCodeableConceptText = (concept?: { coding?: { display?: string }[]; text?: string }): string => {
  if (!concept) return '';
  return concept.text || concept.coding?.[0]?.display || '';
};

// Convert FHIR AllergyIntolerance to form item
const allergyToFormItem = (allergy: AllergyIntolerance): AllergyFormItem => ({
  id: allergy.id,
  _id: allergy._id,
  name: getCodeableConceptText(allergy.code),
  criticality: allergy.criticality || 'low',
  category: allergy.category?.[0] || 'medication',
});

// Convert FHIR Condition to form item
const conditionToFormItem = (condition: Condition): ConditionFormItem => ({
  id: condition.id,
  _id: condition._id,
  name: getCodeableConceptText(condition.code),
  status: condition.clinicalStatus?.coding?.[0]?.code === 'active' ? 'active' : 'resolved',
});

// Convert FHIR MedicationStatement to form item
const medicationToFormItem = (med: MedicationStatement): MedicationFormItem => ({
  id: med.id,
  _id: med._id,
  name: getCodeableConceptText(med.medicationCodeableConcept),
  dosage: med.dosage?.[0]?.text || '',
  status: med.status === 'active' ? 'active' : 'stopped',
});

export const MedicalInfoModal = ({
  isOpen,
  onClose,
  onSave,
  clinicalSummary,
  initialData,
  nhsNumber = '',
  isLoading = false,
}: MedicalInfoModalProps) => {
  const [formData, setFormData] = useState<ClinicalFormData>({
    bloodType: '',
    nhsNumber: '',
    gpPractice: '',
    allergies: [],
    conditions: [],
    medications: [],
  });

  // New item inputs
  const [newAllergy, setNewAllergy] = useState({ name: '', criticality: 'low' as AllergyFormItem['criticality'], category: 'medication' as AllergyFormItem['category'] });
  const [newCondition, setNewCondition] = useState({ name: '', status: 'active' as ConditionFormItem['status'] });
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', status: 'active' as MedicationFormItem['status'] });

  useEffect(() => {
    if (isOpen) {
      // Populate from FHIR clinical summary if available
      if (clinicalSummary) {
        setFormData({
          bloodType: clinicalSummary.legacyMedicalInfo?.bloodType || '',
          nhsNumber: clinicalSummary.nhsNumber || nhsNumber || '',
          gpPractice: clinicalSummary.legacyMedicalInfo?.gpPractice || '',
          allergies: clinicalSummary.allergies.map(allergyToFormItem),
          conditions: clinicalSummary.conditions.map(conditionToFormItem),
          medications: clinicalSummary.medications.map(medicationToFormItem),
        });
      } else if (initialData) {
        // Fall back to legacy data
        setFormData({
          bloodType: initialData.bloodType || '',
          nhsNumber: nhsNumber || initialData.nhsNumber || '',
          gpPractice: initialData.gpPractice || '',
          allergies: (initialData.allergies || []).map((name, idx) => ({
            id: `legacy-${idx}`,
            name,
            criticality: 'low',
            category: 'medication',
            isNew: true,
          })),
          conditions: (initialData.conditions || []).map((name, idx) => ({
            id: `legacy-${idx}`,
            name,
            status: 'active',
            isNew: true,
          })),
          medications: (initialData.medications || []).map((name, idx) => ({
            id: `legacy-${idx}`,
            name,
            dosage: '',
            status: 'active',
            isNew: true,
          })),
        });
      } else {
        setFormData({
          bloodType: '',
          nhsNumber: nhsNumber || '',
          gpPractice: '',
          allergies: [],
          conditions: [],
          medications: [],
        });
      }
    }
  }, [isOpen, clinicalSummary, initialData, nhsNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Allergy handlers
  const addAllergy = () => {
    if (newAllergy.name.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, { ...newAllergy, name: newAllergy.name.trim(), isNew: true }],
      }));
      setNewAllergy({ name: '', criticality: 'low', category: 'medication' });
    }
  };

  const removeAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.map((a, i) => i === index ? { ...a, toDelete: true } : a),
    }));
  };

  // Condition handlers
  const addCondition = () => {
    if (newCondition.name.trim()) {
      setFormData(prev => ({
        ...prev,
        conditions: [...prev.conditions, { ...newCondition, name: newCondition.name.trim(), isNew: true }],
      }));
      setNewCondition({ name: '', status: 'active' });
    }
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => i === index ? { ...c, toDelete: true } : c),
    }));
  };

  // Medication handlers
  const addMedication = () => {
    if (newMedication.name.trim()) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, { ...newMedication, name: newMedication.name.trim(), isNew: true }],
      }));
      setNewMedication({ name: '', dosage: '', status: 'active' });
    }
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((m, i) => i === index ? { ...m, toDelete: true } : m),
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, addFn: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFn();
    }
  };

  if (!isOpen) return null;

  const visibleAllergies = formData.allergies.filter(a => !a.toDelete);
  const visibleConditions = formData.conditions.filter(c => !c.toDelete);
  const visibleMedications = formData.medications.filter(m => !m.toDelete);

  return (
    <div className="medical-modal__overlay" onClick={onClose}>
      <div className="medical-modal" onClick={(e) => e.stopPropagation()}>
        <div className="medical-modal__header">
          <h2>Edit Medical Information</h2>
          <button className="medical-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="medical-modal__form">
          <div className="medical-modal__grid">
            <div className="medical-modal__field">
              <label>Blood Type</label>
              <select
                value={formData.bloodType}
                onChange={(e) => setFormData(prev => ({ ...prev, bloodType: e.target.value }))}
              >
                <option value="">Select blood type...</option>
                {BLOOD_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="medical-modal__field">
              <label>NHS Number</label>
              <input
                type="text"
                value={formData.nhsNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, nhsNumber: e.target.value }))}
                placeholder="Enter NHS number..."
              />
            </div>

            <div className="medical-modal__field medical-modal__field--full">
              <label>GP Practice</label>
              <input
                type="text"
                value={formData.gpPractice}
                onChange={(e) => setFormData(prev => ({ ...prev, gpPractice: e.target.value }))}
                placeholder="Enter GP practice name..."
              />
            </div>
          </div>

          {/* Allergies Section */}
          <div className="medical-modal__section">
            <label>Allergies</label>
            <div className="medical-modal__tags">
              {visibleAllergies.map((allergy, index) => (
                <span
                  key={allergy._id || `new-${index}`}
                  className={`medical-modal__tag medical-modal__tag--allergy ${allergy.criticality === 'high' ? 'medical-modal__tag--critical' : ''}`}
                >
                  {allergy.criticality === 'high' && <AlertTriangle size={12} />}
                  {allergy.name}
                  <span className="medical-modal__tag-meta">({allergy.category})</span>
                  <button type="button" onClick={() => removeAllergy(formData.allergies.findIndex(a => a === allergy))}>
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="medical-modal__add-row medical-modal__add-row--complex">
              <input
                type="text"
                value={newAllergy.name}
                onChange={(e) => setNewAllergy(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, addAllergy)}
                placeholder="Allergy name..."
              />
              <select
                value={newAllergy.category}
                onChange={(e) => setNewAllergy(prev => ({ ...prev, category: e.target.value as AllergyFormItem['category'] }))}
              >
                {ALLERGY_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={newAllergy.criticality}
                onChange={(e) => setNewAllergy(prev => ({ ...prev, criticality: e.target.value as AllergyFormItem['criticality'] }))}
              >
                {CRITICALITY_OPTIONS.map(crit => (
                  <option key={crit} value={crit}>{crit}</option>
                ))}
              </select>
              <button type="button" onClick={addAllergy} disabled={!newAllergy.name.trim()}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Conditions Section */}
          <div className="medical-modal__section">
            <label>Medical Conditions</label>
            <div className="medical-modal__tags">
              {visibleConditions.map((condition, index) => (
                <span
                  key={condition._id || `new-${index}`}
                  className={`medical-modal__tag medical-modal__tag--condition ${condition.status === 'resolved' ? 'medical-modal__tag--resolved' : ''}`}
                >
                  {condition.name}
                  {condition.status === 'resolved' && <span className="medical-modal__tag-meta">(resolved)</span>}
                  <button type="button" onClick={() => removeCondition(formData.conditions.findIndex(c => c === condition))}>
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="medical-modal__add-row medical-modal__add-row--complex">
              <input
                type="text"
                value={newCondition.name}
                onChange={(e) => setNewCondition(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, addCondition)}
                placeholder="Condition name..."
              />
              <select
                value={newCondition.status}
                onChange={(e) => setNewCondition(prev => ({ ...prev, status: e.target.value as ConditionFormItem['status'] }))}
              >
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
              </select>
              <button type="button" onClick={addCondition} disabled={!newCondition.name.trim()}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Medications Section */}
          <div className="medical-modal__section">
            <label>Current Medications</label>
            <div className="medical-modal__tags">
              {visibleMedications.map((med, index) => (
                <span
                  key={med._id || `new-${index}`}
                  className={`medical-modal__tag medical-modal__tag--medication ${med.status === 'stopped' ? 'medical-modal__tag--stopped' : ''}`}
                >
                  {med.name}
                  {med.dosage && <span className="medical-modal__tag-meta">{med.dosage}</span>}
                  {med.status === 'stopped' && <span className="medical-modal__tag-meta">(stopped)</span>}
                  <button type="button" onClick={() => removeMedication(formData.medications.findIndex(m => m === med))}>
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="medical-modal__add-row medical-modal__add-row--complex">
              <input
                type="text"
                value={newMedication.name}
                onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, addMedication)}
                placeholder="Medication name..."
              />
              <input
                type="text"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="Dosage (e.g., 5mg daily)..."
              />
              <button type="button" onClick={addMedication} disabled={!newMedication.name.trim()}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="medical-modal__actions">
            <button type="button" className="medical-modal__btn medical-modal__btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="medical-modal__btn medical-modal__btn--save" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
