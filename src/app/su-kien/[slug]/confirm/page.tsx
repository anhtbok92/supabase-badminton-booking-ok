'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, UploadCloud, Trash2, Users, MapPin, Tag, Ticket, CalendarDays, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Club, Court, Event, UserBooking, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSupabase, useSupabaseQuery, useSupabaseRow, useUser } from '@/supabase';
import { uploadFile } from '@/lib/upload';
import { buildEventBookingRecord, isEventFull, getParticipantCount } from '@/lib/event-utils';

const registrationFormSchema = z.object({
  name: z.string().min(2, { message: 'Họ tên phải có ít nhất 2 ký tự.' }),
  phone: z.string().regex(/^[0-9]{10,11}$/, { message: 'Số điện thoại không hợp lệ.' }),
});

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

function EventConfirmationForm({ club }: { club: Club }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = useSupabase();
  const { user } = useUser();

  const eventId = searchParams.get('eventId');

  const { data: userProfile } = useSupabaseRow<UserProfile>('users', user?.id ?? null);
  const { data: event, loading: eventLoading } = useSupabaseRow<Event>('events', eventId);
  const { data: courts } = useSupabaseQuery<Court>(
    'courts',
    (q) => q.eq('club_id', club.id),
    { deps: [club.id] },
  );
  const { data: eventBookings } = useSupabaseQuery<UserBooking>(
    'bookings',
    (q) => q.eq('event_id', eventId!).not('event_id', 'is', null).eq('is_deleted', false),
    { deps: [eventId] },
  );

  const [paymentProofUrls, setPaymentProofUrls] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string }[]>([]);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: { name: '', phone: '' },
  });

  useEffect(() => {
    if (userProfile?.phone) {
      form.setValue('phone', userProfile.phone);
    }
  }, [userProfile, form]);

  const participantCount = useMemo(() => {
    if (!eventBookings || !eventId) return 0;
    return getParticipantCount(eventBookings, eventId);
  }, [eventBookings, eventId]);

  const courtName = useMemo(() => {
    if (!event?.court_id || !courts) return undefined;
    return courts.find((c) => c.id === event.court_id)?.name;
  }, [event, courts]);

  const full = event ? isEventFull(event, participantCount) : false;

  const handleProofUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (paymentProofUrls.length + files.length > 2) {
      toast({ title: 'Lỗi', description: 'Bạn chỉ có thể tải lên tối đa 2 ảnh bằng chứng.', variant: 'destructive' });
      return;
    }

    const currentUploading = Array.from(files).map((file) => ({ name: file.name }));
    setUploadingFiles((prev) => [...prev, ...currentUploading]);

    Array.from(files).forEach(async (file) => {
      try {
        const url = await uploadFile(supabase, 'payment-proofs', file);
        setPaymentProofUrls((prev) => [...prev, url]);
      } catch (error) {
        console.error('Upload failed:', error);
        toast({ title: 'Lỗi tải lên', description: `Không thể tải lên file ${file.name}.`, variant: 'destructive' });
      } finally {
        setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
      }
    });
  };

  const handleProofDelete = (urlToDelete: string) => {
    setPaymentProofUrls((prev) => prev.filter((url) => url !== urlToDelete));
  };

  const isSubmitting = form.formState.isSubmitting || uploadingFiles.length > 0;

  const onSubmit = async (values: RegistrationFormValues) => {
    if (!event || isSubmitting || full) return;

    const bookingRecord = buildEventBookingRecord(event, values, user?.id, courtName);
    bookingRecord.club_name = club.name;

    const insertData: Record<string, any> = {
      ...bookingRecord,
      payment_proof_image_urls: paymentProofUrls,
    };

    try {
      const { error } = await supabase.from('bookings').insert([insertData]);
      if (error) throw error;

      toast({
        title: 'Đăng ký thành công!',
        description: `Bạn đã đăng ký tham gia sự kiện "${event.event_name}".`,
      });
      router.push('/my-bookings');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Không thể đăng ký sự kiện',
        description: 'Đã xảy ra lỗi. Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  if (eventLoading) {
    return <ConfirmPageSkeleton />;
  }

  if (!event) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-center p-4">
        <h1 className="text-xl font-bold mb-2">Sự kiện không tồn tại</h1>
        <p className="text-muted-foreground mb-4">Sự kiện bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Button variant="link" onClick={() => router.push('/booking')}>Xem danh sách câu lạc bộ</Button>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('vi-VN').format(event.ticket_price);
  const formattedDate = format(new Date(event.event_date + 'T00:00:00'), 'EEEE, dd/MM/yyyy', { locale: vi });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      {/* Event Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-headline text-lg">Thông tin sự kiện</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <h2 className="font-bold text-xl">{event.event_name}</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-medium">{event.start_time} - {event.end_time}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 shrink-0 text-primary" />
              <span className={full ? 'text-destructive font-medium' : ''}>
                {participantCount}/{event.max_participants}
              </span>
              {full && <Badge variant="destructive" className="text-[10px] ml-1">Đã đầy</Badge>}
            </div>
            {courtName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>{courtName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Ticket className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-medium">{event.ticket_price > 0 ? `${formattedPrice}đ` : 'Miễn phí'}</span>
            </div>
            {event.activity_type && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="h-4 w-4 shrink-0 text-primary" />
                <span>{event.activity_type}</span>
              </div>
            )}
          </div>
          {event.notes && (
            <p className="text-sm text-muted-foreground border-t pt-2">{event.notes}</p>
          )}
        </CardContent>
      </Card>

      {/* QR Code Section */}
      {event.ticket_price > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-headline text-xl text-primary">Quét mã thanh toán</CardTitle>
            <CardDescription>Vui lòng quét mã QR bên dưới để chuyển khoản</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4 pt-2">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-30 blur-sm" />
              <Image
                src={club.payment_qr_url || '/ma-qr.JPG'}
                alt="QR Code"
                width={240}
                height={240}
                className="relative rounded-lg border-4 border-white shadow-xl"
              />
            </div>
            <div className="bg-muted/50 w-full p-3 rounded-lg text-center border">
              <p className="text-sm text-muted-foreground mb-1">Số tiền:</p>
              <p className="font-mono text-lg font-bold text-primary">{formattedPrice}đ</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Thông tin đăng ký</CardTitle>
          <CardDescription>Nhập thông tin để xác nhận tham gia sự kiện</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ và tên</FormLabel>
                    <FormControl><Input placeholder="Nguyễn Văn A" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    <FormControl><Input placeholder="0901234567" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Proof Upload */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Bằng chứng thanh toán (Tùy chọn)</p>
                <div className="grid grid-cols-2 gap-2">
                  {paymentProofUrls.map((url) => (
                    <div key={url} className="relative group aspect-square">
                      <Image src={url} alt="Bằng chứng thanh toán" fill sizes="20vw" className="object-cover rounded-md bg-muted" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleProofDelete(url)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {paymentProofUrls.length < 2 && (
                    <label className="flex flex-col items-center justify-center w-full h-full aspect-square border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary transition-colors">
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Tải ảnh</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleProofUpload(e.target.files)}
                        disabled={uploadingFiles.length > 0}
                      />
                    </label>
                  )}
                </div>
                {uploadingFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">Đang tải lên...</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                disabled={isSubmitting || full}
              >
                {form.formState.isSubmitting
                  ? 'Đang gửi...'
                  : uploadingFiles.length > 0
                    ? 'Đang tải ảnh...'
                    : full
                      ? 'Sự kiện đã đầy'
                      : 'Xác nhận tham gia'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfirmPageSkeleton() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      <Card>
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Skeleton className="w-[240px] h-[240px] rounded-lg" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><Skeleton className="h-6 w-36" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EventConfirmPage() {
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
      const { data: bySlug } = await supabase.from('clubs').select('*').eq('slug', slug).limit(1);
      if (bySlug && bySlug.length > 0) {
        setClub(bySlug[0] as Club);
        setClubLoading(false);
        return;
      }
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      if (isUuid) {
        const { data: byId } = await supabase.from('clubs').select('*').eq('id', slug).limit(1);
        if (byId && byId.length > 0) {
          const found = byId[0] as Club;
          if (found.slug) {
            const searchParams = new URLSearchParams(window.location.search);
            router.replace(`/su-kien/${found.slug}/confirm?${searchParams.toString()}`);
            return;
          }
          setClub(found);
        }
      }
      setClubLoading(false);
    }
    resolve();
  }, [slug, supabase, router]);

  if (clubLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-40 w-full border-b bg-card flex-shrink-0">
          <div className="container mx-auto flex h-14 items-center px-4">
            <Skeleton className="h-6 w-6 mr-2" />
            <Skeleton className="h-5 w-48" />
          </div>
        </header>
        <ConfirmPageSkeleton />
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card flex-shrink-0">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Quay lại</span>
          </Button>
          <h1 className="text-base font-bold font-headline truncate">Xác nhận tham gia sự kiện</h1>
        </div>
      </header>
      <EventConfirmationForm club={club} />
    </div>
  );
}
