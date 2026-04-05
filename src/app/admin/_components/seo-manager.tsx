'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Globe, Share2, Settings2, Eye, RefreshCw, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { seoMetadataSchema, type SeoMetadataSchema, seoGlobalSchema, type SeoGlobalSchema } from './schemas';
import { analyzeSeo, getSeoScore, SeoScoreBadge, ScoreIcon, GooglePreview, SocialPreview } from './seo-analysis';

type SeoPage = SeoMetadataSchema & { id?: string; updated_at?: string };

const DEFAULT_SEO: SeoMetadataSchema = {
  page_slug: '', page_name: '', meta_title: '', meta_description: '', meta_keywords: '',
  og_title: '', og_description: '', og_image_url: '', og_type: 'website',
  twitter_card: 'summary_large_image', twitter_title: '', twitter_description: '', twitter_image_url: '',
  canonical_url: '', robots: 'index, follow', structured_data: {}, custom_head_tags: '',
};

export function SeoManager() {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPage, setSelectedPage] = useState<SeoPage | null>(null);
  const [focusKeyword, setFocusKeyword] = useState('');
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageName, setNewPageName] = useState('');
  const [globalSettings, setGlobalSettings] = useState<SeoGlobalSchema | null>(null);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  const globalForm = useForm<SeoGlobalSchema>({ 
    resolver: zodResolver(seoGlobalSchema), 
    defaultValues: { robots_txt: '', google_site_verification: '', fb_app_id: '', site_name: 'Sport Booking' } 
  });

  const form = useForm<SeoMetadataSchema>({ resolver: zodResolver(seoMetadataSchema), defaultValues: DEFAULT_SEO });
  const watchedValues = form.watch();
  const seoChecks = useMemo(() => analyzeSeo(watchedValues, focusKeyword), [watchedValues, focusKeyword]);
  const seoScore = useMemo(() => getSeoScore(seoChecks), [seoChecks]);

  const fetchPages = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('seo_metadata').select('*').order('page_name');
    if (!error && data) setPages(data);
    setLoading(false);
  };

  const fetchGlobalSettings = useCallback(async () => {
    setLoadingGlobal(true);
    const { data } = await supabase.from('site_settings').select('*').eq('key', 'seo_global').single();
    if (data) {
        setGlobalSettings(data.value);
        globalForm.reset(data.value);
    }
    setLoadingGlobal(false);
  }, [supabase, globalForm]);

  useEffect(() => { 
    fetchPages(); 
    fetchGlobalSettings();
  }, [fetchGlobalSettings]); 

  const selectPage = (page: SeoPage) => {
    setSelectedPage(page);
    setFocusKeyword('');
    form.reset({ ...DEFAULT_SEO, ...Object.fromEntries(Object.entries(page).filter(([, v]) => v != null)) });
  };

  const saveSeo = async (values: SeoMetadataSchema) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/seo', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      if (res.ok) { toast({ title: 'Đã lưu', description: `SEO cho "${values.page_name}" đã được cập nhật.` }); fetchPages(); }
      else { const err = await res.json(); toast({ title: 'Lỗi', description: err.error || 'Không thể lưu.', variant: 'destructive' }); }
    } catch { toast({ title: 'Lỗi', description: 'Đã xảy ra lỗi.', variant: 'destructive' }); }
    setSaving(false);
  };

  const handleAddPage = async () => {
    if (!newPageSlug || !newPageName) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/seo', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...DEFAULT_SEO, page_slug: newPageSlug, page_name: newPageName }) });
      if (res.ok) { toast({ title: 'Đã thêm', description: `Trang "${newPageName}" đã được thêm.` }); setAddPageOpen(false); setNewPageSlug(''); setNewPageName(''); fetchPages(); }
    } catch { toast({ title: 'Lỗi', variant: 'destructive' }); }
    setSaving(false);
  };

  const saveGlobalSettings = async (values: SeoGlobalSchema) => {
    setSaving(true);
    const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'seo_global', value: values, updated_at: new Date().toISOString() });
    
    if (!error) {
        toast({ title: 'Đã lưu', description: 'Cấu hình SEO chung đã được cập nhật.' });
        setGlobalSettings(values);
    } else {
        toast({ title: 'Lỗi', description: 'Không thể lưu cấu hình.', variant: 'destructive' });
    }
    setSaving(false);
  };

  if (loading) return <Card><CardHeader><CardTitle>Quản lý SEO</CardTitle></CardHeader><CardContent><div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div></CardContent></Card>;

  // Page list view
  if (!selectedPage) return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Quản lý SEO</CardTitle><CardDescription>Tối ưu SEO cho từng trang giống Yoast SEO. Chọn trang để bắt đầu.</CardDescription></div>
            <div className="flex gap-2">
                <Button onClick={() => setAddPageOpen(true)} size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Thêm trang</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pages">
            <TabsList className="mb-4">
                <TabsTrigger value="pages">Theo trang</TabsTrigger>
                <TabsTrigger value="global">Cấu hình chung</TabsTrigger>
            </TabsList>
            <TabsContent value="pages">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.map(page => {
                    const score = getSeoScore(analyzeSeo(page as SeoMetadataSchema, ''));
                    return (
                    <button key={page.page_slug} onClick={() => selectPage(page)} className="text-left p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-sm">{page.page_name}</h3><SeoScoreBadge score={score} /></div>
                        <p className="text-xs text-muted-foreground mb-1">/{page.page_slug}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{page.meta_description || 'Chưa có mô tả'}</p>
                    </button>
                    );
                })}
                </div>
            </TabsContent>
            <TabsContent value="global">
                {loadingGlobal ? <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-10 w-full" /></div> : (
                    <Form {...globalForm}>
                        <form onSubmit={globalForm.handleSubmit(saveGlobalSettings)} className="space-y-6 max-w-2xl">
                            <FormField 
                                control={globalForm.control} 
                                name="site_name" 
                                render={({ field }) => (
                                    <FormItem><FormLabel>Tên Site</FormLabel><FormControl><Input placeholder="Sport Booking" {...field} /></FormControl><FormMessage /></FormItem>
                                )} 
                            />
                            <FormField 
                                control={globalForm.control} 
                                name="robots_txt" 
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Robots.txt</FormLabel>
                                        <FormControl><Textarea className="font-mono text-xs min-h-[150px]" placeholder="User-agent: *\nAllow: /" {...field} /></FormControl>
                                        <FormDescription>Cấu hình bots công cụ tìm kiếm cho toàn bộ website</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} 
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField 
                                    control={globalForm.control} 
                                    name="google_site_verification" 
                                    render={({ field }) => (
                                        <FormItem><FormLabel>Google Verification Code</FormLabel><FormControl><Input placeholder="ID từ Google Search Console" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} 
                                />
                                <FormField 
                                    control={globalForm.control} 
                                    name="fb_app_id" 
                                    render={({ field }) => (
                                        <FormItem><FormLabel>Facebook App ID</FormLabel><FormControl><Input placeholder="ID ứng dụng Facebook" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} 
                                />
                            </div>
                            <Button type="submit" disabled={saving}>
                                {saving ? <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Đang lưu...</> : 'Lưu cấu hình chung'}
                            </Button>
                        </form>
                    </Form>
                )}
            </TabsContent>
        </Tabs>
      </CardContent>
      <Dialog open={addPageOpen} onOpenChange={setAddPageOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm trang SEO mới</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Slug trang</label><Input placeholder="vd: about-us" value={newPageSlug} onChange={e => setNewPageSlug(e.target.value)} /></div>
            <div><label className="text-sm font-medium">Tên hiển thị</label><Input placeholder="vd: Trang Giới thiệu" value={newPageName} onChange={e => setNewPageName(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddPageOpen(false)}>Hủy</Button><Button onClick={handleAddPage} disabled={saving || !newPageSlug || !newPageName}>Thêm</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );

  // Page editor view
  const pageUrl = watchedValues.canonical_url || `https://sportbooking.online/${watchedValues.page_slug === 'landing' ? '' : watchedValues.page_slug}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setSelectedPage(null)}>← Quay lại</Button>
          <h2 className="text-lg font-bold">{selectedPage.page_name}</h2>
          <Badge variant="outline">/{selectedPage.page_slug}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <SeoScoreBadge score={seoScore} />
          <Button onClick={form.handleSubmit(saveSeo)} disabled={saving}>
            {saving ? <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Đang lưu...</> : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Form {...form}><form onSubmit={form.handleSubmit(saveSeo)} className="space-y-4">
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Search className="h-4 w-4" /> Từ khóa chính (Focus Keyword)</CardTitle></CardHeader>
              <CardContent><Input placeholder="Nhập từ khóa chính muốn SEO, vd: đặt sân cầu lông" value={focusKeyword} onChange={e => setFocusKeyword(e.target.value)} /><p className="text-xs text-muted-foreground mt-1">Từ khóa này dùng để phân tích SEO, không lưu vào database.</p></CardContent>
            </Card>

            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="text-xs"><Globe className="h-3 w-3 mr-1" /> Cơ bản</TabsTrigger>
                <TabsTrigger value="social" className="text-xs"><Share2 className="h-3 w-3 mr-1" /> Mạng xã hội</TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs"><Settings2 className="h-3 w-3 mr-1" /> Nâng cao</TabsTrigger>
                <TabsTrigger value="preview" className="text-xs"><Eye className="h-3 w-3 mr-1" /> Xem trước</TabsTrigger>
              </TabsList>

              <TabsContent value="basic"><Card><CardContent className="pt-4 space-y-4">
                <FormField control={form.control} name="meta_title" render={({ field }) => (
                  <FormItem><FormLabel>Meta Title</FormLabel><FormControl><Input placeholder="Tiêu đề trang hiển thị trên Google" {...field} /></FormControl>
                    <FormDescription className="flex justify-between"><span>Tiêu đề hiển thị trên kết quả tìm kiếm Google</span><span className={field.value.length > 70 ? 'text-red-500' : field.value.length > 55 ? 'text-yellow-500' : 'text-green-500'}>{field.value.length}/70</span></FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="meta_description" render={({ field }) => (
                  <FormItem><FormLabel>Meta Description</FormLabel><FormControl><Textarea placeholder="Mô tả ngắn gọn về trang..." rows={3} {...field} /></FormControl>
                    <FormDescription className="flex justify-between"><span>Mô tả hiển thị dưới tiêu đề trên Google</span><span className={field.value.length > 160 ? 'text-red-500' : field.value.length > 120 ? 'text-yellow-500' : 'text-green-500'}>{field.value.length}/160</span></FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="meta_keywords" render={({ field }) => (
                  <FormItem><FormLabel>Meta Keywords</FormLabel><FormControl><Input placeholder="từ khóa 1, từ khóa 2, từ khóa 3" {...field} /></FormControl><FormDescription>Các từ khóa cách nhau bằng dấu phẩy</FormDescription><FormMessage /></FormItem>
                )} />
              </CardContent></Card></TabsContent>

              <TabsContent value="social" className="space-y-4">
                <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Facebook / Open Graph</CardTitle></CardHeader><CardContent className="space-y-4">
                  <FormField control={form.control} name="og_title" render={({ field }) => (<FormItem><FormLabel>OG Title</FormLabel><FormControl><Input placeholder="Để trống sẽ dùng Meta Title" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="og_description" render={({ field }) => (<FormItem><FormLabel>OG Description</FormLabel><FormControl><Textarea placeholder="Để trống sẽ dùng Meta Description" rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="og_image_url" render={({ field }) => (<FormItem><FormLabel>OG Image URL</FormLabel><FormControl><Input placeholder="https://example.com/image.jpg" {...field} /></FormControl><FormDescription>Kích thước khuyến nghị: 1200x630px</FormDescription><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="og_type" render={({ field }) => (<FormItem><FormLabel>OG Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="website">website</SelectItem><SelectItem value="article">article</SelectItem><SelectItem value="product">product</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                </CardContent></Card>
                <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Twitter / X Card</CardTitle></CardHeader><CardContent className="space-y-4">
                  <FormField control={form.control} name="twitter_card" render={({ field }) => (<FormItem><FormLabel>Card Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="summary">summary</SelectItem><SelectItem value="summary_large_image">summary_large_image</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="twitter_title" render={({ field }) => (<FormItem><FormLabel>Twitter Title</FormLabel><FormControl><Input placeholder="Để trống sẽ dùng Meta Title" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="twitter_description" render={({ field }) => (<FormItem><FormLabel>Twitter Description</FormLabel><FormControl><Textarea placeholder="Để trống sẽ dùng Meta Description" rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="twitter_image_url" render={({ field }) => (<FormItem><FormLabel>Twitter Image URL</FormLabel><FormControl><Input placeholder="Để trống sẽ dùng OG Image" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="advanced"><Card><CardContent className="pt-4 space-y-4">
                <FormField control={form.control} name="canonical_url" render={({ field }) => (<FormItem><FormLabel>Canonical URL</FormLabel><FormControl><Input placeholder="https://sportbooking.online/..." {...field} /></FormControl><FormDescription>URL chính thức của trang, giúp tránh duplicate content</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="robots" render={({ field }) => (<FormItem><FormLabel>Robots Meta Tag</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="index, follow">index, follow (Mặc định)</SelectItem><SelectItem value="noindex, follow">noindex, follow</SelectItem><SelectItem value="index, nofollow">index, nofollow</SelectItem><SelectItem value="noindex, nofollow">noindex, nofollow</SelectItem></SelectContent></Select><FormDescription>Điều khiển cách search engine index trang này</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="custom_head_tags" render={({ field }) => (<FormItem><FormLabel>Custom Head Tags</FormLabel><FormControl><Textarea placeholder={'<meta name="author" content="Sport Booking" />'} rows={4} className="font-mono text-xs" {...field} /></FormControl><FormDescription>HTML tags tùy chỉnh sẽ được thêm vào &lt;head&gt;</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="structured_data" render={({ field }) => (<FormItem><FormLabel>Structured Data (JSON-LD)</FormLabel><FormControl><Textarea placeholder='{"@context": "https://schema.org", "@type": "WebSite"}' rows={6} className="font-mono text-xs" value={typeof field.value === 'string' ? field.value : JSON.stringify(field.value, null, 2)} onChange={e => { try { field.onChange(JSON.parse(e.target.value)); } catch { field.onChange(e.target.value); } }} /></FormControl><FormDescription>Schema.org structured data giúp Google hiểu nội dung trang</FormDescription><FormMessage /></FormItem>)} />
              </CardContent></Card></TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <GooglePreview title={watchedValues.meta_title} description={watchedValues.meta_description} url={pageUrl} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SocialPreview type="facebook" title={watchedValues.og_title || watchedValues.meta_title} description={watchedValues.og_description || watchedValues.meta_description} image={watchedValues.og_image_url} />
                  <SocialPreview type="twitter" title={watchedValues.twitter_title || watchedValues.og_title || watchedValues.meta_title} description={watchedValues.twitter_description || watchedValues.og_description || watchedValues.meta_description} image={watchedValues.twitter_image_url || watchedValues.og_image_url} />
                </div>
              </TabsContent>
            </Tabs>
          </form></Form>
        </div>

        {/* Right sidebar: SEO Analysis */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center justify-between"><span>Phân tích SEO</span><SeoScoreBadge score={seoScore} /></CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {seoChecks.map((check, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ScoreIcon status={check.status} />
                    <div><p className="text-xs font-medium">{check.label}</p><p className="text-xs text-muted-foreground">{check.message}</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">💡 Mẹo SEO</CardTitle></CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>• Meta title nên chứa từ khóa chính ở đầu</li>
                <li>• Meta description nên hấp dẫn, có call-to-action</li>
                <li>• Luôn thêm OG Image để tăng CTR khi chia sẻ</li>
                <li>• Canonical URL giúp tránh duplicate content</li>
                <li>• Structured data giúp hiển thị rich snippets</li>
              </ul>
            </CardContent>
          </Card>
          <GooglePreview title={watchedValues.meta_title} description={watchedValues.meta_description} url={pageUrl} />
        </div>
      </div>
    </div>
  );
}
