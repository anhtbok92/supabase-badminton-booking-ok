'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, X, Gift, Sparkles, Loader2 } from 'lucide-react';
import { useSupabase } from '@/supabase';
import type { PromoPopupConfig } from '@/lib/types';

interface PromoPopupProps {
  onRegister: () => void;
}

export function PromoPopup({ onRegister }: PromoPopupProps) {
  const supabase = useSupabase();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<PromoPopupConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'promo_popup')
        .single();
      
      if (!error && data) {
        const val = data.value as PromoPopupConfig;
        setConfig(val);
        
        // Only proceed if active
        if (val.is_active) {
          const dismissed = sessionStorage.getItem('promo-dismissed');
          if (!dismissed) {
            const timer = setTimeout(() => setOpen(true), val.delay_ms || 1500);
            return () => clearTimeout(timer);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching promo config:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem('promo-dismissed', 'true');
  };

  const handleRegister = () => {
    handleClose();
    onRegister();
  };

  if (loading || !config || !config.is_active) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">{config.title}</DialogTitle>
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
            {config.badge && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 bg-[#9cff93] text-[#00440a] px-3 py-1 rounded-full">
                  <Gift className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{config.badge}</span>
                </div>
              </div>
            )}

            {/* Heading */}
            <h2 className="text-white font-headline text-2xl md:text-3xl font-black uppercase leading-tight mb-2 whitespace-pre-line">
              {config.title.includes(' ') ? (
                <>
                  {config.title.split(' ').slice(0, 2).join(' ')} <span className="text-[#9cff93]">{config.title.split(' ').slice(2).join(' ')}</span>
                </>
              ) : (
                config.title
              )}
            </h2>
            
            {config.description && (
              <p className="text-white/60 text-sm mb-6">
                {config.description}
              </p>
            )}

            {/* Features */}
            {config.features && config.features.length > 0 && (
              <div className="grid grid-cols-1 gap-2.5 mb-6">
                {config.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#9cff93] shrink-0" />
                    <span className="text-white/80 text-sm">{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleRegister}
              className="w-full py-4 bg-[#9cff93] text-[#00440a] rounded-xl font-headline font-black uppercase text-sm tracking-widest hover:shadow-[0_0_30px_rgba(156,255,147,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {config.cta_text || 'Đăng ký ngay'}
            </button>

            {config.sub_text && (
              <p className="text-white/30 text-[10px] text-center mt-3 uppercase tracking-wider">
                {config.sub_text}
              </p>
            )}
          </div>

          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#9cff93]/20 rounded-full blur-[60px] pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#9cff93]/10 rounded-full blur-[40px] pointer-events-none"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
