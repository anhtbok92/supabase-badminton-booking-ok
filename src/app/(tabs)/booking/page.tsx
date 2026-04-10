'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useSupabaseQuery, useSupabaseRow } from '@/supabase';
import type { Club, UserProfile, ClubType } from '@/lib/types';
import { MapPin, Phone, Clock, Map, Search, Star, SlidersHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';

// START: Updated ClubDetailSheet Component
function ClubDetailSheet({
  club,
  isOpen,
  onOpenChange,
  onBookNow,
}: {
  club: Club | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onBookNow: (club: Club) => void;
}) {
  if (!club) {
    return null;
  }

  const mapEmbedUrl = (club.latitude && club.longitude)
    ? `https://maps.google.com/maps?q=${club.latitude},${club.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(club.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const directionsUrl = (club.latitude && club.longitude)
    ? `https://www.google.com/maps/dir/?api=1&destination=${club.latitude},${club.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(club.address)}`;

  const getMinPrice = (pricing: Club['pricing']): string => {
    if (!pricing) return 'N/A';
    const allPrices = [...(pricing.weekday || []).map(p => p.price), ...(pricing.weekend || []).map(p => p.price)];
    const validPrices = allPrices.filter(p => p > 0);
    if (validPrices.length === 0) return 'N/A';

    const minPrice = Math.min(...validPrices);
    return new Intl.NumberFormat('vi-VN').format(minPrice);
  };

  const minPrice = getMinPrice(club.pricing);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0 gap-0 rounded-t-2xl">
        <SheetHeader className="sr-only">
          <SheetTitle>Chi tiết câu lạc bộ: {club.name}</SheetTitle>
          <SheetDescription>
            Thông tin chi tiết, hình ảnh, dịch vụ và vị trí của câu lạc bộ {club.name}.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-shrink-0 flex justify-center py-3 bg-card rounded-t-2xl">
          <div className="h-1.5 w-12 rounded-full bg-muted"></div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar scroll-smooth">
          <div className="pb-40"> {/* Padding for sticky footer */}

            {/* Image Carousel */}
            {club.image_urls && club.image_urls.length > 0 && (
              <div className="w-full pt-2">
                <div className="flex gap-3 px-4 pb-2 overflow-x-auto snap-x snap-mandatory hide-scrollbar touch-pan-x items-center">
                  {club.image_urls.map((url, index) => (
                    <div key={index} className="relative w-[85vw] max-w-sm aspect-[16/10] rounded-xl overflow-hidden shrink-0 snap-center bg-muted border ml-0">
                      <Image src={url} alt={`Image ${index + 1} of ${club.name}`} fill className="object-cover" sizes="85vw" priority={index === 0} />
                    </div>
                  ))}
                  {/* Empty spacing at the end to allow better snapping */}
                  <div className="w-px shrink-0 h-1" />
                </div>
              </div>
            )}

            {/* Headline & Meta */}
            <div className="px-4 mt-4 space-y-2">
              <h1 className="text-2xl font-bold leading-tight font-headline">{club.name}</h1>
              <div className="space-y-1 text-muted-foreground">
                {club.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{club.address}</span>
                  </div>
                )}
                {club.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{club.phone}</span>
                  </div>
                )}
                {club.operating_hours && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{club.operating_hours}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Services HTML */}
            {club.services_html && (
              <div className="px-4 mt-6">
                <h2 className="text-lg font-bold mb-3 border-l-4 border-primary pl-3">Dịch vụ tiện ích</h2>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: club.services_html }}
                />
              </div>
            )}

            {/* Mini Map */}
            <div className="px-4 mt-8">
              <h2 className="text-lg font-bold mb-3 border-l-4 border-primary pl-3">Vị trí</h2>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={mapEmbedUrl}
                ></iframe>
                <div className="absolute bottom-3 right-3">
                  <Button asChild size="sm" className="shadow-lg">
                    <Link href={directionsUrl} target="_blank" rel="noopener noreferrer">
                      <Map className="mr-2 h-4 w-4" />
                      Chỉ đường
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-card/80 backdrop-blur-md border-t pb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Giá từ</p>
              <p className="text-xl font-bold text-primary">{minPrice !== 'N/A' ? `${minPrice}đ` : 'Liên hệ'}<span className="text-sm font-normal text-muted-foreground"> /giờ</span></p>
            </div>
          </div>
          <Button className="w-full text-lg h-12 rounded-xl shadow-lg shadow-primary/30" size="lg" onClick={() => { onOpenChange(false); onBookNow(club); }}>
              Đặt ngay
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
// END: Updated ClubDetailSheet

// START: Re-used components from old file, no changes needed to them
function BookingGreeting() {
  const { user, loading: userLoading } = useUser();
  const { data: userProfile, loading: profileLoading } = useSupabaseRow<UserProfile>('users', user?.id ?? null);

  const loading = userLoading || (user && profileLoading);

  return (
    <div className="px-4 pt-6 pb-2">
      {loading ? (
        <>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-8 w-48" />
        </>
      ) : user && userProfile ? (
        <>
          <p className="text-sm text-primary font-medium uppercase tracking-wider">Chào mừng trở lại</p>
          <h2 className="text-2xl font-bold leading-tight font-headline">Xin chào, {userProfile.phone || user.email?.split('@')[0]}</h2>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold leading-tight font-headline">Khám phá & Đặt sân</h2>
          <p className="text-muted-foreground mt-1">Đăng nhập để có trải nghiệm đặt sân tốt nhất.</p>
          <div className='flex gap-2 mt-3'>
            <Button asChild variant="outline" size="sm" className='rounded-xl text-xs'>
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button asChild size="sm" className='rounded-xl text-xs'>
              <Link href="/login">Đăng ký</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function SearchAndFilter({
  searchTerm,
  onSearchChange,
  activeType,
  onTypeChange,
  clubTypes,
  loading,
  onAdvancedSearchOpen,
  hasAdvancedFilters,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeType: string;
  onTypeChange: (type: string) => void;
  clubTypes: ClubType[] | null;
  loading: boolean;
  onAdvancedSearchOpen: () => void;
  hasAdvancedFilters: boolean;
}) {
  const sortedClubTypes = useMemo(() => clubTypes?.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [clubTypes]);

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm px-4 py-3 space-y-3 border-b border-zinc-100">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Tìm theo tên hoặc địa chỉ..."
            className="pl-10 rounded-xl h-10 text-sm bg-white border-gray-300 shadow-sm focus:ring-primary/20 transition-all font-body"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-xl shrink-0 relative",
            hasAdvancedFilters && "border-primary text-primary"
          )}
          onClick={onAdvancedSearchOpen}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {hasAdvancedFilters && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full" />
          )}
        </Button>
      </div>
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 hide-scrollbar">
        <Button
          variant="ghost"
          className={cn(
            "shrink-0 rounded-full h-9 px-5 text-xs font-bold uppercase tracking-wider transition-all border-2 hover:bg-white",
            activeType === 'Tất cả' 
              ? "bg-white border-primary text-primary shadow-sm" 
              : "bg-white border-zinc-100 text-zinc-500 hover:border-zinc-200"
          )}
          onClick={() => onTypeChange('Tất cả')}
        >
          Tất cả
        </Button>
        {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
        {sortedClubTypes?.map((type) => {
          const isActive = activeType === type.name;
          const typeColor = type.color || '#00e640';
          return (
            <Button
              variant="ghost"
              key={type.id}
              onClick={() => onTypeChange(type.name)}
              className={cn(
                "shrink-0 rounded-full h-9 px-5 text-xs font-bold uppercase tracking-wider transition-all border-2 hover:bg-white",
                isActive 
                  ? "bg-white font-black" 
                  : "bg-white border-zinc-100 text-zinc-500 hover:border-zinc-200"
              )}
              style={{
                borderColor: isActive ? typeColor : undefined,
                color: isActive ? typeColor : undefined,
                boxShadow: isActive ? `0 2px 8px ${typeColor}40` : undefined,
              }}
            >
              <div className="flex items-center gap-1.5">
                {type.icon && <span className="relative w-4 h-4 shrink-0"><Image src={type.icon} alt="" fill className="object-contain" /></span>}
                {!type.icon && !isActive && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColor }} />}
                {type.name}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function ClubCard({ club, onCardClick, clubTypes }: { club: Club; onCardClick: (club: Club) => void; clubTypes: ClubType[] | null; }) {
  const firstImageUrl = club.image_urls && club.image_urls.length > 0 ? club.image_urls[0] : '/images/default-club-2.png';
  const clubTypeObj = clubTypes?.find(t => t.name === club.club_type);
  const typeColor = clubTypeObj?.color || '#00e640';

  const getPriceRange = (pricing: Club['pricing']): string => {
    if (!pricing) return 'N/A';
    const allPrices = [...(pricing.weekday || []).map(p => p.price), ...(pricing.weekend || []).map(p => p.price)];
    if (allPrices.length === 0) return 'N/A';
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    if (minPrice === maxPrice) return `${(minPrice / 1000).toFixed(0)}k`;
    return `${(minPrice / 1000).toFixed(0)}k - ${(maxPrice / 1000).toFixed(0)}k`;
  };

  const priceRange = getPriceRange(club.pricing);

  return (
    <Card
      className="overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-xl border border-zinc-100 bg-white"
      onClick={() => onCardClick(club)}
    >
      <div className="relative w-full aspect-[16/10] overflow-hidden">
        <Image
          src={firstImageUrl}
          alt={`${club.name}`}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
        
        {/* Floating Category Badge */}
        <div 
          className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md bg-white/90 flex items-center gap-1"
          style={{ border: `2px solid ${typeColor}`, color: typeColor }}
        >
          {club.club_type || 'Thể thao'}
        </div>

        {club.rating && club.rating > 0 && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-[11px] font-black text-slate-800">{club.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="text-slate-900 font-headline font-black uppercase italic leading-tight mb-2 line-clamp-2 drop-shadow-sm min-h-[1.5rem]" style={{ fontSize: '15px' }}>
            {club.name}
        </h3>
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs text-slate-500 font-medium line-clamp-1">{club.address}</span>
          </div>
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
            <p className="text-xl font-black text-primary italic leading-none">{priceRange} <span className="text-[10px] text-slate-400 font-bold uppercase not-italic">VND/H</span></p>
          </div>
          <Button 
            className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 active:scale-95 transition-all h-11 px-5 text-xs font-black uppercase tracking-widest" 
            onClick={(e) => { e.stopPropagation(); onCardClick(club); }}
          >
            Chi tiết
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


function ClubCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-xl border">
      <Skeleton className="w-full aspect-[16/9]" />
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-12 rounded-lg" />
        </div>
        <div className="flex items-end gap-3 justify-between">
          <div className="space-y-2 w-full">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-1/2" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
// END: Re-used components


import { cn } from '@/lib/utils';
import { useTenant } from '@/hooks/use-tenant';
import { PROVINCES } from '@/lib/vietnam-locations';
import { AdvancedSearchSheet, type AdvancedFilters } from './_components/advanced-search';
import { BookingTypeSelector } from './_components/booking-type-selector';

const EMPTY_FILTERS: AdvancedFilters = { province: '', district: '', openHour: '' };

/** Check if club's operating_hours contains an opening time <= the target hour */
function matchOpenHour(operatingHours: string | undefined, targetHour: string): boolean {
  if (!operatingHours) return false;
  // Extract all time patterns like "05:00", "6:00" from operating hours string
  const times = operatingHours.match(/(\d{1,2}):(\d{2})/g);
  if (!times || times.length === 0) return false;
  // The first time found is typically the opening time
  const openTime = times[0].padStart(5, '0'); // ensure "6:00" becomes "06:00"
  return openTime <= targetHour;
}

/** Normalize Vietnamese text for matching (remove diacritics) */
function normalizeVN(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/** Check if address contains the location name (diacritics-insensitive) */
function addressContains(address: string, location: string): boolean {
  if (!location) return true;
  // Try exact match first (with diacritics)
  if (address.toLowerCase().includes(location.toLowerCase())) return true;
  // Fallback: normalized match (without diacritics)
  return normalizeVN(address).includes(normalizeVN(location));
}

/** Match club province — by city field (slug or name) or fallback to address */
function matchProvince(club: Club, province: string): boolean {
  if (!province) return true;
  // Match by city field (name match since filter uses province name)
  if ((club as any).city) {
    const prov = PROVINCES.find(p => p.slug === (club as any).city);
    if (prov && prov.name === province) return true;
  }
  // Fallback: address text match
  return addressContains(club.address, province);
}

/** Match club district — by district field (slug or name) or fallback to address */
function matchDistrict(club: Club, district: string): boolean {
  if (!district) return true;
  // Match by district field
  if ((club as any).district && (club as any).city) {
    const prov = PROVINCES.find(p => p.slug === (club as any).city);
    const dist = prov?.districts.find(d => d.slug === (club as any).district);
    if (dist && dist.name === district) return true;
  }
  // Fallback: address text match
  return addressContains(club.address, district);
}

export default function BookingTabPage() {
  const tenant = useTenant();
  const { data: clubs, loading: clubsLoading } = useSupabaseQuery<Club>('clubs');
  const { data: clubTypes, loading: typesLoading } = useSupabaseQuery<ClubType>('club_types');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeClubType, setActiveClubType] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(EMPTY_FILTERS);
  const [bookingTypeClub, setBookingTypeClub] = useState<Club | null>(null);

  const hasAdvancedFilters = !!(advancedFilters.province || advancedFilters.district || advancedFilters.openHour);

  // When tenant context is present, show only the tenant's club
  const filteredClubs = useMemo(() => {
    if (!clubs) return [];

    // Tenant mode: show only the tenant's club
    if (tenant) {
      return clubs.filter(c => c.id === tenant.clubId && (c.is_active ?? true));
    }

    // Normal mode: apply search and type filters
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return clubs.filter(club => {
      const isVisible = club.is_active ?? true;
      const typeMatch = activeClubType === 'Tất cả' || club.club_type === activeClubType;
      const searchMatch = lowercasedSearchTerm === '' ||
        club.name.toLowerCase().includes(lowercasedSearchTerm) ||
        club.address.toLowerCase().includes(lowercasedSearchTerm);

      // Advanced filters — match by city/district field first, fallback to address text
      const provinceMatch = matchProvince(club, advancedFilters.province);
      const districtMatch = matchDistrict(club, advancedFilters.district);
      const hourMatch = !advancedFilters.openHour || matchOpenHour(club.operating_hours, advancedFilters.openHour);

      return isVisible && typeMatch && searchMatch && provinceMatch && districtMatch && hourMatch;
    });
  }, [clubs, activeClubType, searchTerm, tenant, advancedFilters]);

  const handleCardClick = (club: Club) => {
    setSelectedClub(club);
    setIsSheetOpen(true);
  };

  const handleSheetOpenChange = (isOpen: boolean) => {
    setIsSheetOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setSelectedClub(null);
      }, 300);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <BookingGreeting />
      {!tenant && (
        <SearchAndFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeType={activeClubType}
          onTypeChange={setActiveClubType}
          clubTypes={clubTypes}
          loading={typesLoading}
          onAdvancedSearchOpen={() => setAdvancedOpen(true)}
          hasAdvancedFilters={hasAdvancedFilters}
        />
      )}
      <div className="px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clubsLoading && Array.from({ length: 3 }).map((_, i) => <ClubCardSkeleton key={i} />)}
          {filteredClubs?.map((club) => (
            <ClubCard 
                key={club.id} 
                club={club} 
                onCardClick={handleCardClick} 
                clubTypes={clubTypes} 
            />
          ))}
          {!clubsLoading && filteredClubs?.length === 0 && (
            <p className="text-center text-muted-foreground col-span-full py-10">Không có câu lạc bộ nào phù hợp.</p>
          )}
        </div>
      </div>
      <ClubDetailSheet
        club={selectedClub}
        isOpen={isSheetOpen}
        onOpenChange={handleSheetOpenChange}
        onBookNow={(club) => setBookingTypeClub(club)}
      />
      {bookingTypeClub && (
        <BookingTypeSelector
          club={bookingTypeClub}
          isOpen={!!bookingTypeClub}
          onOpenChange={(open) => { if (!open) setBookingTypeClub(null); }}
        />
      )}
      <AdvancedSearchSheet
        isOpen={advancedOpen}
        onOpenChange={setAdvancedOpen}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        onReset={() => setAdvancedFilters(EMPTY_FILTERS)}
      />
    </div>
  );
}
