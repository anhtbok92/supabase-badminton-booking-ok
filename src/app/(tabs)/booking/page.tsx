'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useSupabaseQuery, useSupabaseRow } from '@/supabase';
import type { Club, UserProfile, ClubType } from '@/lib/types';
import { MapPin, Phone, Clock, Map, Search, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';

// START: Updated ClubDetailSheet Component
function ClubDetailSheet({
  club,
  isOpen,
  onOpenChange,
}: {
  club: Club | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
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
          <Link href={`/dat-san/${club.slug || club.id}`} className="w-full">
            <Button className="w-full text-lg h-12 rounded-xl shadow-lg shadow-primary/30" size="lg" onClick={() => onOpenChange(false)}>
              Đặt ngay
            </Button>
          </Link>
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
          <div className='flex gap-2 mt-4'>
            <Button asChild variant="outline" className='rounded-xl'>
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button asChild className='rounded-xl'>
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
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeType: string;
  onTypeChange: (type: string) => void;
}) {
  const { data: clubTypes, loading } = useSupabaseQuery<ClubType>('club_types');
  const sortedClubTypes = useMemo(() => clubTypes?.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [clubTypes]);

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
          className="pl-12 rounded-xl h-14 text-base"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
        <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        <Button
          className="shrink-0 shadow-sm rounded-xl h-10 px-4 data-[active=false]:hover:bg-background"
          data-active={activeType === 'Tất cả'}
          variant={activeType === 'Tất cả' ? 'default' : 'outline'}
          onClick={() => onTypeChange('Tất cả')}
        >
          Tất cả
        </Button>
        {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-24 rounded-xl" />)}
        {sortedClubTypes?.map((type) => (
          <Button
            key={type.id}
            variant={activeType === type.name ? 'default' : 'outline'}
            onClick={() => onTypeChange(type.name)}
            className="shrink-0 rounded-xl h-10 px-4 data-[active=false]:hover:bg-background"
            data-active={activeType === type.name}
          >
            {type.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ClubCard({ club, onCardClick }: { club: Club; onCardClick: (club: Club) => void; }) {
  const firstImageUrl = club.image_urls && club.image_urls.length > 0 ? club.image_urls[0] : `https://picsum.photos/seed/${club.id}/400/300`;

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
      className="overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group rounded-xl border"
      onClick={() => onCardClick(club)}
    >
      <div className="relative w-full aspect-[16/9]">
        <Image
          src={firstImageUrl}
          alt={`${club.name} image`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          data-ai-hint="badminton court"
        />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg leading-tight">{club.name}</CardTitle>
          {club.rating && club.rating > 0 ? (
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg shrink-0 ml-2">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-xs font-bold text-primary">{club.rating.toFixed(1)}</span>
            </div>
          ) : null}
        </div>
        <div className="flex items-end gap-3 justify-between">
          <div className="space-y-1">
            <CardDescription className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{club.address}</span>
            </CardDescription>
            <p className="text-lg font-bold text-primary">{priceRange} <span className="text-xs text-muted-foreground font-normal">VND/giờ</span></p>
          </div>
          <Button className="shrink-0 rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-transform h-10 px-4 text-sm font-bold" onClick={(e) => { e.stopPropagation(); onCardClick(club); }}>
            Đặt ngay
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


export default function BookingTabPage() {
  const { data: clubs, loading } = useSupabaseQuery<Club>('clubs');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeClubType, setActiveClubType] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClubs = useMemo(() => {
    if (!clubs) return [];
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return clubs.filter(club => {
      const isVisible = club.is_active ?? true;
      const typeMatch = activeClubType === 'Tất cả' || club.club_type === activeClubType;
      const searchMatch = lowercasedSearchTerm === '' ||
        club.name.toLowerCase().includes(lowercasedSearchTerm) ||
        club.address.toLowerCase().includes(lowercasedSearchTerm);
      return isVisible && typeMatch && searchMatch;
    });
  }, [clubs, activeClubType, searchTerm]);

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
    <>
      <BookingGreeting />
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeType={activeClubType}
        onTypeChange={setActiveClubType}
      />
      <div className="px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading && Array.from({ length: 3 }).map((_, i) => <ClubCardSkeleton key={i} />)}
          {filteredClubs?.map((club) => (
            <ClubCard key={club.id} club={club} onCardClick={handleCardClick} />
          ))}
          {!loading && filteredClubs?.length === 0 && (
            <p className="text-center text-muted-foreground col-span-full py-10">Không có câu lạc bộ nào phù hợp.</p>
          )}
        </div>
      </div>
      <ClubDetailSheet
        club={selectedClub}
        isOpen={isSheetOpen}
        onOpenChange={handleSheetOpenChange}
      />
    </>
  );
}
