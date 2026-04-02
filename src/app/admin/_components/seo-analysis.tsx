'use client';

import { CheckCircle2, AlertTriangle, XCircle, Eye, Share2 } from 'lucide-react';
import type { SeoMetadataSchema } from './schemas';

// ============================================================
// Types
// ============================================================
export type SeoCheck = { label: string; status: 'good' | 'warning' | 'error'; message: string };

// ============================================================
// SEO Score Analysis (Yoast-like)
// ============================================================
export function analyzeSeo(data: SeoMetadataSchema, focusKeyword: string): SeoCheck[] {
  const checks: SeoCheck[] = [];
  const title = data.meta_title || '';
  const desc = data.meta_description || '';
  const kw = focusKeyword.toLowerCase().trim();

  if (title.length === 0) checks.push({ label: 'Meta Title', status: 'error', message: 'Chưa có meta title.' });
  else if (title.length < 30) checks.push({ label: 'Meta Title', status: 'warning', message: `Quá ngắn (${title.length}/70). Nên từ 30-70 ký tự.` });
  else if (title.length > 70) checks.push({ label: 'Meta Title', status: 'warning', message: `Quá dài (${title.length}/70). Nên dưới 70 ký tự.` });
  else checks.push({ label: 'Meta Title', status: 'good', message: `Độ dài tốt (${title.length}/70 ký tự).` });

  if (desc.length === 0) checks.push({ label: 'Meta Description', status: 'error', message: 'Chưa có meta description.' });
  else if (desc.length < 70) checks.push({ label: 'Meta Description', status: 'warning', message: `Quá ngắn (${desc.length}/160). Nên từ 70-160 ký tự.` });
  else if (desc.length > 160) checks.push({ label: 'Meta Description', status: 'warning', message: `Quá dài (${desc.length}/160). Nên dưới 160 ký tự.` });
  else checks.push({ label: 'Meta Description', status: 'good', message: `Độ dài tốt (${desc.length}/160 ký tự).` });

  if (kw) {
    checks.push(title.toLowerCase().includes(kw)
      ? { label: 'Từ khóa trong Title', status: 'good', message: 'Từ khóa chính xuất hiện trong meta title.' }
      : { label: 'Từ khóa trong Title', status: 'warning', message: 'Từ khóa chính chưa có trong meta title.' });
    checks.push(desc.toLowerCase().includes(kw)
      ? { label: 'Từ khóa trong Description', status: 'good', message: 'Từ khóa chính xuất hiện trong meta description.' }
      : { label: 'Từ khóa trong Description', status: 'warning', message: 'Từ khóa chính chưa có trong meta description.' });
  }

  checks.push(data.og_title || data.og_description
    ? { label: 'Open Graph', status: 'good', message: 'Đã cấu hình Open Graph tags.' }
    : { label: 'Open Graph', status: 'warning', message: 'Chưa cấu hình Open Graph. Sẽ dùng meta title/description mặc định.' });

  checks.push(data.og_image_url
    ? { label: 'OG Image', status: 'good', message: 'Đã có ảnh Open Graph.' }
    : { label: 'OG Image', status: 'warning', message: 'Chưa có ảnh OG. Ảnh giúp tăng CTR khi chia sẻ.' });

  checks.push(data.canonical_url
    ? { label: 'Canonical URL', status: 'good', message: 'Đã thiết lập canonical URL.' }
    : { label: 'Canonical URL', status: 'warning', message: 'Chưa có canonical URL. Nên thiết lập để tránh duplicate content.' });

  checks.push(data.robots?.includes('noindex')
    ? { label: 'Robots', status: 'warning', message: 'Trang đang bị noindex - Google sẽ không index trang này.' }
    : { label: 'Robots', status: 'good', message: 'Trang được phép index bởi search engines.' });

  return checks;
}

export function getSeoScore(checks: SeoCheck[]): number {
  if (checks.length === 0) return 0;
  const scores = checks.map(c => c.status === 'good' ? 100 : c.status === 'warning' ? 50 : 0);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ============================================================
// UI Components
// ============================================================
export function ScoreIcon({ status }: { status: 'good' | 'warning' | 'error' }) {
  if (status === 'good') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

export function SeoScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm`}>
        {score}
      </div>
      <span className="text-sm text-muted-foreground">
        {score >= 80 ? 'Tốt' : score >= 50 ? 'Cần cải thiện' : 'Yếu'}
      </span>
    </div>
  );
}

export function GooglePreview({ title, description, url }: { title: string; description: string; url: string }) {
  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-zinc-900">
      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
        <Eye className="h-3 w-3" /> Xem trước trên Google
      </p>
      <div className="space-y-1">
        <p className="text-sm text-blue-600 dark:text-blue-400 truncate">{url || 'https://sportbooking.online'}</p>
        <h3 className="text-lg text-blue-800 dark:text-blue-300 font-medium leading-tight line-clamp-1 hover:underline cursor-pointer">
          {title || 'Chưa có tiêu đề'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{description || 'Chưa có mô tả...'}</p>
      </div>
    </div>
  );
}

export function SocialPreview({ title, description, image, type }: { title: string; description: string; image: string; type: 'facebook' | 'twitter' }) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
      <p className="text-xs text-muted-foreground px-3 pt-2 flex items-center gap-1">
        <Share2 className="h-3 w-3" /> Xem trước {type === 'facebook' ? 'Facebook' : 'Twitter/X'}
      </p>
      {image ? (
        <div className="w-full h-40 bg-muted mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="OG Preview" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-32 bg-muted mt-2 flex items-center justify-center text-muted-foreground text-sm">Chưa có ảnh</div>
      )}
      <div className="p-3 space-y-1">
        <h4 className="font-semibold text-sm line-clamp-1">{title || 'Chưa có tiêu đề'}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2">{description || 'Chưa có mô tả...'}</p>
      </div>
    </div>
  );
}
