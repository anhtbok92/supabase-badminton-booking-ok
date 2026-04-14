/** Get default banner image based on club type */
export function getDefaultClubImage(clubType?: string): string {
  if (!clubType) return '/images/default-club-2.png';

  const normalized = clubType.toLowerCase();

  if (normalized.includes('pickleball') || normalized.includes('pickle')) {
    return '/images/anh-pickleball-default.avif';
  }
  if (normalized.includes('bóng đá') || normalized.includes('bong da') || normalized.includes('football') || normalized.includes('soccer')) {
    return '/images/anh-bong-da-banner-default.jpg';
  }
  if (normalized.includes('cầu lông') || normalized.includes('cau long') || normalized.includes('badminton')) {
    return '/images/anh-banner-cau-long-default.jpg';
  }

  return '/images/default-club-2.png';
}

import type { Club } from '@/lib/types';

/** Get min price from club pricing */
export function getMinPrice(pricing: Club['pricing']): number | null {
  if (!pricing) return null;
  const allPrices = [
    ...(pricing.weekday || []).map(p => p.price),
    ...(pricing.weekend || []).map(p => p.price),
  ].filter(p => p > 0);
  return allPrices.length > 0 ? Math.min(...allPrices) : null;
}

/** Format price to Vietnamese format */
export function formatVNPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price);
}
