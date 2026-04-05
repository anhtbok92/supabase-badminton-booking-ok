import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getSeoMetadata } from '@/lib/seo';
import { SeoHead } from '@/components/seo-head';

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata('terms', {
    title: 'Điều khoản dịch vụ',
    description: 'Điều khoản và điều kiện sử dụng dịch vụ Sport Booking.',
  });
}


export default function TermsPage() {
    return (
        <div className="container max-w-4xl mx-auto p-8 space-y-8 font-body">
            <SeoHead pageSlug="terms" />
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold font-headline">Điều khoản sử dụng Dịch vụ</h1>
            </div>

            <div className="prose prose-slate max-w-none">
                <p className="text-sm italic">Cập nhật lần cuối: Ngày 29 tháng 3 năm 2026</p>

                <section>
                    <h2 className="text-xl font-bold mt-6 mb-4">1. Chấp thuận Điều khoản</h2>
                    <p>Bằng cách truy cập và sử dụng dịch vụ của Sport Booking, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu tại đây.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mt-6 mb-4">2. Tài khoản của Bạn</h2>
                    <p>Khi đăng ký tài khoản, bạn cam kết cung cấp thông tin chính xác. Bạn chịu trách nhiệm bảo mật mật khẩu và toàn bộ hoạt động diễn ra trong tài khoản của mình. Đối với chủ sân, bạn có trách nhiệm cập nhật đúng tình trạng sân trống để tránh sự cố nhầm lẫn cho khách hàng.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mt-6 mb-4">3. Quy định Đặt sân và Thanh toán</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Giao dịch đặt sân được xác nhận sau khi khách hàng tải lên bằng chứng chuyển khoản thành công và được chủ sân phê duyệt.</li>
                        <li>Chủ sân có trách nhiệm xác nhận hoặc từ chối yêu cầu đặt sân trong thời gian sớm nhất.</li>
                        <li>Chính sách hoàn trả hoặc thay đổi giờ chơi do hai bên (khách hàng và chủ sân) tự thỏa thuận theo chính sách riêng của từng sân.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mt-6 mb-4">4. Quyền của Chúng tôi</h2>
                    <p>Sport Booking có quyền tạm dừng dịch vụ đối với bất kỳ tài khoản nào có hành vi vi phạm pháp luật hoặc ảnh hưởng tiêu cực đến trải nghiệm của người dùng khác mà không cần thông báo trước.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mt-6 mb-4">5. Giới hạn Trách nhiệm</h2>
                    <p>Sport Booking là nền tảng kết nối giữa khách hàng và chủ sân. Chúng tôi không chịu trách nhiệm về các tranh chấp phát sinh tại sân hoặc các vấn đề liên quan đến việc đặt sân giữa hai bên, trừ các lỗi hệ thống của chính Sport Booking.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mt-6 mb-4">6. Thay đổi Điều khoản</h2>
                    <p>Chúng tôi có thể cập nhật điều khoản này bất cứ lúc nào. Sự tiếp tục sử dụng dịch vụ sau khi các thay đổi được đăng tải đồng nghĩa với việc bạn chấp thuận các điều kiện mới.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mt-6 mb-4">7. Thông tin liên hệ</h2>
                    <p>Vui lòng gửi các thắc mắc của bạn về địa chỉ Email: <strong>victory1080@gmail.com</strong>.</p>
                </section>
            </div>
        </div>
    );
}
