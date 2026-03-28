'use client';

import { useMemo } from 'react';
import { useSupabaseQuery } from '@/supabase';
import type { ClubSubscription, SubscriptionPlan, BookingUsageTracking, Club } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, Users, Database } from 'lucide-react';
import { Pie, PieChart, Cell, Legend, Tooltip } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { OverageReport } from './overage-report';

const PLAN_COLORS = {
  FREE: 'hsl(var(--chart-1))',
  BASIC: 'hsl(var(--chart-2))',
  PRO: 'hsl(var(--chart-3))',
};

export function SubscriptionDashboard() {
  // Fetch all necessary data
  const { data: subscriptions, loading: subscriptionsLoading } = useSupabaseQuery<ClubSubscription>(
    'club_subscriptions',
    (q) => q.eq('is_active', true).select('*, plan:subscription_plans(*)')
  );

  const { data: plans, loading: plansLoading } = useSupabaseQuery<SubscriptionPlan>('subscription_plans');

  const { data: usageTracking, loading: usageLoading } = useSupabaseQuery<BookingUsageTracking>(
    'booking_usage_tracking',
    (q) => {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      const monthStr = currentMonth.toISOString().split('T')[0];
      return q.eq('month', monthStr);
    }
  );

  const { data: clubs, loading: clubsLoading } = useSupabaseQuery<Club>('clubs');

  const loading = subscriptionsLoading || plansLoading || usageLoading || clubsLoading;

  // Calculate statistics
  const stats = useMemo(() => {
    if (!subscriptions || !plans || !usageTracking || !clubs) {
      return {
        mrr: 0,
        arr: 0,
        totalOverageRevenue: 0,
        clubDistribution: [],
        avgBookingsPerPlan: [],
        totalBookings: 0,
        supabaseEstimate: {
          storage: 0,
          bandwidth: 0,
          estimatedCost: 0,
        },
      };
    }

    // Calculate MRR and ARR
    let mrr = 0;
    let arr = 0;

    subscriptions.forEach((sub) => {
      const plan = sub.plan || plans.find((p) => p.id === sub.plan_id);
      if (!plan) return;

      if (sub.billing_cycle === 'monthly') {
        mrr += plan.monthly_price;
        arr += plan.monthly_price * 12;
      } else if (sub.billing_cycle === 'yearly') {
        mrr += plan.yearly_price / 12;
        arr += plan.yearly_price;
      }
    });

    // Calculate total overage revenue
    const totalOverageRevenue = usageTracking.reduce((sum, usage) => sum + usage.overage_fee, 0);

    // Club distribution by plan
    const planCounts: Record<string, number> = { FREE: 0, BASIC: 0, PRO: 0 };
    subscriptions.forEach((sub) => {
      const plan = sub.plan || plans.find((p) => p.id === sub.plan_id);
      if (plan) {
        planCounts[plan.name] = (planCounts[plan.name] || 0) + 1;
      }
    });

    const clubDistribution = Object.entries(planCounts).map(([name, count]) => ({
      name,
      value: count,
      fill: PLAN_COLORS[name as keyof typeof PLAN_COLORS],
    }));

    // Average bookings per club per plan
    const bookingsByPlan: Record<string, { total: number; count: number }> = {
      FREE: { total: 0, count: 0 },
      BASIC: { total: 0, count: 0 },
      PRO: { total: 0, count: 0 },
    };

    usageTracking.forEach((usage) => {
      const sub = subscriptions.find((s) => s.club_id === usage.club_id);
      if (sub) {
        const plan = sub.plan || plans.find((p) => p.id === sub.plan_id);
        if (plan) {
          bookingsByPlan[plan.name].total += usage.booking_count;
          bookingsByPlan[plan.name].count += 1;
        }
      }
    });

    const avgBookingsPerPlan = Object.entries(bookingsByPlan).map(([planName, data]) => ({
      plan: planName,
      average: data.count > 0 ? Math.round(data.total / data.count) : 0,
      totalClubs: data.count,
    }));

    // Total bookings across all clubs
    const totalBookings = usageTracking.reduce((sum, usage) => sum + usage.booking_count, 0);

    // Supabase usage estimation (simplified)
    // Assuming: 1 booking = ~10KB storage, 1 booking = ~50KB bandwidth
    const storageGB = (totalBookings * 10) / (1024 * 1024); // Convert KB to GB
    const bandwidthGB = (totalBookings * 50) / (1024 * 1024); // Convert KB to GB
    
    // Supabase free tier: 500MB storage, 2GB bandwidth
    // Pro tier: $25/month for 8GB storage, 50GB bandwidth
    let estimatedCost = 0;
    if (storageGB > 0.5 || bandwidthGB > 2) {
      estimatedCost = 25; // Basic Pro tier cost
    }

    return {
      mrr,
      arr,
      totalOverageRevenue,
      clubDistribution,
      avgBookingsPerPlan,
      totalBookings,
      supabaseEstimate: {
        storage: storageGB,
        bandwidth: bandwidthGB,
        estimatedCost,
      },
    };
  }, [subscriptions, plans, usageTracking, clubs]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR (Doanh thu tháng)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.mrr)}</div>
            <p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR (Doanh thu năm)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.arr)}</div>
            <p className="text-xs text-muted-foreground">Annual Recurring Revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu vượt mức</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalOverageRevenue)}</div>
            <p className="text-xs text-muted-foreground">Tháng này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng CLB</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Đang hoạt động</p>
          </CardContent>
        </Card>
      </div>

      {/* Club Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Phân bổ CLB theo gói</CardTitle>
          <CardDescription>Số lượng câu lạc bộ theo từng gói đăng ký</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              FREE: { label: 'Gói Miễn phí', color: PLAN_COLORS.FREE },
              BASIC: { label: 'Gói Cơ bản', color: PLAN_COLORS.BASIC },
              PRO: { label: 'Gói Chuyên nghiệp', color: PLAN_COLORS.PRO },
            }}
            className="h-80 w-full"
          >
            <PieChart>
              <Pie
                data={stats.clubDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {stats.clubDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">{payload[0].name}</span>
                            <span className="text-sm font-bold">{payload[0].value} CLB</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trung bình booking theo gói</CardTitle>
            <CardDescription>Số booking trung bình mỗi CLB theo từng gói (tháng này)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gói</TableHead>
                  <TableHead className="text-right">Số CLB</TableHead>
                  <TableHead className="text-right">TB Booking/CLB</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.avgBookingsPerPlan.map((item) => (
                  <TableRow key={item.plan}>
                    <TableCell className="font-medium">{item.plan}</TableCell>
                    <TableCell className="text-right">{item.totalClubs}</TableCell>
                    <TableCell className="text-right">{item.average}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>Tổng</TableCell>
                  <TableCell className="text-right">
                    {stats.avgBookingsPerPlan.reduce((sum, item) => sum + item.totalClubs, 0)}
                  </TableCell>
                  <TableCell className="text-right">{stats.totalBookings}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ước tính Supabase</CardTitle>
            <CardDescription>Dự đoán chi phí Supabase dựa trên usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Storage</span>
              </div>
              <span className="text-sm font-medium">
                {stats.supabaseEstimate.storage.toFixed(2)} GB
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Bandwidth</span>
              </div>
              <span className="text-sm font-medium">
                {stats.supabaseEstimate.bandwidth.toFixed(2)} GB
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm font-medium">Chi phí ước tính</span>
              <span className="text-lg font-bold">
                ${stats.supabaseEstimate.estimatedCost}/tháng
              </span>
            </div>
            {stats.supabaseEstimate.estimatedCost === 0 && (
              <p className="text-xs text-muted-foreground">
                Hiện tại vẫn trong free tier của Supabase
              </p>
            )}
            {stats.supabaseEstimate.estimatedCost > 0 && (
              <p className="text-xs text-yellow-600">
                ⚠️ Đã vượt free tier, cần nâng cấp Supabase plan
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overage Report */}
      <OverageReport />
    </div>
  );
}
