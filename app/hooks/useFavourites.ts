import {useState, useEffect, useCallback} from 'react';

const STORAGE_KEY = 'cwf_favourites';
const SYNC_EVENT = 'cwf:favourites';

export type FavouriteProduct = {
  id: string;
  handle: string;
  title: string;
  image?: {url: string; altText?: string | null; width?: number | null; height?: number | null};
  price: {amount: string; currencyCode: string};
};

function readStorage(): FavouriteProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FavouriteProduct[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: FavouriteProduct[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch {
    return;
  }
}

export function useFavourites() {
  const [favourites, setFavourites] = useState<FavouriteProduct[]>([]);

  useEffect(() => {
    setFavourites(readStorage());
    const sync = () => setFavourites(readStorage());
    window.addEventListener(SYNC_EVENT, sync);
    return () => window.removeEventListener(SYNC_EVENT, sync);
  }, []);

  const isFavourite = useCallback(
    (id: string) => favourites.some((f) => f.id === id),
    [favourites],
  );

  const toggleFavourite = useCallback((product: FavouriteProduct) => {
    setFavourites((prev) => {
      const next = prev.some((f) => f.id === product.id)
        ? prev.filter((f) => f.id !== product.id)
        : [...prev, product];
      writeStorage(next);
      return next;
    });
  }, []);

  const removeFavourite = useCallback((id: string) => {
    setFavourites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      writeStorage(next);
      return next;
    });
  }, []);

  return {favourites, isFavourite, toggleFavourite, removeFavourite};
}
