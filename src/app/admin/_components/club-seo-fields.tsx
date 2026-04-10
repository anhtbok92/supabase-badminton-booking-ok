'use client';

import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PROVINCES } from '@/lib/vietnam-locations';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { AmenityType } from '@/lib/types';
import { MapPin, Clock, Building2 } from 'lucide-react';
import type { ClubSchema } from './schemas';

type Props = {
  form: UseFormReturn<ClubSchema>;
  clubId?: string; // existing club id for loading saved amenities
};

export function ClubSeoFields({ form, clubId }: Props) {
  const supabase = useSupabase();
  const selectedCity = form.watch('city');
  const selectedProvince = PROVINCES.find(p => p.slug === selectedCity);

  // Fetch dynamic amenity types
  const { data: amenityTypes } = useSupabaseQuery<AmenityType>(
    'amenity_types',
    (q) => q.order('order')
  );

  // Track selected amenity IDs
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());

  // Load existing club amenities
  useEffect(() => {
    if (!clubId) return;
    supabase
      .from('club_amenities')
      .select('amenity_type_id')
      .eq('club_id', clubId)
      .then(({ data }) => {
        if (data) setSelectedAmenities(new Set(data.map(r => r.amenity_type_id)));
      });
  }, [clubId, supabase]);

  // Expose selected amenities so parent form can save them
  // We store them on the form via a hidden field
  useEffect(() => {
    form.setValue('amenityIds', Array.from(selectedAmenities));
  }, [selectedAmenities, form]);

  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Location Section */}
      <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-base font-bold">Vị trí hành chính</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem>
              <FormLabel>Tỉnh / Thành phố</FormLabel>
              <Select
                onValueChange={(val) => { field.onChange(val); form.setValue('district', ''); }}
                value={field.value || ''}
              >
                <FormControl><SelectTrigger><SelectValue placeholder="Chọn tỉnh/thành..." /></SelectTrigger></FormControl>
                <SelectContent>
                  {PROVINCES.map(p => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="district" render={({ field }) => (
            <FormItem>
              <FormLabel>Quận / Huyện</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedCity}>
                <FormControl><SelectTrigger><SelectValue placeholder={selectedCity ? 'Chọn quận/huyện...' : 'Chọn tỉnh trước'} /></SelectTrigger></FormControl>
                <SelectContent>
                  {selectedProvince?.districts.map(d => <SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>

      {/* Operating Hours Section */}
      <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-base font-bold">Giờ mở/đóng cửa</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="openTime" render={({ field }) => (
            <FormItem><FormLabel>Giờ mở cửa</FormLabel><FormControl><Input placeholder="05:00" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="closeTime" render={({ field }) => (
            <FormItem><FormLabel>Giờ đóng cửa</FormLabel><FormControl><Input placeholder="23:00" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
      </div>

      {/* Dynamic Amenities Section */}
      <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-base font-bold">Tiện ích sân</span>
        </div>
        {amenityTypes && amenityTypes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {amenityTypes.map(amenity => (
              <label
                key={amenity.id}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  selectedAmenities.has(amenity.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <Checkbox
                  checked={selectedAmenities.has(amenity.id)}
                  onCheckedChange={() => toggleAmenity(amenity.id)}
                />
                <span className="text-sm">
                  {amenity.icon && <span className="mr-1">{amenity.icon}</span>}
                  {amenity.name}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có tiện ích nào. Vào "Tiện ích sân" để thêm.</p>
        )}
      </div>

      {/* Description */}
      <FormField control={form.control} name="description" render={({ field }) => (
        <FormItem>
          <FormLabel>Mô tả câu lạc bộ (SEO)</FormLabel>
          <FormControl><Textarea {...field} rows={4} placeholder="Mô tả ngắn gọn về câu lạc bộ, dùng cho SEO..." /></FormControl>
          <FormDescription>Mô tả này sẽ hiển thị trên trang SEO của câu lạc bộ.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}
