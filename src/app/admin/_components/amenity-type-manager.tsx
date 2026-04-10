'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { AmenityType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const amenityTypeSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống').regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường, số và dấu gạch ngang'),
  icon: z.string().optional().or(z.literal('')),
  order: z.coerce.number().default(0),
});
type AmenityTypeSchema = z.infer<typeof amenityTypeSchema>;

export function AmenityTypeManager() {
  const supabase = useSupabase();
  const { toast } = useToast();
  const { data: amenities, loading, refetch } = useSupabaseQuery<AmenityType>(
    'amenity_types',
    (q) => q.order('order')
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AmenityType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AmenityType | null>(null);

  const form = useForm<AmenityTypeSchema>({
    resolver: zodResolver(amenityTypeSchema),
    defaultValues: { name: '', slug: '', icon: '', order: 0 },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: '', slug: '', icon: '', order: (amenities?.length || 0) + 1 });
    setDialogOpen(true);
  };

  const openEdit = (item: AmenityType) => {
    setEditing(item);
    form.reset({ name: item.name, slug: item.slug, icon: item.icon || '', order: item.order || 0 });
    setDialogOpen(true);
  };

  const onSubmit = async (values: AmenityTypeSchema) => {
    if (editing) {
      const { error } = await supabase.from('amenity_types').update(values).eq('id', editing.id);
      if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('amenity_types').insert(values);
      if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: 'Thành công' });
    setDialogOpen(false);
    refetch();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('amenity_types').delete().eq('id', deleteTarget.id);
    if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); }
    else { toast({ title: 'Đã xóa' }); refetch(); }
    setDeleteTarget(null);
  };

  // Auto-generate slug from name
  const autoSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Quản lý Tiện ích sân</CardTitle>
            <CardDescription>Thêm, sửa, xóa các loại tiện ích (mái che, đèn, bãi xe...)</CardDescription>
          </div>
          <Button onClick={openCreate}><PlusCircle className="mr-2 h-4 w-4" /> Thêm tiện ích</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <Skeleton className="h-32 w-full" />}
        {!loading && amenities && amenities.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {amenities.map(a => (
                <TableRow key={a.id}>
                  <TableCell>{a.order}</TableCell>
                  <TableCell>{a.icon || '—'}</TableCell>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{a.slug}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(a)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (!loading && <p className="text-center text-muted-foreground py-8">Chưa có tiện ích nào.</p>)}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Sửa tiện ích' : 'Thêm tiện ích mới'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên tiện ích</FormLabel>
                  <FormControl>
                    <Input {...field} onChange={(e) => {
                      field.onChange(e);
                      if (!editing) form.setValue('slug', autoSlug(e.target.value));
                    }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="icon" render={({ field }) => (
                  <FormItem><FormLabel>Icon (emoji)</FormLabel><FormControl><Input {...field} placeholder="🏠" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="order" render={({ field }) => (
                  <FormItem><FormLabel>Thứ tự</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full">{form.formState.isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tiện ích "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Thao tác này sẽ xóa tiện ích và gỡ khỏi tất cả câu lạc bộ đang dùng.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
