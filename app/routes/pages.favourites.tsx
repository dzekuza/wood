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
    <div className="archive-page">
      <div className="archive-hero">
        <div className="archive-wrap">
          <div className="archive-hero-inner">
            <h1 className="archive-hero-title">Your <em>Favourites</em></h1>
          </div>
          <p className="archive-hero-blurb">
            Pieces you&rsquo;ve saved. Come back any time — they&rsquo;ll be here.
          </p>
        </div>
      </div>

      <section className="fav-section">
        <div className="archive-wrap">
          {favourites.length === 0 ? (
            <div className="fav-empty">
              <svg className="fav-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <h2>Nothing saved yet</h2>
              <p>Browse our collection and tap the heart icon to save pieces you love.</p>
              <Link to="/collections/all" className="btn btn-primary btn-pill fav-empty-cta">Browse all pieces</Link>
            </div>
          ) : (
            <>
              <p className="fav-count">{favourites.length} {favourites.length === 1 ? 'piece' : 'pieces'} saved</p>
              <div className="products-grid">
                {favourites.map((item) => (
                  <FavCard key={item.id} item={item} onRemove={removeFavourite} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function FavCard({item, onRemove}: {item: FavouriteProduct; onRemove: (id: string) => void}) {
  return (
    <Link className="pcard" to={`/products/${item.handle}`} prefetch="intent">
      <div className="pcard-img">
        {item.image ? (
          <img
            src={item.image.url}
            alt={item.image.altText ?? item.title}
            loading="lazy"
            className="pcard-img-frame active"
          />
        ) : (
          <div className="fav-card-placeholder" />
        )}
        <button
          className="pcard-heart saved"
          aria-label="Remove from favourites"
          onClick={(e) => { e.preventDefault(); onRemove(item.id); }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <div className="pcard-body">
        <p className="pcard-name">{item.title}</p>
        <div className="pcard-price">
          <Money data={{amount: item.price.amount, currencyCode: item.price.currencyCode as CurrencyCode}} />
        </div>
      </div>
    </Link>
  );
}
