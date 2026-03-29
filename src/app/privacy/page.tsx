import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="container max-w-4xl mx-auto p-8 space-y-8 font-body">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold font-headline">Chính sách Bảo mật</h1>
            </div>

            <div className="prose prose-slate max-w-none">
                <p className="text-sm italic">Cập nhật lần cuối: Ngày 29 tháng 3 năm 2026</p>

                <section>
                    <h2 className="text-xl font-bold mt-6 mb-4">1. Thu thập Thông tin</h2>
                    <p>Chào mừng bạn đến với Sport Booking. Chúng tôi thu thập thông tin của bạn khi bạn đăng ký tài khoản, liên lạc với chúng tôi qua website này. Thông tin thu thập bao gồm:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Họ và tên</li>
                        <li>Số điện thoại liên hệ</li>
                        <li>Địa chỉ email</li>
                        <li>Thông tin về câu lạc bộ/sân thể thao (đối với chủ sân)</li>
                        <li>Hình ảnh bằng chứng chuyển khoản khi đặt sân</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mt-6 mb-4">2. Sử dụng Thông tin</h2>
                    <p>Bất kỳ thông tin nào chúng tôi thu thập được từ bạn có thể được sử dụng cho một trong các mục đích sau:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Cá nhân hóa trải nghiệm của bạn và đáp ứng nhu cầu cá nhân</li>
                        <li>Cung cấp nội dung đặt sân chính xác</li>
                        <li>Phát triển và cải thiện website</li>
                        <li>Xử lý các giao dịch và gửi email thông báo</li>
                        <li>Liên lạc khi có vấn đề phát sinh liên quan đến lịch đặt sân</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mt-6 mb-4">3. Bảo vệ Thông tin</h2>
                    <p>Chúng tôi thực hiện nhiều biện pháp an ninh để duy trì sự an toàn cho thông tin cá nhân của bạn. Dữ liệu của bạn được lưu trữ trên nền tảng đám mây bảo mật của Supabase, tuân thủ các tiêu chuẩn an toàn dữ liệu quốc tế.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mt-6 mb-4">4. Tiết lộ cho Bên thứ ba</h2>
                    <p>Chúng tôi không bán, trao đổi, hoặc chuyển giao các thông tin cá nhân của bạn cho các bên thứ ba. Điều này không bao gồm các bên thứ ba đáng tin cậy hỗ trợ chúng tôi trong việc vận hành website hoặc phục vụ bạn, miễn là các bên này cam kết bảo mật thông tin này.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mt-6 mb-4">5. Chấp thuận</h2>
                    <p>Bằng cách sử dụng hệ thống của chúng tôi, bạn đồng ý với chính sách bảo mật này.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mt-6 mb-4">6. Liên hệ</h2>
                    <p>Nếu có bất kỳ câu hỏi nào liên quan đến chính sách bảo mật này, bạn có thể liên hệ với chúng tôi theo thông tin dưới đây:</p>
                    <p className="mt-2">
                        <strong>Email:</strong> victory1080@gmail.com<br />
                        <strong>Số điện thoại:</strong> 0982 949 974
                    </p>
                </section>
            </div>
        </div>
    );
}
