# Phân tích giá tối ưu - Subscription Plans

## Chi phí Supabase

### Free Tier (Miễn phí)
- Database: 500 MB
- Bandwidth: 5 GB/tháng
- Realtime: 200 concurrent connections

### Pro Tier ($25/tháng = 600,000 VND)
- Database: 8 GB
- Bandwidth: 250 GB/tháng
- Realtime: 500 concurrent connections

## Tính toán chi phí theo gói

### Gói FREE
- **Giới hạn:** 3 sân, 100 bookings/tháng
- **Storage:** 100 bookings × 2KB = 0.2 MB/tháng
- **Bandwidth:** 100 bookings × 10 views × 2KB = 2 MB/tháng
- **Chi phí thực:** 0 VND (trong free tier)
- **Giá bán:** 0 VND (3 tháng dùng thử)

### Gói BASIC
- **Giới hạn:** 10 sân, 1000 bookings/tháng
- **Storage:** 1000 bookings × 2KB = 2 MB/tháng
- **Bandwidth:** 1000 bookings × 10 views × 2KB = 20 MB/tháng
- **Chi phí thực:** ~12,000 VND/tháng
- **Giá đề xuất:** 200,000 VND/tháng
- **Lợi nhuận:** 188,000 VND (94% margin)
- **Giá năm:** 2,000,000 VND (tiết kiệm 400,000 VND = 2 tháng free)

### Gói PRO
- **Giới hạn:** 30 sân, 3000 bookings/tháng
- **Storage:** 3000 bookings × 2KB = 6 MB/tháng
- **Bandwidth:** 3000 bookings × 10 views × 2KB = 60 MB/tháng
- **Chi phí thực:** ~36,000 VND/tháng
- **Giá đề xuất:** 500,000 VND/tháng
- **Lợi nhuận:** 464,000 VND (93% margin)
- **Giá năm:** 5,000,000 VND (tiết kiệm 1,000,000 VND = 2 tháng free)

## Phí vượt mức (Overage Fees)

### Vượt số sân
- **Không cho phép** - Phải upgrade gói

### Vượt số booking
- **Phí:** 2,000 VND/booking vượt mức
- **Chi phí thực:** ~50 VND/booking (storage + bandwidth)
- **Lợi nhuận:** 1,950 VND/booking (97.5% margin)

**Ví dụ:**
- Gói BASIC (1000 bookings/tháng)
- Thực tế: 1,200 bookings
- Vượt mức: 200 bookings
- Phí vượt: 200 × 2,000 = 400,000 VND
- Tổng hóa đơn: 200,000 + 400,000 = 600,000 VND

## Break-even Analysis

### Với Supabase Free Tier (0 VND/tháng)
**Capacity:**
- Storage: 500 MB → ~250,000 bookings total
- Bandwidth: 5 GB/tháng → ~2,500 bookings/tháng (với 10 views/booking)

**Có thể support:**
- 20 clubs FREE (100 bookings/tháng × 20 = 2,000 bookings)
- HOẶC 10 clubs BASIC (1,000 bookings/tháng × 10 = 10,000 bookings) - **VƯỢT QUÁ**
- HOẶC 5 clubs PRO (3,000 bookings/tháng × 5 = 15,000 bookings) - **VƯỢT QUÁ**

**Kết luận:** Free tier chỉ đủ cho giai đoạn đầu với ít clubs

### Với Supabase Pro ($25/tháng = 600,000 VND)
**Capacity:**
- Storage: 8 GB → ~4,000,000 bookings total
- Bandwidth: 250 GB/tháng → ~125,000 bookings/tháng

**Có thể support:**
- 100 clubs BASIC (1,000 × 100 = 100,000 bookings/tháng) ✓
- 40 clubs PRO (3,000 × 40 = 120,000 bookings/tháng) ✓
- Mix: 20 PRO + 40 BASIC = 100,000 bookings/tháng ✓

**Revenue scenarios:**

**Scenario 1: 50 clubs BASIC**
- Revenue: 50 × 200,000 = 10,000,000 VND/tháng
- Cost: 600,000 VND (Supabase) + 200,000 (other) = 800,000 VND
- Profit: 9,200,000 VND/tháng (92% margin)

**Scenario 2: 20 clubs PRO**
- Revenue: 20 × 500,000 = 10,000,000 VND/tháng
- Cost: 600,000 VND (Supabase) + 200,000 (other) = 800,000 VND
- Profit: 9,200,000 VND/tháng (92% margin)

**Scenario 3: Mix (10 PRO + 30 BASIC)**
- Revenue: (10 × 500,000) + (30 × 200,000) = 11,000,000 VND/tháng
- Cost: 800,000 VND
- Profit: 10,200,000 VND/tháng (93% margin)

## Đề xuất giá cuối cùng

### Gói FREE (3 tháng dùng thử)
- ✅ 3 sân
- ✅ 100 bookings/tháng
- ✅ Email support
- ❌ Không có overage (block khi hết quota)
- **Giá: 0 VND**

### Gói BASIC
- ✅ 10 sân
- ✅ 1,000 bookings/tháng
- ✅ Email support
- ✅ Overage: 2,000 VND/booking
- **Giá tháng: 200,000 VND**
- **Giá năm: 2,000,000 VND** (tiết kiệm 400,000 VND)

### Gói PRO
- ✅ 30 sân
- ✅ 3,000 bookings/tháng
- ✅ Priority support
- ✅ Overage: 1,500 VND/booking (rẻ hơn BASIC)
- ✅ Custom features
- **Giá tháng: 500,000 VND**
- **Giá năm: 5,000,000 VND** (tiết kiệm 1,000,000 VND)

### Gói ENTERPRISE (Custom)
- ✅ Unlimited sân
- ✅ Unlimited bookings
- ✅ Dedicated support
- ✅ API access
- ✅ White-label option
- **Giá: Liên hệ** (từ 2,000,000 VND/tháng)

## Chiến lược tăng trưởng

### Phase 1: Bootstrap (0-3 tháng)
- Sử dụng Supabase Free Tier
- Target: 10-20 clubs FREE
- Focus: Product-market fit
- Revenue: 0 VND

### Phase 2: Early Growth (3-12 tháng)
- Upgrade Supabase Pro ($25/tháng)
- Target: 5 PRO + 15 BASIC + 20 FREE
- Revenue: (5 × 500K) + (15 × 200K) = 5,500,000 VND/tháng
- Cost: 800,000 VND/tháng
- Profit: 4,700,000 VND/tháng (85% margin)

### Phase 3: Scale (12+ tháng)
- Maintain Supabase Pro
- Target: 20 PRO + 40 BASIC + 50 FREE
- Revenue: (20 × 500K) + (40 × 200K) = 18,000,000 VND/tháng
- Cost: 800,000 VND/tháng
- Profit: 17,200,000 VND/tháng (96% margin)

### Phase 4: Enterprise (24+ tháng)
- Consider dedicated infrastructure
- Target: 50+ paying clubs
- Revenue: 25,000,000+ VND/tháng
- Evaluate: Self-hosted vs Supabase Pro vs Supabase Team ($599/tháng)

## Kết luận

**Giá đề xuất có lãi cao (>90% margin) vì:**
1. Chi phí Supabase rất thấp so với giá bán
2. Không có chi phí vận hành lớn (automated system)
3. Scalable: 1 Supabase Pro có thể support 100+ clubs

**Rủi ro:**
1. Nếu clubs có booking rate cao hơn dự kiến → bandwidth vượt quá
2. Cần monitor usage và có plan upgrade Supabase khi cần

**Khuyến nghị:**
- Bắt đầu với giá này
- Monitor actual usage sau 3 tháng
- Adjust nếu cần (có thể giảm giá để cạnh tranh hoặc tăng nếu value cao)
