import { Map } from 'lucide-react';

export function ClubMapSection({ club }: { club: { name: string; address: string; latitude?: number; longitude?: number } }) {
  const mapEmbedUrl = (club.latitude && club.longitude)
    ? `https://maps.google.com/maps?q=${club.latitude},${club.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(club.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const directionsUrl = (club.latitude && club.longitude)
    ? `https://www.google.com/maps/dir/?api=1&destination=${club.latitude},${club.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(club.address)}`;

  return (
    <div className="px-4 mt-8 mb-8">
      <h3 className="text-lg font-bold mb-3 border-l-4 border-primary pl-3">Vị trí</h3>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={mapEmbedUrl}
          title={`Bản đồ ${club.name}`}
        />
        <div className="absolute bottom-3 right-3">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg text-sm font-bold hover:bg-gray-50"
          >
            <Map className="h-4 w-4" />
            Chỉ đường
          </a>
        </div>
      </div>
    </div>
  );
}
