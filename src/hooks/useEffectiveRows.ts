import { useMemo } from 'react';
import { useDataState } from '../context/DataContext';
import { useObservations } from '../context/ObservationContext';
import { applyLateOmissions } from '../utils/omissions';
import type { Row } from '../types/data';

/**
 * Rows with excused late arrivals neutralized. In non-attendance mode or when
 * nothing is excused, this returns the original rows reference unchanged.
 */
export function useEffectiveRows(): Row[] {
  const { parsedData } = useDataState();
  const { omittedSet } = useObservations();

  return useMemo(() => {
    if (!parsedData?.rows) return [];
    if (!parsedData.isAttendance || !parsedData.attendanceKeys || omittedSet.size === 0) {
      return parsedData.rows;
    }
    return applyLateOmissions(parsedData.rows, parsedData.attendanceKeys, omittedSet);
  }, [parsedData, omittedSet]);
}
