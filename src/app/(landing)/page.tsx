'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Sport Booking
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8">
              Hệ thống đặt lịch sân thể thao thông minh
            </p>
            <p className="text-lg text-gray-600 mb-12">
              Quản lý đặt sân dễ dàng, nhanh chóng và hiệu quả
            </p>
          </div>

          {/* CTA Button */}
          <div className="mb-16">
            <a
              href="https://app.sportbooking.online"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg px-8 py-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Bắt đầu đặt lịch ngay →
            </a>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Nhanh chóng</h3>
              <p className="text-gray-600">Đặt sân chỉ trong vài giây</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Tiện lợi</h3>
              <p className="text-gray-600">Truy cập mọi lúc, mọi nơi</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Chính xác</h3>
              <p className="text-gray-600">Quản lý lịch đặt hiệu quả</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 text-gray-600">
            <p>© 2024 Sport Booking. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
