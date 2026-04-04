'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import { cn } from '@/lib/utils';
import type { ClubType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription as FormDescriptionComponent, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, PencilLine, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { clubTypeSchema, type ClubTypeSchema } from './schemas';

export function ClubTypeManager() {
    const supabase = useSupabase();
    const { toast } = useToast();
    const { data: clubTypes, loading: typesLoading, refetch } = useSupabaseQuery<ClubType>('club_types');
    const sortedClubTypes = useMemo(() => clubTypes?.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [clubTypes]);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<ClubType | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const form = useForm<ClubTypeSchema>({ resolver: zodResolver(clubTypeSchema), defaultValues: { name: '', order: 0, color: '#00e640' } });

    const handleEdit = (type: ClubType) => {
        setEditingId(type.id);
        form.reset({
            name: type.name,
            order: type.order || 0,
            color: type.color || '#00e640'
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        form.reset({ name: '', order: 0, color: '#00e640' });
    };

    const onSubmit = async (values: ClubTypeSchema) => {
        if (editingId) {
            const { error } = await supabase.from('club_types').update(values).eq('id', editingId);
            if (error) {
                toast({ title: 'Lỗi', variant: 'destructive' });
            } else {
                toast({ title: 'Thành công', description: 'Đã cập nhật loại câu lạc bộ.' });
                handleCancelEdit();
                refetch();
            }
        } else {
            const { error } = await supabase.from('club_types').insert(values);
            if (error) {
                toast({ title: 'Lỗi', variant: 'destructive' });
            } else {
                toast({ title: 'Thành công', description: 'Đã thêm loại câu lạc bộ mới.' });
                form.reset();
                refetch();
            }
        }
    };

    const confirmDelete = async () => {
        if (!typeToDelete) return;
        const { error } = await supabase.from('club_types').delete().eq('id', typeToDelete.id);
        if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); } else { toast({ title: 'Thành công', description: `Đã xóa loại "${typeToDelete.name}".` }); refetch(); }
        setDeleteAlertOpen(false); setTypeToDelete(null);
    };

    return (
        <Card>
            <CardHeader><CardTitle>Quản lý Loại Câu lạc bộ</CardTitle><CardDescription>Cấu hình các loại hình thể thao và màu sắc hiển thị.</CardDescription></CardHeader>
            <CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-primary">{editingId ? 'Cập nhật Loại' : 'Thêm Loại mới'}</h3>
                        {editingId && (
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="h-7 text-xs gap-1">
                                <X className="h-3 w-3" /> Hủy chỉnh sửa
                            </Button>
                        )}
                    </div>
                    <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-muted/30 p-4 rounded-xl border">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Tên loại</FormLabel><FormControl><Input placeholder="Ví dụ: Cầu lông" {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="order" render={({ field }) => (<FormItem><FormLabel>Thứ tự</FormLabel><FormControl><Input type="number" {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="color" render={({ field }) => (<FormItem><FormLabel>Màu hiển thị</FormLabel><FormControl><div className="flex items-center gap-2"><Input type="color" {...field} className="w-12 h-10 p-1 cursor-pointer bg-white" /><Input {...field} className="font-mono bg-white uppercase" /></div></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {editingId ? 'Lưu thay đổi' : 'Thêm Loại'}
                        </Button>
                    </form></Form>
                </div>
                <div><h3 className="font-semibold mb-4">Danh sách hiện tại</h3><div className="space-y-2">{typesLoading && <Skeleton className="h-10 w-full" />}{sortedClubTypes?.map(type => (
                    <div key={type.id} className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: type.color || '#00e640' }} />
                            <div className="flex flex-col">
                                <span className={cn("text-sm font-bold", editingId === type.id ? "text-primary" : "text-slate-700")}>{type.name}</span>
                                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Thứ tự: {type.order || 0}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10" onClick={() => handleEdit(type)}>
                                <PencilLine className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10" onClick={() => { setTypeToDelete(type); setDeleteAlertOpen(true); }}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}{!typesLoading && sortedClubTypes?.length === 0 && <p className="text-sm text-center text-muted-foreground py-4 border-2 border-dashed rounded-xl">Chưa có dữ liệu.</p>}</div></div>
            </div></CardContent>
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle><AlertDialogDescription>Loại câu lạc bộ sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </Card>
    );
}
