'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseQuery } from '@/supabase';
import { PROVINCES } from '@/lib/vietnam-locations';
import type { ClubType } from '@/lib/types';
import { Search, Download, MapPin, Phone, Star, Clock, Sparkles } from 'lucide-react';

type CrawledPlace = {
  place_id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  rating: number;
  photo_urls: string[];
  operating_hours: string;
  description: string;
  amenities: string[];
};

export function ClubCrawler() {
  const { toast } = useToast();
  const { data: clubTypes } = useSupabaseQuery<ClubType>('club_types', (q) => q.order('order'));

  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [clubType, setClubType] = useState('');
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [places, setPlaces] = useState<CrawledPlace[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const selectedProvince = PROVINCES.find(p => p.slug === city);

  const handleSearch = async () => {
    if (!city || !clubType) {
      toast({ title: 'Vui lòng chọn thành phố và loại sân', variant: 'destructive' });
      return;
    }
    setSearching(true);
    setPlaces([]);
    setSelected(new Set());
    try {
      const cityName = PROVINCES.find(p => p.slug === city)?.name || city;
      const districtName = selectedProvince?.districts.find(d => d.slug === district)?.name || '';
      const res = await fetch('/api/crawl/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: cityName, district: districtName, clubType }),
      });
      const data = await res.json();
      if (data.error) {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      } else {
        setPlaces(data.places || []);
        setSearchQuery(data.query || '');
        if (data.places?.length === 0) {
          toast({ title: 'Không tìm thấy sân nào cho khu vực này' });
        }
      }
    } catch {
      toast({ title: 'Lỗi kết nối', variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const toggleSelect = (placeId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId); else next.add(placeId);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(selected.size === places.length ? new Set() : new Set(places.map(p => p.place_id)));
  };

  const parseOpenClose = (hours: string): { open: string; close: string } => {
    const match = hours.match(/(\d{1,2}):(\d{2})\s*[–\-]\s*(\d{1,2}):(\d{2})/);
    if (match) return { open: `${match[1].padStart(2, '0')}:${match[2]}`, close: `${match[3].padStart(2, '0')}:${match[4]}` };
    return { open: '05:00', close: '22:00' };
  };

  const handleImport = async () => {
    const selectedPlaces = places.filter(p => selected.has(p.place_id));
    if (selectedPlaces.length === 0) { toast({ title: 'Chưa chọn sân nào', variant: 'destructive' }); return; }
    setImporting(true);
    try {
      const importData = selectedPlaces.map(p => {
        const { open, close } = parseOpenClose(p.operating_hours);
        return {
          name: p.name, address: p.address, phone: p.phone,
          latitude: p.latitude, longitude: p.longitude, rating: p.rating,
          photo_urls: p.photo_urls, operating_hours: p.operating_hours,
          club_type: clubType, city, district,
          description: p.description || `${p.name} - Sân ${clubType} tại ${p.address}.`,
          open_time: open, close_time: close,
        };
      });
      const res = await fetch('/api/crawl/import-clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ places: importData }),
      });
      const data = await res.json();
      if (data.error) {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      } else {
        const failed = data.results?.filter((r: any) => !r.success) || [];
        toast({
          title: `Import ${data.imported}/${data.total} sân`,
          description: failed.length > 0
            ? `Bỏ qua: ${failed.map((f: any) => `${f.name} (${f.error})`).join(', ')}`
            : 'Tất cả sân đã được tạo. SEO pages đang cập nhật.',
        });
        setPlaces(prev => prev.filter(p => !selected.has(p.place_id)));
        setSelected(new Set());
      }
    } catch { toast({ title: 'Lỗi kết nối', variant: 'destructive' }); }
    finally { setImporting(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Crawler sân thể thao (AI)</CardTitle>
        <CardDescription>Dùng AI tìm sân thật từ kiến thức Google, chọn và import vào hệ thống. Không cần API key phụ.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select onValueChange={(v) => { setCity(v); setDistrict(''); }} value={city}>
            <SelectTrigger><SelectValue placeholder="Tỉnh/Thành phố" /></SelectTrigger>
            <SelectContent>{PROVINCES.map(p => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={(v) => setDistrict(v === 'all' ? '' : v)} value={district || 'all'} disabled={!city}>
            <SelectTrigger><SelectValue placeholder="Quận/Huyện (tùy chọn)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {selectedProvince?.districts.map(d => <SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={setClubType} value={clubType}>
            <SelectTrigger><SelectValue placeholder="Loại sân" /></SelectTrigger>
            <SelectContent>{clubTypes?.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={searching}>
            <Sparkles className={`mr-2 h-4 w-4 ${searching ? 'animate-spin' : ''}`} />
            {searching ? 'AI đang tìm...' : 'Tìm sân (AI)'}
          </Button>
        </div>

        {searchQuery && <p className="text-sm text-muted-foreground">Kết quả cho: "{searchQuery}" — {places.length} sân</p>}

        {searching && <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>}

        {places.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={selected.size === places.length && places.length > 0} onCheckedChange={selectAll} />
                <span className="text-sm font-medium">Chọn tất cả ({selected.size}/{places.length})</span>
              </label>
              <Button onClick={handleImport} disabled={importing || selected.size === 0}>
                <Download className={`mr-2 h-4 w-4 ${importing ? 'animate-spin' : ''}`} />
                {importing ? 'Đang import...' : `Import ${selected.size} sân`}
              </Button>
            </div>
            <div className="space-y-3">
              {places.map(place => (
                <PlaceCard key={place.place_id} place={place} isSelected={selected.has(place.place_id)} onToggle={() => toggleSelect(place.place_id)} />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

type CrawledPlaceForCard = {
  place_id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  rating: number;
  operating_hours: string;
  description: string;
  amenities: string[];
};

function PlaceCard({ place, isSelected, onToggle }: {
  place: CrawledPlaceForCard;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
      onClick={onToggle}
    >
      <Checkbox checked={isSelected} onCheckedChange={onToggle} className="mt-1 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-sm">{place.name}</h4>
          {place.rating > 0 && (
            <Badge variant="outline" className="shrink-0 gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{place.rating.toFixed(1)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" /><span className="line-clamp-1">{place.address}</span>
        </div>
        {place.phone && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" /><span>{place.phone}</span>
          </div>
        )}
        {place.operating_hours && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" /><span className="line-clamp-1">{place.operating_hours}</span>
          </div>
        )}
        {place.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{place.description}</p>
        )}
        {place.amenities && place.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {place.amenities.map((a, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{a}</Badge>
            ))}
          </div>
        )}
        <div className="text-[10px] text-muted-foreground/60">
          GPS: {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
        </div>
      </div>
    </div>
  );
}
