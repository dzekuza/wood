/**
 * The @tabler/icons-webfont CDN package only ships outline glyphs — there is
 * no `-filled` variant (ti-star-filled, ti-heart-filled, etc. resolve to no
 * glyph at all). These fill that gap for the few spots that need a solid
 * icon (star ratings, the saved-favourite heart state).
 */

export function StarFilledIcon({className}: {className?: string}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

export function HeartFilledIcon({className}: {className?: string}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 21s-7.5-4.6-10.2-9.1C.1 8.5 1.7 4.5 5.6 4.5c2.2 0 4 1.3 4.7 3 .7-1.7 2.5-3 4.7-3 3.9 0 5.5 4 3.8 7.4C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}
