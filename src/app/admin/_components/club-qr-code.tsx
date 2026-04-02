'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import type { Club } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Download, QrCode, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Props = {
  club: Club;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function drawLogoOnCanvas(canvas: HTMLCanvasElement, logoSrc: string): Promise<void> {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) { resolve(); return; }

    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    logo.onload = () => {
      const logoSize = canvas.width * 0.22;
      const x = (canvas.width - logoSize) / 2;
      const y = (canvas.height - logoSize) / 2;
      const padding = 6;
      const radius = 8;

      // White rounded background behind logo
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(x - padding, y - padding, logoSize + padding * 2, logoSize + padding * 2, radius);
      ctx.fill();

      // Draw logo
      ctx.drawImage(logo, x, y, logoSize, logoSize);
      resolve();
    };
    logo.onerror = () => resolve();
    logo.src = logoSrc;
  });
}

export function ClubQrCodeDialog({ club, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  const bookingUrl = `${baseUrl}/dat-san/${club.slug || club.id}`;

  useEffect(() => { setBaseUrl(window.location.origin); }, []);

  const renderQr = useCallback(async () => {
    if (!open || !canvasRef.current || !bookingUrl) return;
    await QRCode.toCanvas(canvasRef.current, bookingUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H', // High error correction to allow logo overlay
    });
    await drawLogoOnCanvas(canvasRef.current, '/favicon.png');
  }, [open, bookingUrl]);

  useEffect(() => { renderQr(); }, [renderQr]);

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    const srcCanvas = canvasRef.current;
    const exportCanvas = document.createElement('canvas');
    const padding = 40;
    const labelHeight = 60;
    exportCanvas.width = srcCanvas.width + padding * 2;
    exportCanvas.height = srcCanvas.height + padding * 2 + labelHeight;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(srcCanvas, padding, padding);

    // Club name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(club.name, exportCanvas.width / 2, srcCanvas.height + padding + 30, exportCanvas.width - padding * 2);

    // Subtitle
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText('Quét mã để đặt sân', exportCanvas.width / 2, srcCanvas.height + padding + 52);

    const link = document.createElement('a');
    link.download = `qr-${club.slug || club.id}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
    toast({ title: 'Đã tải xuống', description: 'Mã QR đã được lưu.' });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast({ title: 'Đã sao chép', description: 'Link đặt sân đã được sao chép.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" /> Mã QR - {club.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="border rounded-lg p-4 bg-white">
            <canvas ref={canvasRef} />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Quét mã QR để truy cập trang đặt sân của <span className="font-semibold">{club.name}</span>
          </p>
          <div className="flex items-center gap-2 w-full">
            <Input value={bookingUrl} readOnly className="text-xs font-mono" />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button onClick={handleDownload}><Download className="h-4 w-4 mr-1" /> Tải mã QR</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
