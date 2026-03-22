import { useState } from 'react';
import { PatientTabs } from './PatientTabs';
import { PatientLocation } from './PatientLocation';
import { PatientDetails } from './PatientDetails';
import { PatientDetailsModal } from './PatientDetailsModal';
import type { PatientDetailsFormData } from './PatientDetailsModal';
import { LiveVitals } from './LiveVitals';
import { MedicalInformation } from './MedicalInformation';
import { MedicalInfoModal } from './MedicalInfoModal';
import type { ClinicalFormData } from './MedicalInfoModal';
import { HealthReportModal } from './HealthReportModal';
import { CallNotes } from './CallNotes';
import { PatientSearch } from './PatientSearch';
import { useAppDispatch } from '../../store/hooks';
import {
  updateMedicalInfo,
  createAllergy,
  deleteAllergy,
  createCondition,
  deleteCondition,
  createMedication,
  deleteMedication,
} from '../../store/slices/clinicalSlice';
import { useUpdatePatientMutation } from '../../services/patientApi';
import type { Patient, Vitals, SleepSummary, ActivitySummary, EcgSummary, ClinicalSummary, CallNote } from '../../types';
import './MainContent.scss';

interface ActivePatientTab {
  id: string;
  patient: Patient;
  isActive: boolean;
}

interface MainContentProps {
  patients: ActivePatientTab[];
  currentPatientId: string | null;
  onPatientSelect: (patientId: string) => void;
  onPatientClose: (patientId: string) => void;
  onAddPatient: () => void;
  onSearchSelectPatient: (patient: Patient) => void;
  vitals: Vitals | null;
  sleep: SleepSummary | null;
  activity: ActivitySummary | null;
  ecg: EcgSummary | null;
  isVitalsLoading?: boolean;
  clinicalSummary: ClinicalSummary | null;
  isClinicalLoading?: boolean;
  callNotes: CallNote[];
  onAddNote: (content: string) => void;
  onRefreshClinicalSummary?: () => void;
  onPatientUpdate?: (patient: Patient) => void;
}

export const MainContent = ({
  patients,
  currentPatientId,
  onPatientSelect,
  onPatientClose,
  onAddPatient,
  onSearchSelectPatient,
  vitals,
  sleep,
  activity,
  ecg,
  isVitalsLoading = false,
  clinicalSummary,
  isClinicalLoading = false,
  callNotes,
  onAddNote,
  onRefreshClinicalSummary,
  onPatientUpdate,
}: MainContentProps) => {
  const dispatch = useAppDispatch();
  const [noteInput, setNoteInput] = useState('');
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isHealthReportOpen, setIsHealthReportOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPatient, setIsSavingPatient] = useState(false);

  const [updatePatient] = useUpdatePatientMutation();

  const currentPatient = patients.find((p) => p.id === currentPatientId)?.patient;

  const handleAddNote = () => {
    if (noteInput.trim()) {
      onAddNote(noteInput.trim());
      setNoteInput('');
    }
  };

  const handleEditMedicalInfo = () => {
    setIsMedicalModalOpen(true);
  };

  const handleEditPatientDetails = () => {
    setIsPatientModalOpen(true);
  };

  const handleSavePatientDetails = async (formData: PatientDetailsFormData) => {
    if (!currentPatient) return;

    setIsSavingPatient(true);
    try {
      // Build telecom array
      const telecom: Patient['telecom'] = [];
      for (const phone of formData.phones) {
        if (phone.value.trim()) {
          telecom.push({ system: 'phone', value: phone.value.trim(), use: phone.use as 'mobile' | 'home' | 'work' });
        }
      }
      if (formData.email.trim()) {
        telecom.push({ system: 'email', value: formData.email.trim() });
      }

      // Build address array
      const addressLines = formData.addressLines.filter((line) => line.trim());
      const address: Patient['address'] = addressLines.length > 0 || formData.city || formData.postalCode ? [
        {
          line: addressLines.length > 0 ? addressLines : undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          postalCode: formData.postalCode || undefined,
          country: formData.country || undefined,
        },
      ] : undefined;

      // Build name array
      const name: Patient['name'] = [
        {
          prefix: formData.prefix.trim() ? [formData.prefix.trim()] : undefined,
          given: formData.givenName.trim() ? formData.givenName.trim().split(' ') : undefined,
          family: formData.familyName.trim() || undefined,
        },
      ];

      const updatedPatient = await updatePatient({
        patientId: currentPatient._id,
        data: {
          name,
          telecom: telecom.length > 0 ? telecom : undefined,
          address,
          birthDate: formData.birthDate || undefined,
          gender: formData.gender || undefined,
        },
      }).unwrap();

      if (onPatientUpdate) {
        onPatientUpdate(updatedPatient);
      }

      setIsPatientModalOpen(false);
    } catch (error) {
      console.error('Error saving patient details:', error);
    } finally {
      setIsSavingPatient(false);
    }
  };

  const handleSaveMedicalInfo = async (formData: ClinicalFormData) => {
    if (!currentPatient) return;

    setIsSaving(true);
    const patientRef = `Patient/${currentPatient._id}`;
    const patientDisplay = `${currentPatient.name?.[0]?.given?.[0] || ''} ${currentPatient.name?.[0]?.family || ''}`.trim();

    try {
      // Update legacy medical info (blood type, NHS number, GP practice)
      await dispatch(updateMedicalInfo({
        patientId: currentPatient._id,
        data: {
          bloodType: formData.bloodType,
          nhsNumber: formData.nhsNumber,
          gpPractice: formData.gpPractice,
        },
      })).unwrap();

      // Process allergies
      for (const allergy of formData.allergies) {
        if (allergy.toDelete && allergy._id) {
          await dispatch(deleteAllergy(allergy._id)).unwrap();
        } else if (allergy.isNew && !allergy.toDelete) {
          await dispatch(createAllergy({
            code: { text: allergy.name },
            patient: { reference: patientRef, display: patientDisplay },
            criticality: allergy.criticality,
            category: [allergy.category],
            clinicalStatus: {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
                code: 'active',
                display: 'Active',
              }],
            },
          })).unwrap();
        }
      }

      // Process conditions
      for (const condition of formData.conditions) {
        if (condition.toDelete && condition._id) {
          await dispatch(deleteCondition(condition._id)).unwrap();
        } else if (condition.isNew && !condition.toDelete) {
          await dispatch(createCondition({
            code: { text: condition.name },
            subject: { reference: patientRef, display: patientDisplay },
            clinicalStatus: {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                code: condition.status,
                display: condition.status === 'active' ? 'Active' : 'Resolved',
              }],
            },
          })).unwrap();
        }
      }

      // Process medications
      for (const med of formData.medications) {
        if (med.toDelete && med._id) {
          await dispatch(deleteMedication(med._id)).unwrap();
        } else if (med.isNew && !med.toDelete) {
          await dispatch(createMedication({
            medicationCodeableConcept: { text: med.name },
            subject: { reference: patientRef, display: patientDisplay },
            status: med.status,
            dosage: med.dosage ? [{ text: med.dosage }] : undefined,
          })).unwrap();
        }
      }

      // Close modal first, then refresh so the useEffect doesn't reset form
      setIsMedicalModalOpen(false);

      if (onRefreshClinicalSummary) {
        onRefreshClinicalSummary();
      }
    } catch (error) {
      console.error('Error saving medical info:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="main-content">
      <PatientTabs
        patients={patients}
        currentPatientId={currentPatientId}
        onPatientSelect={onPatientSelect}
        onPatientClose={onPatientClose}
        onAddPatient={onAddPatient}
      />

      {currentPatient ? (
        <>
          <div className="main-content__row">
            <PatientDetails patient={currentPatient} onEdit={handleEditPatientDetails} />
            <PatientLocation patient={currentPatient} />
          </div>

          <div className="main-content__row">
            <LiveVitals vitals={vitals} sleep={sleep} activity={activity} ecg={ecg} hasActivePatient={true} isLoading={isVitalsLoading} onViewHealthReport={() => setIsHealthReportOpen(true)} />
            <MedicalInformation
              clinicalSummary={clinicalSummary}
              hasActivePatient={true}
              onEdit={handleEditMedicalInfo}
              isLoading={isClinicalLoading}
            />
          </div>

          <MedicalInfoModal
            isOpen={isMedicalModalOpen}
            onClose={() => setIsMedicalModalOpen(false)}
            onSave={handleSaveMedicalInfo}
            clinicalSummary={clinicalSummary}
            nhsNumber={clinicalSummary?.nhsNumber || ''}
            isLoading={isSaving}
          />

          <PatientDetailsModal
            isOpen={isPatientModalOpen}
            onClose={() => setIsPatientModalOpen(false)}
            onSave={handleSavePatientDetails}
            patient={currentPatient}
            isLoading={isSavingPatient}
          />

          <HealthReportModal
            isOpen={isHealthReportOpen}
            onClose={() => setIsHealthReportOpen(false)}
            patientEmail={currentPatient.telecom?.find((t) => t.system === 'email')?.value || ''}
            patientName={`${currentPatient.name?.[0]?.given?.[0] || ''} ${currentPatient.name?.[0]?.family || ''}`.trim()}
          />

          <CallNotes
            notes={callNotes}
            noteInput={noteInput}
            onNoteInputChange={setNoteInput}
            onAddNote={handleAddNote}
            hasActivePatient={true}
          />
        </>
      ) : (
        <div className="main-content__search">
          <PatientSearch onSelectPatient={onSearchSelectPatient} />
        </div>
      )}
    </main>
  );
};
