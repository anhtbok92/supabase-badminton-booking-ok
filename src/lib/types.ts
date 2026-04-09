export type PriceTier = {
  timeRange: [string, string];
  price: number;
  is_priority?: boolean;
};

export type Pricing = {
  weekday: PriceTier[];
  weekend: PriceTier[];
};

export type Club = {
  id: string;
  name: string;
  slug?: string;
  address: string;
  phone: string;
  rating?: number;
  image_urls: string[];
  pricing: Pricing;
  operating_hours?: string;
  services_html?: string;
  latitude?: number;
  longitude?: number;
  club_type: string;
  is_active?: boolean;
  payment_qr_url?: string;
  price_list_html?: string;
  price_list_image_url?: string;
  map_video_url?: string;
  verification_status?: string;
  owner_name?: string;
  owner_phone?: string;
  number_of_courts?: number;
  description?: string;
  owner_id?: string;
  created_at?: string;
  current_subscription_id?: string;
  subscription_status?: 'active' | 'expiring_soon' | 'expired';
  booking_policy?: string;
  custom_subdomain?: string | null;
};

export type Court = {
  id: string;
  name: string;
  club_id: string;
  description?: string;
  image_urls?: string[];
  order?: number;
  created_at?: string;
};

export type UserBooking = {
  id: string;
  user_id?: string;
  club_id: string;
  club_name: string;
  date: string;
  slots: SelectedSlot[];
  total_price: number;
  status: 'Đã xác nhận' | 'Chờ xác nhận' | 'Đã hủy' | 'Khóa' | 'Sự kiện';
  name: string;
  phone: string;
  payment_proof_image_urls?: string[];
  created_at?: string;
  is_deleted?: boolean;
  booking_group_id?: string;
  event_id?: string;
};

export type SelectedSlot = {
  court_id: string;
  time: string;
  court_name?: string;
  date?: string;
};

export type SlotStatus = 'available' | 'booked' | 'blocked' | 'event' | 'selected';

export type BookedSlot = {
  id?: string;
  club_id: string;
  date: string;
  slots: SelectedSlot[];
  status: UserBooking['status'];
};

export type UserProfile = {
  id: string;
  email: string | null;
  phone?: string;
  role: 'admin' | 'club_owner' | 'staff' | 'customer';
  managed_club_ids?: string[];
  is_locked?: boolean;
  created_at?: string;
};

export type NewsArticle = {
  id: string;
  title: string;
  short_description: string;
  content_html: string;
  banner_image_url: string;
  created_at: string;
  tags?: string[];
};

export type NewsTag = {
  id: string;
  name: string;
};

export type ClubType = {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  order?: number;
  created_at?: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  content_html: string;
  banner_image_url?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  status: 'draft' | 'published';
  author_id?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
};

// ============================================================
// Event Booking Types
// ============================================================

export type Event = {
  id: string;
  club_id: string;
  event_name: string;
  event_date: string;
  court_id?: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  ticket_price: number;
  activity_type?: string;
  notes?: string;
  status: 'active' | 'cancelled' | 'completed';
  created_by?: string;
  created_at?: string;
};

// ============================================================
// Fixed Monthly Booking Types
// ============================================================

export type FixedMonthlyConfig = {
  id: string;
  club_id: string;
  court_id: string;
  day_of_week: number; // 0-6 (Sun-Sat)
  start_time: string; // 'HH:mm'
  end_time: string;   // 'HH:mm'
  customer_name: string;
  customer_phone: string;
  total_price: number;
  is_active: boolean;
  is_auto_renew: boolean;
  note?: string;
  start_month?: string;
  last_generated_month?: string;
  created_at?: string;
  updated_at?: string;
};

// ============================================================
// Subscription Management Types
// ============================================================

export type SubscriptionPlanFeatures = {
  trial_months?: number;
  support: 'email' | 'priority';
  analytics?: boolean;
  custom_features?: boolean;
  extra_features?: string;
};

export type SubscriptionPlan = {
  id: string;
  name: 'FREE' | 'BASIC' | 'PRO';
  display_name: string;
  max_courts: number;
  max_bookings_per_month: number;
  monthly_price: number;
  yearly_price: number;
  overage_fee_per_booking: number;
  is_active: boolean;
  features: SubscriptionPlanFeatures;
  created_at: string;
  updated_at: string;
};

export type ClubSubscription = {
  id: string;
  club_id: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  is_active: boolean;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
};

export type BookingUsageTracking = {
  id: string;
  club_id: string;
  month: string;
  booking_count: number;
  overage_count: number;
  overage_fee: number;
  created_at: string;
  updated_at: string;
};

export type CourtLimitCheck = {
  current_count: number;
  max_allowed: number;
  can_create: boolean;
};

export type BookingQuotaCheck = {
  current_count: number;
  max_allowed: number;
  overage_count: number;
  overage_fee: number;
  usage_percentage: number;
};

export type PromoPopupConfig = {
  is_active: boolean;
  badge?: string;
  title: string;
  description?: string;
  cta_text?: string;
  sub_text?: string;
  delay_ms?: number;
  features: string[];
};

export type SiteSetting = {
  key: string;
  value: any;
  created_at: string;
  updated_at: string;
};

// ============================================================
// Backward compatibility aliases (camelCase → snake_case)
// These help existing components compile during incremental migration.
// Components will be updated to use snake_case fields directly
// as each page is migrated in later tasks.
// ============================================================

/** @deprecated Use Club with snake_case fields directly */
export type ClubLegacy = Club & {
  imageUrls?: string[];
  operatingHours?: string;
  servicesHtml?: string;
  clubType?: string;
  isActive?: boolean;
  paymentQrUrl?: string;
  priceListHtml?: string;
  priceListImageUrl?: string;
  mapVideoUrl?: string;
  verificationStatus?: string;
  ownerName?: string;
  ownerPhone?: string;
  numberOfCourts?: number;
  ownerId?: string;
  createdAt?: string;
};

/** @deprecated Use Court with snake_case fields directly */
export type CourtLegacy = Court & {
  clubId?: string;
  imageUrls?: string[];
};

/** @deprecated Use UserBooking with snake_case fields directly */
export type UserBookingLegacy = UserBooking & {
  userId?: string;
  clubId?: string;
  clubName?: string;
  totalPrice?: number;
  paymentProofImageUrls?: string[];
  createdAt?: string;
  isDeleted?: boolean;
  bookingGroupId?: string;
};

/** @deprecated Use SelectedSlot with snake_case fields directly */
export type SelectedSlotLegacy = SelectedSlot & {
  courtId?: string;
  courtName?: string;
};

/** @deprecated Use UserProfile with snake_case fields directly */
export type UserProfileLegacy = UserProfile & {
  uid?: string;
  managedClubIds?: string[];
  isLocked?: boolean;
};

/** @deprecated Use NewsArticle with snake_case fields directly */
export type NewsArticleLegacy = NewsArticle & {
  shortDescription?: string;
  contentHtml?: string;
  bannerImageUrl?: string;
  createdAt?: string;
};

/** @deprecated Use BookedSlot with snake_case fields directly */
export type BookedSlotLegacy = BookedSlot & {
  clubId?: string;
};
