import type { Club } from '@/lib/types';
import type { SeoLandingPage } from '@/lib/seo-pages';
import { SeoClubCard } from '@/components/seo-club-card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function SeoListingContent({
  page,
  clubs,
}: {
  page: SeoLandingPage;
  clubs: Club[];
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 h-14">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-headline font-bold text-sm truncate">{page.title}</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* H1 Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-headline font-black italic uppercase tracking-tight mb-2">
            {page.h1_title}
          </h1>
          {page.filter_params.city_name && (
            <p className="text-muted-foreground">
              Tìm thấy {clubs.length} sân tại {page.filter_params.city_name}
              {page.filter_params.district_name ? `, ${page.filter_params.district_name}` : ''}
            </p>
          )}
          {page.filter_params.location_name && (
            <p className="text-muted-foreground">
              Tìm thấy {clubs.length} sân gần {page.filter_params.location_name}
            </p>
          )}
          {!page.filter_params.city_name && !page.filter_params.location_name && (
            <p className="text-muted-foreground">Tìm thấy {clubs.length} sân phù hợp</p>
          )}
        </div>

        {/* Club Grid */}
        {clubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {clubs.map(club => (
              <SeoClubCard key={club.id} club={club} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">Chưa có sân nào phù hợp với tiêu chí tìm kiếm.</p>
            <Link href="/" className="text-primary font-bold mt-4 inline-block hover:underline">
              Quay về trang chủ
            </Link>
          </div>
        )}

        {/* SEO Content */}
        {page.seo_content && (
          <div className="mt-8 border-t pt-8">
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: page.seo_content }} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
