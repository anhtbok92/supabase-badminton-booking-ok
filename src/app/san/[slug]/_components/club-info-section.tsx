import { MapPin, Phone, Clock, Star } from 'lucide-react';
import type { Club } from '@/lib/types';

export function ClubInfoSection({ club }: { club: Club }) {
  return (
    <div className="px-4 mt-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-headline font-bold leading-tight">{club.name}</h2>
        {club.rating && club.rating > 0 && (
          <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-full shrink-0">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-bold">{club.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {club.club_type && (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
          {club.club_type}
        </span>
      )}

      <div className="space-y-2 text-muted-foreground">
        {club.address && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span>{club.address}</span>
          </div>
        )}
        {club.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 shrink-0 text-primary" />
            <a href={`tel:${club.phone}`} className="hover:underline">{club.phone}</a>
          </div>
        )}
        {club.operating_hours && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <span>{club.operating_hours}</span>
          </div>
        )}
      </div>
    </div>
  );
}
