import type {Route} from './+types/demo._index';
import {SITE_NAME} from '~/lib/site';
import {HeroCarousel} from '~/components/HeroCarousel';
import {CategoriesGrid} from '~/components/CategoriesGrid';
import {PopularProducts} from '~/components/PopularProducts';
import {TexturesGrid} from '~/components/TexturesGrid';
import {TestimonialsMarquee} from '~/components/TestimonialsMarquee';
import {CraftmanshipProcess} from '~/components/CraftmanshipProcess';
import {ContactBanner} from '~/components/ContactBanner';
import demoStyles from '~/styles/demo.css?url';

export const meta: Route.MetaFunction = () => {
  return [{title: `${SITE_NAME} | Demo landing page`}];
};

export function links() {
  return [
    {rel: 'stylesheet', href: demoStyles},
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&family=DM+Sans:wght@400;500&display=swap',
    },
  ];
}

export default function DemoIndex() {
  return (
    <>
      <HeroCarousel />
      <CategoriesGrid />
      <PopularProducts />
      <TexturesGrid />
      <TestimonialsMarquee />
      <CraftmanshipProcess />
      <ContactBanner />
    </>
  );
}
