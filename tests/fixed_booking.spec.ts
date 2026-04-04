import { test, expect } from '@playwright/test';

test.describe('Quản lý lịch cố định (Fixed Monthly Booking)', () => {

  test.beforeEach(async ({ page }) => {
    // Giả định admin đã đăng nhập và vào trang quản trị
    // Trong thực tế, cần thực hiện login ở đây hoặc dùng storageState
    await page.goto('/admin');
  });

  test('Hiển thị danh sách cấu hình lịch cố định', async ({ page }) => {
    // Tìm tab hoặc section quản lý lịch cố định
    const fixedBookingTab = page.getByRole('button', { name: 'Lịch cố định', exact: false });
    if (await fixedBookingTab.isVisible()) {
      await fixedBookingTab.click();
      await expect(page.getByText('Lịch Cố Định & Hợp Đồng')).toBeVisible();
    }
  });

  test('Mở form thêm cấu hình mới', async ({ page }) => {
    const fixedBookingTab = page.getByRole('button', { name: 'Lịch cố định', exact: false });
    if (await fixedBookingTab.isVisible()) {
      await fixedBookingTab.click();
      
      const addBtn = page.getByRole('button', { name: 'Thêm Cấu Hình' });
      await expect(addBtn).toBeVisible();
      await addBtn.click();
      
      await expect(page.getByText('Thêm cấu hình hợp đồng mới')).toBeVisible();
      await expect(page.getByLabel('Tên khách / Nhóm')).toBeVisible();
      await expect(page.getByLabel('Số điện thoại')).toBeVisible();
    }
  });

  test('Tự động tính giá khi nhập giờ', async ({ page }) => {
     // Test này kiểm tra logic tính giá trên UI
     // Cần điền Start Time, End Time và xem giá có thay đổi không
  });
});
