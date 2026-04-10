'use client';

import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PROVINCES } from '@/lib/vietnam-locations';
import { MapPin, Clock, Building2 } from 'lucide-react';
import type { ClubSchema } from './schemas';

export function ClubSeoFields({ form }: { form: UseFormReturn<ClubSchema> }) {
  const selectedCity = form.watch('city');
  const selectedProvince = PROVINCES.find(p => p.slug === selectedCity);

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
                onValueChange={(val) => {
                  field.onChange(val);
                  form.setValue('district', '');
                }}
                value={field.value || ''}
              >
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Chọn tỉnh/thành..." /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PROVINCES.map(p => (
                    <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="district" render={({ field }) => (
            <FormItem>
              <FormLabel>Quận / Huyện</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedCity}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder={selectedCity ? 'Chọn quận/huyện...' : 'Chọn tỉnh trước'} /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {selectedProvince?.districts.map(d => (
                    <SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>
                  ))}
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
            <FormItem>
              <FormLabel>Giờ mở cửa</FormLabel>
              <FormControl><Input placeholder="05:00" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="closeTime" render={({ field }) => (
            <FormItem>
              <FormLabel>Giờ đóng cửa</FormLabel>
              <FormControl><Input placeholder="23:00" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>

      {/* Facilities Section */}
      <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-base font-bold">Tiện ích sân</span>
        </div>
        <FormField control={form.control} name="indoorOutdoor" render={({ field }) => (
          <FormItem>
            <FormLabel>Loại sân</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || 'outdoor'}>
              <FormControl>
                <SelectTrigger><SelectValue /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="indoor">Trong nhà (Indoor)</SelectItem>
                <SelectItem value="outdoor">Ngoài trời (Outdoor)</SelectItem>
                <SelectItem value="both">Cả hai</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="hasRoof" render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel className="text-sm">Có mái che</FormLabel>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="hasLighting" render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel className="text-sm">Có đèn chiếu sáng</FormLabel>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="hasParking" render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel className="text-sm">Có bãi đỗ xe</FormLabel>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
        </div>
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
