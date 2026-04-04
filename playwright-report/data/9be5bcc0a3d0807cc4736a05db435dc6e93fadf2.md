# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.spec.ts >> Quy trình đặt sân (Booking Flow) >> Người dùng có thể xem danh sách câu lạc bộ và mở chi tiết
- Location: tests\booking.spec.ts:5:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('div[role="dialog"] button:has-text("Đặt ngay")')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('div[role="dialog"] button:has-text("Đặt ngay")')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - main [ref=e3]:
      - generic [ref=e4]:
        - heading "Khám phá & Đặt sân" [level=2] [ref=e5]
        - paragraph [ref=e6]: Đăng nhập để có trải nghiệm đặt sân tốt nhất.
        - generic [ref=e7]:
          - link "Đăng nhập" [ref=e8] [cursor=pointer]:
            - /url: /login
          - link "Đăng ký" [ref=e9] [cursor=pointer]:
            - /url: /login
      - generic [ref=e10]:
        - generic [ref=e11]:
          - img [ref=e12]
          - textbox "Tìm kiếm theo tên hoặc địa chỉ..." [ref=e15]
        - generic [ref=e16]:
          - button "Tất cả" [ref=e17] [cursor=pointer]
          - button "Cầu lông" [ref=e18] [cursor=pointer]
          - button "Bóng đá" [ref=e19] [cursor=pointer]
          - button "Pickleball" [ref=e20] [cursor=pointer]
          - button "Bóng bàn" [ref=e21] [cursor=pointer]
      - generic [ref=e23]:
        - generic [ref=e24] [cursor=pointer]:
          - img "Sân Cầu Lông ABC Premium image" [ref=e26]
          - generic [ref=e28]:
            - generic [ref=e29]:
              - generic [ref=e30]: Sân Cầu Lông ABC Premium
              - generic [ref=e31]:
                - img [ref=e32]
                - generic [ref=e34]: "5.0"
            - generic [ref=e35]:
              - generic [ref=e36]:
                - generic [ref=e37]:
                  - img [ref=e38]
                  - generic [ref=e41]: Quận 1 Thành Phố Hồ Chí Minh
                - paragraph [ref=e42]: 30k - 40k VND/giờ
              - button "Đặt ngay" [ref=e43]
        - generic [ref=e44] [cursor=pointer]:
          - img "Sân Cầu Lông Sao Vàng Badminton image" [ref=e46]
          - generic [ref=e48]:
            - generic [ref=e49]:
              - generic [ref=e50]: Sân Cầu Lông Sao Vàng Badminton
              - generic [ref=e51]:
                - img [ref=e52]
                - generic [ref=e54]: "4.8"
            - generic [ref=e55]:
              - generic [ref=e56]:
                - generic [ref=e57]:
                  - img [ref=e58]
                  - generic [ref=e61]: Phạm Tu, Tân Triều, Thanh Trì, Hà Nội
                - paragraph [ref=e62]: 30k - 40k VND/giờ
              - button "Đặt ngay" [ref=e63]
        - generic [ref=e64] [cursor=pointer]:
          - img "Sân cầu lông 12 Khuất Duy Tiến image" [ref=e66]
          - generic [ref=e68]:
            - generic [ref=e69]:
              - generic [ref=e70]: Sân cầu lông 12 Khuất Duy Tiến
              - generic [ref=e71]:
                - img [ref=e72]
                - generic [ref=e74]: "4.8"
            - generic [ref=e75]:
              - generic [ref=e76]:
                - generic [ref=e77]:
                  - img [ref=e78]
                  - generic [ref=e81]: 12 Khuất Duy Tiến, Thanh Xuân Trung, Thanh Xuân, Hà Nội
                - paragraph [ref=e82]: 30k - 40k VND/giờ
              - button "Đặt ngay" [ref=e83]
        - generic [ref=e84] [cursor=pointer]:
          - img "Sân Cầu 1991 Club image" [ref=e86]
          - generic [ref=e88]:
            - generic [ref=e89]:
              - generic [ref=e90]: Sân Cầu 1991 Club
              - generic [ref=e91]:
                - img [ref=e92]
                - generic [ref=e94]: "5.0"
            - generic [ref=e95]:
              - generic [ref=e96]:
                - generic [ref=e97]:
                  - img [ref=e98]
                  - generic [ref=e101]: Ngõ 286 Nguyễn Xiển, Thanh Xuân, Hà Nội
                - paragraph [ref=e102]: 30k - 40k VND/giờ
              - button "Đặt ngay" [ref=e103]
    - generic [ref=e104]:
      - link "Nhắn tin Facebook" [ref=e105] [cursor=pointer]:
        - /url: https://www.facebook.com/profile.php?id=61587156946212
        - img [ref=e106]
      - link "Zalo" [ref=e108] [cursor=pointer]:
        - /url: https://zalo.me/0982949974
        - img "Zalo" [ref=e109]
      - link "Gọi điện" [ref=e110] [cursor=pointer]:
        - /url: tel:0982949974
        - img [ref=e111]
    - navigation [ref=e113]:
      - generic [ref=e114]:
        - link "Đặt sân" [ref=e115] [cursor=pointer]:
          - /url: /booking
          - img [ref=e116]
          - generic [ref=e119]: Đặt sân
        - link "Tin tức" [ref=e120] [cursor=pointer]:
          - /url: /news
          - img [ref=e121]
          - generic [ref=e124]: Tin tức
        - link "Hợp tác" [ref=e125] [cursor=pointer]:
          - /url: /register-club
          - img [ref=e126]
          - generic [ref=e131]: Hợp tác
        - link "Lịch đặt" [ref=e132] [cursor=pointer]:
          - /url: /my-bookings
          - img [ref=e133]
          - generic [ref=e136]: Lịch đặt
        - link "Tài khoản" [ref=e137] [cursor=pointer]:
          - /url: /account
          - img [ref=e138]
          - generic [ref=e141]: Tài khoản
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e147] [cursor=pointer]:
    - img [ref=e148]
  - alert [ref=e151]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Quy trình đặt sân (Booking Flow)', () => {
  4  | 
  5  |   test('Người dùng có thể xem danh sách câu lạc bộ và mở chi tiết', async ({ page }) => {
  6  |     await page.goto('/booking');
  7  |     
  8  |     // Đợi danh sách câu lạc bộ tải xong (Skeletion biến mất)
  9  |     await page.waitForSelector('.grid-cols-1 .overflow-hidden', { state: 'visible', timeout: 15000 });
  10 |     
  11 |     // Click vào thẻ câu lạc bộ đầu tiên
  12 |     const firstClub = page.locator('.grid-cols-1 .overflow-hidden').first();
  13 |     await firstClub.click();
  14 |     
  15 |     // Đợi Sheet chi tiết xuất hiện hoàn toàn
  16 |     // Nút "Đặt ngay" trong Sheet nằm trong một dialog (SheetContent)
  17 |     const sheetOrderBtn = page.locator('div[role="dialog"] button:has-text("Đặt ngay")');
> 18 |     await expect(sheetOrderBtn).toBeVisible({ timeout: 10000 });
     |                                 ^ Error: expect(locator).toBeVisible() failed
  19 |   });
  20 | 
  21 |   test('Người dùng có thể vào trang đặt sân và chọn slot', async ({ page }) => {
  22 |     await page.goto('/booking');
  23 |     await page.waitForSelector('.grid-cols-1 .overflow-hidden', { state: 'visible', timeout: 15000 });
  24 |     
  25 |     // Click nút "Đặt ngay" trực tiếp trên thẻ CLB để mở Sheet
  26 |     const cardOrderBtn = page.locator('.grid-cols-1 .overflow-hidden').first().getByRole('button', { name: 'Đặt ngay' });
  27 |     await cardOrderBtn.click();
  28 |     
  29 |     // Click nút "Đặt ngay" trong Sheet để vào trang chọn sân
  30 |     const sheetOrderBtn = page.locator('div[role="dialog"] button:has-text("Đặt ngay")');
  31 |     await sheetOrderBtn.click();
  32 |     
  33 |     // Đợi trang trang chọn sân tải nội dung
  34 |     await expect(page.getByText('Lịch sân cầu lông')).toBeVisible({ timeout: 15000 });
  35 |     
  36 |     // Chờ bảng lịch sân xuất hiện
  37 |     await page.waitForSelector('button:has-text("k")', { state: 'attached', timeout: 10000 });
  38 |     
  39 |     // Tìm một slot còn trống và click
  40 |     const availableSlot = page.locator('button:has-text("k")').first();
  41 |     if (await availableSlot.isVisible()) {
  42 |       await availableSlot.click();
  43 |       
  44 |       // Kiểm tra xem giỏ hàng/nút Tiếp tục có hiện lên không
  45 |       await expect(page.getByText('Tổng cộng')).toBeVisible({ timeout: 10000 });
  46 |       await expect(page.getByRole('button', { name: 'Tiếp tục' })).toBeVisible();
  47 |     }
  48 |   });
  49 | 
  50 |   test('Kiểm tra bộ lọc câu lạc bộ', async ({ page }) => {
  51 |     await page.goto('/booking');
  52 |     
  53 |     const searchInput = page.getByPlaceholder('Tìm kiếm theo tên hoặc địa chỉ...');
  54 |     await expect(searchInput).toBeVisible();
  55 |     
  56 |     await searchInput.fill('NonExistentClubNameXYZ');
  57 |     await expect(page.getByText('Không có câu lạc bộ nào phù hợp.')).toBeVisible({ timeout: 10000 });
  58 |   });
  59 | });
  60 | 
```