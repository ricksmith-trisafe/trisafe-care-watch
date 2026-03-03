import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useLazyGetClinicalSummaryQuery } from '../services/clinicalApi';
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
  const [getClinicalSummary, { isFetching: isClinicalLoading }] = useLazyGetClinicalSummaryQuery();

  const loadedPatientsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentPatient?._id) return;
    const patient = currentPatient;

    const cacheKey = `clinical-${patient._id}`;
    if (loadedPatientsRef.current.has(cacheKey)) return;
    loadedPatientsRef.current.add(cacheKey);

    const loadData = async () => {
      try {
        const clinicalSummary = await getClinicalSummary(patient._id).unwrap();
        dispatch(updatePatientData({
          patientId: patient._id,
          updates: {
            clinicalSummary,
            personalContacts: clinicalSummary.contacts || [],
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
      const clinicalSummary = await getClinicalSummary(currentPatient._id).unwrap();
      dispatch(updatePatientData({
        patientId: currentPatient._id,
        updates: {
          clinicalSummary,
          personalContacts: clinicalSummary.contacts || [],
        },
      }));
    } catch (err) {
      console.error('Failed to refresh clinical data:', err);
    }
  }, [currentPatient, getClinicalSummary, dispatch]);

  return {
    isClinicalLoading,
    refreshClinicalSummary,
  };
};
