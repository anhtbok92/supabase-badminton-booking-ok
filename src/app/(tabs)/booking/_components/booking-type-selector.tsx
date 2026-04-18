'use client';

import { useRouter } from 'next/navigation';
import type { Club } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CalendarDays, LayoutGrid, ShieldAlert, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BookingTypeSelector({
  club,
  isOpen,
  onOpenChange,
}: {
  club: Club;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const handleVisualBooking = () => {
    onOpenChange(false);
    router.push(`/dat-san/${club.slug || club.id}`);
  };

  const handleEventBooking = () => {
    onOpenChange(false);
    router.push(`/su-kien/${club.slug || club.id}`);
  };

  // Unverified club: show alert instead of booking options
  if (!club.is_verified) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Câu lạc bộ chưa xác minh</DialogTitle>
            <DialogDescription className="text-center text-sm">
              {club.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 pt-2 pb-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <p className="text-sm text-center text-muted-foreground leading-relaxed">
              Câu lạc bộ này chưa được xác minh thông tin sân bãi. Vui lòng liên hệ trực tiếp chủ sân để đặt lịch.
            </p>
            {club.phone && (
              <Button asChild className="w-full rounded-xl h-12 text-base gap-2">
                <a href={`tel:${club.phone}`}>
                  <Phone className="w-5 h-5" />
                  Gọi {club.phone}
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">Chọn loại đặt lịch</DialogTitle>
          <DialogDescription className="text-center text-sm">
            {club.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 pt-2">
          <button
            onClick={handleVisualBooking}
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-100 hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm">Đặt lịch trực quan</p>
              <p className="text-xs text-muted-foreground mt-0.5">Chọn sân và khung giờ trên lịch</p>
            </div>
          </button>
          <button
            onClick={handleEventBooking}
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-100 hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600 shrink-0 group-hover:bg-orange-200 transition-colors">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm">Đặt lịch sự kiện</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tham gia sự kiện thể thao tại sân</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
