'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { UserProfile, Club } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Pencil, Lock, Unlock, Key, Trash2, Copy, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clubOwnerSchema, clubOwnerEditSchema, type ClubOwnerSchema, type ClubOwnerEditSchema } from './schemas';

function ClubOwnerFormDialog({ isOpen, setIsOpen, owner, allClubs, onSuccess }: { isOpen: boolean, setIsOpen: (open: boolean) => void, owner: UserProfile | null, allClubs: Club[], onSuccess?: () => void }) {
    const supabase = useSupabase();
    const { toast } = useToast();
    const isEditMode = !!owner;
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
    const form = useForm<ClubOwnerSchema | ClubOwnerEditSchema>({ resolver: zodResolver(isEditMode ? clubOwnerEditSchema : clubOwnerSchema), defaultValues: { email: owner?.email || '', password: '', managedClubIds: owner?.managed_club_ids || [] } });

    const copyCredentials = (email: string, password: string) => {
        navigator.clipboard.writeText(`Tài khoản: ${email}\nMật khẩu: ${password}`);
        toast({ title: 'Đã copy', description: 'Thông tin đăng nhập đã được copy.' });
    };

    const onSubmit = async (values: ClubOwnerSchema | ClubOwnerEditSchema) => {
        try {
            if (isEditMode && owner) {
                const { error } = await supabase.from('users').update({ email: values.email, managed_club_ids: values.managedClubIds || [] }).eq('id', owner.id);
                if (error) throw error;
                toast({ title: "Thành công", description: 'Đã cập nhật chủ club.' }); setIsOpen(false); onSuccess?.();
            } else {
                const password = (values as ClubOwnerSchema).password;
                const response = await fetch('/api/admin/create-user', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: values.email, password, role: 'club_owner', managedClubIds: values.managedClubIds || [] }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Thao tác thất bại.');
                setCreatedCredentials({ email: values.email, password });
                onSuccess?.();
            }
        } catch (error: any) {
            let message = error.message || 'Thao tác thất bại.';
            if (message.includes('already been registered')) message = 'Email này đã được sử dụng.';
            toast({ title: "Lỗi", description: message, variant: "destructive" });
        }
    };

    if (createdCredentials) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogContent>
                <DialogHeader><DialogTitle>Tạo chủ club thành công</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                    <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
                        <div>Tài khoản: <span className="font-bold">{createdCredentials.email}</span></div>
                        <div>Mật khẩu: <span className="font-bold">{createdCredentials.password}</span></div>
                    </div>
                    <p className="text-xs text-muted-foreground">Hãy copy và gửi thông tin này cho chủ club. Mật khẩu không thể xem lại sau khi đóng.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" className="gap-2" onClick={() => copyCredentials(createdCredentials.email, createdCredentials.password)}>
                        <Copy className="h-4 w-4" /> Copy thông tin
                    </Button>
                    <Button onClick={() => setIsOpen(false)}>Đóng</Button>
                </DialogFooter>
            </DialogContent></Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogContent><DialogHeader><DialogTitle>{isEditMode ? 'Chỉnh sửa Chủ Club' : 'Tạo Chủ Club mới'}</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="owner@example.com" {...field} disabled={isEditMode} /></FormControl><FormMessage /></FormItem>)} />
                {!isEditMode && (<FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Mật khẩu</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />)}
                <FormField control={form.control} name="managedClubIds" render={() => (<FormItem><FormLabel>Các Club quản lý</FormLabel><ScrollArea className="h-40 w-full rounded-md border p-4">{allClubs.map((club) => (<FormField key={club.id} control={form.control} name="managedClubIds" render={({ field }) => (<FormItem key={club.id} className="flex flex-row items-center space-x-3 space-y-0 mb-2"><FormControl><Checkbox checked={field.value?.includes(club.id)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), club.id]) : field.onChange(field.value?.filter((id) => id !== club.id))} /></FormControl><FormLabel className="font-normal">{club.name}</FormLabel></FormItem>)} />))}</ScrollArea><FormMessage /></FormItem>)} />
                <Button type="submit" disabled={form.formState.isSubmitting}>Lưu thay đổi</Button>
            </form></Form>
        </DialogContent></Dialog>
    );
}

export function ClubOwnerManager() {
    const supabase = useSupabase();
    const { data: owners, loading, refetch } = useSupabaseQuery<UserProfile>('users', (q) => q.eq('role', 'club_owner'));
    const { data: clubs } = useSupabaseQuery<Club>('clubs');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedOwner, setSelectedOwner] = useState<UserProfile | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [resetCredentials, setResetCredentials] = useState<{ email: string; password: string } | null>(null);
    const [resetTarget, setResetTarget] = useState<UserProfile | null>(null);
    const [resetPassword, setResetPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const { toast } = useToast();

    const handleToggleLock = async (owner: UserProfile) => {
        const newLockedStatus = !(owner.is_locked ?? false);
        const { error } = await supabase.from('users').update({ is_locked: newLockedStatus }).eq('id', owner.id);
        if (error) { toast({ title: "Lỗi", variant: "destructive" }); } else { toast({ title: "Thành công", description: `Đã ${newLockedStatus ? 'khóa' : 'mở khóa'} tài khoản ${owner.email}.` }); refetch(); }
    };

    const handleResetPassword = async () => {
        if (!resetTarget || !resetPassword) return;
        setIsResetting(true);
        try {
            const response = await fetch('/api/admin/reset-password', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: resetTarget.id, password: resetPassword }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResetCredentials({ email: resetTarget.email!, password: resetPassword });
            setResetTarget(null);
            setResetPassword('');
        } catch (error: any) {
            toast({ title: "Lỗi", description: error.message || 'Không thể đặt lại mật khẩu.', variant: "destructive" });
        } finally {
            setIsResetting(false);
        }
    };

    const copyCredentials = (email: string, password: string) => {
        navigator.clipboard.writeText(`Tài khoản: ${email}\nMật khẩu: ${password}`);
        toast({ title: 'Đã copy', description: 'Thông tin đăng nhập đã được copy.' });
    };

    const handleDeleteOwner = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const response = await fetch('/api/admin/delete-owner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: deleteTarget.id }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Xóa thất bại.');
            toast({ title: "Thành công", description: `Đã xóa chủ club ${deleteTarget.email} và vô hiệu hóa các club liên quan.` });
            setDeleteTarget(null);
            refetch();
        } catch (error: any) {
            toast({ title: "Lỗi", description: error.message, variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card>
            <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Quản lý Chủ Câu lạc bộ</CardTitle><CardDescription>Tạo và gán câu lạc bộ cho các chủ sở hữu.</CardDescription></div><Button onClick={() => { setSelectedOwner(null); setDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Tạo Chủ Club</Button></div></CardHeader>
            <CardContent>
                <Table><TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Các Club quản lý</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading && <tr><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></tr>}
                        {owners?.map(owner => {
                            const managedClubs = owner.managed_club_ids?.map(id => clubs?.find(c => c.id === id)?.name).filter(Boolean);
                            const isLocked = owner.is_locked ?? false;
                            return (
                                <TableRow key={owner.id} className={cn(isLocked && "bg-muted/30 opacity-70")}>
                                    <TableCell className="font-medium"><div className="flex items-center gap-2">{owner.email}{isLocked && <Badge variant="destructive" className="text-[10px] h-4">Đã khóa</Badge>}</div></TableCell>
                                    <TableCell>{managedClubs?.join(', ') || 'Chưa gán'}</TableCell>
                                    <TableCell className="text-right"><div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedOwner(owner); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end"><DropdownMenuLabel>Tùy chọn tài khoản</DropdownMenuLabel><DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleToggleLock(owner)}>{isLocked ? <><Unlock className="mr-2 h-4 w-4" /> Mở khóa</> : <><Lock className="mr-2 h-4 w-4" /> Khóa tài khoản</>}</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setResetTarget(owner); setResetPassword(''); }}><Key className="mr-2 h-4 w-4" /> Đặt lại mật khẩu</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(owner)}><Trash2 className="mr-2 h-4 w-4" /> Xóa chủ club</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div></TableCell>
                                </TableRow>
                            );
                        })}
                        {!loading && owners?.length === 0 && (<TableRow><TableCell colSpan={4} className="text-center h-24">Chưa có chủ club nào.</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </CardContent>
            {dialogOpen && <ClubOwnerFormDialog isOpen={dialogOpen} setIsOpen={setDialogOpen} owner={selectedOwner} allClubs={clubs || []} onSuccess={refetch} />}

            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa chủ club</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc muốn xóa <span className="font-semibold">{deleteTarget?.email}</span>?
                            Tất cả câu lạc bộ của họ sẽ bị vô hiệu hóa trên hệ thống. Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Hủy</Button>
                        <Button variant="destructive" onClick={handleDeleteOwner} disabled={isDeleting}>
                            {isDeleting ? 'Đang xóa...' : 'Xóa chủ club'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!resetTarget} onOpenChange={(open) => { if (!open) { setResetTarget(null); setResetPassword(''); } }}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Đặt lại mật khẩu</DialogTitle><DialogDescription>Nhập mật khẩu mới cho {resetTarget?.email}</DialogDescription></DialogHeader>
                    <Input type="text" placeholder="Nhập mật khẩu mới..." value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setResetTarget(null); setResetPassword(''); }}>Hủy</Button>
                        <Button onClick={handleResetPassword} disabled={!resetPassword || resetPassword.length < 6 || isResetting}>
                            {isResetting ? 'Đang xử lý...' : 'Đặt lại'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!resetCredentials} onOpenChange={(open) => !open && setResetCredentials(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Mật khẩu mới</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
                            <div>Tài khoản: <span className="font-bold">{resetCredentials?.email}</span></div>
                            <div>Mật khẩu mới: <span className="font-bold">{resetCredentials?.password}</span></div>
                        </div>
                        <p className="text-xs text-muted-foreground">Hãy copy và gửi mật khẩu mới cho chủ club. Không thể xem lại sau khi đóng.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="gap-2" onClick={() => resetCredentials && copyCredentials(resetCredentials.email, resetCredentials.password)}>
                            <Copy className="h-4 w-4" /> Copy thông tin
                        </Button>
                        <Button onClick={() => setResetCredentials(null)}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
