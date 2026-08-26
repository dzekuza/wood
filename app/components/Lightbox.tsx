import {useEffect} from 'react';
import {createPortal} from 'react-dom';

export type LightboxImage = {src: string; alt: string};

export function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const count = images.length;
  const goPrev = () => onNavigate((index - 1 + count) % count);
  const goNext = () => onNavigate((index + 1) % count);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'ArrowRight') goNext();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const active = images[index];
  if (!active) return null;

  // Portalled to <body>: callers live inside transform-animated marquee tracks,
  // and a transformed ancestor becomes the containing block for
  // `position: fixed` — rendering in place pins the overlay to the moving
  // track instead of the viewport.
  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true">
      {/* Click-to-dismiss lives on a real button behind the content rather than
          on the dialog itself — a click handler on the non-interactive wrapper
          is unreachable by keyboard (Escape is handled in the effect above). */}
      <button
        type="button"
        className="lightbox-backdrop reset"
        onClick={onClose}
        aria-label="Close"
        tabIndex={-1}
      />

      <button
        type="button"
        className="lightbox-close reset"
        onClick={onClose}
        aria-label="Close"
      >
        <i className="ti ti-x" />
      </button>

      {count > 1 && (
        <button
          type="button"
          className="lightbox-arrow prev reset"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="Previous image"
        >
          <i className="ti ti-chevron-left" />
        </button>
      )}

      <img src={active.src} alt={active.alt} className="lightbox-img" />

      {count > 1 && (
        <button
          type="button"
          className="lightbox-arrow next reset"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="Next image"
        >
          <i className="ti ti-chevron-right" />
        </button>
      )}

      {count > 1 && (
        <div className="lightbox-count">
          {index + 1} / {count}
        </div>
      )}
    </div>,
    document.body,
  );
}
