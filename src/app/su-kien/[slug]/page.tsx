'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, Users, MapPin, Tag, Calendar as CalendarIcon, Ticket, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import { Calendar as AntCalendar } from 'antd';

import type { Club, Court, Event, UserBooking } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import { filterEventsByClubAndDate, filterUpcomingEvents, isEventFull, getParticipantCount } from '@/lib/event-utils';
import { UnverifiedClubAlert } from '@/components/unverified-club-alert';

function HorizontalDatePicker({
  selectedDate,
  onDateSelect,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const dates = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 90 }, (_, i) => addDays(start, i));
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <div className="px-4 space-y-1">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-primary px-1">
          {format(selectedDate, "'Tháng' M, yyyy", { locale: vi })}
        </h3>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-primary hover:bg-primary/10" onClick={() => setCalendarOpen(true)}>
          <CalendarIcon className="h-3.5 w-3.5" />
          <span className="text-xs">Chọn ngày</span>
        </Button>
        <Sheet open={calendarOpen} onOpenChange={setCalendarOpen}>
          <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl px-2 pb-6">
            <SheetHeader className="pb-2">
              <SheetTitle className="font-headline text-center">Chọn ngày</SheetTitle>
              <SheetDescription className="text-center text-xs">Chọn ngày bạn muốn xem sự kiện</SheetDescription>
            </SheetHeader>
            <AntCalendar
              fullscreen={false}
              value={dayjs(selectedDate)}
              disabledDate={(current) =>
                current.isBefore(dayjs(today), 'day') || current.isAfter(dayjs(today).add(90, 'day'), 'day')
              }
              onSelect={(date) => {
                onDateSelect(date.toDate());
                setCalendarOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>
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
                  'flex flex-col items-center justify-center min-w-[48px] sm:min-w-[64px] h-14 sm:h-20 rounded-lg sm:rounded-xl border transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary'
                    : 'bg-card hover:bg-muted',
                )}
              >
                <div className={cn('text-[9px] sm:text-[10px] font-medium uppercase tracking-wider', isSelected ? 'opacity-90' : 'text-muted-foreground')}>
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

function EventCard({
  event,
  participantCount,
  courtName,
  onJoin,
}: {
  event: Event;
  participantCount: number;
  courtName?: string;
  onJoin: (event: Event) => void;
}) {
  const full = isEventFull(event, participantCount);
  const formattedPrice = new Intl.NumberFormat('vi-VN').format(event.ticket_price);

  return (
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <h3 className="font-bold text-base leading-tight line-clamp-2">{event.event_name}</h3>
            <p className="text-xs text-muted-foreground">
              {format(new Date(event.event_date + 'T00:00:00'), 'EEEE, dd/MM/yyyy', { locale: vi })}
            </p>
          </div>
          {full && (
            <Badge variant="destructive" className="shrink-0 text-[10px]">Đã đầy</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className={cn('font-medium', full && 'text-destructive')}>
              {participantCount}/{event.max_participants}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="font-medium">{event.start_time} - {event.end_time}</span>
          </div>
          {courtName && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate">{courtName}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Ticket className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="font-medium">{event.ticket_price > 0 ? `${formattedPrice}đ` : 'Miễn phí'}</span>
          </div>
          {event.activity_type && (
            <div className="flex items-start gap-1.5 text-muted-foreground col-span-2">
              <Tag className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
              <span className="line-clamp-2">{event.activity_type}</span>
            </div>
          )}
        </div>

        {event.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">{event.notes}</p>
        )}

        <Button
          className="w-full rounded-xl"
          disabled={full}
          onClick={() => onJoin(event)}
        >
          {full ? 'Đã đầy' : 'Tham gia'}
        </Button>
      </CardContent>
    </Card>
  );
}

function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden border">
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

export default function SuKienPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useSupabase();
  const slug = params.slug as string;

  const [club, setClub] = useState<Club | null>(null);
  const [clubLoading, setClubLoading] = useState(true);

  // Resolve club by slug (same pattern as dat-san/[slug])
  useEffect(() => {
    async function resolve() {
      setClubLoading(true);
      // Try slug first
      const { data: bySlug } = await supabase.from('clubs').select('*').eq('slug', slug).limit(1);
      if (bySlug && bySlug.length > 0) {
        setClub(bySlug[0] as Club);
        setClubLoading(false);
        return;
      }
      // Fallback: try by UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      if (isUuid) {
        const { data: byId } = await supabase.from('clubs').select('*').eq('id', slug).limit(1);
        if (byId && byId.length > 0) {
          const found = byId[0] as Club;
          if (found.slug) {
            router.replace(`/su-kien/${found.slug}`);
            return;
          }
          setClub(found);
        }
      }
      setClubLoading(false);
    }
    resolve();
  }, [slug, supabase, router]);

  const clubId = club?.id ?? '';

  const [date, setDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const dateStr = format(date, 'yyyy-MM-dd');

  // Fetch all active events for this club
  const { data: allEvents, loading: eventsLoading } = useSupabaseQuery<Event>(
    'events',
    (q) => q.eq('club_id', clubId).eq('status', 'active'),
    { deps: [clubId] },
  );

  // Fetch courts for court name lookup
  const { data: courts } = useSupabaseQuery<Court>(
    'courts',
    (q) => q.eq('club_id', clubId),
    { deps: [clubId] },
  );

  // Fetch bookings for participant counts (event bookings with any status except cancelled)
  const { data: eventBookings } = useSupabaseQuery<UserBooking>(
    'bookings',
    (q) => q.eq('club_id', clubId).not('event_id', 'is', null).eq('is_deleted', false),
    { deps: [clubId], pollingInterval: 30000 },
  );

  // Filter to upcoming events, then by selected date
  const filteredEvents = useMemo(() => {
    if (!allEvents || !clubId) return [];
    const upcoming = filterUpcomingEvents(allEvents);
    return filterEventsByClubAndDate(upcoming, clubId, dateStr);
  }, [allEvents, clubId, dateStr]);

  const courtMap = useMemo(() => {
    const map = new Map<string, string>();
    courts?.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [courts]);

  const participantCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (!eventBookings) return counts;
    filteredEvents.forEach((event) => {
      counts.set(event.id, getParticipantCount(eventBookings, event.id));
    });
    return counts;
  }, [eventBookings, filteredEvents]);

  const handleJoin = (event: Event) => {
    router.push(`/su-kien/${slug}/confirm?eventId=${event.id}`);
  };

  const loading = clubLoading || eventsLoading;

  if (loading && !club) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-40 w-full border-b bg-card flex-shrink-0">
          <div className="container mx-auto flex h-14 items-center px-4">
            <Skeleton className="h-6 w-6 mr-2" />
            <Skeleton className="h-5 w-48" />
          </div>
        </header>
        <div className="py-4 space-y-4">
          <div className="px-4"><Skeleton className="h-14 w-full" /></div>
          <div className="px-4 space-y-3">
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-center p-4">
        <h1 className="text-xl font-bold mb-2">Không tìm thấy câu lạc bộ</h1>
        <p className="text-muted-foreground mb-4">Câu lạc bộ bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Button variant="link" onClick={() => router.push('/booking')}>Xem danh sách câu lạc bộ</Button>
      </div>
    );
  }

  if (!club.is_verified) return <UnverifiedClubAlert club={club} />;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card flex-shrink-0">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Quay lại</span>
          </Button>
          <div className="min-w-0">
            <h1 className="text-base font-bold font-headline truncate">{club.name}</h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Sự kiện</p>
          </div>
        </div>
      </header>

      <div className="py-3 space-y-3 flex-shrink-0">
        <HorizontalDatePicker selectedDate={date} onDateSelect={setDate} />
      </div>

      <div className="flex-1 px-4 pb-24 space-y-3">
        {eventsLoading && (
          <>
            <EventCardSkeleton />
            <EventCardSkeleton />
          </>
        )}

        {!eventsLoading && filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Chưa có sự kiện nào</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Hãy chọn ngày khác để xem sự kiện</p>
          </div>
        )}

        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            participantCount={participantCounts.get(event.id) ?? 0}
            courtName={event.court_id ? courtMap.get(event.court_id) : undefined}
            onJoin={handleJoin}
          />
        ))}
      </div>
    </div>
  );
}
