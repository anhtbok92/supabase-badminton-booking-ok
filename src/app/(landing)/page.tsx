'use client';

import { useState } from 'react';
import { RegisterDialog } from './_components/register-dialog';
import { 
  Rocket, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  ChevronRight,
  Monitor,
  LayoutDashboard,
  CalendarCheck,
  CheckCircle2,
  FileText,
  Smartphone,
  Trophy,
  Activity,
  UserCheck,
  Zap
} from 'lucide-react';
import Link from 'next/link';

type PlanType = 'FREE' | 'BASIC' | 'PRO';

export default function LandingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('FREE');

  const handlePlanSelect = (plan: PlanType) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  return (
    <div className="bg-[#0e0e0e] text-white font-body selection:bg-[#9cff93] selection:text-[#00440a]">
      {/* TopNav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black italic text-[#9cff93] tracking-tighter uppercase font-headline">SPORT BOOKING</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a className="text-[#9cff93] font-headline font-bold uppercase text-xs tracking-widest border-b-2 border-[#9cff93] pb-1" href="#about">Giới thiệu</a>
            <a className="text-white/70 hover:text-white transition-all font-headline font-bold uppercase text-xs tracking-widest" href="#features">Tính năng</a>
            <a className="text-white/70 hover:text-white transition-all font-headline font-bold uppercase text-xs tracking-widest" href="#pricing">Bảng giá</a>
            <a className="text-white/70 hover:text-white transition-all font-headline font-bold uppercase text-xs tracking-widest" href="#contact">Liên hệ</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://app.sportbooking.online/admin" className="px-6 py-2 rounded-full font-bold text-xs text-white hover:text-[#9cff93] transition-all">Đăng nhập</a>
            <a href="https://app.sportbooking.online/splash" className="px-8 py-2 bg-[#9cff93] text-[#00440a] rounded-md font-headline font-black uppercase text-xs tracking-widest hover:shadow-[0_0_20px_rgba(156,255,147,0.4)] transition-all">Đặt sân ngay</a>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-40 pb-32">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-12 xl:col-span-7 z-10 text-center xl:text-left">
              <div className="mb-6 inline-flex items-center gap-2 bg-[#9cff93]/10 px-4 py-2 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#9cff93] animate-pulse"></span>
                <span className="text-[#9cff93] text-xs font-bold uppercase tracking-widest">Đẳng Cấp Thể Thao Digital</span>
              </div>
              <h1 className="font-headline text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8 italic uppercase">
                BỨT PHÁ<br />
                <span className="text-transparent px-2" style={{ WebkitTextStroke: '1px #9cff93' }}>LÀM CHỦ</span><br />
                SÂN CHƠI
              </h1>
              <p className="text-white/60 text-lg md:text-xl font-body mb-10 max-w-2xl mx-auto xl:mx-0 leading-relaxed">
                Nền tảng đặt sân hiện đại số hàng đầu, kết nối cộng đồng vận động viên chuyên nghiệp. Quản lý thời gian, tối ưu hiệu suất và nâng tầm trải nghiệm thi đấu.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center xl:justify-start">
                <a href="https://app.sportbooking.online/splash" className="px-10 py-5 bg-[#9cff93] text-[#00440a] rounded-md font-headline font-black uppercase tracking-widest hover:scale-105 transition-all text-center">
                  Bắt đầu ngay
                </a>
                <button 
                  onClick={() => handlePlanSelect('FREE')}
                  className="px-10 py-5 border border-white/20 text-white rounded-md font-headline font-black uppercase tracking-widest hover:border-[#9cff93] hover:text-[#9cff93] transition-all text-center"
                >
                  Xem Demo
                </button>
              </div>
            </div>
            <div className="lg:col-span-12 xl:col-span-5 relative">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-[0_40px_100px_rgba(156,255,147,0.1)] group">
                <img 
                  alt="Sport Action" 
                  className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_RQ0ugdjLw_SmfNgMeF8KwvoBLeAiVIwRnJaMMfgsvYsjfW7HAQYL7Ifk6A5mh_E5Uj4K7oFQyX-m6P6lp89j1FjOca47qu3mqszIEsn11UeJR5_QQ19j4bGNPoBSRkSFfd9P5YtRMVb-IfB8kkoBSIxxrKB9AjJNYo3xe7XP8D96BNJrZo1TY3GfeAQ664Q7gSTDZdBDsjfVWDTVD5j8_A-eH7bAIJ1zBT2C1Keq89HJnTNiRpHB1clzpBynAVooZP1xpBTYkc7u"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-transparent"></div>
              </div>
              <div className="absolute -bottom-8 -left-8 bg-[#1a1919]/60 backdrop-blur-2xl p-8 rounded-xl border-l-4 border-[#9cff93] shadow-2xl max-w-[280px]">
                <div className="text-[#9cff93] text-4xl font-headline font-black mb-1">30 Giây</div>
                <div className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Thời gian đặt sân trung bình</div>
                <p className="mt-4 text-[11px] text-white/40 italic">Hơn 1000+ lượt đặt mỗi ngày tại Hà Nội, TP.HCM</p>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-[#9cff93]/5 rounded-full blur-[120px] pointer-events-none"></div>
        </section>

        {/* User Features */}
        <section id="features" className="py-32 bg-[#131212] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
              <div className="max-w-xl">
                <span className="font-headline text-[#9cff93] text-sm font-bold tracking-[0.3em] uppercase block mb-4">Dành cho người chơi</span>
                <h2 className="font-headline text-4xl md:text-5xl font-black italic uppercase">Trải nghiệm đặt sân thông minh</h2>
              </div>
              <div className="hidden md:block h-[1px] bg-white/10 flex-grow mx-12 mb-5"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Rocket, title: 'Bắt đầu tức thì', desc: 'Quy trình đặt sân được tối ưu hóa chỉ trong 30 giây.' },
                { icon: Clock, title: 'Lịch Trống Real-time', desc: 'Xem lịch trống chính xác, không lo bị trùng giờ hay chờ đợi vô ích.' },
                { icon: CalendarCheck, title: 'Quản lý lịch đặt', desc: 'Theo dõi tất cả lịch đặt sân, trạng thái xác nhận và lịch sử giao dịch ngay trên app.' },
                { icon: Smartphone, title: 'Mọi lúc mọi nơi', desc: 'Giao diện mobile friendly, đặt sân dễ dàng ngay trên smartphone của bạn.' }
              ].map((item, i) => (
                <div key={i} className="bg-[#1a1919]/40 backdrop-blur-md border border-white/5 p-10 rounded-xl hover:bg-white/[0.03] transition-all group">
                  <div className="w-12 h-12 rounded-lg bg-[#9cff93]/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <item.icon className="text-[#9cff93] w-6 h-6" />
                  </div>
                  <h3 className="font-headline text-lg font-bold uppercase mb-4 tracking-tighter">{item.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Owner Features Section */}
        <section id="about" className="py-32 bg-[#0e0e0e]">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
              <div className="lg:col-span-12 xl:col-span-5 order-2 xl:order-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square rounded-xl overflow-hidden bg-white/5 group relative">
                    <img alt="Management" className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAG7V0HgbfTNXpx4oqRQmO2NUacZ4eNgZ3vAbQ4a8lbGUrdvXujVboomedSVuV2JscZ0y81IJpnvRwU884tAMHkXDXPPdKQcBsCRMW8GHUG4KIypYvmz3x6113DfFjwD7OoCn9zK9wPdzafdGAOqQofpe1mBGE8Wq1gBrglhiHfAodRC-1NsIvQGYNdqqT3_8r5seM4JcgKFbuaxbhyMb2Es6TaJZ0f08egIJnT3bHjKk8_BGrUYJnvx805ey8aVFbdV5FAx7HYtSs" />
                  </div>
                  <div className="aspect-square rounded-xl overflow-hidden bg-white/5 mt-10 group relative">
                    <img alt="Dashboard" className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSJ5uxmM5kEY-0G_9ARacJSU2iMpe4AFhdHrDdvPXF_In3euJeqW-j7MPuQIgQxauMjp8kU81z1KXbR1Bs1UUQtNp7UjPPakg7NBYAX_-cVc09GJYrP8StJJJSQpD2y74hfYuapdFkEMgUeMo1FfDUw608Sidzq8J_K9Eaank-W3XVaF3DEhtE8ICz4d0MhLzWC_1f2_gcRNHves92tKlW0Q6H3SytQ6mQ3cFc5vw-rA-6yZkU7rLaltm7KSs0gc_S51rc7VbbjYs" />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-12 xl:col-span-7 order-1 xl:order-2">
                <span className="font-headline text-[#9cff93] text-sm font-bold tracking-[0.3em] uppercase block mb-4">Dành cho chủ sân</span>
                <h2 className="font-headline text-5xl md:text-6xl font-black italic uppercase mb-10 leading-[0.9]">Tối ưu doanh thu<br /><span className="text-[#9cff93]">CLB Thể Thao</span></h2>
                <div className="space-y-10">
                  <div className="flex gap-6 items-start group">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-[#9cff93]/10 flex items-center justify-center border border-[#9cff93]/20 group-hover:bg-[#9cff93] group-hover:text-[#00440a] transition-all">
                      <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-headline font-black uppercase text-xl mb-3 tracking-tighter">Quản lý toàn diện</h4>
                      <p className="text-white/50 leading-relaxed">Thiết lập giá linh hoạt theo giờ cao điểm, ngày lễ và quản lý đa dạng loại sân (Cầu lông, Bóng đá, Tennis, Pickleball).</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start group">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-[#9cff93]/10 flex items-center justify-center border border-[#9cff93]/20 group-hover:bg-[#9cff93] group-hover:text-[#00440a] transition-all">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-headline font-black uppercase text-xl mb-3 tracking-tighter">Dashboard Thống Kê</h4>
                      <p className="text-white/50 leading-relaxed">Hệ thống báo cáo tự động về doanh thu, tỷ lệ lấp đầy sân và hành vi khách hàng giúp bạn ra quyết định chuẩn xác.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start group">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-[#9cff93]/10 flex items-center justify-center border border-[#9cff93]/20 group-hover:bg-[#9cff93] group-hover:text-[#00440a] transition-all">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-headline font-black uppercase text-xl mb-3 tracking-tighter">Tạo sân không giới hạn</h4>
                      <p className="text-white/50 leading-relaxed">Thêm bao nhiêu sân tùy thích, tùy chỉnh tên, mô tả, hình ảnh và sắp xếp thứ tự hiển thị theo ý muốn.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start group">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-[#9cff93]/10 flex items-center justify-center border border-[#9cff93]/20 group-hover:bg-[#9cff93] group-hover:text-[#00440a] transition-all">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-headline font-black uppercase text-xl mb-3 tracking-tighter">Quản lý đặt sân & lịch trình</h4>
                      <p className="text-white/50 leading-relaxed">Xem lịch đặt theo ngày, xác nhận hoặc hủy booking nhanh chóng, xuất báo cáo PDF chỉ với một thao tác.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start group">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-[#9cff93]/10 flex items-center justify-center border border-[#9cff93]/20 group-hover:bg-[#9cff93] group-hover:text-[#00440a] transition-all">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-headline font-black uppercase text-xl mb-3 tracking-tighter">Đăng tin tức & khuyến mãi</h4>
                      <p className="text-white/50 leading-relaxed">Tạo bài viết quảng bá CLB, thông báo sự kiện và chương trình ưu đãi để thu hút thêm khách hàng mới.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePlanSelect('BASIC')}
                    className="mt-4 px-10 py-5 bg-[#1a1919] border border-[#9cff93]/30 text-[#9cff93] rounded-md font-headline font-bold uppercase tracking-widest hover:bg-[#9cff93] hover:text-[#00440a] transition-all"
                  >
                    Đăng Ký Chủ Sân
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-40 bg-[#131212] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-24">
              <h2 className="font-headline text-5xl md:text-7xl font-black italic uppercase italic tracking-tighter mb-6">Gói Đăng Ký Đối Tác</h2>
              <p className="text-white/40 max-w-2xl mx-auto">Chọn giải pháp quản trị phù hợp nhất với quy mô CLB của bạn. Nâng cấp bất cứ lúc nào.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-8">
              {/* Plan 1 */}
              <div className="bg-[#1a1919]/40 backdrop-blur-md border border-white/5 p-12 rounded-xl flex flex-col hover:border-[#9cff93]/30 transition-all">
                <span className="font-headline text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-4 block">Cơ bản</span>
                <div className="text-4xl font-headline font-black mb-10">FREE<span className="text-sm font-normal text-white/30 ml-2">/vĩnh viễn</span></div>
                <div className="space-y-6 mb-12 flex-grow">
                  <div className="flex items-center gap-4 text-sm text-white/60"><CheckCircle2 className="w-5 h-5 text-[#9cff93]" /> <span>Tối đa 3 sân</span></div>
                  <div className="flex items-center gap-4 text-sm text-white/60"><CheckCircle2 className="w-5 h-5 text-[#9cff93]" /> <span>100 lượt đặt/tháng</span></div>
                  <div className="flex items-center gap-4 text-sm text-white/60"><CheckCircle2 className="w-5 h-5 text-[#9cff93]" /> <span>Tính năng cơ bản</span></div>
                </div>
                <button 
                  onClick={() => handlePlanSelect('FREE')}
                  className="w-full py-4 border border-white/10 rounded-md font-headline font-black uppercase text-xs tracking-widest hover:border-[#9cff93] hover:text-[#9cff93] transition-all"
                >
                  Bắt đầu ngay
                </button>
              </div>
              {/* Plan 2: RECOMMENDED */}
              <div className="bg-[#9cff93] text-[#00440a] p-12 rounded-xl flex flex-col relative scale-[1.08] z-10 shadow-[0_40px_80px_rgba(156,255,147,0.15)]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00440a] text-[#9cff93] px-4 py-1 rounded text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">KHUYÊN DÙNG</div>
                <span className="font-headline text-[10px] font-black uppercase tracking-[0.3em] mb-4 block opacity-60">Chuyên nghiệp</span>
                <div className="text-5xl font-headline font-black mb-10">500.000<span className="text-sm font-bold opacity-60 ml-2">đ/tháng</span></div>
                <div className="space-y-6 mb-12 flex-grow">
                  <div className="flex items-center gap-4 text-sm font-black"><CheckCircle2 className="w-6 h-6" /> <span>Tối đa 30 sân</span></div>
                  <div className="flex items-center gap-4 text-sm font-black"><CheckCircle2 className="w-6 h-6" /> <span>3.000 lượt đặt/tháng</span></div>
                  <div className="flex items-center gap-4 text-sm font-black"><CheckCircle2 className="w-6 h-6" /> <span>Dashboard chuyên sâu (AI)</span></div>
                  <div className="flex items-center gap-4 text-sm font-black"><CheckCircle2 className="w-6 h-6" /> <span>Hỗ trợ VIP 24/7</span></div>
                </div>
                <button 
                  onClick={() => handlePlanSelect('PRO')}
                  className="w-full py-5 bg-[#00440a] text-white rounded-md font-headline font-black uppercase text-xs tracking-widest hover:opacity-90 transition-opacity"
                >
                  Chọn gói PRO
                </button>
              </div>
              {/* Plan 3 */}
              <div className="bg-[#1a1919]/40 backdrop-blur-md border border-white/5 p-12 rounded-xl flex flex-col hover:border-[#9cff93]/30 transition-all">
                <span className="font-headline text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-4 block">Mở rộng</span>
                <div className="text-4xl font-headline font-black mb-10">200.000<span className="text-sm font-normal text-white/30 ml-2">đ/tháng</span></div>
                <div className="space-y-6 mb-12 flex-grow">
                  <div className="flex items-center gap-4 text-sm text-white/60"><CheckCircle2 className="w-5 h-5 text-[#9cff93]" /> <span>Tối đa 10 sân</span></div>
                  <div className="flex items-center gap-4 text-sm text-white/60"><CheckCircle2 className="w-5 h-5 text-[#9cff93]" /> <span>1.000 lượt đặt/tháng</span></div>
                  <div className="flex items-center gap-4 text-sm text-white/60"><CheckCircle2 className="w-5 h-5 text-[#9cff93]" /> <span>Báo cáo doanh thu nâng cao</span></div>
                </div>
                <button 
                  onClick={() => handlePlanSelect('BASIC')}
                  className="w-full py-4 border border-white/10 rounded-md font-headline font-black uppercase text-xs tracking-widest hover:border-[#9cff93] hover:text-[#9cff93] transition-all"
                >
                  Chọn gói Basic
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-40 relative">
          <div className="max-w-7xl mx-auto px-8">
            <div className="bg-[#1c1b1b] rounded-2xl p-20 text-center relative overflow-hidden border border-white/5 group">
              <div className="z-10 relative">
                <h2 className="font-headline text-5xl md:text-6xl font-black italic uppercase mb-8">Sẵn sàng để <span className="text-[#9cff93]">LÀM CHỦ</span> sân chơi?</h2>
                <p className="text-white/50 text-xl mb-12 max-w-2xl mx-auto">Chuyển đổi số ngay hôm nay. Không cần thẻ tín dụng, đăng ký trong 1 phút.</p>
                <button 
                  onClick={() => handlePlanSelect('PRO')}
                  className="px-12 py-6 bg-[#9cff93] text-[#00440a] rounded-md font-headline font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(156,255,147,0.2)] hover:scale-105 transition-all text-xl"
                >
                  Dùng thử ngay
                </button>
              </div>
              <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#9cff93]/5 rounded-full blur-[120px] -translate-y-1/2 group-hover:bg-[#9cff93]/10 transition-colors"></div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-[#0e0e0e] border-t border-white/10 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
              <span className="text-2xl font-black italic text-white uppercase font-headline">SPORT BOOKING</span>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                Kiến tạo cộng đồng thể thao văn minh và hiện đại thông qua công nghệ quản lý sân thông minh số 1 Việt Nam.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[#9cff93] hover:text-[#9cff93] transition-all">
                  <Smartphone className="w-4 h-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[#9cff93] hover:text-[#9cff93] transition-all">
                  <Zap className="w-4 h-4" />
                </a>
              </div>
            </div>
            
            <div className="space-y-8">
              <h5 className="font-headline text-[#9cff93] text-[11px] font-black uppercase tracking-[0.3em]">Khám phá</h5>
              <div className="flex flex-col gap-4 text-sm text-white/40 font-bold uppercase tracking-widest font-headline">
                <a href="#about" className="hover:text-white transition-colors">Giới thiệu</a>
                <a href="#features" className="hover:text-white transition-colors">Tính năng</a>
                <a href="#pricing" className="hover:text-white transition-colors">Bảng giá</a>
              </div>
            </div>

            <div className="space-y-8">
              <h5 className="font-headline text-[#9cff93] text-[11px] font-black uppercase tracking-[0.3em]">Hỗ trợ pháp lý</h5>
              <div className="flex flex-col gap-4 text-sm text-white/40 font-bold uppercase tracking-widest font-headline">
                <Link href="/privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Điều khoản dịch vụ</Link>
              </div>
            </div>

            <div className="space-y-8">
              <h5 className="font-headline text-[#9cff93] text-[11px] font-black uppercase tracking-[0.3em]">Liên hệ</h5>
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-white/50 text-sm">
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-[#9cff93]" /></span>
                  <span>victory1080@gmail.com</span>
                </div>
                <div className="flex items-center gap-4 text-white/50 text-sm">
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-[#9cff93]" /></span>
                  <span>0982 949 974</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-[10px] font-headline font-bold text-white/20 uppercase tracking-[0.4em]">© 2024 SPORT BOOKING KINETIC PRECISION. ALL RIGHTS RESERVED.</span>
            <div className="flex gap-6 text-white/20 text-xs">
              <span className="hover:text-[#9cff93] cursor-pointer">VIETNAM</span>
              <span className="hover:text-[#9cff93] cursor-pointer">HANOI</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Register Dialog */}
      <RegisterDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        selectedPlan={selectedPlan}
      />
    </div>
  );
}
