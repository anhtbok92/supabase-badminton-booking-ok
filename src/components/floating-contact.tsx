'use client';

import React from 'react';
import Image from 'next/image';
import { Phone } from 'lucide-react';

export default function FloatingContact() {
    return (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-3">
            {/* Facebook Icon */}
            <a
                href="https://www.facebook.com/profile.php?id=61587156946212"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-[0_4px_15px_rgba(24,119,242,0.4)] transition-all hover:scale-110 hover:rotate-3 active:scale-95 animate-bounce-subtle"
                title="Nhắn tin Facebook"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-7 w-7 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.791-4.667 4.532-4.667 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            </a>

            {/* Zalo Icon */}
            <a
                href="https://zalo.me/0982949974"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0068ff] text-white shadow-[0_4px_15px_rgba(0,104,255,0.4)] transition-all hover:scale-110 hover:-rotate-3 active:scale-95 animate-bounce-subtle animation-delay-500 overflow-hidden"
                title="Nhắn tin Zalo"
            >
                <Image
                    src="/Icon_of_Zalo.svg.png"
                    alt="Zalo"
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                />
            </a>

            {/* Phone Icon (Call) - Separate for clarity */}
            <a
                href="tel:0982949974"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white shadow-[0_4px_15px_rgba(34,197,94,0.4)] transition-all hover:scale-110 active:scale-95"
                title="Gọi điện"
            >
                <Phone className="h-6 w-6" />
            </a>

            <style jsx global>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
        .animation-delay-500 {
          animation-delay: 1.5s;
        }
      `}</style>
        </div>
    );
}
