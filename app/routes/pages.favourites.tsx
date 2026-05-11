import {Link} from 'react-router';
import {Money} from '@shopify/hydrogen';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import {useFavourites} from '~/hooks/useFavourites';
import type {FavouriteProduct} from '~/hooks/useFavourites';

export const meta = () => [
  {title: 'Favourites — CraftWoodFurniture'},
  {name: 'description', content: 'Your saved pieces from CraftWoodFurniture.'},
];

export default function FavouritesPage() {
  const {favourites, removeFavourite} = useFavourites();

  return (
    <>
      <div className="page-header">
        <div className="cwf-wrap">
          <div className="page-header-inner">
            <div>
              <span className="eyebrow">Saved pieces</span>
              <h1>Your <em>Favourites</em></h1>
              <p className="blurb">
                Pieces you've saved. Come back any time — they'll be here.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="fav-section">
        <div className="cwf-wrap">
          {favourites.length === 0 ? (
            <div className="fav-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--cwf-accent)', marginBottom: 20}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <h2>Nothing saved yet</h2>
              <p>Browse our collection and tap the heart icon to save pieces you love.</p>
              <Link to="/collections/all" className="btn btn-primary" style={{marginTop: 24}}>Browse all pieces</Link>
            </div>
          ) : (
            <>
              <p className="fav-count">{favourites.length} {favourites.length === 1 ? 'piece' : 'pieces'} saved</p>
              <div className="fav-grid">
                {favourites.map((item) => (
                  <FavCard key={item.id} item={item} onRemove={removeFavourite} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

function FavCard({item, onRemove}: {item: FavouriteProduct; onRemove: (id: string) => void}) {
  return (
    <div className="fav-card">
      <Link to={`/products/${item.handle}`} className="fav-card-img">
        {item.image ? (
          <img
            src={item.image.url}
            alt={item.image.altText ?? item.title}
            width={item.image.width ?? 400}
            height={item.image.height ?? 400}
            loading="lazy"
          />
        ) : (
          <div className="fav-card-img-placeholder" />
        )}
      </Link>
      <div className="fav-card-body">
        <Link to={`/products/${item.handle}`} className="fav-card-name">{item.title}</Link>
        <div className="fav-card-row">
          <span className="fav-card-price">
            <Money data={{amount: item.price.amount, currencyCode: item.price.currencyCode as CurrencyCode}} />
          </span>
          <button
            className="fav-remove-btn"
            aria-label="Remove from favourites"
            onClick={() => onRemove(item.id)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
