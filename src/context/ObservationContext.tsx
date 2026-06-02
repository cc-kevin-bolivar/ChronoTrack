import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { ObservationEntry } from '../types/data';

/**
 * Observations are keyed by "{employeeId}|{date}" and stored in localStorage.
 * Each entry holds the free-text note plus an `omitLate` flag that excuses a
 * late arrival on that record (so it stops counting as late everywhere).
 */
type Observations = Record<string, ObservationEntry>;

const EMPTY_ENTRY: ObservationEntry = { text: '', omitLate: false };

interface ObservationContextValue {
  observations: Observations;
  /** Returns the note text for a record (empty string if none). */
  getObservation: (employeeId: string, date: string) => string;
  /** Returns the full entry (text + omitLate) for a record. */
  getEntry: (employeeId: string, date: string) => ObservationEntry;
  /** Set of "{employeeId}|{date}" keys whose late arrival is excused. */
  omittedSet: Set<string>;
  setObservation: (employeeId: string, date: string, text: string, omitLate: boolean) => void;
}

const STORAGE_KEY = 'chronotrack_observations';

function loadObservations(): Observations {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Observations = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        // Legacy format: a bare note string with no omit flag.
        result[key] = { text: value, omitLate: false };
      } else if (value && typeof value === 'object') {
        const entry = value as Partial<ObservationEntry>;
        result[key] = {
          text: typeof entry.text === 'string' ? entry.text : '',
          omitLate: entry.omitLate === true,
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

function saveObservations(obs: Observations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obs));
}

const ObservationContext = createContext<ObservationContextValue | null>(null);

export function ObservationProvider({ children }: { children: ReactNode }) {
  const [observations, setObservations] = useState<Observations>(loadObservations);

  const getEntry = useCallback(
    (employeeId: string, date: string) => observations[`${employeeId}|${date}`] ?? EMPTY_ENTRY,
    [observations]
  );

  const getObservation = useCallback(
    (employeeId: string, date: string) => getEntry(employeeId, date).text,
    [getEntry]
  );

  const omittedSet = useMemo(() => {
    const set = new Set<string>();
    for (const [key, entry] of Object.entries(observations)) {
      if (entry.omitLate) set.add(key);
    }
    return set;
  }, [observations]);

  const setObservation = useCallback(
    (employeeId: string, date: string, text: string, omitLate: boolean) => {
      setObservations((prev) => {
        const key = `${employeeId}|${date}`;
        const next = { ...prev };
        const trimmed = text.trim();
        // Drop the entry only when there is nothing left to remember.
        if (!trimmed && !omitLate) {
          delete next[key];
        } else {
          next[key] = { text: trimmed, omitLate };
        }
        saveObservations(next);
        return next;
      });
    },
    []
  );

  return (
    <ObservationContext.Provider value={{ observations, getObservation, getEntry, omittedSet, setObservation }}>
      {children}
    </ObservationContext.Provider>
  );
}

export function useObservations() {
  const ctx = useContext(ObservationContext);
  if (!ctx) throw new Error('useObservations must be used within ObservationProvider');
  return ctx;
}
