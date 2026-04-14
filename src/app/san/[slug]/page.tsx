import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getClubBySlug, getAllClubSlugs } from '@/lib/seo-pages';
import { getMinPrice, formatVNPrice } from '@/lib/club-utils';
import { notFound } from 'next/navigation';
import { ClubImageGallery } from './_components/club-image-gallery';
import { ClubInfoSection } from './_components/club-info-section';
import { ClubPricingTable } from './_components/club-pricing-table';
import { ClubMapSection } from './_components/club-map-section';

type Props = { params: Promise<{ slug: string }> };

/** Revalidate every hour to pick up new clubs */
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllClubSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const club = await getClubBySlug(slug);
  if (!club) return { title: 'Không tìm thấy - Sport Booking' };

  const title = `${club.name} - Đặt sân ${club.club_type} tại ${club.address}`;
  const description = club.description
    || `Địa chỉ, giá và thông tin ${club.name}. ${club.address}. Đặt sân online nhanh chóng.`;
  const ogImage = club.image_urls?.[0];

  return {
    title,
    description,
    openGraph: {
      title, description, type: 'website',
      url: `https://sportbooking.online/san/${slug}`,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image', title, description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    alternates: { canonical: `https://sportbooking.online/san/${slug}` },
  };
}

export default async function ClubDetailSeoPage({ params }: Props) {
  const { slug } = await params;
  const club = await getClubBySlug(slug);
  if (!club) notFound();

  const minPrice = getMinPrice(club.pricing);
  const appBookingUrl = `https://app.sportbooking.online/dat-san/${club.slug || club.id}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: club.name,
    address: { '@type': 'PostalAddress', streetAddress: club.address },
    telephone: club.phone,
    description: club.description,
    image: club.image_urls?.[0],
    ...(club.latitude && club.longitude
      ? { geo: { '@type': 'GeoCoordinates', latitude: club.latitude, longitude: club.longitude } }
      : {}),
    ...(minPrice ? { priceRange: `${formatVNPrice(minPrice)}đ/giờ` } : {}),
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-4xl mx-auto flex items-center gap-3 px-4 h-14">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-headline font-bold text-sm truncate">{club.name}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <ClubImageGallery images={club.image_urls} clubName={club.name} clubType={club.club_type} />
        <ClubInfoSection club={club} />

        {/* Price + CTA */}
        <div className="px-4 mt-6">
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Giá từ</p>
              <p className="text-2xl font-bold text-primary">
                {minPrice ? `${formatVNPrice(minPrice)}đ` : 'Liên hệ'}
                <span className="text-sm font-normal text-muted-foreground"> /giờ</span>
              </p>
            </div>
            <a href={appBookingUrl} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity">
              Đặt sân ngay
            </a>
          </div>
        </div>

        {club.description && (
          <div className="px-4 mt-8">
            <h3 className="text-lg font-bold mb-3 border-l-4 border-primary pl-3">Giới thiệu</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{club.description}</p>
          </div>
        )}

        {club.services_html && (
          <div className="px-4 mt-8">
            <h3 className="text-lg font-bold mb-3 border-l-4 border-primary pl-3">Dịch vụ tiện ích</h3>
            <div className="prose prose-sm max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: club.services_html }} />
          </div>
        )}

        <ClubPricingTable pricing={club.pricing} />
        <ClubMapSection club={club} />

        <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t p-4 pb-8">
          <a href={appBookingUrl} className="block w-full text-center py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-base shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity">
            Đặt sân ngay tại {club.name}
          </a>
        </div>
      </main>
    </div>
  );
}
