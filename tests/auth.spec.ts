import { test, expect } from '@playwright/test';

test.describe('Xác thực người dùng (Authentication)', () => {

  test('Hiển thị đầy đủ form đăng nhập', async ({ page }) => {
    await page.goto('/login');
    
    // Kiểm tra tiêu đề trang
    await expect(page.getByText('Chào mừng trở lại')).toBeVisible();
    
    // Kiểm tra các trường nhập liệu
    await expect(page.getByPlaceholder('0912345678')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Kiểm tra nút bấm
    await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
  });

  test('Báo lỗi khi nhập sai định dạng số điện thoại', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder('0912345678').fill('123');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    
    // Kiểm tra thông báo lỗi validation
    await expect(page.getByText('Số điện thoại phải có 10-11 chữ số.')).toBeVisible();
  });

  test('Có thể chuyển sang tab Đăng ký', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('tab', { name: 'Đăng ký' }).click();
    
    await expect(page.getByText('Tạo tài khoản')).toBeVisible();
    await expect(page.getByText('Chỉ cần số điện thoại và mật khẩu để bắt đầu.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng ký', exact: true })).toBeVisible();
  });

  test('Thất bại khi đăng nhập với thông tin sai', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder('0912345678').fill('0999999999');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    
    // Đợi thông báo lỗi từ phía server (Toast)
    // Tăng timeout lên 10s đề phòng mạng chậm
    await expect(page.getByText('Đăng nhập thất bại')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Số điện thoại hoặc mật khẩu không chính xác.')).toBeVisible({ timeout: 10000 });
  });
});
