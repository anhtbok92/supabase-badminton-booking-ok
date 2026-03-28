'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { ClubType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription as FormDescriptionComponent, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { clubTypeSchema, type ClubTypeSchema } from './schemas';

export function ClubTypeManager() {
    const supabase = useSupabase();
    const { toast } = useToast();
    const { data: clubTypes, loading: typesLoading, refetch } = useSupabaseQuery<ClubType>('club_types');
    const sortedClubTypes = useMemo(() => clubTypes?.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [clubTypes]);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<ClubType | null>(null);
    const form = useForm<ClubTypeSchema>({ resolver: zodResolver(clubTypeSchema), defaultValues: { name: '', order: 0 } });

    const onSubmit = async (values: ClubTypeSchema) => {
        const { error } = await supabase.from('club_types').insert(values);
        if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); } else { toast({ title: 'Thành công', description: 'Đã thêm loại câu lạc bộ mới.' }); form.reset(); refetch(); }
    };

    const confirmDelete = async () => {
        if (!typeToDelete) return;
        const { error } = await supabase.from('club_types').delete().eq('id', typeToDelete.id);
        if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); } else { toast({ title: 'Thành công', description: `Đã xóa loại "${typeToDelete.name}".` }); refetch(); }
        setDeleteAlertOpen(false); setTypeToDelete(null);
    };

    return (
        <Card>
            <CardHeader><CardTitle>Quản lý Loại Câu lạc bộ</CardTitle><CardDescription>Thêm hoặc xóa các loại hình câu lạc bộ.</CardDescription></CardHeader>
            <CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div><h3 className="font-semibold mb-4">Thêm Loại mới</h3><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Tên loại</FormLabel><FormControl><Input placeholder="Ví dụ: Cầu lông" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="order" render={({ field }) => (<FormItem><FormLabel>Thứ tự</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescriptionComponent>Dùng để sắp xếp bộ lọc.</FormDescriptionComponent><FormMessage /></FormItem>)} />
                    <Button type="submit" disabled={form.formState.isSubmitting}>Thêm</Button>
                </form></Form></div>
                <div><h3 className="font-semibold mb-4">Các Loại hiện có</h3><div className="space-y-2">{typesLoading && <Skeleton className="h-10 w-full" />}{sortedClubTypes?.map(type => (<div key={type.id} className="flex items-center justify-between p-2 bg-muted rounded-md"><span className="text-sm font-medium">{type.name} (order: {type.order || 0})</span><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setTypeToDelete(type); setDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button></div>))}{!typesLoading && sortedClubTypes?.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Chưa có loại nào.</p>}</div></div>
            </div></CardContent>
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle><AlertDialogDescription>Loại câu lạc bộ sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </Card>
    );
}
