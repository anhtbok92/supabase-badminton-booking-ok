'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';

// Fix leaflet default marker icon
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([lat, lng], 16, { duration: 1 });
        }
    }, [lat, lng, map]);
    return null;
}

interface LocationPickerProps {
    latitude: number;
    longitude: number;
    onLocationChange: (lat: number, lng: number) => void;
}

export function LocationPicker({ latitude, longitude, onLocationChange }: LocationPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([]);

    const hasValidCoords = latitude !== 0 && longitude !== 0;
    const mapCenter: [number, number] = hasValidCoords ? [latitude, longitude] : [10.8231, 106.6297]; // Default: HCM

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        setSuggestions([]);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=vn`
            );
            const data = await res.json();
            if (data.length > 0) {
                setSuggestions(data);
            }
        } catch { /* ignore */ }
        finally { setSearching(false); }
    }, [searchQuery]);

    const handleSelectSuggestion = (item: { lat: string; lon: string }) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        onLocationChange(lat, lng);
        setSuggestions([]);
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        placeholder="Tìm địa chỉ trên bản đồ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    />
                    {suggestions.length > 0 && (
                        <div className="absolute z-[1000] top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {suggestions.map((item, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-b-0"
                                    onClick={() => handleSelectSuggestion(item)}
                                >
                                    <MapPin className="inline h-3 w-3 mr-1.5 text-muted-foreground" />
                                    {item.display_name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <Button type="button" variant="outline" size="icon" onClick={handleSearch} disabled={searching}>
                    <Search className="h-4 w-4" />
                </Button>
            </div>
            <div className="rounded-lg overflow-hidden border h-[300px]">
                <MapContainer
                    center={mapCenter}
                    zoom={hasValidCoords ? 16 : 12}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onLocationSelect={onLocationChange} />
                    {hasValidCoords && <Marker position={[latitude, longitude]} icon={defaultIcon} />}
                    {hasValidCoords && <FlyToLocation lat={latitude} lng={longitude} />}
                </MapContainer>
            </div>
            <p className="text-xs text-muted-foreground">Click trên bản đồ hoặc tìm kiếm để chọn vị trí.</p>
        </div>
    );
}
