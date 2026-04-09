'use client';

import { useState, useMemo } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { UserProfile, Club, Court, Event, UserBooking } from '@/lib/types';
import { isEventEditable, getParticipantCount } from '@/lib/event-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarDays, Plus, MoreHorizontal, Pencil, Trash2, Users, Search } from 'lucide-react';

const eventFormSchema = z.object({
  event_name: z.string().min(1, 'Tên sự kiện không được để trống'),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có định dạng YYYY-MM-DD'),
  court_id: z.string().min(1, 'Vui lòng chọn sân'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Giờ bắt đầu không hợp lệ'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Giờ kết thúc không hợp lệ'),
  max_participants: z.coerce.number().int().min(1, 'Số người tham gia phải lớn hơn 0'),
  ticket_price: z.coerce.number().min(0, 'Giá vé không được âm'),
  activity_type: z.string().min(1, 'Thể loại tham gia là bắt buộc'),
  notes: z.string().optional(),
}).refine((data) => {
  const [sh, sm] = data.start_time.split(':').map(Number);
  const [eh, em] = data.end_time.split(':').map(Number);
  return (eh * 60 + em) > (sh * 60 + sm);
}, { message: 'Giờ kết thúc phải sau giờ bắt đầu', path: ['end_time'] });
type EventFormSchema = z.infer<typeof eventFormSchema>;


function ParticipantsDialog({ event, bookings, isOpen, onClose }: {
  event: Event | null;
  bookings: UserBooking[] | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const participants = useMemo(() => {
    if (!event || !bookings) return [];
    return bookings.filter(
      (b) => b.event_id === event.id && b.status !== 'Đã hủy' && !b.is_deleted && b.phone !== 'Hệ thống'
    );
  }, [event, bookings]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Danh sách người tham gia</DialogTitle>
          <DialogDescription>{event?.event_name} — {participants.length}/{event?.max_participants} người</DialogDescription>
        </DialogHeader>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Chưa có người tham gia.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>STT</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.phone}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.created_at ? format(new Date(p.created_at), 'HH:mm dd/MM/yyyy', { locale: vi }) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}


export function EventManager({ userProfile }: { userProfile: UserProfile }) {
  const supabase = useSupabase();
  const { toast } = useToast();
  const isAdmin = userProfile.role === 'admin';

  const { data: events, loading: eventsLoading, refetch: refetchEvents } = useSupabaseQuery<Event>('events');
  const { data: clubs, loading: clubsLoading } = useSupabaseQuery<Club>('clubs');
  const { data: courts, loading: courtsLoading } = useSupabaseQuery<Court>('courts');
  const { data: bookings } = useSupabaseQuery<UserBooking>('bookings');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [participantsEvent, setParticipantsEvent] = useState<Event | null>(null);

  const loading = eventsLoading || clubsLoading || courtsLoading;

  const availableClubs = useMemo(() => {
    if (!clubs) return [];
    if (isAdmin) return clubs;
    return clubs.filter(c => userProfile.managed_club_ids?.includes(c.id));
  }, [clubs, isAdmin, userProfile.managed_club_ids]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let result = events;

    // Role-based filtering
    if (!isAdmin) {
      const ownerClubIds = userProfile.managed_club_ids || [];
      result = result.filter(e => ownerClubIds.includes(e.club_id));
    }

    if (selectedClubId !== 'all') {
      result = result.filter(e => e.club_id === selectedClubId);
    }
    if (statusFilter !== 'all') {
      result = result.filter(e => e.status === statusFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(e => e.event_name.toLowerCase().includes(term));
    }

    return result.sort((a, b) => b.event_date.localeCompare(a.event_date));
  }, [events, isAdmin, userProfile.managed_club_ids, selectedClubId, statusFilter, searchTerm]);

  const form = useForm<EventFormSchema>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: { event_name: '', event_date: '', court_id: '', start_time: '08:00', end_time: '10:00', max_participants: 10, ticket_price: 0, activity_type: '', notes: '' },
  });

  // Courts filtered by selected club in form
  const formClubId = form.watch('court_id') ? courts?.find(c => c.id === form.watch('court_id'))?.club_id : undefined;
  const selectedFormClubId = editingEvent?.club_id || (availableClubs.length === 1 ? availableClubs[0].id : undefined);

  const courtsForForm = useMemo(() => {
    if (!courts || !selectedFormClubId) return courts || [];
    return courts.filter(c => c.club_id === selectedFormClubId);
  }, [courts, selectedFormClubId]);

  const [formClubSelect, setFormClubSelect] = useState<string>('');

  const courtsFiltered = useMemo(() => {
    if (!courts) return [];
    const clubId = editingEvent?.club_id || formClubSelect || (availableClubs.length === 1 ? availableClubs[0].id : '');
    if (!clubId) return [];
    return courts.filter(c => c.club_id === clubId);
  }, [courts, editingEvent, formClubSelect, availableClubs]);

  const openCreateForm = () => {
    setEditingEvent(null);
    const defaultClubId = availableClubs.length === 1 ? availableClubs[0].id : '';
    setFormClubSelect(defaultClubId);
    form.reset({ event_name: '', event_date: '', court_id: '', start_time: '08:00', end_time: '10:00', max_participants: 10, ticket_price: 0, activity_type: '', notes: '' });
    setIsFormOpen(true);
  };

  const openEditForm = (event: Event) => {
    if (!isEventEditable(event)) {
      toast({ title: 'Không thể chỉnh sửa', description: 'Sự kiện đã diễn ra, không thể chỉnh sửa.', variant: 'destructive' });
      return;
    }
    setEditingEvent(event);
    setFormClubSelect(event.club_id);
    form.reset({
      event_name: event.event_name,
      event_date: event.event_date,
      court_id: event.court_id || '',
      start_time: event.start_time || '08:00',
      end_time: event.end_time || '10:00',
      max_participants: event.max_participants,
      ticket_price: event.ticket_price,
      activity_type: event.activity_type || '',
      notes: event.notes || '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: EventFormSchema) => {
    const clubId = editingEvent?.club_id || formClubSelect;
    if (!clubId) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn câu lạc bộ.', variant: 'destructive' });
      return;
    }

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update({ ...data, club_id: clubId })
          .eq('id', editingEvent.id);
        if (error) throw error;
        toast({ title: 'Cập nhật thành công', description: `Đã cập nhật sự kiện "${data.event_name}".` });
      } else {
        const { error } = await supabase
          .from('events')
          .insert({ ...data, club_id: clubId, created_by: userProfile.id });
        if (error) throw error;
        toast({ title: 'Tạo thành công', description: `Đã tạo sự kiện "${data.event_name}".` });
      }
      setIsFormOpen(false);
      refetchEvents();
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Lỗi', description: error.message || 'Không thể lưu sự kiện.', variant: 'destructive' });
    }
  };

  const handleDelete = async (event: Event) => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', event.id);
      if (error) throw error;
      toast({ title: 'Xóa thành công', description: `Đã xóa sự kiện "${event.event_name}".` });
      refetchEvents();
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Lỗi', description: error.message || 'Không thể xóa sự kiện.', variant: 'destructive' });
    }
  };

  const getClubName = (clubId: string) => clubs?.find(c => c.id === clubId)?.name || '—';
  const getCourtName = (courtId?: string) => courts?.find(c => c.id === courtId)?.name || '—';

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500 text-white border-green-500 hover:bg-green-500/80">Hoạt động</Badge>;
      case 'cancelled': return <Badge className="bg-red-500 text-white border-red-500 hover:bg-red-500/80">Đã hủy</Badge>;
      case 'completed': return <Badge className="bg-blue-500 text-white border-blue-500 hover:bg-blue-500/80">Hoàn thành</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) return <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>;


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" /> Quản lý Sự kiện
              </CardTitle>
              <CardDescription>{filteredEvents.length} sự kiện</CardDescription>
            </div>
            <Button onClick={openCreateForm}><Plus className="h-4 w-4 mr-2" /> Tạo sự kiện</Button>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên sự kiện..."
                className="pl-9 w-full sm:w-[200px]"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedClubId} onValueChange={setSelectedClubId}>
              <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Lọc theo CLB" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả CLB</SelectItem>
                {availableClubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên sự kiện</TableHead>
                <TableHead>CLB</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Khung giờ</TableHead>
                <TableHead>Sân</TableHead>
                <TableHead>Người tham gia</TableHead>
                <TableHead>Giá vé</TableHead>
                <TableHead>Thể loại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map(event => {
                const count = bookings ? getParticipantCount(bookings, event.id) : 0;
                const editable = isEventEditable(event);
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.event_name}</TableCell>
                    <TableCell className="text-sm">{getClubName(event.club_id)}</TableCell>
                    <TableCell className="text-sm">{event.event_date}</TableCell>
                    <TableCell className="text-sm">{event.start_time} - {event.end_time}</TableCell>
                    <TableCell className="text-sm">{getCourtName(event.court_id)}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => setParticipantsEvent(event)}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer"
                      >
                        <Users className="h-3.5 w-3.5" /> {count}/{event.max_participants}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">{new Intl.NumberFormat('vi-VN').format(event.ticket_price)}đ</TableCell>
                    <TableCell className="text-sm">{event.activity_type || '—'}</TableCell>
                    <TableCell>{statusBadge(event.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditForm(event)} disabled={!editable}>
                            <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setParticipantsEvent(event)}>
                            <Users className="mr-2 h-4 w-4" /> Xem người tham gia
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(event)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center h-24 text-muted-foreground">Chưa có sự kiện nào.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Cập nhật thông tin sự kiện.' : 'Điền thông tin để tạo sự kiện mới.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Club selector (only when creating and multiple clubs) */}
              {!editingEvent && availableClubs.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Câu lạc bộ</label>
                  <Select value={formClubSelect} onValueChange={(v) => { setFormClubSelect(v); form.setValue('court_id', ''); }}>
                    <SelectTrigger><SelectValue placeholder="Chọn câu lạc bộ" /></SelectTrigger>
                    <SelectContent>
                      {availableClubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <FormField control={form.control} name="event_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên sự kiện</FormLabel>
                  <FormControl><Input placeholder="VD: Giao lưu cầu lông cuối tuần" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="event_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày tổ chức</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="start_time" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ bắt đầu</FormLabel>
                    <FormControl><Input type="time" step="1800" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="end_time" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ kết thúc</FormLabel>
                    <FormControl><Input type="time" step="1800" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="court_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sân</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Chọn sân" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {courtsFiltered.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="max_participants" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số người tối đa</FormLabel>
                    <FormControl><Input type="number" min={1} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="ticket_price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá vé (VNĐ)</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="activity_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Thể loại tham gia</FormLabel>
                  <FormControl><Input placeholder="VD: Đánh đôi, Giao lưu, Đánh đơn" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl><Textarea placeholder="Ghi chú thêm (không bắt buộc)" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Hủy</Button>
                <Button type="submit">{editingEvent ? 'Cập nhật' : 'Tạo sự kiện'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Participants Dialog */}
      <ParticipantsDialog
        event={participantsEvent}
        bookings={bookings}
        isOpen={!!participantsEvent}
        onClose={() => setParticipantsEvent(null)}
      />
    </>
  );
}
