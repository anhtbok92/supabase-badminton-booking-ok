'use client';

import { useState } from 'react';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Globe, ExternalLink, Trash2 } from 'lucide-react';
import type { SeoLandingPage } from '@/lib/seo-pages';

const PAGE_TYPE_LABELS: Record<string, string> = {
  type_city: 'Loại + Thành phố',
  type_district: 'Loại + Quận/Huyện',
  near_location: 'Gần vị trí',
  price: 'Theo giá',
  amenity: 'Tiện ích',
  time: 'Thời gian',
};

export function SeoPagesGenerator() {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const { data: pages, loading, refetch } = useSupabaseQuery<SeoLandingPage>(
    'seo_landing_pages',
    (q) => q.eq('is_active', true).order('page_type').order('slug')
  );

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/seo/generate-pages', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Tạo trang SEO thành công',
          description: `Đã tạo/cập nhật ${data.generated} trang, ẩn ${data.removed} trang cũ.${data.errors.length > 0 ? ` (${data.errors.length} lỗi)` : ''}`,
        });
        refetch();
      } else {
        toast({ title: 'Lỗi', description: data.error || 'Không thể tạo trang SEO.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể kết nối API.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeactivate = async (slug: string) => {
    const { error } = await supabase
      .from('seo_landing_pages')
      .update({ is_active: false })
      .eq('slug', slug);
    if (error) {
      toast({ title: 'Lỗi', variant: 'destructive' });
    } else {
      toast({ title: 'Đã ẩn trang' });
      refetch();
    }
  };

  // Group pages by type
  const grouped = (pages || []).reduce<Record<string, SeoLandingPage[]>>((acc, page) => {
    const key = page.page_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(page);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Trang SEO Landing
            </CardTitle>
            <CardDescription>
              Tự động tạo trang SEO dựa trên dữ liệu câu lạc bộ thực tế. Mỗi khi thêm/sửa club, bấm nút để cập nhật.
            </CardDescription>
          </div>
          <Button onClick={handleGenerate} disabled={generating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Đang tạo...' : 'Tạo/Cập nhật trang SEO'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}

        {!loading && (!pages || pages.length === 0) && (
          <p className="text-center text-muted-foreground py-8">
            Chưa có trang SEO nào. Hãy thêm câu lạc bộ với đầy đủ thông tin (tỉnh/thành, quận/huyện, tiện ích...) rồi bấm "Tạo/Cập nhật trang SEO".
          </p>
        )}

        {Object.entries(grouped).map(([type, typePages]) => (
          <div key={type} className="mb-6">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
              {PAGE_TYPE_LABELS[type] || type} ({typePages.length})
            </h3>
            <div className="space-y-2">
              {typePages.map(page => (
                <div key={page.slug} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{page.h1_title}</p>
                    <p className="text-xs text-muted-foreground truncate">/{page.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Badge variant="outline" className="text-[10px]">{PAGE_TYPE_LABELS[page.page_type]}</Badge>
                    <a
                      href={`https://sportbooking.online/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeactivate(page.slug)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {pages && pages.length > 0 && (
          <p className="text-xs text-muted-foreground mt-4">
            Tổng: {pages.length} trang SEO đang hoạt động
          </p>
        )}
      </CardContent>
    </Card>
  );
}
