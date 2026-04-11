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
