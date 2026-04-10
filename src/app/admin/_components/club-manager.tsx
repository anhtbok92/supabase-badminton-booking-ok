'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { Club, UserProfile, ClubType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription as FormDescriptionComponent, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, Pencil, UploadCloud, Copy, QrCode, Info, Star, Globe } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { uploadFile } from '@/lib/upload';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { clubSchema, type ClubSchema } from './schemas';

const RESERVED_SUBDOMAINS = [
    'app', 'www', 'api', 'admin', 'mail', 'ftp',
    'staging', 'dev', 'test', 'beta', 'demo',
    'static', 'cdn', 'assets', 'img', 'images',
    'ns1', 'ns2', 'dns', 'mx',
];
const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
import { CourtManager } from './court-manager';
import { BookingQuotaDisplay } from './booking-quota-display';
import { ClubQrCodeDialog } from './club-qr-code';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('./location-picker').then(m => ({ default: m.LocationPicker })), { ssr: false, loading: () => <div className="h-[300px] rounded-lg border flex items-center justify-center text-muted-foreground text-sm">Đang tải bản đồ...</div> });
import { ClubSeoFields } from './club-seo-fields';

export function ClubManager({ userProfile }: { userProfile: UserProfile }) {
    const supabase = useSupabase();
    const { data: allClubs, loading, refetch } = useSupabaseQuery<Club>('clubs');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedClub, setSelectedClub] = useState<Club | undefined>(undefined);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [clubToDelete, setClubToDelete] = useState<Club | null>(null);
    const [qrClub, setQrClub] = useState<Club | null>(null);
    const { toast } = useToast();
    const isAdmin = userProfile.role === 'admin';

    const clubs = useMemo(() => {
        if (!allClubs) return [];
        if (userProfile.role === 'club_owner') return allClubs.filter(c => userProfile.managed_club_ids?.includes(c.id));
        return allClubs;
    }, [allClubs, userProfile]);

    const handleToggleActive = async (club: Club) => {
        if (!isAdmin) return;
        const newIsActive = !(club.is_active ?? true);
        const { error } = await supabase.from('clubs').update({ is_active: newIsActive }).eq('id', club.id);
        if (error) { toast({ title: 'Lỗi', description: 'Không thể cập nhật trạng thái.', variant: 'destructive' }); }
        else { toast({ title: 'Cập nhật thành công', description: `Câu lạc bộ "${club.name}" đã được ${newIsActive ? 'hiển thị' : 'ẩn'}.` }); refetch(); }
    };

    const confirmDelete = async () => {
        if (!clubToDelete || !isAdmin) return;
        const { error } = await supabase.from('clubs').delete().eq('id', clubToDelete.id);
        if (error) { toast({ title: 'Lỗi', description: 'Không thể xóa câu lạc bộ.', variant: 'destructive' }); }
        else { toast({ title: 'Thành công', description: 'Đã xóa câu lạc bộ.' }); refetch(); }
        setDeleteAlertOpen(false); setClubToDelete(null);
    };

    const handleDuplicate = async (club: Club) => {
        const { id, created_at, ...rest } = club as any;
        const duplicateData = {
            ...rest,
            name: `${club.name} (Bản sao)`,
            is_active: false,
        };
        const { error } = await supabase.from('clubs').insert(duplicateData);
        if (error) { toast({ title: 'Lỗi', description: 'Không thể nhân bản câu lạc bộ.', variant: 'destructive' }); }
        else { toast({ title: 'Thành công', description: `Đã nhân bản "${club.name}". CLB mới đang ở trạng thái ẩn.` }); refetch(); }
    };

    return (
        <Card>
            <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Danh sách Câu lạc bộ</CardTitle><CardDescription>Thêm, sửa, hoặc xóa câu lạc bộ và quản lý sân/giá.</CardDescription></div>
                {isAdmin && (<Button onClick={() => { setSelectedClub(undefined); setDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Thêm Câu lạc bộ</Button>)}
            </div></CardHeader>
            <CardContent>
                {loading && <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}
                {!loading && clubs && clubs.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {clubs.map(club => (
                            <AccordionItem key={club.id} value={club.id}>
                                <div className="flex items-center">
                                    <AccordionTrigger className="flex-grow">{club.name} <Badge variant="secondary" className="ml-2">{club.club_type}</Badge></AccordionTrigger>
                                    <div className="flex items-center space-x-2 pr-4">
                                        <Switch checked={club.is_active ?? true} onCheckedChange={() => handleToggleActive(club)} onClick={(e) => e.stopPropagation()} disabled={!isAdmin} />
                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedClub(club); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => setQrClub(club)} title="Mã QR đặt sân"><QrCode className="h-4 w-4" /></Button>
                                        {isAdmin && <Button variant="ghost" size="icon" onClick={() => handleDuplicate(club)} title="Nhân bản"><Copy className="h-4 w-4" /></Button>}
                                        {isAdmin && <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setClubToDelete(club); setDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button>}
                                    </div>
                                </div>
                                <AccordionContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
                                        <CourtManager club={club} userRole={userProfile.role} />
                                        <PricingManager club={club} />
                                        <BookingQuotaDisplay clubId={club.id} />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (!loading && <p className="text-center text-muted-foreground py-8">Chưa có câu lạc bộ nào.</p>)}
            </CardContent>
            {dialogOpen && <ClubFormDialog key={selectedClub?.id || 'new'} isOpen={dialogOpen} setIsOpen={setDialogOpen} club={selectedClub} userRole={userProfile.role} onSuccess={refetch} />}
            {isAdmin && (<AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle><AlertDialogDescription>Thao tác này sẽ xóa vĩnh viễn câu lạc bộ.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}
            {qrClub && <ClubQrCodeDialog club={qrClub} open={!!qrClub} onOpenChange={(open) => { if (!open) setQrClub(null); }} />}
        </Card>
    );
}

function PricingManager({ club }: { club: Club }) {
    const { pricing } = club;
    
    if (!pricing || !pricing.weekday || !pricing.weekend) {
        return (
            <Card>
                <CardHeader><CardTitle>Thông tin giá</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Chưa có thông tin giá. Vui lòng cập nhật trong form chỉnh sửa.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader><CardTitle>Thông tin giá</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><h4 className="font-semibold mb-2">Ngày thường</h4><Table><TableHeader><TableRow><TableHead>Khung thời gian</TableHead><TableHead className="text-right">Ưu tiên</TableHead><TableHead className="text-right">Đơn giá/30p</TableHead></TableRow></TableHeader><TableBody>{pricing.weekday.map((tier, i) => (<TableRow key={i}><TableCell className="font-mono">{tier.timeRange.join(' - ')}</TableCell><TableCell className="text-right">{tier.is_priority && <Badge className="bg-amber-500 hover:bg-amber-600 border-none"><Star className="h-3 w-3 mr-1 fill-white" /> Ưu tiên</Badge>}</TableCell><TableCell className="text-right font-bold text-primary">{new Intl.NumberFormat('vi-VN').format(tier.price)} đ</TableCell></TableRow>))}</TableBody></Table></div>
                <div><h4 className="font-semibold mb-2">Cuối tuần</h4><Table><TableHeader><TableRow><TableHead>Khung thời gian</TableHead><TableHead className="text-right">Ưu tiên</TableHead><TableHead className="text-right">Đơn giá/30p</TableHead></TableRow></TableHeader><TableBody>{pricing.weekend.map((tier, i) => (<TableRow key={i}><TableCell className="font-mono">{tier.timeRange.join(' - ')}</TableCell><TableCell className="text-right">{tier.is_priority && <Badge className="bg-amber-500 hover:bg-amber-600 border-none"><Star className="h-3 w-3 mr-1 fill-white" /> Ưu tiên</Badge>}</TableCell><TableCell className="text-right font-bold text-primary">{new Intl.NumberFormat('vi-VN').format(tier.price)} đ</TableCell></TableRow>))}</TableBody></Table></div>
            </CardContent>
        </Card>
    );
}

function ClubFormDialog({ isOpen, setIsOpen, club, userRole, onSuccess }: { isOpen: boolean; setIsOpen: (open: boolean) => void; club?: Club, userRole: UserProfile['role'], onSuccess?: () => void }) {
    const supabase = useSupabase();
    const { toast } = useToast();
    const isEditMode = !!club;
    const canEdit = userRole === 'admin';
    const { data: clubTypes, loading: typesLoading } = useSupabaseQuery<ClubType>('club_types');
    const [imageUrls, setImageUrls] = useState<string[]>(club?.image_urls || []);
    const [uploadingFiles, setUploadingFiles] = useState<{ name: string }[]>([]);
    const [paymentQrUrl, setPaymentQrUrl] = useState<string>(club?.payment_qr_url || '');
    const [uploadingQr, setUploadingQr] = useState(false);
    const [priceListImageUrl, setPriceListImageUrl] = useState<string>(club?.price_list_image_url || '');
    const [uploadingPriceListImage, setUploadingPriceListImage] = useState(false);
    const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'reserved' | 'invalid'>('idle');

    const form = useForm<ClubSchema>({
        resolver: zodResolver(clubSchema),
        defaultValues: {
            name: club?.name ?? '', address: club?.address ?? '', phone: club?.phone ?? '', clubType: club?.club_type ?? '',
            rating: club?.rating ?? undefined, pricing: club?.pricing ?? { weekday: [{ timeRange: ['05:00', '17:00'], price: 30000 }], weekend: [{ timeRange: ['05:00', '22:00'], price: 40000 }] },
            operatingHours: club?.operating_hours ?? 'Thứ 2 - CN: 05:00 - 22:00', servicesHtml: club?.services_html ?? '',
            latitude: club?.latitude ?? 0, longitude: club?.longitude ?? 0, isActive: club?.is_active ?? true,
            paymentQrUrl: club?.payment_qr_url ?? '', priceListHtml: club?.price_list_html ?? '',
            priceListImageUrl: club?.price_list_image_url ?? '', mapVideoUrl: club?.map_video_url ?? '',
            bookingPolicy: club?.booking_policy ?? 'Khách vui lòng đặt 2 tiếng, nếu đặt lẻ giờ vui lòng nhắn theo hotline 0982.949.974',
            customSubdomain: club?.custom_subdomain ?? '',
            city: (club as any)?.city ?? '',
            district: (club as any)?.district ?? '',
            openTime: (club as any)?.open_time ?? '',
            closeTime: (club as any)?.close_time ?? '',
            hasRoof: (club as any)?.has_roof ?? false,
            indoorOutdoor: (club as any)?.indoor_outdoor ?? 'outdoor',
            hasLighting: (club as any)?.has_lighting ?? true,
            hasParking: (club as any)?.has_parking ?? false,
            description: club?.description ?? '',
        },
    });

    const { fields: weekdayFields, append: appendWeekday, remove: removeWeekday } = useFieldArray({ control: form.control, name: "pricing.weekday" });
    const { fields: weekendFields, append: appendWeekend, remove: removeWeekend } = useFieldArray({ control: form.control, name: "pricing.weekend" });

    const checkSubdomainAvailability = useCallback(async (value: string) => {
        if (!value) { setSubdomainStatus('idle'); return; }
        if (value.length > 63 || !SUBDOMAIN_REGEX.test(value)) { setSubdomainStatus('invalid'); return; }
        if (RESERVED_SUBDOMAINS.includes(value)) { setSubdomainStatus('reserved'); return; }
        setSubdomainStatus('checking');
        const { data } = await supabase
            .from('clubs')
            .select('id')
            .eq('custom_subdomain', value)
            .maybeSingle();
        if (data && data.id !== club?.id) {
            setSubdomainStatus('taken');
        } else {
            setSubdomainStatus('available');
        }
    }, [supabase, club?.id]);

    const handleImageUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        if (imageUrls.length + files.length > 10) { toast({ title: "Lỗi", description: "Tối đa 10 ảnh.", variant: "destructive" }); return; }
        const currentUploading = Array.from(files).map(file => ({ name: file.name }));
        setUploadingFiles(prev => [...prev, ...currentUploading]);
        Array.from(files).forEach(async (file) => {
            try {
                const url = await uploadFile(supabase, `clubs`, file);
                setImageUrls(prev => [...prev, url]);
            } catch { toast({ title: "Lỗi tải lên", variant: "destructive" }); }
            finally { setUploadingFiles(prev => prev.filter(f => f.name !== file.name)); }
        });
    };

    const onSubmit = async (values: ClubSchema) => {
        const finalValues = {
            name: values.name, address: values.address, phone: values.phone, club_type: values.clubType,
            rating: values.rating || 0, image_urls: imageUrls, pricing: values.pricing,
            operating_hours: values.operatingHours, services_html: values.servicesHtml,
            latitude: values.latitude, longitude: values.longitude, is_active: values.isActive,
            payment_qr_url: paymentQrUrl, price_list_html: values.priceListHtml,
            price_list_image_url: priceListImageUrl, map_video_url: values.mapVideoUrl,
            booking_policy: values.bookingPolicy,
            custom_subdomain: values.customSubdomain || null,
            city: values.city || null,
            district: values.district || null,
            open_time: values.openTime || null,
            close_time: values.closeTime || null,
            has_roof: values.hasRoof,
            indoor_outdoor: values.indoorOutdoor,
            has_lighting: values.hasLighting,
            has_parking: values.hasParking,
            description: values.description || null,
        };
        if (isEditMode && club) {
            const { error } = await supabase.from('clubs').update(finalValues).eq('id', club.id);
            if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
        } else {
            const { error } = await supabase.from('clubs').insert(finalValues);
            if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
        }
        toast({ title: 'Thành công', description: `Đã ${isEditMode ? 'cập nhật' : 'tạo'} câu lạc bộ.` }); setIsOpen(false); onSuccess?.();
        // Auto-regenerate SEO pages in background
        fetch('/api/seo/generate-pages', { method: 'POST' }).catch(() => {});
    };

    const uploadSingleImage = (setter: (url: string) => void, setUploading: (v: boolean) => void, folder: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setUploading(true);
        try {
            const url = await uploadFile(supabase, folder, file);
            setter(url);
        } catch { toast({ title: "Lỗi", variant: "destructive" }); }
        finally { setUploading(false); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogContent className="sm:max-w-[800px]"><DialogHeader><DialogTitle className="font-headline">{isEditMode ? 'Chỉnh sửa Câu lạc bộ' : 'Tạo Câu lạc bộ mới'}</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Tên câu lạc bộ</FormLabel><FormControl><Input {...field} disabled={isEditMode && !canEdit} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Địa chỉ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="clubType" render={({ field }) => (<FormItem><FormLabel>Loại câu lạc bộ</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Chọn loại..." /></SelectTrigger></FormControl><SelectContent>{typesLoading ? <SelectItem value="loading" disabled>Đang tải...</SelectItem> : clubTypes?.map(type => (<SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Số điện thoại</FormLabel><FormControl><Input placeholder="0912345678" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="rating" render={({ field }) => (<FormItem><FormLabel>Đánh giá (0-5)</FormLabel><FormControl><Input type="number" step="0.1" min="0" max="5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="operatingHours" render={({ field }) => (<FormItem><FormLabel>Giờ hoạt động</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="space-y-2">
                    <FormLabel>Vị trí trên bản đồ</FormLabel>
                    <LocationPicker
                        latitude={form.watch('latitude') || 0}
                        longitude={form.watch('longitude') || 0}
                        onLocationChange={(lat, lng) => {
                            form.setValue('latitude', lat);
                            form.setValue('longitude', lng);
                        }}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="latitude" render={({ field }) => (<FormItem><FormLabel>Vĩ độ</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="longitude" render={({ field }) => (<FormItem><FormLabel>Kinh độ</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>
                <FormField control={form.control} name="isActive" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Hiển thị Câu lạc bộ</FormLabel><FormDescriptionComponent>Nếu tắt, câu lạc bộ sẽ bị ẩn.</FormDescriptionComponent></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={!canEdit} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="servicesHtml" render={({ field }) => (<FormItem><FormLabel>Dịch vụ (HTML)</FormLabel><FormControl><Textarea {...field} rows={6} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="priceListHtml" render={({ field }) => (<FormItem><FormLabel>Bảng giá chi tiết (HTML)</FormLabel><FormControl><Textarea {...field} rows={6} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bookingPolicy" render={({ field }) => (<FormItem><FormLabel>Chính sách đặt sân (Hiển thị ngay dưới tiêu đề)</FormLabel><FormControl><Input {...field} placeholder="VD: Khách vui lòng đặt 2 tiếng..." /></FormControl><FormDescriptionComponent>Thông báo ngắn gọn cho khách khi đặt sân.</FormDescriptionComponent><FormMessage /></FormItem>)} />
                <div className="space-y-2 border p-4 rounded-lg bg-muted/20">
                    <FormLabel className="text-base font-bold flex items-center gap-2">📍 Thông tin SEO & Tiện ích</FormLabel>
                    <ClubSeoFields form={form} />
                </div>
                <div className="space-y-2 border p-4 rounded-lg bg-muted/20">
                    <FormLabel className="text-base font-bold flex items-center gap-2"><Globe className="h-4 w-4" /> Subdomain riêng</FormLabel>
                    <FormField control={form.control} name="customSubdomain" render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="vd: caulonglinhdam"
                                    onChange={(e) => {
                                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                        field.onChange(val);
                                        checkSubdomainAvailability(val);
                                    }}
                                />
                            </FormControl>
                            {field.value && (
                                <div className="text-xs space-y-1">
                                    <p className="text-muted-foreground">
                                        URL: <a href={`https://${field.value}.sportbooking.online`} target="_blank" rel="noopener noreferrer" className="font-mono font-medium text-primary underline hover:text-primary/80">{field.value}.sportbooking.online</a>
                                    </p>
                                    {subdomainStatus === 'checking' && <p className="text-muted-foreground">Đang kiểm tra...</p>}
                                    {subdomainStatus === 'available' && <p className="text-emerald-600">✓ Subdomain khả dụng</p>}
                                    {subdomainStatus === 'taken' && <p className="text-destructive">✗ Subdomain đã được sử dụng</p>}
                                    {subdomainStatus === 'reserved' && <p className="text-destructive">✗ Subdomain này là từ khóa hệ thống, không thể sử dụng</p>}
                                    {subdomainStatus === 'invalid' && <p className="text-destructive">✗ Subdomain không hợp lệ (chỉ chữ thường, số, dấu gạch ngang)</p>}
                                </div>
                            )}
                            <FormDescriptionComponent>Để trống nếu không muốn dùng subdomain riêng.</FormDescriptionComponent>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="space-y-4 border p-4 rounded-lg bg-muted/20"><FormLabel className="text-base font-bold">Hình ảnh Bảng giá</FormLabel>
                    {priceListImageUrl ? (<div className="relative group w-full max-w-sm aspect-video border-2 border-primary/20 rounded-xl overflow-hidden shadow-md"><Image src={priceListImageUrl} alt="Price List" fill className="object-contain p-2 bg-white" /><Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => setPriceListImageUrl('')}><Trash2 className="h-4 w-4" /></Button></div>)
                    : (<label className="flex flex-col items-center justify-center w-full max-w-sm h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-secondary/50"><UploadCloud className="w-8 h-8 mb-2 text-primary/60" /><p className="text-sm font-medium">Tải lên ảnh Bảng giá</p><input type="file" className="hidden" accept="image/*" onChange={uploadSingleImage(setPriceListImageUrl, setUploadingPriceListImage, 'price-list')} disabled={uploadingPriceListImage} /></label>)}
                    {uploadingPriceListImage && <p className="text-xs text-primary animate-pulse">Đang tải...</p>}
                </div>
                <FormField control={form.control} name="mapVideoUrl" render={({ field }) => (<FormItem><FormLabel>Link Video Chỉ đường</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="space-y-4 border p-4 rounded-lg bg-muted/20"><FormLabel className="text-base font-bold">Mã QR Thanh toán</FormLabel>
                    {paymentQrUrl ? (<div className="relative group w-48 aspect-square border-2 border-primary/20 rounded-xl overflow-hidden shadow-md"><Image src={paymentQrUrl} alt="QR" fill className="object-contain p-2 bg-white" /><Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => setPaymentQrUrl('')}><Trash2 className="h-4 w-4" /></Button></div>)
                    : (<label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed rounded-xl cursor-pointer hover:bg-secondary/50"><UploadCloud className="w-10 h-10 mb-2 text-primary/60" /><p className="text-sm font-medium">Tải lên mã QR</p><input type="file" className="hidden" accept="image/*" onChange={uploadSingleImage(setPaymentQrUrl, setUploadingQr, 'qr')} disabled={uploadingQr} /></label>)}
                    {uploadingQr && <p className="text-xs text-primary animate-pulse">Đang xử lý...</p>}
                </div>
                <div className="space-y-2"><FormLabel>Hình ảnh Câu lạc bộ (Tối đa 10)</FormLabel>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {imageUrls.map(url => (<div key={url} className="relative group aspect-square"><Image src={url} alt="Ảnh" fill sizes="10vw" className="object-cover rounded-md bg-muted" /><Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => setImageUrls(prev => prev.filter(u => u !== url))}><Trash2 className="h-4 w-4" /></Button></div>))}
                        {imageUrls.length < 10 && (<label className="flex flex-col items-center justify-center w-full h-full aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary"><UploadCloud className="w-8 h-8 text-muted-foreground" /><input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} disabled={uploadingFiles.length > 0} /></label>)}
                    </div>
                </div>
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-2">
                    <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                        <Info className="h-4 w-4" /> Lưu ý về logic tính giá:
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Hệ thống tự động tính giá theo nguyên tắc <strong>"Ưu tiên khung giờ cụ thể nhất"</strong>:
                        <br />• <strong>Ưu tiên Thủ công:</strong> Khung giờ được đánh dấu "Ưu tiên" sẽ luôn được dùng trước.
                        <br />• <strong>Thời lượng (Duration):</strong> Khung giờ ngắn hơn (VD: 18-20h) ưu tiên hơn khung dài (VD: 06-24h).
                        <br />• <strong>Giá (Price):</strong> Nếu độ dài bằng nhau, khung giờ có giá cao hơn sẽ được chọn.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">Giá ngày thường</h3>
                            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => appendWeekday({ timeRange: ['05:00', '17:00'], price: 30000, is_priority: false })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Thêm khung
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {weekdayFields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-xl bg-white shadow-sm space-y-3 relative group">
                                    <div className="flex justify-between items-center bg-slate-50 -m-4 mb-3 p-3 rounded-t-xl border-b">
                                        <Badge variant="outline" className="bg-white">Khung #{index + 1}</Badge>
                                        <div className="flex items-center gap-3">
                                            <FormField control={form.control} name={`pricing.weekday.${index}.is_priority`} render={({ field }) => (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400">Ưu tiên</span>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
                                                </div>
                                            )} />
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeWeekday(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField control={form.control} name={`pricing.weekday.${index}.timeRange.0`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Từ</FormLabel><FormControl><Input {...field} className="h-8 font-mono" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`pricing.weekday.${index}.timeRange.1`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Đến</FormLabel><FormControl><Input {...field} className="h-8 font-mono" /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <FormField control={form.control} name={`pricing.weekday.${index}.price`} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Đơn giá/30 phút</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type="number" {...field} className="h-9 pr-10 font-bold text-primary" />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">Giá cuối tuần</h3>
                            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => appendWeekend({ timeRange: ['05:00', '22:00'], price: 40000, is_priority: false })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Thêm khung
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {weekendFields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-xl bg-white shadow-sm space-y-3 relative group">
                                    <div className="flex justify-between items-center bg-slate-50 -m-4 mb-3 p-3 rounded-t-xl border-b">
                                        <Badge variant="outline" className="bg-white">Khung #{index + 1}</Badge>
                                        <div className="flex items-center gap-3">
                                            <FormField control={form.control} name={`pricing.weekend.${index}.is_priority`} render={({ field }) => (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400">Ưu tiên</span>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
                                                </div>
                                            )} />
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeWeekend(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField control={form.control} name={`pricing.weekend.${index}.timeRange.0`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Từ</FormLabel><FormControl><Input {...field} className="h-8 font-mono" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`pricing.weekend.${index}.timeRange.1`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Đến</FormLabel><FormControl><Input {...field} className="h-8 font-mono" /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <FormField control={form.control} name={`pricing.weekend.${index}.price`} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Đơn giá/30 phút</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type="number" {...field} className="h-9 pr-10 font-bold text-primary" />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || uploadingFiles.length > 0 || subdomainStatus === 'taken' || subdomainStatus === 'reserved' || subdomainStatus === 'checking'}>{form.formState.isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
            </form></Form>
        </DialogContent></Dialog>
    );
}