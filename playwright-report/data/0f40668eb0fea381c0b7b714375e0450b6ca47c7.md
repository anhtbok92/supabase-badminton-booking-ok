# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Xác thực người dùng (Authentication) >> Thất bại khi đăng nhập với thông tin sai
- Location: tests\auth.spec.ts:40:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Đăng nhập thất bại')
Expected: visible
Error: strict mode violation: getByText('Đăng nhập thất bại') resolved to 2 elements:
    1) <div class="text-sm font-semibold">Đăng nhập thất bại</div> aka getByText('Đăng nhập thất bại', { exact: true })
    2) <span role="status" aria-atomic="true" aria-live="assertive">Notification Đăng nhập thất bạiSố điện thoại hoặc…</span> aka getByText('Notification Đăng nhập thất b')

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Đăng nhập thất bại')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - button "Quay lại" [ref=e4] [cursor=pointer]:
        - img
        - generic [ref=e5]: Quay lại
      - heading "Đăng nhập / Đăng ký" [level=1] [ref=e6]
  - generic [ref=e8]:
    - tablist [ref=e9]:
      - tab "Đăng nhập" [selected] [ref=e10] [cursor=pointer]
      - tab "Đăng ký" [ref=e11] [cursor=pointer]
    - tabpanel "Đăng nhập" [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]: Chào mừng trở lại
          - generic [ref=e16]: Nhập số điện thoại và mật khẩu của bạn để tiếp tục.
        - generic [ref=e18]:
          - generic [ref=e19]:
            - text: Số điện thoại
            - textbox "Số điện thoại" [ref=e20]:
              - /placeholder: "0912345678"
              - text: "0999999999"
          - generic [ref=e21]:
            - text: Mật khẩu
            - textbox "Mật khẩu" [ref=e22]: wrongpassword
          - button "Đăng nhập" [ref=e23] [cursor=pointer]
  - region "Notifications (F8)":
    - list [ref=e25]:
      - status [ref=e26]:
        - generic [ref=e27]:
          - generic [ref=e28]: Đăng nhập thất bại
          - generic [ref=e29]: Số điện thoại hoặc mật khẩu không chính xác.
        - button [ref=e30] [cursor=pointer]:
          - img [ref=e31]
  - button "Open Next.js Dev Tools" [ref=e40] [cursor=pointer]:
    - img [ref=e41]
  - alert [ref=e44]
  - status [ref=e45]: Notification Đăng nhập thất bạiSố điện thoại hoặc mật khẩu không chính xác.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Xác thực người dùng (Authentication)', () => {
  4  | 
  5  |   test('Hiển thị đầy đủ form đăng nhập', async ({ page }) => {
  6  |     await page.goto('/login');
  7  |     
  8  |     // Kiểm tra tiêu đề trang
  9  |     await expect(page.getByText('Chào mừng trở lại')).toBeVisible();
  10 |     
  11 |     // Kiểm tra các trường nhập liệu
  12 |     await expect(page.getByPlaceholder('0912345678')).toBeVisible();
  13 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  14 |     
  15 |     // Kiểm tra nút bấm
  16 |     await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
  17 |   });
  18 | 
  19 |   test('Báo lỗi khi nhập sai định dạng số điện thoại', async ({ page }) => {
  20 |     await page.goto('/login');
  21 |     
  22 |     await page.getByPlaceholder('0912345678').fill('123');
  23 |     await page.locator('input[type="password"]').fill('password123');
  24 |     await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  25 |     
  26 |     // Kiểm tra thông báo lỗi validation
  27 |     await expect(page.getByText('Số điện thoại phải có 10-11 chữ số.')).toBeVisible();
  28 |   });
  29 | 
  30 |   test('Có thể chuyển sang tab Đăng ký', async ({ page }) => {
  31 |     await page.goto('/login');
  32 |     
  33 |     await page.getByRole('tab', { name: 'Đăng ký' }).click();
  34 |     
  35 |     await expect(page.getByText('Tạo tài khoản')).toBeVisible();
  36 |     await expect(page.getByText('Chỉ cần số điện thoại và mật khẩu để bắt đầu.')).toBeVisible();
  37 |     await expect(page.getByRole('button', { name: 'Đăng ký', exact: true })).toBeVisible();
  38 |   });
  39 | 
  40 |   test('Thất bại khi đăng nhập với thông tin sai', async ({ page }) => {
  41 |     await page.goto('/login');
  42 |     
  43 |     await page.getByPlaceholder('0912345678').fill('0999999999');
  44 |     await page.locator('input[type="password"]').fill('wrongpassword');
  45 |     await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  46 |     
  47 |     // Đợi thông báo lỗi từ phía server (Toast)
  48 |     // Tăng timeout lên 10s đề phòng mạng chậm
> 49 |     await expect(page.getByText('Đăng nhập thất bại')).toBeVisible({ timeout: 10000 });
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  50 |     await expect(page.getByText('Số điện thoại hoặc mật khẩu không chính xác.')).toBeVisible({ timeout: 10000 });
  51 |   });
  52 | });
  53 | 
```