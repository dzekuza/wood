import {useUnitSystem} from '~/hooks/useUnitSystem';

export function UnitToggle() {
  const {unit, setUnit} = useUnitSystem();
  return (
    <div className="unit-toggle" role="group" aria-label="Measurement units">
      <button
        type="button"
        className={`unit-toggle-opt${unit === 'imperial' ? ' is-active' : ''}`}
        aria-pressed={unit === 'imperial'}
        onClick={() => setUnit('imperial')}
      >
        in
      </button>
      <button
        type="button"
        className={`unit-toggle-opt${unit === 'metric' ? ' is-active' : ''}`}
        aria-pressed={unit === 'metric'}
        onClick={() => setUnit('metric')}
      >
        cm
      </button>
    </div>
  );
}
