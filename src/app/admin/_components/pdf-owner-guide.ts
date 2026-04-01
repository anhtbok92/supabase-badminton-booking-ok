import {
    createPdfDoc, addPage, addPageNumbers, drawHeader, drawSectionTitle, drawSubSection,
    drawParagraph, drawBulletPoint, drawStepBox, drawInfoBox, drawTable,
    drawTableOfContents, drawFaqSection, drawContactBox,
} from './pdf-utils';

export function generateOwnerGuide() {
    const doc = createPdfDoc();

    let y = drawHeader(doc, 'HƯỚNG DẪN QUẢN LÝ', 'Dành cho Chủ sân Cầu lông', 'owner');
    y = drawParagraph(doc, y, 'Chào mừng bạn đến với Sport Booking! Tài liệu này hướng dẫn bạn sử dụng hệ thống quản lý câu lạc bộ cầu lông một cách hiệu quả nhất. Từ quản lý sân, đặt lịch, nhân viên đến theo dõi doanh thu.');

    y = drawTableOfContents(doc, y, [
        { num: '1', title: 'Đăng ký làm Chủ sân' },
        { num: '2', title: 'Tổng quan Dashboard' },
        { num: '3', title: 'Quản lý Câu lạc bộ & Sân' },
        { num: '4', title: 'Quản lý Lịch đặt sân' },
        { num: '5', title: 'Lịch cố định (Recurring)' },
        { num: '6', title: 'Quản lý Nhân viên' },
        { num: '7', title: 'Thống kê & Doanh thu' },
        { num: '8', title: 'Gói đăng ký & Thanh toán' },
        { num: '9', title: 'Câu hỏi thường gặp (FAQ)' },
    ]);

    // Mục 1: Đăng ký
    y = addPage(doc);
    y = drawSectionTitle(doc, y, '1', 'ĐĂNG KÝ LÀM CHỦ SÂN');
    y = drawSubSection(doc, y, 'Quy trình đăng ký');
    y = drawStepBox(doc, y, 1, 'Truy cập trang đăng ký', 'Vào trang chủ của Sport Booking, nhấn nút "Đăng ký làm đối tác" hoặc truy cập trực tiếp link đăng ký chủ sân.');
    y = drawStepBox(doc, y, 2, 'Chọn gói đăng ký', 'Hệ thống có 3 gói: FREE (miễn phí, 3 sân), BASIC (200.000đ/tháng, 10 sân), PRO (500.000đ/tháng, 30 sân). Chọn gói phù hợp với quy mô của bạn.');
    y = drawStepBox(doc, y, 3, 'Điền thông tin', 'Nhập: Họ tên, Email, Số điện thoại, Tên câu lạc bộ, Số lượng sân, Địa chỉ, Ghi chú (nếu có).');
    y = drawStepBox(doc, y, 4, 'Gửi đăng ký', 'Nhấn "Gửi đăng ký". Admin sẽ xem xét và phê duyệt. Bạn sẽ nhận thông báo qua email/điện thoại khi được duyệt.');
    y = drawStepBox(doc, y, 5, 'Nhận tài khoản', 'Sau khi được duyệt, bạn sẽ nhận tài khoản đăng nhập vào hệ thống quản lý (Admin Dashboard).');
    y = drawInfoBox(doc, y, 'Gói FREE - Dùng thử miễn phí', 'Gói FREE cho phép bạn dùng thử với 3 sân và 100 lượt đặt/tháng trong 3 tháng. Sau đó có thể nâng cấp lên BASIC hoặc PRO.', 'info');

    // Mục 2: Dashboard
    y = addPage(doc);
    y = drawSectionTitle(doc, y, '2', 'TỔNG QUAN DASHBOARD');
    y = drawParagraph(doc, y, 'Sau khi đăng nhập, bạn sẽ thấy Dashboard quản lý với các menu chính ở thanh bên trái:');
    y = drawTable(doc, y,
        ['Menu', 'Chức năng', 'Mô tả'],
        [
            ['Thống kê', 'Báo cáo', 'Xem doanh thu, số lượt đặt, tỷ lệ sử dụng sân'],
            ['Lịch sân', 'Lịch trình', 'Xem lịch đặt sân theo ngày, tuần, tháng'],
            ['Lịch cố định', 'Recurring', 'Quản lý lịch đặt cố định hàng tuần'],
            ['QL Lịch đặt', 'Booking', 'Xác nhận, từ chối, quản lý các lượt đặt sân'],
            ['QL CLB', 'Club', 'Chỉnh sửa thông tin câu lạc bộ, sân, giá'],
            ['QL Nhân viên', 'Staff', 'Thêm, sửa, xóa tài khoản nhân viên'],
        ]
    );
    y = drawInfoBox(doc, y, 'Thông báo tự động', 'Hệ thống sẽ gửi thông báo khi có người đặt sân mới, thanh toán mới, hoặc khi cần xử lý. Biểu tượng chuông ở góc trên bên phải hiển thị số thông báo chưa đọc.', 'info');

    // Mục 3: Quản lý CLB & Sân
    y = addPage(doc);
    y = drawSectionTitle(doc, y, '3', 'QUẢN LÝ CÂU LẠC BỘ & SÂN');
    y = drawSubSection(doc, y, 'Chỉnh sửa thông tin câu lạc bộ');
    y = drawStepBox(doc, y, 1, 'Vào menu "QL Câu lạc bộ"', 'Nhấn vào menu "Quản lý Câu lạc bộ" ở thanh bên trái.');
    y = drawStepBox(doc, y, 2, 'Chỉnh sửa thông tin', 'Cập nhật: Tên CLB, Địa chỉ, Số điện thoại, Giờ hoạt động, Mô tả dịch vụ, Hình ảnh.');
    y = drawStepBox(doc, y, 3, 'Upload hình ảnh', 'Tải lên hình ảnh câu lạc bộ để khách hàng có thể xem trước cơ sở vật chất. Hỗ trợ nhiều hình ảnh.');
    y = drawStepBox(doc, y, 4, 'Lưu thay đổi', 'Nhấn "Lưu" để cập nhật. Thông tin sẽ hiển thị ngay trên trang đặt sân của khách hàng.');

    y = drawSubSection(doc, y, 'Quản lý sân');
    y = drawParagraph(doc, y, 'Trong phần quản lý câu lạc bộ, bạn có thể thêm, sửa, xóa các sân:');
    y = drawBulletPoint(doc, y, 'Thêm sân mới: Nhập tên sân, trạng thái (hoạt động/bảo trì).');
    y = drawBulletPoint(doc, y, 'Thiết lập giá: Đặt giá theo khung giờ và ngày (ngày thường/cuối tuần).');
    y = drawBulletPoint(doc, y, 'Khóa sân: Tạm khóa sân khi bảo trì hoặc có sự kiện.');
    y = drawBulletPoint(doc, y, 'Số lượng sân tối đa phụ thuộc vào gói đăng ký của bạn.');

    y = drawSubSection(doc, y, 'Thiết lập bảng giá');
    y = drawParagraph(doc, y, 'Hệ thống hỗ trợ đặt giá linh hoạt theo khung giờ:');
    y = drawTable(doc, y,
        ['Khung giờ', 'Ngày thường', 'Cuối tuần'],
        [
            ['6:00 - 16:00', 'Giá thấp', 'Giá trung bình'],
            ['16:00 - 21:00', 'Giá cao (giờ vàng)', 'Giá cao nhất'],
            ['21:00 - 23:00', 'Giá trung bình', 'Giá cao'],
        ]
    );

    // Mục 4: Quản lý lịch đặt
    y = addPage(doc);
    y = drawSectionTitle(doc, y, '4', 'QUẢN LÝ LỊCH ĐẶT SÂN');
    y = drawSubSection(doc, y, 'Xem và xử lý booking');
    y = drawStepBox(doc, y, 1, 'Vào "QL Lịch đặt"', 'Menu "Quản lý Lịch đặt" hiển thị tất cả các lượt đặt sân của khách hàng.');
    y = drawStepBox(doc, y, 2, 'Lọc và tìm kiếm', 'Lọc theo ngày, trạng thái (chờ xác nhận, đã xác nhận, đã hủy) để tìm booking cần xử lý.');
    y = drawStepBox(doc, y, 3, 'Xác nhận booking', 'Với booking "Chờ xác nhận": Kiểm tra bằng chứng thanh toán, sau đó nhấn "Xác nhận" hoặc "Từ chối".');
    y = drawStepBox(doc, y, 4, 'Thông báo tự động', 'Khi bạn xác nhận hoặc từ chối, khách hàng sẽ nhận được thông báo tự động.');

    y = drawSubSection(doc, y, 'Xem lịch sân (Schedule)');
    y = drawParagraph(doc, y, 'Menu "Lịch sân" hiển thị bảng lịch trực quan:');
    y = drawBulletPoint(doc, y, 'Xem lịch theo ngày với tất cả các sân và khung giờ.');
    y = drawBulletPoint(doc, y, 'Màu sắc phân biệt trạng thái: trống, đã đặt, khóa, sự kiện.');
    y = drawBulletPoint(doc, y, 'Nhấn vào ô để xem chi tiết booking hoặc khóa/mở sân.');
    y = drawBulletPoint(doc, y, 'Chuyển ngày nhanh bằng nút mũi tên hoặc chọn từ lịch.');
    y = drawInfoBox(doc, y, 'Mẹo quản lý hiệu quả', 'Nên kiểm tra và xác nhận booking ít nhất 2 lần/ngày (sáng và chiều) để khách hàng không phải chờ lâu. Booking chưa xác nhận quá lâu có thể khiến khách hàng hủy.', 'warning');

    // Mục 5: Lịch cố định
    y = addPage(doc);
    y = drawSectionTitle(doc, y, '5', 'LỊCH CỐ ĐỊNH (RECURRING BOOKINGS)');
    y = drawParagraph(doc, y, 'Tính năng lịch cố định cho phép tạo booking lặp lại hàng tuần cho khách hàng thường xuyên.');
    y = drawSubSection(doc, y, 'Tạo lịch cố định');
    y = drawStepBox(doc, y, 1, 'Vào menu "Lịch cố định"', 'Nhấn vào menu "Lịch cố định" ở thanh bên trái.');
    y = drawStepBox(doc, y, 2, 'Thêm lịch mới', 'Nhấn nút "Thêm lịch cố định". Chọn: Sân, Thứ trong tuần, Khung giờ, Tên khách hàng, Số điện thoại.');
    y = drawStepBox(doc, y, 3, 'Thiết lập thời gian', 'Chọn ngày bắt đầu và ngày kết thúc (hoặc để trống nếu không giới hạn). Hệ thống sẽ tự động tạo booking mỗi tuần.');
    y = drawStepBox(doc, y, 4, 'Quản lý', 'Có thể tạm dừng, tiếp tục, hoặc hủy lịch cố định bất kỳ lúc nào.');
    y = drawInfoBox(doc, y, 'Ưu điểm lịch cố định', 'Lịch cố định giúp giữ chân khách hàng thường xuyên, đảm bảo doanh thu ổn định, và giảm thời gian quản lý booking thủ công.', 'info');

    // Mục 6: Quản lý nhân viên
    y += 5;
    y = drawSectionTitle(doc, y, '6', 'QUẢN LÝ NHÂN VIÊN');
    y = drawSubSection(doc, y, 'Thêm nhân viên');
    y = drawStepBox(doc, y, 1, 'Vào "QL Nhân viên"', 'Menu "Quản lý Nhân viên" cho phép bạn thêm người hỗ trợ quản lý sân.');
    y = drawStepBox(doc, y, 2, 'Tạo tài khoản', 'Nhập: Tên, Số điện thoại, Mật khẩu cho nhân viên. Hệ thống sẽ tạo tài khoản với quyền "staff".');
    y = drawStepBox(doc, y, 3, 'Phân quyền', 'Nhân viên có thể: Xem lịch sân, Quản lý booking, Xem lịch cố định. Không thể: Chỉnh sửa thông tin CLB, Xem thống kê doanh thu.');

    // Mục 7: Thống kê
    y = addPage(doc);
    y = drawSectionTitle(doc, y, '7', 'THỐNG KÊ & DOANH THU');
    y = drawSubSection(doc, y, 'Dashboard thống kê');
    y = drawParagraph(doc, y, 'Menu "Thống kê" cung cấp cái nhìn tổng quan về hoạt động kinh doanh:');
    y = drawBulletPoint(doc, y, 'Tổng doanh thu theo ngày/tuần/tháng/năm.');
    y = drawBulletPoint(doc, y, 'Số lượt đặt sân và tỷ lệ tăng trưởng.');
    y = drawBulletPoint(doc, y, 'Tỷ lệ sử dụng sân (VD: 94% công suất).');
    y = drawBulletPoint(doc, y, 'Biểu đồ xu hướng booking theo thời gian.');
    y = drawBulletPoint(doc, y, 'Doanh thu theo từng sân để biết sân nào hiệu quả nhất.');

    y = drawSubSection(doc, y, 'Báo cáo chi tiết');
    y = drawParagraph(doc, y, 'Bạn có thể lọc báo cáo theo khoảng thời gian bất kỳ để phân tích xu hướng kinh doanh và đưa ra quyết định điều chỉnh giá, khuyến mãi phù hợp.');

    // Mục 8: Gói đăng ký
    y += 5;
    y = drawSectionTitle(doc, y, '8', 'GÓI ĐĂNG KÝ & THANH TOÁN');
    y = drawSubSection(doc, y, 'So sánh các gói');
    y = drawTable(doc, y,
        ['Tính năng', 'FREE', 'BASIC', 'PRO'],
        [
            ['Giá/tháng', '0đ', '200.000đ', '500.000đ'],
            ['Giá/năm', '0đ', '2.000.000đ', '5.000.000đ'],
            ['Số sân tối đa', '3', '10', '30'],
            ['Booking/tháng', '100', '1.000', '3.000'],
            ['Phí vượt mức', '0đ', '2.000đ/booking', '1.500đ/booking'],
            ['Báo cáo', 'Cơ bản', 'Nâng cao', 'AI-powered'],
        ]
    );

    y = drawSubSection(doc, y, 'Theo dõi sử dụng');
    y = drawParagraph(doc, y, 'Hệ thống tự động theo dõi số sân và số booking của bạn:');
    y = drawBulletPoint(doc, y, 'Hiển thị realtime: "450/1000 bookings" ngay trên dashboard.');
    y = drawBulletPoint(doc, y, 'Cảnh báo khi đạt 80%, 90%, 100% quota.');
    y = drawBulletPoint(doc, y, 'Thông báo 7 ngày trước khi gói hết hạn.');
    y = drawBulletPoint(doc, y, 'Tự động chuyển về gói FREE nếu hết hạn mà không gia hạn.');
    y = drawInfoBox(doc, y, 'Nâng cấp gói', 'Để nâng cấp gói, liên hệ admin qua hotline hoặc gửi yêu cầu trong hệ thống. Việc nâng cấp sẽ có hiệu lực ngay lập tức.', 'info');

    // Mục 9: FAQ
    y = addPage(doc);
    y = drawSectionTitle(doc, y, '9', 'CÂU HỎI THƯỜNG GẶP (FAQ)');
    y = drawFaqSection(doc, y, [
        { q: 'Tôi có thể quản lý nhiều câu lạc bộ không?', a: 'Có, tùy thuộc vào gói đăng ký. Mỗi câu lạc bộ được quản lý độc lập với thống kê riêng.' },
        { q: 'Nhân viên có thể xem doanh thu không?', a: 'Không. Nhân viên chỉ có quyền xem lịch sân, quản lý booking và lịch cố định. Thống kê doanh thu chỉ dành cho chủ sân.' },
        { q: 'Nếu vượt quá số booking cho phép thì sao?', a: 'Hệ thống vẫn cho phép đặt sân nhưng sẽ tính phí vượt mức theo gói của bạn. VD: Gói BASIC tính 2.000đ/booking vượt mức.' },
        { q: 'Làm sao để đổi gói đăng ký?', a: 'Liên hệ admin hệ thống để yêu cầu nâng cấp hoặc hạ cấp gói. Thay đổi sẽ có hiệu lực ngay.' },
        { q: 'Dữ liệu có an toàn không?', a: 'Hệ thống sử dụng Supabase với bảo mật cấp doanh nghiệp, mã hóa dữ liệu và sao lưu tự động hàng ngày.' },
    ]);

    y = drawContactBox(doc, y, 'SẴN SÀNG BẮT ĐẦU?', [
        'Đăng ký ngay hôm nay để trải nghiệm hệ thống quản lý sân cầu lông',
        'hiện đại và chuyên nghiệp nhất!',
    ]);

    addPageNumbers(doc);
    return doc;
}
