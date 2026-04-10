import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSeoLandingPage, getAllSeoLandingPages, getClubsByFilter } from '@/lib/seo-pages';
import { SeoListingContent } from './_components/seo-listing-content';

type Props = { params: Promise<{ seoSlug: string }> };

/** Revalidate every hour to pick up new pages/clubs */
export const revalidate = 3600;

// Known static routes that should NOT be handled by this catch-all
// All existing static routes - [seoSlug] must not handle these
const RESERVED_SLUGS = new Set([
  'admin', 'login', 'booking', 'payment', 'privacy', 'terms',
  'register-club', 'register-owner', 'news', 'bai-viet', 'san',
  'dat-san', 'su-kien', 'events', 'api', 'robots.txt', 'sitemap.xml',
  'splash', 'account', 'my-bookings',
]);

export async function generateStaticParams() {
  const pages = await getAllSeoLandingPages();
  return pages.map(p => ({ seoSlug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoSlug } = await params;
  if (RESERVED_SLUGS.has(seoSlug)) return {};

  const page = await getSeoLandingPage(seoSlug);
  if (!page) return { title: 'Không tìm thấy - Sport Booking' };

  return {
    title: page.title,
    description: page.meta_description || page.h1_title,
    openGraph: {
      title: page.title,
      description: page.meta_description || page.h1_title,
      type: 'website',
      url: `https://sportbooking.online/${seoSlug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.meta_description || page.h1_title,
    },
    alternates: { canonical: `https://sportbooking.online/${seoSlug}` },
  };
}

export default async function SeoListingPage({ params }: Props) {
  const { seoSlug } = await params;
  if (RESERVED_SLUGS.has(seoSlug)) notFound();

  const page = await getSeoLandingPage(seoSlug);
  if (!page) notFound();

  const clubs = await getClubsByFilter(page.filter_params);

  // JSON-LD for listing page
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: page.h1_title,
    numberOfItems: clubs.length,
    itemListElement: clubs.slice(0, 20).map((club, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'SportsActivityLocation',
        name: club.name,
        address: club.address,
        url: `https://sportbooking.online/san/${club.slug || club.id}`,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoListingContent page={page} clubs={clubs} />
    </>
  );
}
