import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/**
 * Observations are keyed by "{employeeId}|{date}" and stored in localStorage.
 */
type Observations = Record<string, string>;

interface ObservationContextValue {
  observations: Observations;
  getObservation: (employeeId: string, date: string) => string;
  setObservation: (employeeId: string, date: string, text: string) => void;
}

const STORAGE_KEY = 'chronotrack_observations';

function loadObservations(): Observations {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
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

  const getObservation = useCallback(
    (employeeId: string, date: string) => observations[`${employeeId}|${date}`] ?? '',
    [observations]
  );

  const setObservation = useCallback(
    (employeeId: string, date: string, text: string) => {
      setObservations((prev) => {
        const key = `${employeeId}|${date}`;
        const next = { ...prev };
        if (text.trim()) {
          next[key] = text.trim();
        } else {
          delete next[key];
        }
        saveObservations(next);
        return next;
      });
    },
    []
  );

  return (
    <ObservationContext.Provider value={{ observations, getObservation, setObservation }}>
      {children}
    </ObservationContext.Provider>
  );
}

export function useObservations() {
  const ctx = useContext(ObservationContext);
  if (!ctx) throw new Error('useObservations must be used within ObservationProvider');
  return ctx;
}
