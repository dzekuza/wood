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

/**
 * Solid social marks for the announcement bar. Facebook's path is the
 * designer-supplied `Link.svg` (recoloured to currentColor); Instagram is a
 * filled build of the Tabler outline, since the webfont has no filled variant.
 */
export function FacebookFilledIcon({className}: {className?: string}) {
  return (
    <svg
      // Cropped to the glyph, not the 30x30 artboard it shipped in: the mark
      // only occupies x 10-19.2 / y 6.7-23.5, so the original viewBox rendered
      // it visibly smaller than Instagram at the same box size. This box makes
      // the glyph fill 83.3% of its height — the same ratio as the Instagram
      // mark — so the two match optically.
      viewBox="4.48 4.98 20.20 20.20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M18.5657 16.1348L19.0412 13.0898H16.0705V11.1147C16.0705 10.2805 16.4851 9.46881 17.8164 9.46881H19.1667V6.87273C19.1667 6.87273 17.9419 6.66699 16.7666 6.66699C14.3209 6.66699 12.7196 8.12588 12.7196 10.7668V13.0898H10V16.1348H12.7196V23.5003H16.0667V16.1348H18.5657Z" />
    </svg>
  );
}

export function InstagramFilledIcon({className}: {className?: string}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      className={className}
      aria-hidden
    >
      {/* One path, evenodd: the body fills, the lens ring and flash punch back out. */}
      <path d="M7 2H17A5 5 0 0 1 22 7V17A5 5 0 0 1 17 22H7A5 5 0 0 1 2 17V7A5 5 0 0 1 7 2ZM7.25 12A4.75 4.75 0 1 0 16.75 12A4.75 4.75 0 1 0 7.25 12ZM9.25 12A2.75 2.75 0 1 0 14.75 12A2.75 2.75 0 1 0 9.25 12ZM16.35 6.5A1.15 1.15 0 1 0 18.65 6.5A1.15 1.15 0 1 0 16.35 6.5Z" />
    </svg>
  );
}

export function PinterestFilledIcon({className}: {className?: string}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.03-2.83.19-.77 1.27-5.38 1.27-5.38s-.32-.65-.32-1.61c0-1.51.88-2.64 1.96-2.64.93 0 1.38.7 1.38 1.53 0 .93-.6 2.33-.9 3.63-.26 1.08.53 1.96 1.59 1.96 1.9 0 3.37-2 3.37-4.9 0-2.56-1.84-4.35-4.47-4.35-3.04 0-4.82 2.28-4.82 4.64 0 .92.35 1.9.79 2.44.09.1.1.2.07.3l-.29 1.19c-.05.18-.16.22-.36.13-1.39-.65-2.26-2.68-2.26-4.32 0-3.51 2.55-6.73 7.35-6.73 3.86 0 6.86 2.75 6.86 6.42 0 3.83-2.41 6.91-5.76 6.91-1.12 0-2.18-.58-2.54-1.27l-.69 2.59c-.25.96-.93 2.16-1.38 2.89A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10Z" />
    </svg>
  );
}
