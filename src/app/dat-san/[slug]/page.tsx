'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSupabase } from '@/supabase';
import type { Club } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import BookingPage from '@/app/booking/[clubId]/page';

export default function DatSanPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useSupabase();
  const slug = params.slug as string;

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolve() {
      setLoading(true);
      // Try slug first
      const { data: bySlug } = await supabase.from('clubs').select('*').eq('slug', slug).limit(1);
      if (bySlug && bySlug.length > 0) {
        setClub(bySlug[0] as Club);
        setLoading(false);
        return;
      }
      // Fallback: try by UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      if (isUuid) {
        const { data: byId } = await supabase.from('clubs').select('*').eq('id', slug).limit(1);
        if (byId && byId.length > 0) {
          const found = byId[0] as Club;
          // Redirect to slug URL
          if (found.slug) {
            router.replace(`/dat-san/${found.slug}`);
            return;
          }
          setClub(found);
        }
      }
      setLoading(false);
    }
    resolve();
  }, [slug, supabase, router]);

  if (loading) return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-40 w-full border-b bg-card">
        <div className="container mx-auto flex h-16 items-center px-4"><Skeleton className="h-6 w-48" /></div>
      </div>
      <div className="p-4 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>
    </div>
  );

  if (!club) return (
    <div className="flex flex-col h-screen items-center justify-center text-center p-4">
      <h1 className="text-2xl font-bold mb-2">Không tìm thấy câu lạc bộ</h1>
      <p className="text-muted-foreground mb-4">Câu lạc bộ bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
      <Button variant="link" onClick={() => router.push('/booking')}>Xem danh sách câu lạc bộ</Button>
    </div>
  );

  return <BookingPage clubIdProp={club.id} />;
}
