import { test, expect } from '@playwright/test';

test.describe('Quy trình đặt sân (Booking Flow)', () => {

  test('Người dùng có thể xem danh sách câu lạc bộ và mở chi tiết', async ({ page }) => {
    await page.goto('/booking');
    
    // Đợi danh sách câu lạc bộ tải xong (Skeletion biến mất)
    await page.waitForSelector('.grid-cols-1 .overflow-hidden', { state: 'visible', timeout: 15000 });
    
    // Click vào thẻ câu lạc bộ đầu tiên
    const firstClub = page.locator('.grid-cols-1 .overflow-hidden').first();
    await firstClub.click();
    
    // Đợi Sheet chi tiết xuất hiện hoàn toàn
    // Nút "Đặt ngay" trong Sheet nằm trong một dialog (SheetContent)
    const sheetOrderBtn = page.locator('div[role="dialog"] button:has-text("Đặt ngay")');
    await expect(sheetOrderBtn).toBeVisible({ timeout: 10000 });
  });

  test('Người dùng có thể vào trang đặt sân và chọn slot', async ({ page }) => {
    await page.goto('/booking');
    await page.waitForSelector('.grid-cols-1 .overflow-hidden', { state: 'visible', timeout: 15000 });
    
    // Click nút "Đặt ngay" trực tiếp trên thẻ CLB để mở Sheet
    const cardOrderBtn = page.locator('.grid-cols-1 .overflow-hidden').first().getByRole('button', { name: 'Đặt ngay' });
    await cardOrderBtn.click();
    
    // Click nút "Đặt ngay" trong Sheet để vào trang chọn sân
    const sheetOrderBtn = page.locator('div[role="dialog"] button:has-text("Đặt ngay")');
    await sheetOrderBtn.click();
    
    // Đợi trang trang chọn sân tải nội dung
    await expect(page.getByText('Lịch sân cầu lông')).toBeVisible({ timeout: 15000 });
    
    // Chờ bảng lịch sân xuất hiện
    await page.waitForSelector('button:has-text("k")', { state: 'attached', timeout: 10000 });
    
    // Tìm một slot còn trống và click
    const availableSlot = page.locator('button:has-text("k")').first();
    if (await availableSlot.isVisible()) {
      await availableSlot.click();
      
      // Kiểm tra xem giỏ hàng/nút Tiếp tục có hiện lên không
      await expect(page.getByText('Tổng cộng')).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: 'Tiếp tục' })).toBeVisible();
    }
  });

  test('Kiểm tra bộ lọc câu lạc bộ', async ({ page }) => {
    await page.goto('/booking');
    
    const searchInput = page.getByPlaceholder('Tìm kiếm theo tên hoặc địa chỉ...');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('NonExistentClubNameXYZ');
    await expect(page.getByText('Không có câu lạc bộ nào phù hợp.')).toBeVisible({ timeout: 10000 });
  });
});
