'use client';

import { useState } from 'react';
import { RegisterDialog } from './_components/register-dialog';

type PlanType = 'FREE' | 'BASIC' | 'PRO';

export default function LandingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('FREE');

  const handlePlanSelect = (plan: PlanType) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  return (
    <>
      {/* TopNavBar */}
      <nav className="sticky top-0 z-50 bg-[#f4faff] shadow-sm">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎾</span>
            <span className="text-2xl font-black text-[#006e1c] tracking-tighter font-headline">Sport Booking</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-[#006e1c] font-bold border-b-4 border-[#4caf50] font-label text-sm uppercase tracking-widest py-1" href="#about">Giới thiệu</a>
            <a className="text-[#001f2a] font-medium hover:text-[#4caf50] transition-colors duration-300 font-label text-sm uppercase tracking-widest py-1" href="#features">Tính năng</a>
            <a className="text-[#001f2a] font-medium hover:text-[#4caf50] transition-colors duration-300 font-label text-sm uppercase tracking-widest py-1" href="#pricing">Bảng giá</a>
            <a className="text-[#001f2a] font-medium hover:text-[#4caf50] transition-colors duration-300 font-label text-sm uppercase tracking-widest py-1" href="#contact">Liên hệ</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://app.sportbooking.online/login" className="px-6 py-2 rounded-full font-bold text-sm text-on-surface hover:text-primary transition-all active:scale-95">Đăng nhập</a>
            <a href="https://app.sportbooking.online" className="px-6 py-2 bg-gradient-to-br from-primary to-primary-container text-white rounded-full font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all">Đăng ký</a>
          </div>
        </div>
      </nav>

      {/* Hero Section - bg-background (#f4faff) */}
      <header className="relative overflow-hidden pt-16 pb-32 bg-[#f4faff]">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 z-10">
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-[#001f2a] tracking-tight leading-[1.1] mb-6">
              Sport Booking - <span className="text-[#006e1c]">Hệ thống đặt sân</span> thông minh
            </h1>
            <p className="text-xl text-[#3f4a3c] font-body mb-10 max-w-xl leading-relaxed">
              Giải pháp quản lý và đặt sân toàn diện cho câu lạc bộ thể thao. Nhanh chóng, chính xác và chuyên nghiệp hơn bao giờ hết.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="https://app.sportbooking.online" className="px-8 py-4 bg-[#ff9800] text-[#653900] rounded-lg font-bold text-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
                Bắt đầu đặt lịch ngay
                <span>→</span>
              </a>
              <button className="px-8 py-4 border-2 border-[#becab9] text-[#001f2a] rounded-lg font-bold text-lg hover:bg-[#d9f2ff] transition-colors flex items-center justify-center gap-2">
                Xem bản demo
              </button>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,31,42,0.08)]">
              <img alt="Sport venue" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_RQ0ugdjLw_SmfNgMeF8KwvoBLeAiVIwRnJaMMfgsvYsjfW7HAQYL7Ifk6A5mh_E5Uj4K7oFQyX-m6P6lp89j1FjOca47qu3mqszIEsn11UeJR5_QQ19j4bGNPoBSRkSFfd9P5YtRMVb-IfB8kkoBSIxxrKB9AjJNYo3xe7XP8D96BNJrZo1TY3GfeAQ664Q7gSTDZdBDsjfVWDTVD5j8_A-eH7bAIJ1zBT2C1Keq89HJnTNiRpHB1clzpBynAVooZP1xpBTYkc7u"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,31,42,0.4)] to-transparent"></div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-[rgba(201,231,247,0.7)] backdrop-blur-[20px] p-6 rounded-lg shadow-[0_24px_48px_-12px_rgba(0,31,42,0.08)] max-w-[240px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#4caf50] flex items-center justify-center">
                  <span className="text-white">✓</span>
                </div>
                <span className="font-bold text-[#001f2a] text-sm">Xác nhận tức thì</span>
              </div>
              <p className="text-xs text-[#3f4a3c] leading-tight">Hệ thống xử lý hơn 1000+ lượt đặt sân mỗi ngày tại Hà Nội, TP.HCM</p>
            </div>
          </div>
        </div>
        <span className="absolute -top-20 -right-20 text-[20rem] text-[#006e1c] opacity-5 select-none pointer-events-none">⚽</span>
      </header>

      {/* User Features Section - bg-surface-container-low (#e6f6ff) */}
      <section id="features" className="py-24 bg-[#e6f6ff]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16 text-center lg:text-left">
            <span className="font-label text-xs uppercase tracking-[0.3em] text-[#006e1c] font-bold mb-4 block">Dành cho người chơi</span>
            <h2 className="font-headline text-4xl font-extrabold text-[#001f2a]">Trải nghiệm đặt sân đỉnh cao</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🎾', title: 'Đa dạng môn thể thao', desc: 'Đặt sân cầu lông, bóng đá, bóng chuyền, tennis chỉ với vài cú chạm trên ứng dụng.' },
              { icon: '⏰', title: 'Lịch trống thực tế', desc: 'Xem lịch sân trống theo thời gian thực. Không còn tình trạng trùng lịch hay chờ đợi.' },
              { icon: '📊', title: 'Quản lý lịch cá nhân', desc: 'Dễ dàng theo dõi, thay đổi hoặc hủy lịch đặt ngay trong tài khoản của bạn.' },
              { icon: '🔔', title: 'Thông báo nhắc nhở', desc: 'Nhận thông báo xác nhận và nhắc lịch trước giờ ra sân để bạn không bao giờ lỡ hẹn.' },
              { icon: '📰', title: 'Tin tức thể thao', desc: 'Cập nhật những tin tức, giải đấu và mẹo tập luyện mới nhất mỗi ngày.' },
              { icon: '☁️', title: 'Xác thực thanh toán', desc: 'Tải lên bằng chứng chuyển khoản nhanh chóng để chủ sân xác nhận lịch đặt.' },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-lg shadow-[0_24px_48px_-12px_rgba(0,31,42,0.08)] hover:-translate-y-2 transition-transform duration-300">
                <div className="w-14 h-14 bg-[#d9f2ff] flex items-center justify-center rounded-lg mb-6 text-3xl">
                  {feature.icon}
                </div>
                <h3 className="font-headline text-xl font-bold mb-3 text-[#001f2a]">{feature.title}</h3>
                <p className="text-[#3f4a3c] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Owner Management Features - bg-white */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16 text-center">
            <span className="font-label text-xs uppercase tracking-[0.3em] text-[#8b5000] font-bold mb-4 block">Dành cho chủ sân</span>
            <h2 className="font-headline text-4xl font-extrabold text-[#001f2a]">Hệ quản trị toàn diện chuyên nghiệp</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-3 gap-6 h-auto md:h-[800px]">
            <div className="md:col-span-2 md:row-span-2 bg-[#006e1c] rounded-lg p-10 text-white flex flex-col justify-between relative overflow-hidden group">
              <div className="z-10">
                <h3 className="font-headline text-3xl font-bold mb-4">Dashboard Thống Kê</h3>
                <p className="text-white/80 max-w-xs mb-8">Theo dõi doanh thu, tỷ lệ lấp đầy sân và xu hướng đặt lịch theo tuần/tháng một cách trực quan.</p>
              </div>
              <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md z-10">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-black">94%</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1">Hiệu suất sử dụng sân</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#ff9800] h-full w-[94%]"></div>
                </div>
              </div>
              <span className="absolute -bottom-10 -right-10 text-[15rem] text-white/10 group-hover:scale-110 transition-transform duration-700">📊</span>
            </div>
            <div className="md:col-span-2 bg-[#d9f2ff] rounded-lg p-8 flex items-center gap-6 group">
              <div className="w-16 h-16 shrink-0 bg-white rounded-lg flex items-center justify-center shadow-md text-3xl">💰</div>
              <div>
                <h4 className="font-headline text-xl font-bold text-[#001f2a]">Giá linh hoạt</h4>
                <p className="text-[#3f4a3c] text-sm">Cài đặt giá theo giờ cao điểm, ngày lễ hoặc thành viên thân thiết.</p>
              </div>
            </div>
            <div className="md:col-span-1 bg-[#e6f6ff] rounded-lg p-8 text-center flex flex-col items-center justify-center hover:bg-[#d9f2ff] transition-colors">
              <span className="text-4xl mb-4">📍</span>
              <h4 className="font-headline font-bold text-[#001f2a]">Quản lý cơ sở</h4>
            </div>
            <div className="md:col-span-1 bg-[#e6f6ff] rounded-lg p-8 text-center flex flex-col items-center justify-center hover:bg-[#d9f2ff] transition-colors">
              <span className="text-4xl mb-4">📄</span>
              <h4 className="font-headline font-bold text-[#001f2a]">Báo cáo chi tiết</h4>
            </div>
            <div className="md:col-span-2 bg-[#163440] text-white rounded-lg p-8 flex justify-between items-center group">
              <div className="max-w-[60%]">
                <h4 className="font-headline text-xl font-bold mb-2">Quản lý từng sân riêng biệt</h4>
                <p className="text-white/60 text-sm">Kiểm soát trạng thái bảo trì, lịch thi đấu cho từng khu vực sân.</p>
              </div>
              <span className="text-6xl text-[#006e1c] opacity-40 group-hover:rotate-12 transition-transform">📦</span>
            </div>
            <div className="md:col-span-1 bg-[#d9f2ff] rounded-lg p-8 flex flex-col justify-end relative">
              <span className="text-4xl absolute top-8 left-8">🔔</span>
              <h4 className="font-headline font-bold text-[#001f2a]">Trung tâm thông báo</h4>
            </div>
            <div className="md:col-span-1 bg-[#4caf50] rounded-lg p-8 text-white flex flex-col justify-end relative">
              <span className="text-4xl absolute top-8 left-8">✅</span>
              <h4 className="font-headline font-bold">Xác nhận lịch</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans - bg-background (#f4faff) */}
      <section id="pricing" className="py-24 bg-[#f4faff]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="font-headline text-4xl font-extrabold text-[#001f2a] mb-4">Gói dịch vụ linh hoạt</h2>
            <p className="text-[#3f4a3c] max-w-2xl mx-auto">Chọn gói phù hợp với quy mô câu lạc bộ của bạn. Nâng cấp bất cứ lúc nào.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            <div className="bg-white p-10 rounded-lg flex flex-col border border-[#becab9]/15 hover:border-[#4caf50]/40 transition-colors">
              <span className="font-label text-xs font-bold text-[#3f4a3c] uppercase tracking-widest mb-2">Cơ bản</span>
              <h3 className="font-headline text-3xl font-bold mb-6">FREE</h3>
              <div className="space-y-4 mb-10 flex-grow">
                <div className="flex items-center gap-3"><span className="text-[#006e1c] text-xl">✓</span><span className="text-[#001f2a]">Tối đa 3 sân</span></div>
                <div className="flex items-center gap-3"><span className="text-[#006e1c] text-xl">✓</span><span className="text-[#001f2a]">100 lượt đặt/tháng</span></div>
                <div className="flex items-center gap-3"><span className="text-[#006e1c] text-xl">✓</span><span className="text-[#001f2a]">Báo cáo cơ bản</span></div>
              </div>
              <button onClick={() => handlePlanSelect('FREE')} className="w-full py-4 border-2 border-[#006e1c] text-[#006e1c] rounded-lg font-bold hover:bg-[#4caf50] hover:text-white transition-all text-center">Đăng ký ngay</button>
            </div>
            <div className="bg-white p-10 rounded-lg flex flex-col border-4 border-[#006e1c] shadow-[0_24px_48px_-12px_rgba(0,31,42,0.08)] relative scale-105 z-10">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#006e1c] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">RECOMMENDED</div>
              <span className="font-label text-xs font-bold text-[#006e1c] uppercase tracking-widest mb-2">Chuyên nghiệp</span>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-headline text-3xl font-bold">500.000</span>
                <span className="text-[#3f4a3c] font-medium">VNĐ/tháng</span>
              </div>
              <div className="space-y-4 mb-10 flex-grow">
                <div className="flex items-center gap-3"><span className="text-[#006e1c] text-xl">✓</span><span className="text-[#001f2a] font-bold">Tối đa 30 sân</span></div>
                <div className="flex items-center gap-3"><span className="text-[#006e1c] text-xl">✓</span><span className="text-[#001f2a] font-bold">3.000 lượt đặt/tháng</span></div>
                <div className="flex items-center gap-3"><span className="text-[#006e1c] text-xl">✓</span><span className="text-[#001f2a]">Báo cáo chuyên sâu (AI)</span></div>
                <div className="flex items-center gap-3"><span className="text-[#006e1c] text-xl">✓</span><span className="text-[#001f2a]">Hỗ trợ ưu tiên 24/7</span></div>
              </div>
              <button onClick={() => handlePlanSelect('PRO')} className="w-full py-4 bg-[#006e1c] text-white rounded-lg font-bold shadow-lg shadow-[#006e1c]/20 hover:scale-[1.02] transition-transform text-center">Đăng ký PRO</button>
            </div>
            <div className="bg-white p-10 rounded-lg flex flex-col border border-[#becab9]/15">
              <span className="font-label text-xs font-bold text-[#3f4a3c] uppercase tracking-widest mb-2">Mở rộng</span>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-headline text-3xl font-bold">200.000</span>
                <span className="text-[#3f4a3c] font-medium">VNĐ/tháng</span>
              </div>
              <div className="space-y-4 mb-10 flex-grow">
                <div className="flex items-center gap-3"><span className="text-[#006e1c] text-xl">✓</span><span className="text-[#001f2a]">Tối đa 10 sân</span></div>
                <div className="flex items-center gap-3"><span className="text-[#006e1c] text-xl">✓</span><span className="text-[#001f2a]">1.000 lượt đặt/tháng</span></div>
                <div className="flex items-center gap-3"><span className="text-[#006e1c] text-xl">✓</span><span className="text-[#001f2a]">Quản lý nhân viên</span></div>
              </div>
              <button onClick={() => handlePlanSelect('BASIC')} className="w-full py-4 border-2 border-[#006e1c] text-[#006e1c] rounded-lg font-bold hover:bg-[#4caf50] hover:text-white transition-all text-center">Đăng ký ngay</button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - bg-surface-container-low (#e6f6ff) */}
      <section id="about" className="py-24 bg-[#e6f6ff] overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg shadow-[0_24px_48px_-12px_rgba(0,31,42,0.08)] translate-y-8">
                    <span className="text-3xl mb-4 block">⚡</span>
                    <h4 className="font-bold mb-2">Nhanh chóng</h4>
                    <p className="text-xs text-[#3f4a3c]">Đặt sân chỉ trong 30 giây với quy trình tối ưu.</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-[0_24px_48px_-12px_rgba(0,31,42,0.08)] translate-y-8">
                    <span className="text-3xl mb-4 block">✓</span>
                    <h4 className="font-bold mb-2">Chính xác</h4>
                    <p className="text-xs text-[#3f4a3c]">Hệ thống đồng bộ hóa 100% không lo sai sót.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg shadow-[0_24px_48px_-12px_rgba(0,31,42,0.08)]">
                    <span className="text-3xl mb-4 block">🏆</span>
                    <h4 className="font-bold mb-2">Chuyên nghiệp</h4>
                    <p className="text-xs text-[#3f4a3c]">Giao diện hiện đại nâng tầm thương hiệu CLB.</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-[0_24px_48px_-12px_rgba(0,31,42,0.08)]">
                    <span className="text-3xl mb-4 block">🧠</span>
                    <h4 className="font-bold mb-2">Thông minh</h4>
                    <p className="text-xs text-[#3f4a3c]">AI hỗ trợ sắp xếp lịch và dự báo doanh thu.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="font-label text-xs uppercase tracking-[0.3em] text-[#006e1c] font-bold mb-4 block">Tại sao chọn chúng tôi?</span>
              <h2 className="font-headline text-4xl font-extrabold text-[#001f2a] mb-8">Hơn cả một phần mềm, đó là đối tác vận hành</h2>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-[#4caf50]/20 flex items-center justify-center shrink-0">
                    <span className="text-[#006e1c] text-sm">✓</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-[#001f2a]">Linh hoạt tối đa</h5>
                    <p className="text-sm text-[#3f4a3c]">Phù hợp cho mọi loại hình sân từ nhỏ đến quy mô chuỗi hệ thống.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-[#4caf50]/20 flex items-center justify-center shrink-0">
                    <span className="text-[#006e1c] text-sm">✓</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-[#001f2a]">Hỗ trợ tận tâm</h5>
                    <p className="text-sm text-[#3f4a3c]">Đội ngũ kỹ thuật túc trực 24/7 giải quyết mọi vấn đề phát sinh.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <span className="absolute top-10 -left-20 text-[25rem] text-[#006e1c] opacity-5 rotate-12">🏸</span>
      </section>

      {/* Final CTA - no specific bg color in original, using default */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <div className="bg-[#006e1c] rounded-lg p-16 relative overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,31,42,0.08)]">
            <div className="z-10 relative">
              <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-white mb-6">Sẵn sàng chuyển đổi số cho CLB của bạn?</h2>
              <p className="text-white/80 text-xl mb-12">Không cần thẻ tín dụng • Dùng thử FREE vĩnh viễn</p>
              <a href="https://app.sportbooking.online" className="inline-block px-12 py-5 bg-[#ff9800] text-[#653900] rounded-full font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl">
                Dùng thử miễn phí ngay
              </a>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>
        </div>
      </section>

      {/* Footer - bg-[#d9f2ff] */}
      <footer id="contact" className="bg-[#d9f2ff] pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 px-8 max-w-7xl mx-auto">
          <div>
            <span className="text-xl font-bold text-[#001f2a] font-headline mb-6 block">Sport Booking</span>
            <p className="text-sm font-body text-slate-600 mb-8 max-w-xs leading-relaxed">
              Kiến tạo cộng đồng thể thao văn minh và hiện đại thông qua công nghệ đặt sân hàng đầu Việt Nam.
            </p>
            <div className="flex gap-4">
              <a className="w-10 h-10 rounded-full bg-[#c9e7f7] flex items-center justify-center text-[#006e1c] hover:bg-[#006e1c] hover:text-white transition-colors" href="#">🌐</a>
              <a className="w-10 h-10 rounded-full bg-[#c9e7f7] flex items-center justify-center text-[#006e1c] hover:bg-[#006e1c] hover:text-white transition-colors" href="#">📱</a>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-label text-xs font-inter uppercase tracking-widest text-[#006e1c] font-bold">Liên kết nhanh</span>
            <a className="text-sm font-body text-slate-600 hover:underline decoration-2 underline-offset-4 w-fit" href="#about">Giới thiệu</a>
            <a className="text-sm font-body text-slate-600 hover:underline decoration-2 underline-offset-4 w-fit" href="/privacy">Chính sách bảo mật</a>
            <a className="text-sm font-body text-slate-600 hover:underline decoration-2 underline-offset-4 w-fit" href="/terms">Điều khoản dịch vụ</a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-label text-xs font-inter uppercase tracking-widest text-[#006e1c] font-bold">Liên hệ</span>
            <div className="flex items-center gap-3 text-slate-600">
              <span>📧</span>
              <span className="text-sm font-body">victory1080@gmail.com</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <span>📞</span>
              <span className="text-sm font-body">0982 949 974</span>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-[#ceedfd]/50 border border-[#becab9]/10">
              <p className="text-xs text-[#3f4a3c] font-medium">Đăng ký nhận tin để không bỏ lỡ ưu đãi dành cho CLB mới.</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 mt-16 pt-8 border-t border-[#becab9]/10 text-center">
          <p className="text-xs font-inter uppercase tracking-widest text-slate-500">© 2024 Sport Booking. All rights reserved.</p>
        </div>
      </footer>

      {/* Register Dialog */}
      <RegisterDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        selectedPlan={selectedPlan}
      />
    </>
  );
}
