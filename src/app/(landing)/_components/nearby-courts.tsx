'use client';

import { useState, useCallback } from 'react';
import { MapPin, Navigation, X, Loader2 } from 'lucide-react';
import { useSupabase } from '@/supabase';
import type { Club } from '@/lib/types';
import { SeoClubCard } from '@/components/seo-club-card';

type GeoState = 'idle' | 'requesting' | 'loading' | 'done' | 'denied' | 'error';

export function NearbyCourts() {
  const supabase = useSupabase();
  const [state, setState] = useState<GeoState>('idle');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState('error');
      setErrorMsg('Trình duyệt không hỗ trợ định vị.');
      return;
    }

    setState('requesting');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setState('loading');
        const { latitude, longitude } = position.coords;

        const { data, error } = await supabase.rpc('nearby_clubs', {
          lat: latitude,
          lng: longitude,
          radius_km: 10,
          sport_type: null,
        });

        if (error) {
          setState('error');
          setErrorMsg('Không thể tải danh sách sân. Vui lòng thử lại.');
          return;
        }

        setClubs((data || []) as Club[]);
        setState('done');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState('denied');
        } else {
          setState('error');
          setErrorMsg('Không thể lấy vị trí. Vui lòng kiểm tra cài đặt GPS.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [supabase]);

  const reset = () => {
    setState('idle');
    setClubs([]);
    setErrorMsg('');
  };

  return (
    <section className="py-20 md:py-32 bg-[var(--lp-bg)] border-t border-[var(--lp-border-light)]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-12 md:mb-16 text-center">
          <span className="font-headline text-[var(--lp-accent)] text-sm font-bold tracking-[0.3em] uppercase block mb-4">
            Gần bạn
          </span>
          <h2 className="font-headline text-3xl md:text-5xl font-black italic uppercase tracking-tight mb-4">
            Tìm sân gần tôi
          </h2>
          <p className="text-[var(--lp-text-muted)] max-w-xl mx-auto">
            Cho phép truy cập vị trí để tìm các sân thể thao gần bạn nhất trong bán kính 10km.
          </p>
        </div>

        {/* Idle / CTA */}
        {state === 'idle' && (
          <div className="flex justify-center">
            <button
              onClick={requestLocation}
              className="group flex items-center gap-3 px-10 py-5 bg-[var(--lp-accent-bg)] text-[#00440a] rounded-md font-headline font-black uppercase tracking-widest text-sm hover:scale-105 hover:shadow-[0_0_30px_var(--lp-glow)] transition-all"
            >
              <Navigation className="w-5 h-5 group-hover:animate-pulse" />
              Tìm sân gần tôi
            </button>
          </div>
        )}

        {/* Requesting permission */}
        {state === 'requesting' && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 px-8 py-5 rounded-xl border border-[var(--lp-border-light)] bg-[var(--lp-bg-card)]">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--lp-accent)]" />
              <span className="font-headline font-bold text-sm uppercase tracking-widest">Đang xin quyền vị trí...</span>
            </div>
          </div>
        )}

        {/* Loading clubs */}
        {state === 'loading' && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 px-8 py-5 rounded-xl border border-[var(--lp-border-light)] bg-[var(--lp-bg-card)]">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--lp-accent)]" />
              <span className="font-headline font-bold text-sm uppercase tracking-widest">Đang tìm sân gần bạn...</span>
            </div>
          </div>
        )}

        {/* Permission denied */}
        {state === 'denied' && (
          <div className="text-center py-12">
            <div className="inline-block max-w-md mx-auto p-8 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
              <X className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <p className="font-bold text-red-600 dark:text-red-400 mb-2">Quyền vị trí bị từ chối</p>
              <p className="text-sm text-red-500 dark:text-red-400/80 mb-4">
                Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt để sử dụng tính năng này.
              </p>
              <button
                onClick={reset}
                className="text-sm font-bold text-[var(--lp-accent)] hover:underline"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="text-center py-12">
            <div className="inline-block max-w-md mx-auto p-8 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
              <MapPin className="w-10 h-10 text-orange-400 mx-auto mb-4" />
              <p className="font-bold text-orange-600 dark:text-orange-400 mb-2">Có lỗi xảy ra</p>
              <p className="text-sm text-orange-500 dark:text-orange-400/80 mb-4">{errorMsg}</p>
              <button
                onClick={() => { reset(); requestLocation(); }}
                className="text-sm font-bold text-[var(--lp-accent)] hover:underline"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {state === 'done' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[var(--lp-text-muted)] text-sm font-medium">
                Tìm thấy <span className="text-[var(--lp-accent)] font-black">{clubs.length}</span> sân gần bạn
              </p>
              <button
                onClick={() => { reset(); requestLocation(); }}
                className="text-xs font-bold text-[var(--lp-accent)] hover:underline uppercase tracking-widest"
              >
                Tìm lại
              </button>
            </div>

            {clubs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map((club) => (
                  <SeoClubCard key={club.id} club={club} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <MapPin className="w-12 h-12 text-[var(--lp-text-muted)] mx-auto mb-4 opacity-40" />
                <p className="text-[var(--lp-text-muted)] font-medium">
                  Chưa có sân nào trong bán kính 10km quanh bạn.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
