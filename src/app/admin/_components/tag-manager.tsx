'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { NewsTag } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { newTagSchema, type NewTagSchema } from './schemas';

export function TagManager() {
    const supabase = useSupabase();
    const { toast } = useToast();
    const { data: tags, loading: tagsLoading, refetch } = useSupabaseQuery<NewsTag>('news_tags');
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<NewsTag | null>(null);
    const form = useForm<NewTagSchema>({ resolver: zodResolver(newTagSchema), defaultValues: { name: '' } });

    const onSubmit = async (values: NewTagSchema) => {
        const { error } = await supabase.from('news_tags').insert(values);
        if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); } else { toast({ title: 'Thành công', description: 'Đã thêm tag mới.' }); form.reset(); refetch(); }
    };

    const confirmDelete = async () => {
        if (!tagToDelete) return;
        const { error } = await supabase.from('news_tags').delete().eq('id', tagToDelete.id);
        if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); } else { toast({ title: 'Thành công', description: `Đã xóa tag "${tagToDelete.name}".` }); refetch(); }
        setDeleteAlertOpen(false); setTagToDelete(null);
    };

    return (
        <Card>
            <CardHeader><CardTitle>Quản lý Tags Tin tức</CardTitle><CardDescription>Thêm hoặc xóa các tag phân loại bài viết.</CardDescription></CardHeader>
            <CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div><h3 className="font-semibold mb-4">Thêm Tag mới</h3><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2"><FormField control={form.control} name="name" render={({ field }) => (<FormItem className="flex-grow"><FormControl><Input placeholder="Ví dụ: Giải đấu" {...field} /></FormControl><FormMessage /></FormItem>)} /><Button type="submit" disabled={form.formState.isSubmitting}>Thêm</Button></form></Form></div>
                <div><h3 className="font-semibold mb-4">Các Tags hiện có</h3><div className="space-y-2">{tagsLoading && <Skeleton className="h-10 w-full" />}{tags?.map(tag => (<div key={tag.id} className="flex items-center justify-between p-2 bg-muted rounded-md"><span className="text-sm font-medium">{tag.name}</span><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setTagToDelete(tag); setDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button></div>))}{!tagsLoading && tags?.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Chưa có tag nào.</p>}</div></div>
            </div></CardContent>
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle><AlertDialogDescription>Tag sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </Card>
    );
}
