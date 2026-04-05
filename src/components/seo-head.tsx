import { getRawSeoData } from '@/lib/seo';

/**
 * Server component that renders structured data and custom head tags.
 * Use in layout.tsx or page.tsx alongside generateMetadata.
 */
export async function SeoHead({ pageSlug }: { pageSlug: string }) {
  const seo = await getRawSeoData(pageSlug);
  if (!seo) return null;

  return (
    <>
      {/* Structured Data (JSON-LD) */}
      {seo.structured_data && Object.keys(seo.structured_data).length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.structured_data) }}
        />
      )}
    </>
  );
}
