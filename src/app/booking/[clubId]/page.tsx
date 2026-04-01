'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format, getDay, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Info, ChevronLeft, ChevronRight, ShoppingCart, X, Calendar as CalendarIcon } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';

import { timeSlots } from '@/lib/data';
import type { Club, Court, SelectedSlot, SlotStatus, UserBooking } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSupabaseQuery, useSupabaseRow } from '@/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

// Price calculation utility
function getPriceForSlot(time: string, date: Date | string, pricing?: Club['pricing']): number {
  if (!pricing) return 0;
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const dayOfWeek = getDay(d);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const relevantTiers = isWeekend ? pricing.weekend : pricing.weekday;

  if (!relevantTiers) return 0;

  const [h, m] = time.split(':').map(Number);
  const slotValue = h * 60 + m;

  for (const tier of relevantTiers) {
    if (!tier.timeRange || tier.timeRange.length < 2) continue;

    const [sh, sm] = tier.timeRange[0].split(':').map(Number);
    const startValue = sh * 60 + sm;

    const [eh, em] = tier.timeRange[1].split(':').map(Number);
    let endValue = eh * 60 + em;

    // If end time is 00:00 or 24:00, and it's after the start time, it means end of day (1440 mins)
    if ((endValue === 0 || eh === 24) && startValue > 0) {
      endValue = 1440;
    }

    // Allow slots up to and including the last 30-min slot before endValue
    // For example, if endValue is 1440 (24:00), allow slot 1410 (23:30)
    if (slotValue >= startValue && slotValue < endValue) {
      return tier.price;
    }
  }
  return 0;
}

// New Horizontal Date Picker component based on booking.html
function HorizontalDatePicker({
  selectedDate,
  onDateSelect,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}) {
  const dates = useMemo(() => {
    const start = new Date();
    // Invalidate time part for correct comparison
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 365 }, (_, i) => addDays(start, i));
  }, []);

  return (
    <div className="px-4 space-y-1">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-primary px-1">
          {format(selectedDate, "'Tháng' M, yyyy", { locale: vi })}
        </h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-primary hover:bg-primary/10">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span className="text-xs">Chọn ngày</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateSelect(date)}
              initialFocus
              locale={vi}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const oneYearFromNow = addDays(today, 365);
                return date < today || date > oneYearFromNow;
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-1">
          {dates.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateSelect(date)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[48px] sm:min-w-[64px] h-14 sm:h-20 rounded-lg sm:rounded-xl border transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary"
                    : "bg-card hover:bg-muted"
                )}
              >
                <div className={cn("text-[9px] sm:text-[10px] font-medium uppercase tracking-wider", isSelected ? "opacity-90" : "text-muted-foreground")}>
                  {format(date, 'eee', { locale: vi })}
                </div>
                <div className="text-base sm:text-xl font-bold">{format(date, 'd')}</div>
                {!isSelected && (
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground font-medium opacity-60">
                    T{format(date, 'M')}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}


// Status Legend component styled like in the HTML
function StatusLegend() {
  const legendItems = [
    { label: 'Đã chọn', className: 'bg-accent' },
    { label: 'Trống', className: 'bg-background border' },
    { label: 'Đã đặt', className: 'bg-destructive/80' },
    { label: 'Khóa', className: 'bg-muted line-through' },
    { label: 'Sự kiện', className: 'bg-event/80' },
  ];

  return (
    <div className="flex items-center gap-x-3 sm:gap-x-4 gap-y-1 px-4 text-xs sm:text-sm text-muted-foreground overflow-x-auto whitespace-nowrap">
      {legendItems.map(item => (
        <div key={item.label} className="flex items-center gap-1.5 shrink-0">
          <div className={cn('h-3 w-3 sm:h-4 sm:w-4 rounded-sm', item.className)} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// Modal for Court Information (retained from old version for better UX)
function CourtInfoModal({ isOpen, onClose, court }: { isOpen: boolean, onClose: () => void, court: Court | null }) {
  if (!court) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{court.name}</DialogTitle>
          {court.description && <DialogDescription className="pt-2">{court.description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 mt-2">
          {court.image_urls && court.image_urls.length > 0 ? (
            <div className={`grid grid-cols-${court.image_urls.length > 1 ? '2' : '1'} gap-2`}>
              {court.image_urls.map(url => (
                <div key={url} className="relative aspect-video">
                  <Image src={url} alt={`Image for ${court.name}`} fill className="object-cover rounded-md bg-muted" sizes="40vw" />
                </div>
              ))}
            </div>
          ) : null}
          {(!court.image_urls || court.image_urls.length === 0) && !court.description && (
            <p className="text-muted-foreground text-center py-4">Không có thông tin chi tiết cho sân này.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


// Main Booking Page Component
export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId as string;

  const [date, setDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const { data: club, loading: clubLoading } = useSupabaseRow<Club>('clubs', clubId);
  const { data: courts, loading: courtsLoading } = useSupabaseQuery<Court>('courts', q => q.eq('club_id', clubId));
  const sortedCourts = useMemo(() => courts?.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [courts]);

  const dateStr = format(date, 'yyyy-MM-dd');
  const { data: bookedSlots, loading: bookingsLoading } = useSupabaseQuery<UserBooking>(
    'bookings',
    q => q.eq('date', dateStr).eq('club_id', clubId),
    { deps: [dateStr, clubId] }
  );

  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [isCourtInfoModalOpen, setIsCourtInfoModalOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

  // Removed clearing selected slots on date change to support multi-day booking

  const getSlotStatus = (courtId: string, time: string): SlotStatus => {
    const currentDateStr = format(date, 'yyyy-MM-dd');
    if (selectedSlots.some(s => s.court_id === courtId && s.time === time && s.date === currentDateStr)) {
      return 'selected';
    }

    const booking = bookedSlots?.find(booking =>
      booking.status !== 'Đã hủy' &&
      booking.slots.some(s => s.court_id === courtId && s.time === time)
    );

    if (booking) {
      if (booking.status === 'Khóa') return 'blocked';
      if (booking.status === 'Sự kiện') return 'event';
      return 'booked';
    }

    // Block past time slots for today
    const now = new Date();
    if (isSameDay(date, now)) {
      const [slotHour, slotMinute] = time.split(':').map(Number);
      const currentTimeString = format(now, 'HH:mm');
      const [currentHour, currentMinute] = currentTimeString.split(':').map(Number);

      if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute)) {
        return 'blocked';
      }
    }

    // Block slots that don't have pricing configured (price = 0)
    if (club && getPriceForSlot(time, date, club.pricing) === 0) {
      return 'blocked';
    }

    return 'available';
  };

  const loading = clubLoading || courtsLoading || bookingsLoading;


  const handleCourtClick = (court: Court) => {
    setSelectedCourt(court);
    setIsCourtInfoModalOpen(true);
  };

  const handleSlotClick = (courtId: string, time: string, status: SlotStatus) => {
    if (status !== 'available' && status !== 'selected') return;

    const currentDateStr = format(date, 'yyyy-MM-dd');
    const slotIdentifier = { court_id: courtId, time, date: currentDateStr };
    const isSelected = selectedSlots.some(s => s.court_id === courtId && s.time === time && s.date === currentDateStr);

    if (isSelected) {
      setSelectedSlots(selectedSlots.filter(s => !(s.court_id === courtId && s.time === time && s.date === currentDateStr)));
    } else {
      setSelectedSlots([...selectedSlots, slotIdentifier]);
    }
  };


  const getStatusClass = (status: SlotStatus) => {
    switch (status) {
      case 'available':
        return 'bg-primary/[0.03] text-card-foreground hover:bg-primary/5 border';
      case 'selected':
        return 'bg-accent text-accent-foreground hover:bg-accent/90';
      case 'booked':
        return 'bg-destructive/80 text-destructive-foreground cursor-not-allowed';
      case 'blocked':
        return 'bg-muted text-muted-foreground cursor-not-allowed line-through';
      case 'event':
        return 'bg-event/80 text-event-foreground cursor-not-allowed';
      default:
        return 'bg-card border';
    }
  };

  const totalPrice = selectedSlots.reduce((total, slot) => {
    // If slot has date, use it; otherwise fallback to current page date (shouldn't happen with new logic but safe)
    const slotDate = slot.date || format(date, 'yyyy-MM-dd');
    return total + getPriceForSlot(slot.time, slotDate, club?.pricing);
  }, 0);

  // Group slots by date for Cart view
  const slotsByDate = useMemo(() => {
    const groups: Record<string, SelectedSlot[]> = {};
    selectedSlots.forEach(slot => {
      const d = slot.date || format(date, 'yyyy-MM-dd');
      if (!groups[d]) groups[d] = [];
      groups[d].push(slot);
    });
    return groups;
  }, [selectedSlots, date]);

  const bookingUrl = `/payment?clubId=${club?.id}&date=${format(date, 'yyyy-MM-dd')}&slots=${encodeURIComponent(JSON.stringify(selectedSlots))}`;

  if (loading && !club) {
    return <BookingPageSkeleton />;
  }

  if (!club) {
    return (
      <div className="flex flex-col h-screen">
        <header className="sticky top-0 z-40 w-full border-b bg-card flex-shrink-0">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Quay lại</span>
            </Button>
            <h1 className="text-lg font-semibold font-headline truncate">Không tìm thấy</h1>
          </div>
        </header>
        <div className="flex-grow flex items-center justify-center text-center">
          Không tìm thấy câu lạc bộ.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card flex-shrink-0">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Quay lại</span>
          </Button>
          <h1 className="text-lg font-semibold font-headline truncate">{club.name}</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-auto">
                <Info className="h-5 w-5" />
                <span className="sr-only">Xem giá</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="font-headline">Bảng giá</SheetTitle>
                <SheetDescription>Giá cho mỗi suất 30 phút.</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-4">
                <div>
                  <h3 className="font-semibold mb-2">Thứ Hai - Thứ Sáu</h3>
                  <Table>
                    <TableHeader><TableRow><TableHead>Khung giờ</TableHead><TableHead className="text-right">Đơn giá</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {club.pricing?.weekday.map((p, i) => (
                        <TableRow key={`wd-${i}`}><TableCell>{p.timeRange.join(' - ')}</TableCell><TableCell className="text-right">{new Intl.NumberFormat('vi-VN').format(p.price)}đ</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Thứ Bảy & Chủ Nhật</h3>
                  <Table>
                    <TableHeader><TableRow><TableHead>Khung giờ</TableHead><TableHead className="text-right">Đơn giá</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {club.pricing?.weekend.map((p, i) => (
                        <TableRow key={`we-${i}`}><TableCell>{p.timeRange.join(' - ')}</TableCell><TableCell className="text-right">{new Intl.NumberFormat('vi-VN').format(p.price)}đ</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="py-2 sm:py-4 space-y-2 sm:space-y-4 flex-shrink-0">
        <HorizontalDatePicker selectedDate={date} onDateSelect={setDate} />
        <div className="px-4 py-0 sm:py-2">
          <h3 className="text-[#0d1b12] dark:text-white text-sm sm:text-lg font-bold leading-tight tracking-[-0.015em]">Lịch sân cầu lông</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Khách vui lòng đặt 2 tiếng, nếu đặt lẻ giờ vui lòng nhắn theo hotline 0964.669.324
          </p>
        </div>
      </div>

      <div className="flex-grow min-h-0">
        <ScrollArea className="w-full h-full whitespace-nowrap">
          <div className="inline-block min-w-full">
            {/* Sticky Header */}
            <div className="grid grid-cols-[96px,1fr] sticky top-0 bg-background z-20">
              <div className="p-2 border-b border-r text-xs font-bold text-muted-foreground/80 text-center sticky left-0 bg-card z-10">Sân</div>
              <div className="relative border-b h-12 bg-card overflow-visible">
                <div className="absolute inset-x-0 bottom-0 flex h-full">
                  {timeSlots.map((time, i) => (
                    <div
                      key={time}
                      className="absolute text-[10px] font-bold text-muted-foreground flex flex-col items-center"
                      style={{
                        left: `${i * 80}px`,
                        transform: 'translateX(-50%)',
                        width: '40px'
                      }}
                    >
                      <div className="h-4 w-px bg-border mt-2"></div>
                      <span className="mt-1 leading-none">{time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Court Rows */}
            {sortedCourts?.map(court => (
              <div key={court.id} className="grid grid-cols-[96px,1fr] items-center">
                <div className="font-semibold text-sm border-r text-center sticky left-0 bg-card h-full flex items-center justify-center z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <Button variant="ghost" className="w-full h-full text-left p-1 justify-center rounded-none hover:bg-muted/50 transition-colors" onClick={() => handleCourtClick(court)}>{court.name}</Button>
                </div>
                <div className="flex">
                  {timeSlots.slice(0, 48).map(time => {
                    const status = getSlotStatus(court.id, time);
                    const price = getPriceForSlot(time, date, club.pricing);
                    const showPrice = (status === 'available' || status === 'selected') && price > 0;
                    return (
                      <Button
                        key={time}
                        variant="outline"
                        className={cn(
                          'w-20 h-16 rounded-none border-l border-b flex-shrink-0 text-xs transition-all duration-200',
                          getStatusClass(status),
                          status === 'available' && 'hover:border-primary hover:z-10'
                        )}
                        onClick={() => handleSlotClick(court.id, time, status)}
                      >
                        {showPrice ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={cn('font-bold', status === 'selected' ? 'text-accent-foreground' : 'text-primary')}>
                              {`${price / 1000}k`}
                            </span>
                            {status === 'selected' && <div className="w-1 h-1 rounded-full bg-accent-foreground" />}
                          </div>
                        ) : ''}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
            {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="px-2 py-2 sm:p-4 bg-muted/50 border-t mt-auto">
        <StatusLegend />
      </div>

      <CourtInfoModal
        isOpen={isCourtInfoModalOpen}
        onClose={() => setIsCourtInfoModalOpen(false)}
        court={selectedCourt}
      />

      {selectedSlots.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 mt-auto bg-card/80 backdrop-blur-md border-t shadow-lg flex-shrink-0 pb-safe">
          {/* Mobile: compact single row */}
          <div className="flex sm:hidden items-center gap-2 p-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 gap-1.5 bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary shrink-0">
                  <ShoppingCart className="h-4 w-4" />
                  <Badge variant="secondary" className="h-5 min-w-5 px-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-[10px]">{selectedSlots.length}</Badge>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle className="font-headline">Chi tiết đặt sân</SheetTitle>
                  <SheetDescription>{selectedSlots.length} suất đã chọn</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(60vh-10rem)] mt-4">
                  <div className="space-y-3 pr-4">
                    {Object.entries(slotsByDate).sort().map(([d, slots]) => (
                      <div key={d} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-bold text-muted-foreground">{format(new Date(d), 'dd/MM/yyyy')}</span>
                        </div>
                        <div className="space-y-3 pl-2">
                          {(() => {
                            const slotsByCourt: Record<string, string[]> = {};
                            slots.forEach(s => {
                              const cName = courts?.find(c => c.id === s.court_id)?.name || 'Sân ?';
                              if (!slotsByCourt[cName]) slotsByCourt[cName] = [];
                              slotsByCourt[cName].push(s.time);
                            });
                            return Object.entries(slotsByCourt).sort().map(([cName, cTimes]) => {
                              const sorted = cTimes.sort();
                              const ranges: { start: string, end: string, originalSlots: string[] }[] = [];
                              if (sorted.length > 0) {
                                let start = sorted[0]; let prev = sorted[0]; let currentRangeSlots = [sorted[0]];
                                for (let i = 1; i <= sorted.length; i++) {
                                  const current = sorted[i]; let isConsecutive = false;
                                  if (current) { const [pH, pM] = prev.split(':').map(Number); const [cH, cM] = current.split(':').map(Number); if (cH * 60 + cM === pH * 60 + pM + 30) isConsecutive = true; }
                                  if (!isConsecutive) { const [eH, eM] = prev.split(':').map(Number); let totalMins = eH * 60 + eM + 30; ranges.push({ start, end: `${Math.floor(totalMins / 60).toString().padStart(2, '0')}:${(totalMins % 60).toString().padStart(2, '0')}`, originalSlots: currentRangeSlots }); if (current) { start = current; prev = current; currentRangeSlots = [current]; } } else { prev = current; currentRangeSlots.push(current); }
                                }
                              }
                              return (
                                <div key={cName} className="space-y-1">
                                  <div className="text-xs font-bold text-primary/70">{cName}</div>
                                  <div className="flex flex-wrap gap-1">
                                    {ranges.map((range, ridx) => (
                                      <div key={ridx} className="flex items-center gap-1.5 text-xs bg-background border border-primary/20 rounded-full pl-2.5 pr-1.5 py-1 shadow-sm">
                                        <span className="font-semibold text-primary">{range.start} - {range.end}</span>
                                        <button onClick={() => { const courtId = slots.find(s => courts?.find(c => c.id === s.court_id)?.name === cName)?.court_id; if (courtId) { setSelectedSlots(prev => prev.filter(s => !(s.date === d && s.court_id === courtId && range.originalSlots.includes(s.time)))); } }} className="text-muted-foreground hover:text-destructive bg-muted/30 rounded-full p-0.5 transition-colors"><X className="h-3 w-3" /></button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="pt-3 border-t mt-3">
                  <div className="flex justify-between items-center text-sm font-semibold mb-3">
                    <span>Tổng cộng:</span>
                    <span className="text-primary text-lg">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}</span>
                  </div>
                  <Link href={bookingUrl} className="w-full">
                    <Button size="lg" className="w-full h-12 text-base rounded-xl shadow-lg shadow-primary/30">Tiếp tục<ChevronRight className="ml-2 h-5 w-5" /></Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
            <p className="text-lg font-bold font-headline text-primary flex-1">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}</p>
            <Link href={bookingUrl}>
              <Button size="sm" className="h-10 px-5 rounded-xl shadow-lg shadow-primary/30 font-bold">Tiếp tục<ChevronRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </div>

          {/* Desktop: full layout */}
          <div className="hidden sm:flex container mx-auto p-4 flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2 bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>Giỏ hàng</span>
                      <Badge variant="secondary" className="h-5 min-w-5 px-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-[10px]">{selectedSlots.length}</Badge>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start" sideOffset={8}>
                    <div className="bg-muted/50 p-3 border-b flex justify-between items-center">
                      <h4 className="font-semibold text-sm">Chi tiết đặt sân</h4>
                      <span className="text-xs text-muted-foreground">{selectedSlots.length} suất đã chọn</span>
                    </div>
                    <ScrollArea className="h-64">
                      <div className="p-2 space-y-3">
                        {Object.entries(slotsByDate).sort().map(([d, slots]) => (
                          <div key={d} className="space-y-1">
                            <div className="flex items-center gap-2 px-2">
                              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-bold text-muted-foreground">{format(new Date(d), 'dd/MM/yyyy')}</span>
                            </div>
                            <div className="space-y-3 px-2">
                              {(() => {
                                const slotsByCourt: Record<string, string[]> = {};
                                slots.forEach(s => {
                                  const cName = courts?.find(c => c.id === s.court_id)?.name || 'Sân ?';
                                  if (!slotsByCourt[cName]) slotsByCourt[cName] = [];
                                  slotsByCourt[cName].push(s.time);
                                });
                                return Object.entries(slotsByCourt).sort().map(([cName, cTimes]) => {
                                  const sorted = cTimes.sort();
                                  const ranges: { start: string, end: string, originalSlots: string[] }[] = [];
                                  if (sorted.length > 0) {
                                    let start = sorted[0]; let prev = sorted[0]; let currentRangeSlots = [sorted[0]];
                                    for (let i = 1; i <= sorted.length; i++) {
                                      const current = sorted[i]; let isConsecutive = false;
                                      if (current) { const [pH, pM] = prev.split(':').map(Number); const [cH, cM] = current.split(':').map(Number); if (cH * 60 + cM === pH * 60 + pM + 30) isConsecutive = true; }
                                      if (!isConsecutive) { const [eH, eM] = prev.split(':').map(Number); let totalMins = eH * 60 + eM + 30; ranges.push({ start, end: `${Math.floor(totalMins / 60).toString().padStart(2, '0')}:${(totalMins % 60).toString().padStart(2, '0')}`, originalSlots: currentRangeSlots }); if (current) { start = current; prev = current; currentRangeSlots = [current]; } } else { prev = current; currentRangeSlots.push(current); }
                                    }
                                  }
                                  return (
                                    <div key={cName} className="space-y-1">
                                      <div className="text-[10px] font-bold text-primary/70">{cName}</div>
                                      <div className="flex flex-wrap gap-1">
                                        {ranges.map((range, ridx) => (
                                          <div key={ridx} className="flex items-center gap-1.5 text-[10px] bg-background border border-primary/20 rounded-full pl-2.5 pr-1.5 py-0.5 shadow-sm">
                                            <span className="font-semibold text-primary">{range.start} - {range.end}</span>
                                            <button onClick={() => { const courtId = slots.find(s => courts?.find(c => c.id === s.court_id)?.name === cName)?.court_id; if (courtId) { setSelectedSlots(prev => prev.filter(s => !(s.date === d && s.court_id === courtId && range.originalSlots.includes(s.time)))); } }} className="text-muted-foreground hover:text-destructive bg-muted/30 rounded-full p-0.5 transition-colors"><X className="h-2.5 w-2.5" /></button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="p-3 border-t bg-muted/20">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span>Tổng cộng:</span>
                        <span className="text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}</span>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-2xl font-bold font-headline text-primary">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
              </p>
            </div>
            <Link href={bookingUrl} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 text-lg rounded-xl shadow-lg shadow-primary/30">
                Tiếp tục
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingPageSkeleton() {
  const router = useRouter();
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card flex-shrink-0">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Quay lại</span>
          </Button>
          <Skeleton className="h-7 w-48" />
        </div>
      </header>
      <div className="py-4 space-y-4">
        <div className="px-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-2">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-20 w-[60px] rounded-xl" />)}
            </div>
          </ScrollArea>
        </div>
        <div className="px-4"><Skeleton className="h-8 w-48" /></div>
      </div>
      <div className="flex-grow min-h-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[max-content,1fr] items-center">
            <div className="p-2 border-r text-center sticky left-0 bg-background w-28 h-16 flex items-center justify-center">
              <Skeleton className="h-5 w-20 mx-auto" />
            </div>
            <div className="flex p-1">
              {timeSlots.slice(1, 49).map(time => (
                <Skeleton key={time} className="w-20 h-14 rounded-md m-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-muted/50 border-t mt-auto">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  )
}
