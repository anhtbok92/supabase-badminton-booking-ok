import type { Event, UserBooking } from '@/lib/types';

/**
 * Filter events by club ID and date (YYYY-MM-DD).
 */
export function filterEventsByClubAndDate(
  events: Event[],
  clubId: string,
  date: string,
): Event[] {
  return events.filter(
    (e) => e.club_id === clubId && e.event_date === date,
  );
}

/**
 * Check if an event has reached its max participants.
 */
export function isEventFull(
  event: Event,
  participantCount: number,
): boolean {
  return participantCount >= event.max_participants;
}

/**
 * Check if an event can still be edited (event_date >= today).
 */
export function isEventEditable(event: Event): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(event.event_date + 'T00:00:00');
  return eventDate >= today;
}

/**
 * Count active (non-cancelled, non-deleted, non-system) participants for an event.
 */
export function getParticipantCount(
  bookings: UserBooking[],
  eventId: string,
): number {
  return bookings.filter(
    (b) =>
      b.event_id === eventId &&
      b.status !== 'Đã hủy' &&
      !b.is_deleted &&
      b.phone !== 'Hệ thống',
  ).length;
}

/**
 * Return only events whose event_date is today or in the future.
 */
export function filterUpcomingEvents(events: Event[]): Event[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return events.filter((e) => {
    const d = new Date(e.event_date + 'T00:00:00');
    return d >= today;
  });
}

/**
 * Filter bookings by type: 'event' returns bookings with event_id set,
 * 'visual' returns bookings without event_id.
 */
export function filterBookingsByType(
  bookings: UserBooking[],
  type: 'event' | 'visual',
): UserBooking[] {
  if (type === 'event') {
    return bookings.filter((b) => !!b.event_id);
  }
  return bookings.filter((b) => !b.event_id);
}

/**
 * Generate 30-minute time slot strings between start and end (exclusive).
 * E.g. generateTimeSlots('08:00', '10:00') => ['08:00', '08:30', '09:00', '09:30']
 */
function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;
  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    current += 30;
  }
  return slots;
}

/**
 * Build a booking record from an event registration.
 */
export function buildEventBookingRecord(
  event: Event,
  formData: { name: string; phone: string },
  userId?: string,
  courtName?: string,
): Omit<UserBooking, 'id' | 'created_at'> {
  const timeSlots = generateTimeSlots(event.start_time, event.end_time);
  const slots = event.court_id
    ? timeSlots.map((time) => ({ court_id: event.court_id!, time, court_name: courtName }))
    : [];

  return {
    user_id: userId,
    club_id: event.club_id,
    club_name: '', // will be filled by caller with actual club name
    date: event.event_date,
    slots,
    total_price: event.ticket_price,
    status: 'Sự kiện',
    name: formData.name,
    phone: formData.phone,
    event_id: event.id,
  };
}

/**
 * Validate event creation form data.
 * Returns an object with field-level error messages, or null if valid.
 */
export type EventFormData = {
  event_name?: string;
  event_date?: string;
  court_id?: string;
  start_time?: string;
  end_time?: string;
  max_participants?: number;
  ticket_price?: number;
  activity_type?: string;
};

export type EventFormErrors = Partial<Record<keyof EventFormData, string>>;

export function validateEventForm(
  data: EventFormData,
): EventFormErrors | null {
  const errors: EventFormErrors = {};

  if (!data.event_name || data.event_name.trim() === '') {
    errors.event_name = 'Tên sự kiện là bắt buộc';
  }
  if (!data.event_date || data.event_date.trim() === '') {
    errors.event_date = 'Ngày tổ chức là bắt buộc';
  }
  if (!data.court_id || data.court_id.trim() === '') {
    errors.court_id = 'Sân là bắt buộc';
  }
  if (!data.start_time || data.start_time.trim() === '') {
    errors.start_time = 'Giờ bắt đầu là bắt buộc';
  }
  if (!data.end_time || data.end_time.trim() === '') {
    errors.end_time = 'Giờ kết thúc là bắt buộc';
  }
  if (data.start_time && data.end_time) {
    const [sh, sm] = data.start_time.split(':').map(Number);
    const [eh, em] = data.end_time.split(':').map(Number);
    if ((eh * 60 + em) <= (sh * 60 + sm)) {
      errors.end_time = 'Giờ kết thúc phải sau giờ bắt đầu';
    }
  }
  if (
    data.max_participants === undefined ||
    data.max_participants === null ||
    data.max_participants < 1
  ) {
    errors.max_participants = 'Số người tham gia phải lớn hơn 0';
  }
  if (
    data.ticket_price === undefined ||
    data.ticket_price === null ||
    data.ticket_price < 0
  ) {
    errors.ticket_price = 'Giá vé không được âm';
  }
  if (!data.activity_type || data.activity_type.trim() === '') {
    errors.activity_type = 'Thể loại tham gia là bắt buộc';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
