'use client';

import type { Club } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Phone, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UnverifiedClubAlert({ club }: { club: Club }) {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen items-center justify-center text-center p-6">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 text-amber-600 mb-6">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <h1 className="text-xl font-bold mb-2">Câu lạc bộ chưa xác minh</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
        Câu lạc bộ <span className="font-semibold text-foreground">{club.name}</span> chưa được xác minh thông tin sân bãi. Vui lòng liên hệ trực tiếp chủ sân để đặt lịch.
      </p>
      {club.phone && (
        <Button asChild className="w-full max-w-xs rounded-xl h-12 text-base gap-2 mb-3">
          <a href={`tel:${club.phone}`}>
            <Phone className="w-5 h-5" />
            Gọi {club.phone}
          </a>
        </Button>
      )}
      <Button
        variant="outline"
        className="w-full max-w-xs rounded-xl gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </Button>
    </div>
  );
}
