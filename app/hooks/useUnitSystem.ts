import {useState, useEffect, useCallback} from 'react';
import type {UnitSystem} from '~/lib/units';

const STORAGE_KEY = 'cwf_unit_system';
const SYNC_EVENT = 'cwf:unit-system';
const DEFAULT_UNIT: UnitSystem = 'imperial';

function readStorage(): UnitSystem {
  if (typeof window === 'undefined') return DEFAULT_UNIT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'imperial' || raw === 'metric' ? raw : DEFAULT_UNIT;
  } catch {
    return DEFAULT_UNIT;
  }
}

function writeStorage(unit: UnitSystem): void {
  try {
    localStorage.setItem(STORAGE_KEY, unit);
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch {
    return;
  }
}

export function useUnitSystem() {
  const [unit, setUnitState] = useState<UnitSystem>(DEFAULT_UNIT);

  useEffect(() => {
    setUnitState(readStorage());
    const sync = () => setUnitState(readStorage());
    window.addEventListener(SYNC_EVENT, sync);
    return () => window.removeEventListener(SYNC_EVENT, sync);
  }, []);

  const setUnit = useCallback((next: UnitSystem) => {
    writeStorage(next);
    setUnitState(next);
  }, []);

  const toggleUnit = useCallback(() => {
    setUnit(unit === 'imperial' ? 'metric' : 'imperial');
  }, [unit, setUnit]);

  return {unit, setUnit, toggleUnit};
}
