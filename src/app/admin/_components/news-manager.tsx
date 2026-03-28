'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { NewsArticle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function NewsManager() {
    const supabase = useSupabase();
    const { toast } = useToast();
    const { data: articles, loading, refetch } = useSupabaseQuery<NewsArticle>('news', (q) => q.order('created_at', { ascending: false }));
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState<NewsArticle | null>(null);

    const confirmDelete = async () => {
        if (!articleToDelete) return;
        const { error } = await supabase.from('news').delete().eq('id', articleToDelete.id);
        if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); } else { toast({ title: 'Thành công', description: 'Đã xóa bài viết.' }); refetch(); }
        setDeleteAlertOpen(false); setArticleToDelete(null);
    };

    return (
        <Card>
            <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Quản lý Tin tức</CardTitle><CardDescription>Thêm, sửa, hoặc xóa các bài viết.</CardDescription></div><Button asChild><Link href="/admin/news/new"><PlusCircle className="mr-2 h-4 w-4" /> Thêm Bài viết</Link></Button></div></CardHeader>
            <CardContent>
                <Table><TableHeader><TableRow><TableHead className="hidden md:table-cell">Ảnh</TableHead><TableHead>Tiêu đề</TableHead><TableHead>Tags</TableHead><TableHead className="hidden sm:table-cell">Ngày tạo</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading && Array.from({ length: 3 }).map((_, i) => (<TableRow key={i}><TableCell className="hidden md:table-cell"><Skeleton className="h-12 w-12 rounded-md" /></TableCell><TableCell><Skeleton className="h-5 w-48" /></TableCell><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell><TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell></TableRow>))}
                        {articles?.map(article => (
                            <TableRow key={article.id}>
                                <TableCell className="hidden md:table-cell">{article.banner_image_url && <Image src={article.banner_image_url} alt={article.title} width={48} height={48} className="rounded-md object-cover aspect-square bg-muted" />}</TableCell>
                                <TableCell className="font-medium max-w-xs truncate">{article.title}</TableCell>
                                <TableCell><div className="flex flex-wrap gap-1">{article.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div></TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground">{article.created_at ? format(new Date(article.created_at), 'dd/MM/yyyy') : '...'}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/admin/news/${article.id}/edit`}>Sửa</Link></DropdownMenuItem><DropdownMenuItem onClick={() => { setArticleToDelete(article); setDeleteAlertOpen(true); }} className="text-destructive">Xóa</DropdownMenuItem></DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && articles?.length === 0 && (<TableRow><TableCell colSpan={5} className="h-24 text-center">Chưa có bài viết nào.</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </CardContent>
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle><AlertDialogDescription>Bài viết sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </Card>
    );
}
