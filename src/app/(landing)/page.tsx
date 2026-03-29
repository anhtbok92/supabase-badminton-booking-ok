'use client';

export default function LandingPage() {
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
            <a className="text-[#006e1c] font-bold border-b-4 border-[#4caf50] font-label text-sm uppercase tracking-widest py-1" href="#about">About</a>
            <a className="text-[#001f2a] font-medium hover:text-[#4caf50] transition-colors duration-300 font-label text-sm uppercase tracking-widest py-1" href="#features">Features</a>
            <a className="text-[#001f2a] font-medium hover:text-[#4caf50] transition-colors duration-300 font-label text-sm uppercase tracking-widest py-1" href="#pricing">Pricing</a>
            <a className="text-[#001f2a] font-medium hover:text-[#4caf50] transition-colors duration-300 font-label text-sm uppercase tracking-widest py-1" href="#contact">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://app.sportbooking.online/login" className="px-6 py-2 rounded-full font-bold text-sm text-on-surface hover:text-primary transition-all active:scale-95">Login</a>
            <a href="https://app.sportbooking.online" className="px-6 py-2 bg-gradient-to-br from-primary to-primary-container text-white rounded-full font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all">Sign-up</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden pt-16 pb-32">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 z-10">
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-on-background tracking-tight leading-[1.1] mb-6">
              Sport Booking - <span className="text-primary">Hệ thống đặt sân</span> thông minh
            </h1>
            <p className="text-xl text-on-surface-variant font-body mb-10 max-w-xl leading-relaxed">
              Giải pháp quản lý và đặt sân toàn diện cho câu lạc bộ thể thao. Nhanh chóng, chính xác và chuyên nghiệp hơn bao giờ hết.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="https://app.sportbooking.online" className="px-8 py-4 bg-secondary-container text-on-secondary-container rounded-lg font-bold text-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
                Bắt đầu đặt lịch ngay
                <span>→</span>
              </a>
              <button className="px-8 py-4 border-2 border-outline-variant text-on-surface rounded-lg font-bold text-lg hover:bg-surface-container transition-colors flex items-center justify-center gap-2">
                Xem bản demo
              </button>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg">
              <img alt="Sport venue" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_RQ0ugdjLw_SmfNgMeF8KwvoBLeAiVIwRnJaMMfgsvYsjfW7HAQYL7Ifk6A5mh_E5Uj4K7oFQyX-m6P6lp89j1FjOca47qu3mqszIEsn11UeJR5_QQ19j4bGNPoBSRkSFfd9P5YtRMVb-IfB8kkoBSIxxrKB9AjJNYo3xe7XP8D96BNJrZo1TY3GfeAQ664Q7gSTDZdBDsjfVWDTVD5j8_A-eH7bAIJ1zBT2C1Keq89HJnTNiRpHB1clzpBynAVooZP1xpBTYkc7u"/>
              <div className="absolute inset-0 bg-gradient-to-t from-on-background/40 to-transparent"></div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-[rgba(201,231,247,0.7)] backdrop-blur-xl p-6 rounded-lg shadow-lg max-w-[240px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="text-white">✓</span>
                </div>
                <span className="font-bold text-on-surface text-sm">Xác nhận tức thì</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-tight">Hệ thống xử lý hơn 1000+ lượt đặt sân mỗi ngày tại TP.HCM</p>
            </div>
          </div>
        </div>
        <span className="absolute -top-20 -right-20 text-[20rem] text-primary opacity-5 select-none pointer-events-none">⚽</span>
      </header>

      {/* User Features Section */}
      <section id="features" className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16 text-center lg:text-left">
            <span className="font-label text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4 block">Dành cho người chơi</span>
            <h2 className="font-headline text-4xl font-extrabold text-on-background">Trải nghiệm đặt sân đỉnh cao</h2>
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
              <div key={i} className="bg-surface-container-lowest p-8 rounded-lg shadow-lg hover:-translate-y-2 transition-transform duration-300">
                <div className="w-14 h-14 bg-surface-container flex items-center justify-center rounded-lg mb-6 text-3xl">
                  {feature.icon}
                </div>
                <h3 className="font-headline text-xl font-bold mb-3 text-on-surface">{feature.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Owner Management Features */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16 text-center">
            <span className="font-label text-xs uppercase tracking-[0.3em] text-secondary font-bold mb-4 block">Dành cho chủ sân</span>
            <h2 className="font-headline text-4xl font-extrabold text-on-background">Hệ quản trị toàn diện chuyên nghiệp</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-3 gap-6 h-auto md:h-[800px]">
            <div className="md:col-span-2 md:row-span-2 bg-primary rounded-lg p-10 text-white flex flex-col justify-between relative overflow-hidden group">
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
                  <div className="bg-secondary-container h-full w-[94%]"></div>
                </div>
              </div>
              <span className="absolute -bottom-10 -right-10 text-[15rem] text-white/10 group-hover:scale-110 transition-transform duration-700">📊</span>
            </div>
            <div className="md:col-span-2 bg-surface-container rounded-lg p-8 flex items-center gap-6 group">
              <div className="w-16 h-16 shrink-0 bg-white rounded-lg flex items-center justify-center shadow-md text-3xl">💰</div>
              <div>
                <h4 className="font-headline text-xl font-bold text-on-surface">Giá linh hoạt</h4>
                <p className="text-on-surface-variant text-sm">Cài đặt giá theo giờ cao điểm, ngày lễ hoặc thành viên thân thiết.</p>
              </div>
            </div>
            <div className="md:col-span-1 bg-surface-container-low rounded-lg p-8 text-center flex flex-col items-center justify-center hover:bg-surface-container transition-colors">
              <span className="text-4xl mb-4">📍</span>
              <h4 className="font-headline font-bold text-on-surface">Quản lý cơ sở</h4>
            </div>
            <div className="md:col-span-1 bg-surface-container-low rounded-lg p-8 text-center flex flex-col items-center justify-center hover:bg-surface-container transition-colors">
              <span className="text-4xl mb-4">📄</span>
              <h4 className="font-headline font-bold text-on-surface">Báo cáo chi tiết</h4>
            </div>
            <div className="md:col-span-2 bg-inverse-surface text-white rounded-lg p-8 flex justify-between items-center group">
              <div className="max-w-[60%]">
                <h4 className="font-headline text-xl font-bold mb-2">Quản lý từng sân riêng biệt</h4>
                <p className="text-white/60 text-sm">Kiểm soát trạng thái bảo trì, lịch thi đấu cho từng khu vực sân.</p>
              </div>
              <span className="text-6xl text-primary opacity-40 group-hover:rotate-12 transition-transform">📦</span>
            </div>
            <div className="md:col-span-1 bg-surface-container rounded-lg p-8 flex flex-col justify-end relative">
              <span className="text-4xl absolute top-8 left-8">🔔</span>
              <h4 className="font-headline font-bold text-on-surface">Trung tâm thông báo</h4>
            </div>
            <div className="md:col-span-1 bg-primary-container rounded-lg p-8 text-white flex flex-col justify-end relative">
              <span className="text-4xl absolute top-8 left-8">✅</span>
              <h4 className="font-headline font-bold">Xác nhận lịch</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section id="pricing" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="font-headline text-4xl font-extrabold text-on-background mb-4">Gói dịch vụ linh hoạt</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Chọn gói phù hợp với quy mô câu lạc bộ của bạn. Nâng cấp bất cứ lúc nào.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            <div className="bg-surface-container-lowest p-10 rounded-lg flex flex-col border border-outline-variant/15 hover:border-primary-container/40 transition-colors">
              <span className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Cơ bản</span>
              <h3 className="font-headline text-3xl font-bold mb-6">FREE</h3>
              <div className="space-y-4 mb-10 flex-grow">
                <div className="flex items-center gap-3"><span className="text-primary text-xl">✓</span><span className="text-on-surface">Tối đa 3 sân</span></div>
                <div className="flex items-center gap-3"><span className="text-primary text-xl">✓</span><span className="text-on-surface">100 lượt đặt/tháng</span></div>
                <div className="flex items-center gap-3"><span className="text-primary text-xl">✓</span><span className="text-on-surface">Báo cáo cơ bản</span></div>
              </div>
              <a href="https://app.sportbooking.online" className="w-full py-4 border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary-container hover:text-white transition-all text-center">Đăng ký ngay</a>
            </div>
            <div className="bg-white p-10 rounded-lg flex flex-col border-4 border-primary shadow-xl relative scale-105 z-10">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">RECOMMENDED</div>
              <span className="font-label text-xs font-bold text-primary uppercase tracking-widest mb-2">Chuyên nghiệp</span>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-headline text-3xl font-bold">500.000</span>
                <span className="text-on-surface-variant font-medium">VNĐ/tháng</span>
              </div>
              <div className="space-y-4 mb-10 flex-grow">
                <div className="flex items-center gap-3"><span className="text-primary text-xl">✓</span><span className="text-on-surface font-bold">Tối đa 30 sân</span></div>
                <div className="flex items-center gap-3"><span className="text-primary text-xl">✓</span><span className="text-on-surface font-bold">3.000 lượt đặt/tháng</span></div>
                <div className="flex items-center gap-3"><span className="text-primary text-xl">✓</span><span className="text-on-surface">Báo cáo chuyên sâu (AI)</span></div>
                <div className="flex items-center gap-3"><span className="text-primary text-xl">✓</span><span className="text-on-surface">Hỗ trợ ưu tiên 24/7</span></div>
              </div>
              <a href="https://app.sportbooking.online" className="w-full py-4 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform text-center">Đăng ký PRO</a>
            </div>
            <div className="bg-surface-container-lowest p-10 rounded-lg flex flex-col border border-outline-variant/15">
              <span className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Mở rộng</span>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-headline text-3xl font-bold">200.000</span>
                <span className="text-on-surface-variant font-medium">VNĐ/tháng</span>
              </div>
              <div className="space-y-4 mb-10 flex-grow">
                <div className="flex items-center gap-3"><span className="text-primary text-xl">✓</span><span className="text-on-surface">Tối đa 10 sân</span></div>
                <div className="flex items-center gap-3"><span className="text-primary text-xl">✓</span><span className="text-on-surface">1.000 lượt đặt/tháng</span></div>
                <div className="flex items-center gap-3"><span className="text-primary text-xl">✓</span><span className="text-on-surface">Quản lý nhân viên</span></div>
              </div>
              <a href="https://app.sportbooking.online" className="w-full py-4 border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary-container hover:text-white transition-all text-center">Đăng ký ngay</a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-24 bg-surface-container-low overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg shadow-lg translate-y-8">
                    <span className="text-3xl mb-4 block">⚡</span>
                    <h4 className="font-bold mb-2">Nhanh chóng</h4>
                    <p className="text-xs text-on-surface-variant">Đặt sân chỉ trong 30 giây với quy trình tối ưu.</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-lg translate-y-8">
                    <span className="text-3xl mb-4 block">✓</span>
                    <h4 className="font-bold mb-2">Chính xác</h4>
                    <p className="text-xs text-on-surface-variant">Hệ thống đồng bộ hóa 100% không lo sai sót.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg shadow-lg">
                    <span className="text-3xl mb-4 block">🏆</span>
                    <h4 className="font-bold mb-2">Chuyên nghiệp</h4>
                    <p className="text-xs text-on-surface-variant">Giao diện hiện đại nâng tầm thương hiệu CLB.</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-lg">
                    <span className="text-3xl mb-4 block">🧠</span>
                    <h4 className="font-bold mb-2">Thông minh</h4>
                    <p className="text-xs text-on-surface-variant">AI hỗ trợ sắp xếp lịch và dự báo doanh thu.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="font-label text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4 block">Tại sao chọn chúng tôi?</span>
              <h2 className="font-headline text-4xl font-extrabold text-on-background mb-8">Hơn cả một phần mềm, đó là đối tác vận hành</h2>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-on-surface">Linh hoạt tối đa</h5>
                    <p className="text-sm text-on-surface-variant">Phù hợp cho mọi loại hình sân từ nhỏ đến quy mô chuỗi hệ thống.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-on-surface">Hỗ trợ tận tâm</h5>
                    <p className="text-sm text-on-surface-variant">Đội ngũ kỹ thuật túc trực 24/7 giải quyết mọi vấn đề phát sinh.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <span className="absolute top-10 -left-20 text-[25rem] text-primary opacity-5 rotate-12">🏸</span>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <div className="bg-primary rounded-lg p-16 relative overflow-hidden shadow-xl">
            <div className="z-10 relative">
              <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-white mb-6">Sẵn sàng chuyển đổi số cho CLB của bạn?</h2>
              <p className="text-white/80 text-xl mb-12">Không cần thẻ tín dụng • Dùng thử FREE vĩnh viễn</p>
              <a href="https://app.sportbooking.online" className="inline-block px-12 py-5 bg-secondary-container text-on-secondary-container rounded-full font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl">
                Dùng thử miễn phí ngay
              </a>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#d9f2ff] pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 px-8 max-w-7xl mx-auto">
          <div>
            <span className="text-xl font-bold text-[#001f2a] font-headline mb-6 block">Sport Booking</span>
            <p className="text-sm font-body text-slate-600 mb-8 max-w-xs leading-relaxed">
              Kiến tạo cộng đồng thể thao văn minh và hiện đại thông qua công nghệ đặt sân hàng đầu Việt Nam.
            </p>
            <div className="flex gap-4">
              <a className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors" href="#">🌐</a>
              <a className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors" href="#">📱</a>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-label text-xs font-inter uppercase tracking-widest text-[#006e1c] font-bold">Quick Links</span>
            <a className="text-sm font-body text-slate-600 hover:underline decoration-2 underline-offset-4 w-fit" href="#about">About</a>
            <a className="text-sm font-body text-slate-600 hover:underline decoration-2 underline-offset-4 w-fit" href="#">Privacy Policy</a>
            <a className="text-sm font-body text-slate-600 hover:underline decoration-2 underline-offset-4 w-fit" href="#">Terms of Service</a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-label text-xs font-inter uppercase tracking-widest text-[#006e1c] font-bold">Contact</span>
            <div className="flex items-center gap-3 text-slate-600">
              <span>📧</span>
              <span className="text-sm font-body">support@sportbooking.online</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <span>📞</span>
              <span className="text-sm font-body">0123 456 789</span>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-surface-container-high/50 border border-outline-variant/10">
              <p className="text-xs text-on-surface-variant font-medium">Đăng ký nhận tin để không bỏ lỡ ưu đãi dành cho CLB mới.</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 mt-16 pt-8 border-t border-outline-variant/10 text-center">
          <p className="text-xs font-inter uppercase tracking-widest text-slate-500">© 2024 Sport Booking. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
