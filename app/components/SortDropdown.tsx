import {useState, useRef} from 'react';
import {useNavigate, useSearchParams} from 'react-router';

export const SORT_OPTIONS = [
  {value: 'newest', label: 'Newest First'},
  {value: 'price-high', label: 'Price: High to Low'},
  {value: 'price-low', label: 'Price: Low to High'},
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export function SortDropdown({current}: {current: SortValue}) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{top: number; right: number} | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentLabel = SORT_OPTIONS.find((o) => o.value === current)?.label ?? 'Newest First';

  function toggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((o) => !o);
  }

  function select(value: SortValue) {
    const params = new URLSearchParams(searchParams);
    params.set('sort', value);
    params.delete('cursor');
    navigate(`?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div className="sort-wrap">
      {open && (
        <div className="sort-backdrop" onClick={() => setOpen(false)} />
      )}
      <button ref={btnRef} type="button" className="sort-btn" onClick={toggle}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cwf-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l4-4 4 4"/><path d="M7 5v14"/>
          <path d="M21 15l-4 4-4-4"/><path d="M17 19V5"/>
        </svg>
        {currentLabel}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: 2, opacity: 0.5}}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && dropdownPos && (
        <div
          className="sort-dropdown"
          style={{position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, left: 'auto'}}
        >
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`sort-option${current === opt.value ? ' active' : ''}`}
              onClick={() => select(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
