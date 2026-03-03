import { useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCurrentCallId } from '../store/slices/callSlice';
import {
  setPatientTabs as setPatientTabsAction,
  addPatientTab,
  removePatientTab,
  updatePatientInTab,
  setCurrentPatient as setCurrentPatientAction,
  removePatientData,
  updatePatientData,
  type PatientTab,
} from '../store/slices/patientSlice';
import type { Patient } from '../types';

export type { PatientTab };

export interface UsePatientTabsReturn {
  patientTabs: PatientTab[];
  currentPatient: Patient | null;
  setPatientTabs: (tabs: PatientTab[]) => void;
  setCurrentPatient: (patient: Patient | null) => void;
  selectPatient: (patientId: string) => void;
  closePatient: (patientId: string) => boolean; // returns false if note required
  addPatient: () => void;
  selectSearchedPatient: (patient: Patient) => void;
  updatePatient: (updatedPatient: Patient) => void;
  showNoteRequiredModal: boolean;
  setShowNoteRequiredModal: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Hook for managing patient tabs via Redux.
 * Handles tab lifecycle, selection, and note requirement validation.
 */
export const usePatientTabs = (): UsePatientTabsReturn => {
  const dispatch = useAppDispatch();
  const patientTabs = useAppSelector((state) => state.patient.patientTabs);
  const currentPatient = useAppSelector((state) => state.patient.currentPatient);
  const patientDataCache = useAppSelector((state) => state.patient.patientDataCache);
  const { currentCallId } = useAppSelector((state) => state.call);

  // Local state for modal (not persisted)
  const [showNoteRequiredModal, setShowNoteRequiredModal] = useState(false);

  const setPatientTabs = useCallback((tabs: PatientTab[]) => {
    dispatch(setPatientTabsAction(tabs));
  }, [dispatch]);

  const setCurrentPatient = useCallback((patient: Patient | null) => {
    dispatch(setCurrentPatientAction(patient));
  }, [dispatch]);

  const selectPatient = useCallback((patientId: string) => {
    const tab = patientTabs.find((t) => t.id === patientId);
    if (tab) {
      dispatch(setCurrentPatientAction(tab.patient));
      dispatch(setCurrentCallId(patientId));
    }
  }, [patientTabs, dispatch]);

  const closePatient = useCallback((patientId: string): boolean => {
    // Check if agent has added a note for this patient - required before closing
    const patientData = patientDataCache[patientId];
    if (!patientData?.hasAddedNoteThisCall) {
      // Switch to this patient and show the note required modal
      const patientTab = patientTabs.find((t) => t.id === patientId);
      if (patientTab) {
        dispatch(setCurrentPatientAction(patientTab.patient));
        dispatch(setCurrentCallId(patientId));
      }
      setShowNoteRequiredModal(true);
      return false;
    }

    // Remove from tabs
    dispatch(removePatientTab(patientId));

    // Remove cached data for this patient
    dispatch(removePatientData(patientId));

    // If this was the current patient, switch to another or clear
    if (currentCallId === patientId) {
      const remaining = patientTabs.filter((t) => t.id !== patientId);
      if (remaining.length > 0) {
        dispatch(setCurrentPatientAction(remaining[0].patient));
        dispatch(setCurrentCallId(remaining[0].id));
      } else {
        dispatch(setCurrentPatientAction(null));
        dispatch(setCurrentCallId(null));
      }
    }

    return true;
  }, [patientDataCache, patientTabs, currentCallId, dispatch]);

  const addPatient = useCallback(() => {
    // Clear current selection to show search
    dispatch(setCurrentPatientAction(null));
    dispatch(setCurrentCallId(null));
  }, [dispatch]);

  const selectSearchedPatient = useCallback((patient: Patient) => {
    // Set the selected patient as current
    dispatch(setCurrentPatientAction(patient));

    // Check if patient already exists in tabs
    const existsInTabs = patientTabs.some((t) => t.id === patient._id);

    // Initialize patient data if this is a new patient (not already in tabs)
    if (!existsInTabs) {
      dispatch(updatePatientData({
        patientId: patient._id,
        updates: { hasAddedNoteThisCall: false },
      }));
    }

    // Add to tabs (will update existing or add new)
    dispatch(addPatientTab({
      id: patient._id,
      patient,
      isActive: true,
    }));

    dispatch(setCurrentCallId(patient._id));
  }, [patientTabs, dispatch]);

  const updatePatient = useCallback((updatedPatient: Patient) => {
    dispatch(updatePatientInTab(updatedPatient));
  }, [dispatch]);

  return useMemo(() => ({
    patientTabs,
    currentPatient,
    setPatientTabs,
    setCurrentPatient,
    selectPatient,
    closePatient,
    addPatient,
    selectSearchedPatient,
    updatePatient,
    showNoteRequiredModal,
    setShowNoteRequiredModal,
  }), [
    patientTabs,
    currentPatient,
    setPatientTabs,
    setCurrentPatient,
    selectPatient,
    closePatient,
    addPatient,
    selectSearchedPatient,
    updatePatient,
    showNoteRequiredModal,
  ]);
};
