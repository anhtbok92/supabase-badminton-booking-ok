'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, FileText, Users, Building, Eye } from 'lucide-react';
import { generateUserGuide } from './pdf-user-guide';
import { generateOwnerGuide } from './pdf-owner-guide';

type GuideType = 'user' | 'owner';

export function UserGuideGenerator() {
    const [generating, setGenerating] = useState<GuideType | null>(null);

    const handleGenerate = async (type: GuideType) => {
        setGenerating(type);
        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            const doc = type === 'user' ? generateUserGuide() : generateOwnerGuide();
            const fileName = type === 'user'
                ? 'Huong-dan-su-dung-Sport-Booking-Nguoi-dat-san.pdf'
                : 'Huong-dan-quan-ly-Sport-Booking-Chu-san.pdf';
            doc.save(fileName);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setGenerating(null);
        }
    };

    const handlePreview = (type: GuideType) => {
        try {
            const doc = type === 'user' ? generateUserGuide() : generateOwnerGuide();
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error previewing PDF:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Tài liệu Hướng dẫn Sử dụng</h2>
                <p className="text-muted-foreground mt-1">
                    Tạo tài liệu PDF chuyên nghiệp để gửi cho khách hàng và chủ sân. Tài liệu bao gồm hướng dẫn chi tiết tất cả các tính năng của hệ thống.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <GuideCard
                    title="Hướng dẫn cho Người đặt sân"
                    description="Dành cho khách hàng sử dụng dịch vụ"
                    icon={<Users className="h-6 w-6" />}
                    iconBg="bg-green-100 text-green-600"
                    accentColor="from-green-500 to-emerald-500"
                    badgeText="8 mục"
                    features={[
                        'Đăng ký & Đăng nhập tài khoản',
                        'Tìm kiếm và chọn sân cầu lông',
                        'Đặt sân theo giờ & Thanh toán',
                        'Quản lý lịch đặt sân',
                        'Câu hỏi thường gặp',
                    ]}
                    onGenerate={() => handleGenerate('user')}
                    onPreview={() => handlePreview('user')}
                    generating={generating === 'user'}
                    disabled={generating !== null}
                />
                <GuideCard
                    title="Hướng dẫn cho Chủ sân"
                    description="Dành cho đối tác quản lý câu lạc bộ"
                    icon={<Building className="h-6 w-6" />}
                    iconBg="bg-orange-100 text-orange-600"
                    accentColor="from-orange-500 to-amber-500"
                    buttonClass="bg-orange-600 hover:bg-orange-700"
                    badgeText="9 mục"
                    features={[
                        'Đăng ký làm Chủ sân & Dashboard',
                        'Quản lý CLB, Sân & Bảng giá',
                        'Quản lý Booking & Lịch cố định',
                        'Nhân viên & Thống kê doanh thu',
                        'Gói đăng ký & FAQ',
                    ]}
                    onGenerate={() => handleGenerate('owner')}
                    onPreview={() => handlePreview('owner')}
                    generating={generating === 'owner'}
                    disabled={generating !== null}
                />
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>Tài liệu được tạo tự động dựa trên các tính năng hiện tại của hệ thống. PDF được thiết kế chuyên nghiệp với màu sắc thương hiệu, mục lục, và hướng dẫn từng bước chi tiết.</p>
                            <p>Bạn có thể gửi trực tiếp file PDF này cho chủ sân khi họ đăng ký, hoặc in ra để phát tại các sự kiện.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function GuideCard({ title, description, icon, iconBg, accentColor, buttonClass, badgeText, features, onGenerate, onPreview, generating, disabled }: {
    title: string; description: string; icon: React.ReactNode; iconBg: string;
    accentColor: string; buttonClass?: string; badgeText: string; features: string[];
    onGenerate: () => void; onPreview: () => void; generating: boolean; disabled: boolean;
}) {
    return (
        <Card className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentColor}`} />
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2"><Badge variant="outline" className="text-xs">{badgeText}</Badge> Hướng dẫn đầy đủ từ A-Z</span>
                    <ul className="space-y-1 ml-4 list-disc">
                        {features.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                </div>
                <div className="flex gap-2">
                    <Button onClick={onGenerate} disabled={disabled} className={`flex-1 ${buttonClass || ''}`}>
                        {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo...</> : <><Download className="mr-2 h-4 w-4" /> Tải PDF</>}
                    </Button>
                    <Button variant="outline" onClick={onPreview} disabled={disabled}>
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
