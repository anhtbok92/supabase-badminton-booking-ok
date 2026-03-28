'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OverageReportData {
  month: string;
  total_overage_revenue: number;
  clubs: Array<{
    club_id: string;
    club_name: string;
    plan_name: string;
    quota: number;
    actual_bookings: number;
    overage_count: number;
    overage_fee: number;
  }>;
}

export function OverageReport() {
  const [reportData, setReportData] = useState<OverageReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const { toast } = useToast();

  // Initialize with current month
  useEffect(() => {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    setSelectedMonth(monthStr);
  }, []);

  // Fetch report data
  useEffect(() => {
    if (!selectedMonth) return;

    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/overage-report?month=${selectedMonth}`);
        if (!response.ok) {
          throw new Error('Failed to fetch overage report');
        }
        const data = await response.json();
        setReportData(data);
      } catch (error) {
        console.error('Error fetching overage report:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải báo cáo vượt mức',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedMonth, toast]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr);
    return new Intl.DateTimeFormat('vi-VN', { year: 'numeric', month: 'long' }).format(date);
  };

  const exportToCSV = () => {
    if (!reportData || reportData.clubs.length === 0) {
      toast({
        title: 'Không có dữ liệu',
        description: 'Không có dữ liệu để xuất',
        variant: 'destructive',
      });
      return;
    }

    // Create CSV content
    const headers = ['Câu lạc bộ', 'Gói', 'Quota', 'Booking thực tế', 'Vượt mức', 'Phí vượt mức'];
    const rows = reportData.clubs.map((club) => [
      club.club_name,
      club.plan_name,
      club.quota.toString(),
      club.actual_bookings.toString(),
      club.overage_count.toString(),
      club.overage_fee.toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      `Tổng doanh thu vượt mức,,,,,${reportData.total_overage_revenue}`,
    ].join('\n');

    // Create and download file
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `overage-report-${reportData.month}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Thành công',
      description: 'Đã xuất báo cáo ra file CSV',
    });
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert YYYY-MM to YYYY-MM-01
    const value = e.target.value;
    if (value) {
      setSelectedMonth(`${value}-01`);
    }
  };

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Báo cáo vượt mức booking</CardTitle>
            <CardDescription>
              Danh sách các CLB vượt quota và phí vượt mức - {reportData ? formatMonth(reportData.month) : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="month"
                value={selectedMonth ? selectedMonth.substring(0, 7) : ''}
                onChange={handleMonthChange}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm" disabled={!reportData || reportData.clubs.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Xuất CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {reportData && reportData.clubs.length > 0 ? (
          <>
            <div className="mb-4 rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tổng doanh thu vượt mức:</span>
                <span className="text-2xl font-bold">{formatCurrency(reportData.total_overage_revenue)}</span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Câu lạc bộ</TableHead>
                  <TableHead>Gói</TableHead>
                  <TableHead className="text-right">Quota</TableHead>
                  <TableHead className="text-right">Booking thực tế</TableHead>
                  <TableHead className="text-right">Vượt mức</TableHead>
                  <TableHead className="text-right">Phí vượt mức</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.clubs.map((club) => (
                  <TableRow key={club.club_id}>
                    <TableCell className="font-medium">{club.club_name}</TableCell>
                    <TableCell>{club.plan_name}</TableCell>
                    <TableCell className="text-right">{club.quota}</TableCell>
                    <TableCell className="text-right">{club.actual_bookings}</TableCell>
                    <TableCell className="text-right text-orange-600 font-medium">
                      +{club.overage_count}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(club.overage_fee)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={5} className="text-right">
                    Tổng cộng:
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(reportData.total_overage_revenue)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              Không có CLB nào vượt quota trong tháng này
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
