'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navigation, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type UserLocation = {
  latitude: number;
  longitude: number;
};

/**
 * Auto-popup xin quyền location khi user vào trang booking.
 * Nếu user cho phép → trả về coords qua onLocationGranted.
 * Nếu từ chối hoặc dismiss → ẩn đi, không hỏi lại trong session.
 */
export function NearbyPrompt({
  onLocationGranted,
}: {
  onLocationGranted: (loc: UserLocation) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    // Không hiện lại nếu user đã dismiss trong session này
    const dismissed = sessionStorage.getItem('location-prompt-dismissed');
    if (dismissed) return;

    // Nếu đã có permission rồi thì lấy luôn, không cần hiện popup
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          // Đã có quyền, lấy location ngay
          navigator.geolocation.getCurrentPosition(
            (pos) => onLocationGranted({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => {} // ignore error
          );
        } else if (result.state === 'prompt') {
          // Chưa hỏi → hiện popup
          setVisible(true);
        }
        // 'denied' → không hiện gì
      }).catch(() => {
        // Fallback: hiện popup
        setVisible(true);
      });
    } else {
      setVisible(true);
    }
  }, [onLocationGranted]);

  const handleAllow = useCallback(() => {
    if (!navigator.geolocation) {
      setVisible(false);
      return;
    }
    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationGranted({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setVisible(false);
        setRequesting(false);
      },
      () => {
        // User denied hoặc lỗi
        sessionStorage.setItem('location-prompt-dismissed', '1');
        setVisible(false);
        setRequesting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationGranted]);

  const handleDismiss = () => {
    sessionStorage.setItem('location-prompt-dismissed', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mx-4 mt-3 mb-1 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <MapPin className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground mb-1">Tìm sân gần bạn?</p>
        <p className="text-xs text-muted-foreground mb-3">
          Cho phép truy cập vị trí để hiển thị các sân thể thao gần bạn nhất.
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="rounded-lg h-8 text-xs font-bold gap-1.5"
            onClick={handleAllow}
            disabled={requesting}
          >
            <Navigation className="w-3.5 h-3.5" />
            {requesting ? 'Đang lấy vị trí...' : 'Cho phép'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-lg h-8 text-xs text-muted-foreground"
            onClick={handleDismiss}
          >
            Để sau
          </Button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Đóng"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
