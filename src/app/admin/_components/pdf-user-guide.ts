import {
    createPdfDoc, addPage, addPageNumbers, drawHeader, drawSectionTitle, drawSubSection,
    drawParagraph, drawBulletPoint, drawStepBox, drawInfoBox, drawTable,
    drawTableOfContents, drawFaqSection, drawContactBox,
} from './pdf-utils';

export function generateUserGuide() {
    const doc = createPdfDoc();

    // Trang bìa
    let y = drawHeader(doc, 'HƯỚNG DẪN SỬ DỤNG', 'Hệ thống Đặt sân Cầu lông Online', 'user');
    y = drawParagraph(doc, y, 'Chào mừng bạn đến với Sport Booking - nền tảng đặt sân cầu lông trực tuyến hàng đầu. Tài liệu này sẽ hướng dẫn bạn sử dụng tất cả các tính năng của hệ thống một cách chi tiết và dễ hiểu.');

    y = drawTableOfContents(doc, y, [
        { num: '1', title: 'Đăng ký & Đăng nhập tài khoản' },
        { num: '2', title: 'Tìm kiếm và chọn sân cầu lông' },
        { num: '3', title: 'Đặt sân theo giờ' },
        { num: '4', title: 'Thanh toán' },
        { num: '5', title: 'Quản lý lịch đặt sân' },
        { num: '6', title: 'Quản lý tài khoản cá nhân' },
        { num: '7', title: 'Đọc tin tức & cập nhật' },
        { num: '8', title: 'Câu hỏi thường gặp (FAQ)' },
    ]);

    // Mục 1: Đăng ký & Đăng nhập
    y = addPage(doc);
    y = drawSectionTitle(doc, y, '1', 'ĐĂNG KÝ & ĐĂNG NHẬP TÀI KHOẢN');
    y = drawSubSection(doc, y, 'Đăng ký tài khoản mới');
    y = drawStepBox(doc, y, 1, 'Truy cập trang đăng nhập', 'Mở ứng dụng hoặc truy cập website, nhấn vào nút "Đăng nhập" ở góc trên bên phải màn hình.');
    y = drawStepBox(doc, y, 2, 'Chọn "Đăng ký"', 'Tại trang đăng nhập, nhấn vào tab "Đăng ký" để chuyển sang form đăng ký tài khoản mới.');
    y = drawStepBox(doc, y, 3, 'Nhập thông tin', 'Điền đầy đủ: Họ và tên, Số điện thoại (10-11 số), Mật khẩu (tối thiểu 6 ký tự). Số điện thoại sẽ là tài khoản đăng nhập của bạn.');
    y = drawStepBox(doc, y, 4, 'Xác nhận đăng ký', 'Nhấn nút "Đăng ký" để hoàn tất. Hệ thống sẽ tự động đăng nhập và đưa bạn vào trang chính.');
    y = drawInfoBox(doc, y, 'Lưu ý quan trọng', 'Số điện thoại là tài khoản duy nhất của bạn. Mỗi số điện thoại chỉ đăng ký được 1 tài khoản. Hãy nhớ mật khẩu để đăng nhập lần sau.', 'warning');

    y = drawSubSection(doc, y, 'Đăng nhập');
    y = drawStepBox(doc, y, 1, 'Nhập số điện thoại', 'Nhập số điện thoại đã đăng ký vào ô "Số điện thoại".');
    y = drawStepBox(doc, y, 2, 'Nhập mật khẩu', 'Nhập mật khẩu của bạn vào ô "Mật khẩu".');
    y = drawStepBox(doc, y, 3, 'Nhấn "Đăng nhập"', 'Hệ thống sẽ xác thực và đưa bạn vào trang chính nếu thông tin chính xác.');

    // Mục 2: Tìm kiếm sân
    y = addPage(doc);
    y = drawSectionTitle(doc, y, '2', 'TÌM KIẾM VÀ CHỌN SÂN CẦU LÔNG');
    y = drawSubSection(doc, y, 'Xem danh sách câu lạc bộ');
    y = drawParagraph(doc, y, 'Tại trang chính "Đặt sân", bạn sẽ thấy danh sách tất cả các câu lạc bộ cầu lông đang hoạt động trên hệ thống.');
    y = drawBulletPoint(doc, y, 'Mỗi câu lạc bộ hiển thị: Tên, địa chỉ, số điện thoại, giờ hoạt động, giá từ...');
    y = drawBulletPoint(doc, y, 'Hình ảnh câu lạc bộ giúp bạn hình dung cơ sở vật chất trước khi đến.');
    y = drawBulletPoint(doc, y, 'Biểu tượng trạng thái cho biết câu lạc bộ đang mở hay đóng.');

    y = drawSubSection(doc, y, 'Tìm kiếm & Lọc');
    y = drawStepBox(doc, y, 1, 'Tìm kiếm theo tên', 'Sử dụng thanh tìm kiếm ở đầu trang để nhập tên câu lạc bộ hoặc khu vực bạn muốn tìm.');
    y = drawStepBox(doc, y, 2, 'Lọc theo loại hình', 'Chọn loại hình thể thao (Cầu lông, Pickleball...) để lọc danh sách phù hợp.');
    y = drawStepBox(doc, y, 3, 'Xem chi tiết', 'Nhấn vào câu lạc bộ để xem thông tin chi tiết: bản đồ, dịch vụ, bảng giá, và nút đặt sân.');
    y = drawInfoBox(doc, y, 'Mẹo hay', 'Bạn có thể xem bản đồ Google Maps tích hợp để biết vị trí chính xác của câu lạc bộ và chỉ đường đến đó.', 'info');

    // Mục 3: Đặt sân
    y = addPage(doc);
    y = drawSectionTitle(doc, y, '3', 'ĐẶT SÂN THEO GIỜ');
    y = drawSubSection(doc, y, 'Quy trình đặt sân');
    y = drawStepBox(doc, y, 1, 'Chọn câu lạc bộ', 'Từ danh sách, nhấn vào câu lạc bộ bạn muốn đặt sân, sau đó nhấn nút "Đặt sân ngay".');
    y = drawStepBox(doc, y, 2, 'Chọn ngày', 'Sử dụng lịch (calendar) để chọn ngày bạn muốn chơi. Có thể chọn nhiều ngày cùng lúc.');
    y = drawStepBox(doc, y, 3, 'Chọn sân và giờ', 'Bảng lịch sân hiển thị tất cả các sân và khung giờ 30 phút. Nhấn vào ô trống (màu xanh) để chọn. Ô đã đặt (màu đỏ) không thể chọn.');
    y = drawStepBox(doc, y, 4, 'Xem tóm tắt', 'Phần tóm tắt ở cuối trang hiển thị: sân đã chọn, khung giờ, và tổng tiền. Kiểm tra kỹ trước khi tiếp tục.');
    y = drawStepBox(doc, y, 5, 'Xác nhận đặt sân', 'Nhấn nút "Đặt sân" để gửi yêu cầu. Bạn sẽ được chuyển sang trang thanh toán.');

    y = drawSubSection(doc, y, 'Giải thích màu sắc trên bảng lịch');
    y = drawTable(doc, y,
        ['Màu sắc', 'Trạng thái', 'Mô tả'],
        [
            ['Xanh lá', 'Trống', 'Sân còn trống, có thể đặt'],
            ['Đỏ', 'Đã đặt', 'Sân đã có người đặt, không thể chọn'],
            ['Xám', 'Khóa', 'Sân bị khóa bởi quản lý'],
            ['Vàng', 'Sự kiện', 'Sân đang có sự kiện đặc biệt'],
            ['Xanh dương', 'Đang chọn', 'Ô bạn vừa chọn, chưa xác nhận'],
        ]
    );

    // Mục 4: Thanh toán
    y = addPage(doc);
    y = drawSectionTitle(doc, y, '4', 'THANH TOÁN');
    y = drawSubSection(doc, y, 'Các bước thanh toán');
    y = drawStepBox(doc, y, 1, 'Xem thông tin thanh toán', 'Sau khi đặt sân, trang thanh toán hiển thị: mã QR chuyển khoản, số tài khoản ngân hàng, số tiền cần chuyển, và nội dung chuyển khoản.');
    y = drawStepBox(doc, y, 2, 'Chuyển khoản', 'Mở app ngân hàng, quét mã QR hoặc nhập thủ công thông tin. QUAN TRỌNG: Nhập đúng nội dung chuyển khoản để hệ thống nhận diện.');
    y = drawStepBox(doc, y, 3, 'Chụp màn hình', 'Sau khi chuyển khoản thành công, chụp lại màn hình xác nhận từ ngân hàng.');
    y = drawStepBox(doc, y, 4, 'Upload bằng chứng', 'Tại trang thanh toán, nhấn nút "Tải lên bằng chứng" và chọn ảnh chụp màn hình chuyển khoản.');
    y = drawStepBox(doc, y, 5, 'Chờ xác nhận', 'Quản lý sân sẽ kiểm tra và xác nhận thanh toán của bạn. Bạn sẽ nhận thông báo khi đặt sân thành công.');
    y = drawInfoBox(doc, y, 'Lưu ý thanh toán', 'Luôn nhập đúng nội dung chuyển khoản được hệ thống cung cấp. Điều này giúp quản lý sân xác nhận nhanh hơn. Nếu quá 30 phút chưa được xác nhận, hãy liên hệ trực tiếp với câu lạc bộ.', 'warning');

    // Mục 5: Quản lý lịch đặt
    y = addPage(doc);
    y = drawSectionTitle(doc, y, '5', 'QUẢN LÝ LỊCH ĐẶT SÂN');
    y = drawSubSection(doc, y, 'Xem lịch đặt của bạn');
    y = drawParagraph(doc, y, 'Vào tab "Lịch đặt" ở thanh menu dưới cùng để xem tất cả các lần đặt sân của bạn.');
    y = drawBulletPoint(doc, y, 'Danh sách hiển thị theo thứ tự thời gian, mới nhất lên trước.');
    y = drawBulletPoint(doc, y, 'Mỗi booking hiển thị: tên câu lạc bộ, ngày, sân, khung giờ, tổng tiền.');
    y = drawBulletPoint(doc, y, 'Trạng thái booking được hiển thị bằng màu sắc để phân biệt.');

    y = drawSubSection(doc, y, 'Các trạng thái booking');
    y = drawTable(doc, y,
        ['Trạng thái', 'Màu', 'Ý nghĩa'],
        [
            ['Chờ xác nhận', 'Vàng', 'Đang chờ quản lý xác nhận thanh toán'],
            ['Đã xác nhận', 'Xanh', 'Đặt sân thành công, sẵn sàng chơi'],
            ['Đã hủy', 'Đỏ', 'Booking đã bị hủy'],
        ]
    );
    y = drawInfoBox(doc, y, 'Đặt sân không cần tài khoản', 'Bạn có thể đặt sân mà không cần đăng ký tài khoản. Tuy nhiên, bạn sẽ không thể xem lại lịch sử đặt sân. Nên đăng ký tài khoản để quản lý tốt hơn.', 'info');

    // Mục 6: Tài khoản
    y = addPage(doc);
    y = drawSectionTitle(doc, y, '6', 'QUẢN LÝ TÀI KHOẢN CÁ NHÂN');
    y = drawSubSection(doc, y, 'Thông tin tài khoản');
    y = drawParagraph(doc, y, 'Vào tab "Tài khoản" để quản lý thông tin cá nhân của bạn.');
    y = drawBulletPoint(doc, y, 'Xem và cập nhật họ tên, email, số điện thoại.');
    y = drawBulletPoint(doc, y, 'Đổi mật khẩu đăng nhập.');
    y = drawBulletPoint(doc, y, 'Xem lịch sử đặt sân và các khuyến mãi.');
    y = drawBulletPoint(doc, y, 'Đăng xuất khỏi tài khoản.');

    // Mục 7: Tin tức
    y += 5;
    y = drawSectionTitle(doc, y, '7', 'ĐỌC TIN TỨC & CẬP NHẬT');
    y = drawParagraph(doc, y, 'Tab "Tin tức" cung cấp các bài viết về thể thao, sự kiện, khuyến mãi từ các câu lạc bộ.');
    y = drawBulletPoint(doc, y, 'Xem tin tức mới nhất và nổi bật.');
    y = drawBulletPoint(doc, y, 'Lọc tin tức theo thể loại (tags).');
    y = drawBulletPoint(doc, y, 'Nhấn vào bài viết để đọc chi tiết.');

    // Mục 8: FAQ
    y = addPage(doc);
    y = drawSectionTitle(doc, y, '8', 'CÂU HỎI THƯỜNG GẶP (FAQ)');
    y = drawFaqSection(doc, y, [
        { q: 'Tôi có thể đặt sân mà không cần tài khoản không?', a: 'Có, bạn có thể đặt sân với tư cách khách. Chỉ cần nhập số điện thoại và tên. Tuy nhiên, bạn sẽ không thể xem lại lịch sử đặt sân.' },
        { q: 'Làm sao để hủy đặt sân?', a: 'Hiện tại, vui lòng liên hệ trực tiếp với câu lạc bộ qua số điện thoại để yêu cầu hủy. Trong tương lai, tính năng hủy trực tuyến sẽ được cập nhật.' },
        { q: 'Tại sao tôi không thể chọn một số khung giờ?', a: 'Các khung giờ màu đỏ là đã có người đặt, màu xám là bị khóa bởi quản lý sân. Bạn chỉ có thể chọn các ô màu xanh (còn trống).' },
        { q: 'Thanh toán có an toàn không?', a: 'Hệ thống sử dụng chuyển khoản ngân hàng trực tiếp. Bạn chuyển tiền vào tài khoản của câu lạc bộ và upload bằng chứng. Quản lý sân sẽ xác nhận thủ công.' },
        { q: 'Tôi quên mật khẩu thì làm sao?', a: 'Vui lòng liên hệ admin hệ thống hoặc câu lạc bộ để được hỗ trợ đặt lại mật khẩu.' },
    ]);

    y = drawContactBox(doc, y, 'CẦN HỖ TRỢ?', [
        'Liên hệ với chúng tôi qua ứng dụng hoặc gọi đến hotline để được hỗ trợ nhanh nhất.',
    ]);

    addPageNumbers(doc);
    return doc;
}
