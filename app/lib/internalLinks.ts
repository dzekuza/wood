/**
 * One source for the internal links that tie guides and category pages
 * together. Anchor text is keyword-led (the collection's real search term)
 * rather than the short Shopify collection title ("Shelves").
 */

export type InternalLink = {label: string; to: string};

export const COLLECTION_LINKS = {
  mantelBeams: {label: 'Solid oak mantel beams', to: '/collections/solid-oak-mantel-beams'},
  fireplaceSurrounds: {label: 'Oak fireplace surrounds', to: '/collections/solid-oak-fireplace-surrounds'},
  shelves: {label: 'Solid oak floating shelves', to: '/collections/solid-oak-shelves'},
  coatRacks: {label: 'Solid oak coat racks', to: '/collections/solid-oak-coat-racks'},
  consoleTables: {label: 'Solid oak console tables', to: '/collections/console-tables'},
  cubeBlocks: {label: 'Solid oak cube blocks', to: '/collections/solid-oak-cube-blocks'},
  doorStops: {label: 'Solid oak door stops', to: '/collections/solid-oak-door-stops'},
} as const satisfies Record<string, InternalLink>;

/** Every category, in homepage order. Used by the footer and homepage link rows. */
export const ALL_COLLECTION_LINKS: InternalLink[] = [
  COLLECTION_LINKS.mantelBeams,
  COLLECTION_LINKS.fireplaceSurrounds,
  COLLECTION_LINKS.shelves,
  COLLECTION_LINKS.coatRacks,
  COLLECTION_LINKS.consoleTables,
  COLLECTION_LINKS.cubeBlocks,
  COLLECTION_LINKS.doorStops,
];

/**
 * The keyword-anchored category link for a product, picked from the Shopify
 * collections it belongs to. Returns null when it sits in none of ours, so the
 * caller can fall back to the all-products page.
 */
export function collectionLinkForHandles(handles: readonly string[]): InternalLink | null {
  return (
    ALL_COLLECTION_LINKS.find((link) => handles.includes(link.to.replace('/collections/', ''))) ?? null
  );
}

export const GUIDE_LINKS = {
  fitMantel: {label: 'How to fit an oak mantel beam', to: '/blogs/news/how-to-fit-an-oak-mantel-beam'},
  mantelSizes: {label: 'Oak mantel beam sizes guide', to: '/blogs/news/oak-mantel-beam-sizes'},
  shelfSizes: {
    label: 'Oak floating shelf thickness, depth and length',
    to: '/blogs/news/oak-floating-shelves-thickness-depth-length',
  },
  installShelves: {label: 'How to install floating shelves', to: '/blogs/news/how-to-install-floating-shelves'},
  oilColours: {label: 'Oak oil colours compared', to: '/blogs/news/oak-oil-colours-compared'},
} as const satisfies Record<string, InternalLink>;

export type ArticleRelatedLinks = {
  /** The money collection(s) this guide supports. */
  shop: InternalLink[];
  /** Sibling guides. */
  guides: InternalLink[];
};

/** Keyed by article handle (all five live under /blogs/news). */
export const ARTICLE_RELATED_LINKS: Record<string, ArticleRelatedLinks> = {
  'how-to-fit-an-oak-mantel-beam': {
    shop: [COLLECTION_LINKS.mantelBeams, COLLECTION_LINKS.fireplaceSurrounds],
    guides: [GUIDE_LINKS.mantelSizes, GUIDE_LINKS.oilColours],
  },
  'oak-mantel-beam-sizes': {
    shop: [COLLECTION_LINKS.mantelBeams, COLLECTION_LINKS.fireplaceSurrounds],
    guides: [GUIDE_LINKS.fitMantel, GUIDE_LINKS.oilColours],
  },
  'oak-floating-shelves-thickness-depth-length': {
    shop: [COLLECTION_LINKS.shelves],
    guides: [GUIDE_LINKS.installShelves, GUIDE_LINKS.oilColours],
  },
  'how-to-install-floating-shelves': {
    shop: [COLLECTION_LINKS.shelves],
    guides: [GUIDE_LINKS.shelfSizes, GUIDE_LINKS.oilColours],
  },
  'oak-oil-colours-compared': {
    shop: [COLLECTION_LINKS.mantelBeams, COLLECTION_LINKS.shelves, COLLECTION_LINKS.consoleTables],
    guides: [GUIDE_LINKS.mantelSizes, GUIDE_LINKS.shelfSizes],
  },
  // Pre-wired for the 4 drafted UK SEO/GEO guides in content/blog/ once published in Shopify Admin.
  'oak-mantel-beam-clearance-above-log-burner': {
    shop: [COLLECTION_LINKS.mantelBeams, COLLECTION_LINKS.fireplaceSurrounds],
    guides: [GUIDE_LINKS.fitMantel, GUIDE_LINKS.mantelSizes, GUIDE_LINKS.oilColours],
  },
  'how-to-fit-floating-shelves-plasterboard-stud-dot-and-dab': {
    shop: [COLLECTION_LINKS.shelves],
    guides: [GUIDE_LINKS.installShelves, GUIDE_LINKS.shelfSizes, GUIDE_LINKS.oilColours],
  },
  'solid-oak-vs-oak-veneer-mantel-beams': {
    shop: [COLLECTION_LINKS.mantelBeams, COLLECTION_LINKS.fireplaceSurrounds, COLLECTION_LINKS.cubeBlocks],
    guides: [GUIDE_LINKS.mantelSizes, GUIDE_LINKS.fitMantel, GUIDE_LINKS.oilColours],
  },
  'alcove-floating-shelves-uk-measuring-spacing-guide': {
    shop: [COLLECTION_LINKS.shelves, COLLECTION_LINKS.mantelBeams],
    guides: [GUIDE_LINKS.shelfSizes, GUIDE_LINKS.installShelves, GUIDE_LINKS.oilColours],
  },
};
