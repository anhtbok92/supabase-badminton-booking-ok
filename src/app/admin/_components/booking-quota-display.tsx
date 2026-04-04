'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BookingQuotaData {
  current_count: number;
  max_allowed: number;
  overage_count: number;
  overage_fee: number;
  usage_percentage: number;
  month_label: string;
}

export function BookingQuotaDisplay({ clubId }: { clubId: string }) {
  const supabase = useSupabase();
  const [quotaData, setQuotaData] = useState<BookingQuotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('check_booking_quota', { 
          p_club_id: clubId 
        });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setQuotaData(data[0]);
        }
      } catch (err: any) {
        console.error('Failed to fetch booking quota:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuota();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchQuota, 30000);
    return () => clearInterval(interval);
  }, [clubId, supabase]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-headline">Quota Booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (error || !quotaData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-headline">Quota Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Không thể tải thông tin quota</p>
        </CardContent>
      </Card>
    );
  }

  const { current_count, max_allowed, overage_count, overage_fee, usage_percentage, month_label } = quotaData;
  const isOverage = current_count > max_allowed;
  const isNearLimit = usage_percentage >= 80 && !isOverage;

  return (
    <Card className="bg-white/50 backdrop-blur-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 font-headline">
          <TrendingUp className="h-4 w-4 text-primary" />
          Quota Booking {month_label}
        </CardTitle>
        <CardDescription>Số lượng booking thực tế trong tháng này</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">
              {current_count} / {max_allowed} bookings
            </span>
            <Badge variant={isOverage ? 'destructive' : isNearLimit ? 'default' : 'secondary'}>
              {usage_percentage.toFixed(1)}%
            </Badge>
          </div>
          <Progress 
            value={Math.min(usage_percentage, 100)} 
            className={isOverage ? 'bg-destructive/20' : isNearLimit ? 'bg-yellow-200' : ''}
          />
        </div>

        {isNearLimit && !isOverage && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Đã sử dụng {usage_percentage.toFixed(1)}% quota. Cân nhắc nâng cấp gói để tránh phí vượt mức.
            </AlertDescription>
          </Alert>
        )}

        {isOverage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <div className="font-semibold mb-1">Đã vượt quota!</div>
              <div>Vượt mức: {overage_count} bookings</div>
              <div>Phí vượt mức: {new Intl.NumberFormat('vi-VN').format(overage_fee)}đ</div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
