import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchClinicalSummary } from '../store/slices/clinicalSlice';
import { updatePatientData } from '../store/slices/patientSlice';

export interface UseClinicalSummaryLoaderReturn {
  isClinicalLoading: boolean;
  refreshClinicalSummary: () => Promise<void>;
}

/**
 * Hook that loads clinical summary when current patient changes.
 * Contacts are populated from the clinical summary response.
 */
export const useClinicalSummaryLoader = (): UseClinicalSummaryLoaderReturn => {
  const dispatch = useAppDispatch();
  const currentPatient = useAppSelector((state) => state.patient.currentPatient);
  const isLoading = useAppSelector((state) => state.clinical.isLoading);

  const loadedPatientsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentPatient?._id) return;
    const patient = currentPatient;

    const cacheKey = `clinical-${patient._id}`;
    if (loadedPatientsRef.current.has(cacheKey)) return;
    loadedPatientsRef.current.add(cacheKey);

    const loadData = async () => {
      try {
        const result = await dispatch(fetchClinicalSummary(patient._id)).unwrap();
        dispatch(updatePatientData({
          patientId: patient._id,
          updates: {
            personalContacts: result.data.contacts || [],
          },
        }));
      } catch (err) {
        console.error('Failed to load clinical summary:', err);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPatient?._id]);

  const refreshClinicalSummary = useCallback(async () => {
    if (!currentPatient?._id) return;
    try {
      const result = await dispatch(fetchClinicalSummary(currentPatient._id)).unwrap();
      dispatch(updatePatientData({
        patientId: currentPatient._id,
        updates: {
          personalContacts: result.data.contacts || [],
        },
      }));
    } catch (err) {
      console.error('Failed to refresh clinical data:', err);
    }
  }, [currentPatient, dispatch]);

  return {
    isClinicalLoading: isLoading,
    refreshClinicalSummary,
  };
};
