'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { GripVertical } from 'lucide-react';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { Club, Court, UserProfile, CourtLimitCheck } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, Pencil, UploadCloud } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { uploadFile } from '@/lib/upload';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { courtFormSchema, type CourtFormSchema } from './schemas';

function SortableCourtItem({ court, onEdit, onDelete }: { court: Court; onEdit: (court: Court) => void; onDelete: (court: Court) => void; }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: court.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' as any, opacity: isDragging ? 0.6 : 1 };
    return (
        <div ref={setNodeRef} style={style} className={cn("flex items-center justify-between p-2 rounded-md bg-card border hover:bg-muted transition-colors", isDragging && "shadow-lg border-primary")}>
            <div className="flex items-center gap-3"><div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded text-muted-foreground"><GripVertical className="h-4 w-4" /></div><span className="font-medium text-sm">{court.name}</span></div>
            <div className="flex items-center"><Button variant="ghost" size="icon" onClick={() => onEdit(court)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(court)}><Trash2 className="h-4 w-4" /></Button></div>
        </div>
    );
}

function CourtFormDialog({ isOpen, setIsOpen, clubId, court, userRole, onSuccess }: { isOpen: boolean; setIsOpen: (open: boolean) => void; clubId: string; court?: Court, userRole: UserProfile['role'], onSuccess?: () => void }) {
    const supabase = useSupabase();
    const { toast } = useToast();
    const isEditMode = !!court;
    const [imageUrls, setImageUrls] = useState<string[]>(court?.image_urls || []);
    const [uploadingFiles, setUploadingFiles] = useState<{ name: string }[]>([]);
    const form = useForm<CourtFormSchema>({ resolver: zodResolver(courtFormSchema), defaultValues: isEditMode ? { name: court.name, description: court.description || '', order: court.order || 0 } : { name: '', description: '', order: 0 } });

    useEffect(() => { if (isEditMode && court) { form.reset({ name: court.name, description: court.description || '', order: court.order || 0 }); setImageUrls(court.image_urls || []); } else { form.reset({ name: '', description: '', order: 0 }); setImageUrls([]); } }, [isOpen, isEditMode, court, form]);

    const handleImageUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        if (imageUrls.length + files.length > 2) { toast({ title: "Lỗi", description: "Tối đa 2 ảnh.", variant: "destructive" }); return; }
        const currentUploading = Array.from(files).map(file => ({ name: file.name }));
        setUploadingFiles(prev => [...prev, ...currentUploading]);
        Array.from(files).forEach(async (file) => {
            try {
                const url = await uploadFile(supabase, `courts/${clubId}`, file);
                setImageUrls(prev => [...prev, url]);
            } catch { toast({ title: "Lỗi tải lên", variant: "destructive" }); }
            finally { setUploadingFiles(prev => prev.filter(f => f.name !== file.name)); }
        });
    };

    const onSubmit = async (values: CourtFormSchema) => {
        const courtData = { ...values, club_id: clubId, image_urls: imageUrls, order: values.order || 0 };
        if (isEditMode && court) {
            const { error } = await supabase.from('courts').update(courtData).eq('id', court.id);
            if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
        } else {
            // Check court limit before creating
            const { data: limitData, error: limitError } = await supabase.rpc('check_court_limit', { p_club_id: clubId });
            if (limitError) {
                toast({ title: 'Lỗi', description: 'Không thể kiểm tra giới hạn sân.', variant: 'destructive' });
                return;
            }
            
            if (limitData && limitData.length > 0 && !limitData[0].can_create) {
                toast({
                    title: 'Đã đạt giới hạn',
                    description: `Gói hiện tại chỉ cho phép ${limitData[0].max_allowed} sân. Vui lòng nâng cấp gói để tạo thêm sân.`,
                    variant: 'destructive'
                });
                return;
            }
            
            const { error } = await supabase.from('courts').insert(courtData);
            if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
        }
        toast({ title: 'Thành công', description: `Đã ${isEditMode ? 'cập nhật' : 'tạo'} sân.` }); setIsOpen(false); onSuccess?.();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogContent className="sm:max-w-[600px]"><DialogHeader><DialogTitle>{isEditMode ? 'Chỉnh sửa Sân' : 'Tạo Sân mới'}</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Tên sân</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="order" render={({ field }) => (<FormItem><FormLabel>Thứ tự</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="space-y-2"><FormLabel>Hình ảnh (Tối đa 2)</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {imageUrls.map(url => (<div key={url} className="relative group aspect-square"><Image src={url} alt="Ảnh sân" fill sizes="10vw" className="object-cover rounded-md bg-muted" /><Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => setImageUrls(prev => prev.filter(u => u !== url))}><Trash2 className="h-4 w-4" /></Button></div>))}
                        {imageUrls.length < 2 && (<label className="flex flex-col items-center justify-center w-full h-full aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary"><UploadCloud className="w-8 h-8 text-muted-foreground" /><input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} disabled={uploadingFiles.length > 0} /></label>)}
                    </div>
                    {uploadingFiles.length > 0 && <p className="text-sm text-muted-foreground">Đang tải lên...</p>}
                </div>
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || uploadingFiles.length > 0}>{form.formState.isSubmitting ? 'Đang lưu...' : 'Lưu Sân'}</Button>
            </form></Form>
        </DialogContent></Dialog>
    );
}

export function CourtManager({ club, userRole }: { club: Club, userRole: UserProfile['role'] }) {
    const supabase = useSupabase();
    const { toast } = useToast();
    const { data: courts, loading, refetch } = useSupabaseQuery<Court>('courts', (q) => q.eq('club_id', club.id), { deps: [club.id] });
    const sortedCourts = useMemo(() => courts?.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [courts]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCourt, setSelectedCourt] = useState<Court | undefined>(undefined);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [courtToDelete, setCourtToDelete] = useState<Court | null>(null);
    const [courtLimit, setCourtLimit] = useState<CourtLimitCheck | null>(null);
    const [checkingLimit, setCheckingLimit] = useState(false);
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    // Check court limit on mount and when courts change
    useEffect(() => {
        const checkLimit = async () => {
            setCheckingLimit(true);
            try {
                const { data, error } = await supabase.rpc('check_court_limit', { p_club_id: club.id });
                if (error) {
                    console.error('Error checking court limit:', error);
                } else if (data && data.length > 0) {
                    setCourtLimit(data[0]);
                }
            } catch (error) {
                console.error('Error checking court limit:', error);
            } finally {
                setCheckingLimit(false);
            }
        };
        checkLimit();
    }, [club.id, courts, supabase]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = sortedCourts!.findIndex((item) => item.id === active.id);
            const newIndex = sortedCourts!.findIndex((item) => item.id === over.id);
            const newSorted = arrayMove(sortedCourts!, oldIndex, newIndex);
            for (let i = 0; i < newSorted.length; i++) {
                await supabase.from('courts').update({ order: i }).eq('id', newSorted[i].id);
            }
            toast({ title: 'Đã cập nhật thứ tự', description: 'Thứ tự các sân đã được lưu.' });
            refetch();
        }
    };

    const confirmDelete = async () => {
        if (!courtToDelete) return;
        const { error } = await supabase.from('courts').delete().eq('id', courtToDelete.id);
        if (error) { toast({ title: 'Lỗi', description: 'Không thể xóa sân.', variant: 'destructive' }); }
        else { toast({ title: 'Thành công', description: 'Đã xóa sân.' }); refetch(); }
        setDeleteAlertOpen(false); setCourtToDelete(null);
    };

    const handleAddCourt = () => {
        // Check if limit is reached
        if (courtLimit && !courtLimit.can_create) {
            toast({
                title: "Đã đạt giới hạn",
                description: `Gói hiện tại chỉ cho phép ${courtLimit.max_allowed} sân. Vui lòng nâng cấp gói để tạo thêm sân.`,
                variant: "destructive"
            });
            return;
        }
        setSelectedCourt(undefined);
        setDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                        <CardTitle>Sân</CardTitle>
                        {courtLimit && !checkingLimit && (
                            <p className="text-sm text-muted-foreground">
                                Đang sử dụng: {courtLimit.current_count}/{courtLimit.max_allowed} sân
                            </p>
                        )}
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddCourt}
                        disabled={courtLimit ? !courtLimit.can_create : false}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Thêm sân
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading && <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                    <SortableContext items={sortedCourts?.map(c => c.id) || []} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">{sortedCourts?.map(court => (<SortableCourtItem key={court.id} court={court} onEdit={(c) => { setSelectedCourt(c); setDialogOpen(true); }} onDelete={(c) => { setCourtToDelete(c); setDeleteAlertOpen(true); }} />))}</div>
                    </SortableContext>
                </DndContext>
                {!loading && sortedCourts?.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Chưa có sân nào.</p>}
            </CardContent>
            {dialogOpen && <CourtFormDialog key={selectedCourt?.id || 'new'} isOpen={dialogOpen} setIsOpen={setDialogOpen} clubId={club.id} court={selectedCourt} userRole={userRole} onSuccess={refetch} />}
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể được hoàn tác.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </Card>
    );
}
