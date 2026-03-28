import type { Club, BookedSlot, UserBooking } from './types';

// Mock data is no longer the primary source of truth but can be kept for reference or seeding.

export const clubs: Club[] = [
    // This data will now come from Firestore
];

export const bookedSlots: BookedSlot[] = [
    // This data will now come from Firestore
];

export const userBookings: UserBooking[] = [
    // This data will now come from Firestore
]

export const timeSlots = Array.from({ length: 49 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

export const qrCodeUrl = '/anh-qr-chuyen-khoan.jpg';
