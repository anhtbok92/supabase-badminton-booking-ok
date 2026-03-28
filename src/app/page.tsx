'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Feather } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function SplashPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 1;
      });
    }, 20); // update every 20ms

    // Redirect after a delay
    const redirectTimer = setTimeout(() => {
      router.replace('/booking');
    }, 2500); // 2.5 seconds

    return () => {
      clearInterval(progressTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className={cn("dark", "font-display", "relative flex h-screen w-full flex-col items-center justify-between overflow-hidden bg-background p-8")}>
      {/* Abstract Dynamic Action Lines (Background Decor) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="light-trail-green absolute -top-20 -left-40 h-24 w-[600px]"></div>
        <div className="light-trail-blue absolute top-1/2 -right-40 h-32 w-[500px]"></div>
        <div className="light-trail-yellow absolute bottom-20 -left-20 h-20 w-[450px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background"></div>
      </div>

      {/* Top spacing for iOS Safe Area */}
      <div className="h-12 w-full"></div>

      {/* Central Branding & Loading Area */}
      <div className="relative flex flex-1 flex-col items-center justify-center">
        {/* Pulsing Ring Background */}
        <div className="absolute size-64 rounded-full border-2 border-primary/30 opacity-50"></div>
        <div className="absolute size-80 rounded-full border border-primary/10 opacity-30"></div>
        
        {/* Shield Logo Component */}
        <div className="relative z-10 flex size-48 items-center justify-center rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-2xl shadow-primary/20">
          {/* Inner Texture (Net Pattern) */}
          <div className="shield-texture absolute inset-4 rounded-lg border border-zinc-600/30"></div>
          
          {/* Main Iconography */}
          <div className="relative flex flex-col items-center">
            <Feather className="h-16 w-16 text-primary drop-shadow-[0_0_15px_hsl(var(--primary)_/_0.5)]" />
            <div className="mt-2 flex gap-2">
                {/* SVG for soccer ball */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white/40">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 12a10 10 0 0 0-8.66-5"></path>
                    <path d="M12 12a10 10 0 0 1-8.66 5"></path>
                    <path d="M12 12a10 10 0 0 0 8.66 5"></path>
                    <path d="M12 12a10 10 0 0 1 8.66-5"></path>
                </svg>
                {/* SVG for volleyball */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white/40">
                    <path d="M12.22 18.04a2.2 2.2 0 0 1-2.44 0l-4.48-2.54a2.2 2.2 0 0 1-1.1-1.9V8.44a2.2 2.2 0 0 1 1.1-1.9l4.48-2.54a2.2 2.2 0 0 1 2.44 0l4.48 2.54a2.2 2.2 0 0 1 1.1 1.9v5.12a2.2 2.2 0 0 1-1.1 1.9l-4.48 2.54Z"></path>
                    <path d="m4.1 8.44 8.1 4.56 8.1-4.56"></path><path d="M12.22 4l.01 14.04"></path>
                </svg>
            </div>
          </div>
        </div>

        {/* Loading Info */}
        <div className="mt-16 flex w-64 flex-col items-center gap-4">
          <div className="flex w-full flex-col gap-2">
            <Progress value={progress} className="h-1.5 w-full bg-primary/20" />
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
              Đang khởi tạo hệ thống
            </p>
          </div>
        </div>
      </div>

      {/* Headline and Meta Text Section */}
      <div className="relative z-10 flex w-full max-w-sm flex-col gap-2 pb-12">
        <h2 className="text-center text-3xl font-bold leading-tight tracking-tight text-white">
          Đặt sân <span className="text-primary">mọi môn</span> thể thao
        </h2>
        <p className="text-center text-sm font-normal leading-relaxed text-zinc-400 opacity-80">
          Hệ thống đặt sân • Phiên bản 1.0.0
        </p>
      </div>

      {/* Subtle Bottom Branding */}
      <div className="absolute bottom-6 flex items-center gap-2 opacity-40">
        <div className="h-px w-8 bg-zinc-600"></div>
        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
          Phần mềm đặt sân chuyên nghiệp
        </span>
        <div className="h-px w-8 bg-zinc-600"></div>
      </div>
    </div>
  );
}
