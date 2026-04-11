'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type SeoModifier = {
  id: string;
  type: 'prefix' | 'suffix';
  label: string;
  slug: string;
  is_active: boolean;
  order: number;
};

const schema = z.object({
  type: z.enum(['prefix', 'suffix']),
  label: z.string().min(1, 'Không được để trống'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Chỉ chữ thường, số, gạch ngang'),
  order: z.coerce.number().default(0),
});
type FormValues = z.infer<typeof schema>;

export function SeoModifierManager() {
  const supabase = useSupabase();
  const { toast } = useToast();
  const { data: modifiers, loading, refetch } = useSupabaseQuery<SeoModifier>(
    'seo_modifiers', (q) => q.order('type').order('order')
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SeoModifier | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'prefix', label: '', slug: '', order: 0 },
  });

  const autoSlug = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openCreate = () => {
    setEditing(null);
    form.reset({ type: 'prefix', label: '', slug: '', order: (modifiers?.length || 0) + 1 });
    setDialogOpen(true);
  };

  const openEdit = (item: SeoModifier) => {
    setEditing(item);
    form.reset({ type: item.type, label: item.label, slug: item.slug, order: item.order });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (editing) {
      const { error } = await supabase.from('seo_modifiers').update(values).eq('id', editing.id);
      if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('seo_modifiers').insert({ ...values, is_active: true });
      if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: 'Thành công' });
    setDialogOpen(false);
    refetch();
  };

  const toggleActive = async (item: SeoModifier) => {
    await supabase.from('seo_modifiers').update({ is_active: !item.is_active }).eq('id', item.id);
    refetch();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('seo_modifiers').delete().eq('id', id);
    toast({ title: 'Đã xóa' });
    refetch();
  };

  const prefixes = modifiers?.filter(m => m.type === 'prefix') || [];
  const suffixes = modifiers?.filter(m => m.type === 'suffix') || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>SEO Prefix / Suffix</CardTitle>
            <CardDescription>
              Thêm prefix (VD: "Thuê") hoặc suffix (VD: "tốt nhất") để nhân bản trang SEO.
              Ví dụ: "Thuê sân cầu lông Hà Nội" → /thue-san-cau-long-ha-noi
            </CardDescription>
          </div>
          <Button onClick={openCreate}><PlusCircle className="mr-2 h-4 w-4" /> Thêm</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && <Skeleton className="h-32 w-full" />}

        {prefixes.length > 0 && (
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Prefix ({prefixes.length})</h3>
            <ModifierTable items={prefixes} onEdit={openEdit} onToggle={toggleActive} onDelete={handleDelete} />
          </div>
        )}

        {suffixes.length > 0 && (
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Suffix ({suffixes.length})</h3>
            <ModifierTable items={suffixes} onEdit={openEdit} onToggle={toggleActive} onDelete={handleDelete} />
          </div>
        )}

        {!loading && (!modifiers || modifiers.length === 0) && (
          <p className="text-center text-muted-foreground py-8">Chưa có prefix/suffix nào.</p>
        )}

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p className="font-bold mb-1">Cách hoạt động:</p>
          <p>Mỗi prefix/suffix active sẽ tạo thêm 1 bản sao cho MỖI trang SEO gốc khi bấm "Tạo/Cập nhật trang SEO".</p>
          <p className="mt-1">VD: 3 prefix × 50 trang gốc = 150 trang SEO bổ sung.</p>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Sửa' : 'Thêm'} Prefix/Suffix</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="prefix">Prefix (đầu)</SelectItem>
                      <SelectItem value="suffix">Suffix (cuối)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="label" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhãn hiển thị</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="VD: Thuê" onChange={(e) => {
                      field.onChange(e);
                      if (!editing) form.setValue('slug', autoSlug(e.target.value));
                    }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem><FormLabel>Slug (URL)</FormLabel><FormControl><Input {...field} placeholder="thue" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="order" render={({ field }) => (
                <FormItem><FormLabel>Thứ tự</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full">{form.formState.isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ModifierTable({ items, onEdit, onToggle, onDelete }: {
  items: SeoModifier[];
  onEdit: (item: SeoModifier) => void;
  onToggle: (item: SeoModifier) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Nhãn</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Active</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(item => (
          <TableRow key={item.id}>
            <TableCell>{item.order}</TableCell>
            <TableCell className="font-medium">{item.label}</TableCell>
            <TableCell><Badge variant="outline" className="font-mono text-xs">{item.slug}</Badge></TableCell>
            <TableCell><Switch checked={item.is_active} onCheckedChange={() => onToggle(item)} /></TableCell>
            <TableCell className="text-right space-x-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
