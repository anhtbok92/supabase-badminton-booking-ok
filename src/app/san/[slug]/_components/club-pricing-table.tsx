import type { Pricing } from '@/lib/types';
import { formatVNPrice } from '@/lib/club-utils';

export function ClubPricingTable({ pricing }: { pricing: Pricing }) {
  if (!pricing || (!pricing.weekday?.length && !pricing.weekend?.length)) return null;

  return (
    <div className="px-4 mt-8">
      <h3 className="text-lg font-bold mb-3 border-l-4 border-primary pl-3">Bảng giá</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pricing.weekday?.length > 0 && (
          <div className="border rounded-xl p-4">
            <h4 className="font-bold text-sm mb-3">Ngày thường</h4>
            <div className="space-y-2">
              {pricing.weekday.map((tier, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{tier.timeRange[0]} - {tier.timeRange[1]}</span>
                  <span className="font-bold">{formatVNPrice(tier.price)}đ</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {pricing.weekend?.length > 0 && (
          <div className="border rounded-xl p-4">
            <h4 className="font-bold text-sm mb-3">Cuối tuần</h4>
            <div className="space-y-2">
              {pricing.weekend.map((tier, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{tier.timeRange[0]} - {tier.timeRange[1]}</span>
                  <span className="font-bold">{formatVNPrice(tier.price)}đ</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
