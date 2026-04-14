'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';
import { useSupabase } from '@/supabase';

type SeoLink = {
  slug: string;
  page_type: string;
  h1_title: string;
  filter_params: Record<string, any>;
};

const TYPE_LABELS: Record<string, string> = {
  type_city: 'Theo thành phố',
  type_district: 'Theo quận/huyện',
  amenity: 'Theo tiện ích',
  time: 'Theo thời gian',
  price: 'Theo giá',
  near_location: 'Gần vị trí',
};

export function SeoInternalLinks() {
  const supabase = useSupabase();
  const [links, setLinks] = useState<SeoLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('seo_landing_pages')
      .select('slug, page_type, h1_title, filter_params')
      .eq('is_active', true)
      .order('page_type')
      .order('slug')
      .limit(60)
      .then(({ data }) => {
        setLinks((data || []) as SeoLink[]);
        setLoading(false);
      });
  }, [supabase]);

  if (loading || links.length === 0) return null;

  // Group by page_type
  const grouped = links.reduce<Record<string, SeoLink[]>>((acc, link) => {
    const key = link.page_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(link);
    return acc;
  }, {});

  return (
    <section className="py-20 md:py-32 bg-[var(--lp-bg-alt)] border-t border-[var(--lp-border-light)]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-12 md:mb-16">
          <span className="font-headline text-[var(--lp-accent)] text-sm font-bold tracking-[0.3em] uppercase block mb-4">
            Tìm sân thể thao
          </span>
          <h2 className="font-headline text-3xl md:text-5xl font-black italic uppercase tracking-tight">
            Khám phá sân gần bạn
          </h2>
          <p className="text-[var(--lp-text-muted)] mt-4 max-w-2xl">
            Tìm kiếm sân thể thao theo khu vực, loại sân, tiện ích và nhiều tiêu chí khác.
          </p>
        </div>

        <div className="space-y-10">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <h3 className="font-headline text-sm font-black uppercase tracking-[0.2em] text-[var(--lp-accent)] mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {TYPE_LABELS[type] || type}
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((link) => (
                  <Link
                    key={link.slug}
                    href={`/${link.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[var(--lp-border-light)] bg-[var(--lp-bg-card)] text-sm font-medium text-[var(--lp-text-secondary)] hover:border-[var(--lp-accent)] hover:text-[var(--lp-accent)] hover:bg-[var(--lp-accent-light)] transition-all group"
                  >
                    {link.h1_title}
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/bai-viet"
            className="inline-flex items-center gap-2 px-8 py-4 border border-[var(--lp-border)] text-[var(--lp-text)] rounded-md font-headline font-bold uppercase tracking-widest text-xs hover:border-[var(--lp-accent)] hover:text-[var(--lp-accent)] transition-all"
          >
            Xem bài viết & tin tức
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
