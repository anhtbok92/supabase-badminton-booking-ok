'use client';

import { useState } from 'react';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { BlogPost } from '@/lib/types';
import { generateSlug } from '@/lib/slug';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2, PlusCircle, Sparkles, Eye, Send, MoreHorizontal, Pencil, Trash2, Globe } from 'lucide-react';

type GeneratedContent = {
  title: string;
  shortDescription: string;
  seoTitle: string;
  seoDescription: string;
  contentHtml: string;
};

export function BlogAiWriter() {
  const supabase = useSupabase();
  const { toast } = useToast();
  const { data: posts, loading, refetch } = useSupabaseQuery<BlogPost>('blog_posts', (q) =>
    q.order('created_at', { ascending: false })
  );

  const [activeTab, setActiveTab] = useState('list');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  // Form state
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [articleLength, setArticleLength] = useState('medium');
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSeoTitle, setEditSeoTitle] = useState('');
  const [editSeoDescription, setEditSeoDescription] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập chủ đề bài viết.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    setGenerated(null);
    try {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), keywords: keywordArray, length: articleLength }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGenerated(data);
      setEditTitle(data.title);
      setEditDescription(data.shortDescription);
      setEditSeoTitle(data.seoTitle);
      setEditSeoDescription(data.seoDescription);
      setEditContent(data.contentHtml);
      setActiveTab('preview');
      toast({ title: 'Thành công', description: 'AI đã tạo bài viết. Hãy xem preview và chỉnh sửa nếu cần.' });
    } catch (err: any) {
      toast({ title: 'Lỗi tạo bài viết', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (status: 'draft' | 'published') => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast({ title: 'Lỗi', description: 'Tiêu đề và nội dung không được để trống.', variant: 'destructive' });
      return;
    }
    setIsPublishing(true);
    try {
      const slug = generateSlug(editTitle);
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
      const { error } = await supabase.from('blog_posts').insert({
        title: editTitle.trim(),
        slug,
        short_description: editDescription.trim(),
        content_html: editContent,
        seo_title: editSeoTitle.trim(),
        seo_description: editSeoDescription.trim(),
        seo_keywords: keywordArray,
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
      });
      if (error) throw error;
      toast({ title: 'Thành công', description: status === 'published' ? 'Bài viết đã được xuất bản.' : 'Đã lưu bản nháp.' });
      resetForm();
      refetch();
      setActiveTab('list');
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', postToDelete.id);
    if (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa bài viết.', variant: 'destructive' });
    } else {
      toast({ title: 'Thành công', description: 'Đã xóa bài viết.' });
      refetch();
    }
    setDeleteAlertOpen(false);
    setPostToDelete(null);
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('blog_posts').update({
      status: newStatus,
      published_at: newStatus === 'published' ? new Date().toISOString() : null,
    }).eq('id', post.id);
    if (error) {
      toast({ title: 'Lỗi', variant: 'destructive' });
    } else {
      toast({ title: 'Thành công', description: newStatus === 'published' ? 'Đã xuất bản.' : 'Đã chuyển về nháp.' });
      refetch();
    }
  };

  const resetForm = () => {
    setTopic('');
    setKeywords('');
    setArticleLength('medium');
    setGenerated(null);
    setEditTitle('');
    setEditDescription('');
    setEditSeoTitle('');
    setEditSeoDescription('');
    setEditContent('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Blog AI Writer
            </CardTitle>
            <CardDescription>Tạo bài viết blog bằng AI, tối ưu SEO tự động.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="list">Danh sách bài viết</TabsTrigger>
            <TabsTrigger value="create">Tạo bài mới</TabsTrigger>
            {generated && <TabsTrigger value="preview">Preview</TabsTrigger>}
          </TabsList>

          {/* LIST TAB */}
          <TabsContent value="list">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { resetForm(); setActiveTab('create'); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Tạo bài viết AI
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden sm:table-cell">Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {posts?.map(post => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-xs truncate">{post.title}</TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">/bai-viet/{post.slug}</TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                        {post.status === 'published' ? 'Đã xuất bản' : 'Nháp'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {post.created_at ? format(new Date(post.created_at), 'dd/MM/yyyy') : '...'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(`/bai-viet/${post.slug}`, '_blank')}>
                            <Eye className="mr-2 h-4 w-4" /> Xem
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(post)}>
                            <Globe className="mr-2 h-4 w-4" />
                            {post.status === 'published' ? 'Chuyển về nháp' : 'Xuất bản'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { setPostToDelete(post); setDeleteAlertOpen(true); }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && (!posts || posts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Chưa có bài viết nào. Hãy tạo bài viết đầu tiên bằng AI.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          {/* CREATE TAB */}
          <TabsContent value="create">
            <div className="space-y-6 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-medium">Chủ đề bài viết *</label>
                <Input
                  placeholder="VD: Đặt sân cầu lông ở Hà Nội, Top sân cầu lông quận Cầu Giấy..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Từ khóa SEO (phân cách bằng dấu phẩy)</label>
                <Input
                  placeholder="VD: đặt sân cầu lông, sân cầu lông hà nội, thuê sân giờ"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Nhập các từ khóa SEO muốn tối ưu, cách nhau bằng dấu phẩy.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Độ dài bài viết</label>
                <Select value={articleLength} onValueChange={setArticleLength}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Ngắn (800-1200 từ)</SelectItem>
                    <SelectItem value="medium">Trung bình (1500-2000 từ)</SelectItem>
                    <SelectItem value="long">Dài (2500-3500 từ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI đang viết bài...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Tạo bài viết bằng AI</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview">
            {generated && (
              <div className="space-y-6">
                {/* SEO Info */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Thông tin SEO</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tiêu đề bài viết</label>
                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mô tả ngắn</label>
                      <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">SEO Title</label>
                        <Input value={editSeoTitle} onChange={(e) => setEditSeoTitle(e.target.value)} />
                        <p className="text-xs text-muted-foreground">{editSeoTitle.length}/60 ký tự</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">SEO Description</label>
                        <Textarea value={editSeoDescription} onChange={(e) => setEditSeoDescription(e.target.value)} rows={2} />
                        <p className="text-xs text-muted-foreground">{editSeoDescription.length}/160 ký tự</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Slug URL</label>
                      <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                        /bai-viet/<span className="text-foreground font-medium">{generateSlug(editTitle)}</span>
                      </p>
                    </div>
                    {/* Google Preview */}
                    <div className="border rounded-lg p-4 bg-white dark:bg-zinc-950">
                      <p className="text-xs text-muted-foreground mb-1">Preview trên Google:</p>
                      <p className="text-blue-600 dark:text-blue-400 text-lg hover:underline cursor-pointer truncate">
                        {editSeoTitle || editTitle}
                      </p>
                      <p className="text-green-700 dark:text-green-500 text-sm truncate">
                        sportbooking.online/bai-viet/{generateSlug(editTitle)}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {editSeoDescription || editDescription}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Preview */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Nội dung bài viết</CardTitle></CardHeader>
                  <CardContent>
                    <article className="prose prose-sm dark:prose-invert max-w-none">
                      <h1>{editTitle}</h1>
                      <p className="lead text-muted-foreground">{editDescription}</p>
                      <div dangerouslySetInnerHTML={{ __html: editContent }} />
                    </article>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setActiveTab('create')}>
                    <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa đề bài
                  </Button>
                  <Button variant="secondary" onClick={() => handlePublish('draft')} disabled={isPublishing}>
                    {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Lưu nháp
                  </Button>
                  <Button onClick={() => handlePublish('published')} disabled={isPublishing}>
                    {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Xuất bản
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa &quot;{postToDelete?.title}&quot;? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
