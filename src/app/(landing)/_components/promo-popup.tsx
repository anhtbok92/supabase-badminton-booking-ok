'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, X, Gift, Sparkles } from 'lucide-react';

interface PromoPopupProps {
  onRegister: () => void;
}

export function PromoPopup({ onRegister }: PromoPopupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('promo-dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem('promo-dismissed', 'true');
  };

  const handleRegister = () => {
    handleClose();
    onRegister();
  };

  const features = [
    'Không giới hạn số lượng sân',
    'Không giới hạn lượt đặt',
    'Dashboard thống kê chuyên sâu',
    'Quản lý đặt sân & lịch trình',
    'Đăng tin tức & khuyến mãi',
    'Hỗ trợ kỹ thuật 24/7',
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">Ưu đãi dùng thử miễn phí 3 tháng</DialogTitle>
        <div className="relative rounded-2xl overflow-hidden">
          {/* Background */}
          <div className="bg-gradient-to-br from-[#00440a] via-[#006610] to-[#00880a] p-6 md:p-8">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all z-20"
              aria-label="Đóng"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 bg-[#9cff93] text-[#00440a] px-3 py-1 rounded-full">
                <Gift className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Ưu đãi đặc biệt</span>
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-white font-headline text-2xl md:text-3xl font-black uppercase leading-tight mb-2">
              Dùng thử <span className="text-[#9cff93]">miễn phí</span><br />trọn bộ 3 tháng
            </h2>
            <p className="text-white/60 text-sm mb-6">
              Trải nghiệm toàn bộ tính năng PRO, không cần thẻ tín dụng.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 gap-2.5 mb-6">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#9cff93] shrink-0" />
                  <span className="text-white/80 text-sm">{f}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={handleRegister}
              className="w-full py-4 bg-[#9cff93] text-[#00440a] rounded-xl font-headline font-black uppercase text-sm tracking-widest hover:shadow-[0_0_30px_rgba(156,255,147,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Đăng ký ngay — Miễn phí
            </button>

            <p className="text-white/30 text-[10px] text-center mt-3 uppercase tracking-wider">
              Không ràng buộc • Hủy bất cứ lúc nào
            </p>
          </div>

          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#9cff93]/20 rounded-full blur-[60px] pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#9cff93]/10 rounded-full blur-[40px] pointer-events-none"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
