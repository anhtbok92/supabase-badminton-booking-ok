# Clean Code & Component Structure Guidelines

## Nguyên tắc tổ chức code

### 1. Tách nhỏ theo chức năng
- Mỗi trang lớn (admin, dashboard...) phải tách component theo từng menu/chức năng riêng biệt.
- KHÔNG gộp nhiều chức năng vào 1 file. Mỗi file tối đa ~300 dòng.
- Sử dụng thư mục `_components/` trong mỗi route folder để chứa các component con.

### 2. Cấu trúc thư mục chuẩn
```
src/app/[route]/
├── page.tsx                    # Entry point - chỉ chứa logic routing/auth
├── _components/
│   ├── schemas.ts              # Zod schemas & types dùng chung
│   ├── [feature]-manager.tsx   # Component chính cho từng chức năng
│   └── [shared-component].tsx  # Component dùng chung trong route
```

### 3. Quy tắc đặt tên
- File component: `kebab-case.tsx` (ví dụ: `booking-manager.tsx`)
- File schema/utils: `kebab-case.ts`
- Export component: `PascalCase` (ví dụ: `export function BookingManager`)
- Component nội bộ (không export): giữ `function` bình thường

### 4. Quản lý imports
- Mỗi file tự import những gì nó cần, không import qua file trung gian.
- Schemas và types dùng chung đặt trong `schemas.ts`.
- Utility functions dùng chung đặt trong file riêng và export.

### 5. Nguyên tắc clean code
- Không duplicate code. Logic dùng chung phải extract ra utility/hook.
- Component con (dialog, form) nên nằm cùng file với component cha nếu chỉ dùng ở đó.
- Nếu component con dùng ở nhiều nơi, tách ra file riêng.
- Giữ `page.tsx` gọn nhẹ: chỉ chứa auth check, loading state, và render component chính.

### 6. Khi thêm chức năng mới
- Tạo file mới trong `_components/` cho chức năng đó.
- Import và render trong component dashboard/layout chính.
- KHÔNG thêm code trực tiếp vào file đã có sẵn nếu nó không liên quan.
