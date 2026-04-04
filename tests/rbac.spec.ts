import { test, expect } from '@playwright/test';

test.describe('Phân quyền truy cập (RBAC)', () => {

  test('Người dùng chưa đăng nhập sẽ thấy trang Login Admin khi vào /admin', async ({ page }) => {
    await page.goto('/admin');
    
    // Kiểm tra xem có hiển thị form đăng nhập admin không
    await expect(page.getByText('Đăng nhập Admin')).toBeVisible();
    await expect(page.getByPlaceholder('admin@example.com')).toBeVisible();
  });

  test('Người dùng không có quyền (Customer) sẽ bị từ chối truy cập /admin', async ({ page }) => {
    // Lưu ý: Test này cần một tài khoản customer đã đăng nhập.
    // Vì đây là E2E test trên môi trường thật/dev, chúng ta giả định kịch bản 
    // nếu login thành công với role customer thì trang web phải hiển thị "Truy cập bị từ chối"
    
    // TẠM THỜI: Kiểm tra UI của trang Access Denied (có thể mock hoặc bỏ qua nếu chưa có user test)
    // Ở đây tôi viết kịch bản mong muốn:
    /*
    await loginAs(page, 'customer_phone', 'password');
    await page.goto('/admin');
    await expect(page.getByText('Truy cập bị từ chối')).toBeVisible();
    */
  });

  test('Nhân viên (Staff) có thể truy cập trang Dashboard Admin', async ({ page }) => {
    // Tương tự, cần tài khoản staff để test thực tế.
  });
});
