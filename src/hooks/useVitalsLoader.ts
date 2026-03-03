import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '../store/hooks';
import { useLazyGetPatientVitalsQuery } from '../services/vitalsApi';
import type { Vitals, VitalsHistory, SleepSummary, ActivitySummary, EcgSummary } from '../types';

export interface UseVitalsLoaderReturn {
  vitals: Vitals | null;
  vitalsHistory: VitalsHistory[];
  sleep: SleepSummary | null;
  activity: ActivitySummary | null;
  ecg: EcgSummary | null;
  isVitalsLoading: boolean;
  refreshVitals: () => Promise<void>;
}

/**
 * Hook that loads vitals when the current patient changes.
 * Follows the same pattern as useClinicalSummaryLoader.
 */
export const useVitalsLoader = (): UseVitalsLoaderReturn => {
  const currentPatient = useAppSelector((state) => state.patient.currentPatient);
  const [getVitals, { data, isFetching }] = useLazyGetPatientVitalsQuery();

  const loadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentPatient?._id) return;

    const cacheKey = `vitals-${currentPatient._id}`;
    if (loadedRef.current.has(cacheKey)) return;
    loadedRef.current.add(cacheKey);

    getVitals({ patientId: currentPatient._id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPatient?._id]);

  const refreshVitals = useCallback(async () => {
    if (!currentPatient?._id) return;
    loadedRef.current.delete(`vitals-${currentPatient._id}`);
    await getVitals({ patientId: currentPatient._id });
  }, [currentPatient?._id, getVitals]);

  return {
    vitals: data?.vitals ?? null,
    vitalsHistory: data?.history ?? [],
    sleep: data?.sleep ?? null,
    activity: data?.activity ?? null,
    ecg: data?.ecg ?? null,
    isVitalsLoading: isFetching,
    refreshVitals,
  };
};
