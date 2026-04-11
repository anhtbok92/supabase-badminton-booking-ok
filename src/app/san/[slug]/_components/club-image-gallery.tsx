import Image from 'next/image';
import { getDefaultClubImage } from '@/lib/club-utils';

export function ClubImageGallery({ images, clubName, clubType }: { images: string[]; clubName: string; clubType?: string }) {
  const displayImages = images && images.length > 0 ? images : [getDefaultClubImage(clubType)];

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-3 px-4 py-4 snap-x snap-mandatory">
        {displayImages.map((url, i) => (
          <div key={i} className="relative w-[85vw] max-w-lg aspect-[16/10] rounded-xl overflow-hidden shrink-0 snap-center bg-muted border">
            <Image src={url} alt={`${clubName} - Ảnh ${i + 1}`} fill className="object-cover" sizes="85vw" priority={i === 0} />
          </div>
        ))}
      </div>
    </div>
  );
}
