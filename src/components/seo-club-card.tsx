import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Clock, Star } from 'lucide-react';
import type { Club } from '@/lib/types';
import { getMinPrice, formatVNPrice } from '@/lib/seo-pages';
import { getDefaultClubImage } from '@/lib/club-utils';

export function SeoClubCard({ club }: { club: Club }) {
  const firstImage = club.image_urls?.[0] || getDefaultClubImage(club.club_type);
  const minPrice = getMinPrice(club.pricing);

  const getPriceRange = (): string => {
    if (!club.pricing) return 'N/A';
    const allPrices = [
      ...(club.pricing.weekday || []).map(p => p.price),
      ...(club.pricing.weekend || []).map(p => p.price),
    ];
    if (allPrices.length === 0) return 'N/A';
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    if (min === max) return `${(min / 1000).toFixed(0)}k`;
    return `${(min / 1000).toFixed(0)}k - ${(max / 1000).toFixed(0)}k`;
  };

  return (
    <Link
      href={`/san/${club.slug || club.id}`}
      className="block overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 rounded-xl border border-zinc-100 bg-white group"
    >
      <div className="relative w-full aspect-[16/10] overflow-hidden">
        <Image
          src={firstImage}
          alt={club.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
        {club.club_type && (
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md bg-white/90 border-2 border-primary text-primary">
            {club.club_type}
          </div>
        )}
        {club.rating && club.rating > 0 && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-[11px] font-black text-slate-800">{club.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-slate-900 font-headline font-black uppercase italic leading-tight mb-2 line-clamp-2 min-h-[1.5rem]" style={{ fontSize: '15px' }}>
          {club.name}
        </h3>
        <div className="space-y-1 mb-3">
          {club.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs text-slate-500 font-medium line-clamp-1">{club.address}</span>
            </div>
          )}
          {club.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs text-slate-500 font-medium">{club.phone}</span>
            </div>
          )}
          {club.operating_hours && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs text-slate-500 font-medium line-clamp-1">{club.operating_hours}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest leading-none mb-1">Giá từ</p>
            <p className="text-xl font-black text-primary italic leading-none">
              {getPriceRange()} <span className="text-[10px] text-slate-400 font-bold uppercase not-italic">VND/H</span>
            </p>
          </div>
          <span className="rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 h-11 px-5 text-xs font-black uppercase tracking-widest inline-flex items-center">
            Chi tiết
          </span>
        </div>
      </div>
    </Link>
  );
}
