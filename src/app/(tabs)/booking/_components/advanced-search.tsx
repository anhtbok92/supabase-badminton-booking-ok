'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PROVINCES } from '@/lib/vietnam-locations';
import { X } from 'lucide-react';

export type AdvancedFilters = {
  province: string;
  district: string;
  openHour: string;
};

const HOUR_OPTIONS = Array.from({ length: 19 }, (_, i) => {
  const h = i + 5;
  return `${h.toString().padStart(2, '0')}:00`;
});

export function AdvancedSearchSheet({
  isOpen,
  onOpenChange,
  filters,
  onFiltersChange,
  onReset,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onReset: () => void;
}) {
  const selectedProvince = useMemo(() => {
    if (!filters.province) return null;
    return PROVINCES.find(p => p.slug === filters.province || p.name === filters.province) || null;
  }, [filters.province]);

  const districts = useMemo(() => {
    return selectedProvince?.districts || [];
  }, [selectedProvince]);

  const hasFilters = filters.province || filters.district || filters.openHour;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:w-[380px]">
        <SheetHeader>
          <SheetTitle>Tìm kiếm nâng cao</SheetTitle>
          <SheetDescription>Lọc câu lạc bộ theo khu vực và giờ mở cửa.</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label>Tỉnh / Thành phố</Label>
            <Select
              value={filters.province}
              onValueChange={(val) =>
                onFiltersChange({ ...filters, province: val, district: '' })
              }
            >
              <SelectTrigger><SelectValue placeholder="Chọn tỉnh thành..." /></SelectTrigger>
              <SelectContent>
                {PROVINCES.map(p => (
                  <SelectItem key={p.slug} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quận / Huyện</Label>
            <Select
              value={filters.district}
              onValueChange={(val) => onFiltersChange({ ...filters, district: val })}
              disabled={!filters.province}
            >
              <SelectTrigger><SelectValue placeholder={filters.province ? 'Chọn quận huyện...' : 'Chọn tỉnh thành trước'} /></SelectTrigger>
              <SelectContent>
                {districts.map(d => (
                  <SelectItem key={d.slug} value={d.name}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Giờ mở cửa trước</Label>
            <Select
              value={filters.openHour}
              onValueChange={(val) => onFiltersChange({ ...filters, openHour: val })}
            >
              <SelectTrigger><SelectValue placeholder="Chọn giờ..." /></SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.map(h => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onReset} disabled={!hasFilters}>
              <X className="h-4 w-4 mr-1" /> Xóa bộ lọc
            </Button>
            <Button className="flex-1" onClick={() => onOpenChange(false)}>
              Áp dụng
            </Button>
          </div>

          {hasFilters && (
            <p className="text-xs text-muted-foreground text-center">
              Đang lọc: {[filters.province, filters.district, filters.openHour && `mở trước ${filters.openHour}`].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
