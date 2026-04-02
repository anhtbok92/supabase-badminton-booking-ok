import type { Metadata } from 'next';
import { createClient } from '@/supabase/server';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  // Try by slug first, then by ID
  let club = null;
  const { data: bySlug } = await supabase.from('clubs').select('name, address, description, image_urls, slug').eq('slug', slug).limit(1);
  if (bySlug && bySlug.length > 0) {
    club = bySlug[0];
  } else {
    const { data: byId } = await supabase.from('clubs').select('name, address, description, image_urls, slug').eq('id', slug).limit(1);
    if (byId && byId.length > 0) club = byId[0];
  }

  if (!club) {
    return { title: 'Không tìm thấy - Sport Booking', description: 'Câu lạc bộ không tồn tại.' };
  }

  const title = `Đặt sân ${club.name} - Sport Booking`;
  const description = club.description || `Đặt sân tại ${club.name}, ${club.address}. Nhanh chóng, chính xác và chuyên nghiệp.`;
  const ogImage = club.image_urls?.[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default function DatSanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
