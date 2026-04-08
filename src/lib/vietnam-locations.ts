/**
 * Vietnam provinces and districts data for advanced search.
 * Only includes major provinces/cities commonly used for sport booking.
 */

export type Province = {
  name: string;
  districts: string[];
};

export const VIETNAM_PROVINCES: Province[] = [
  {
    name: 'Hà Nội',
    districts: [
      'Ba Đình', 'Hoàn Kiếm', 'Hai Bà Trưng', 'Đống Đa', 'Tây Hồ', 'Cầu Giấy',
      'Thanh Xuân', 'Hoàng Mai', 'Long Biên', 'Nam Từ Liêm', 'Bắc Từ Liêm',
      'Hà Đông', 'Thanh Trì', 'Gia Lâm', 'Đông Anh', 'Sóc Sơn', 'Hoài Đức',
      'Thanh Oai', 'Thường Tín', 'Phú Xuyên', 'Mê Linh', 'Đan Phượng',
    ],
  },
  {
    name: 'TP. Hồ Chí Minh',
    districts: [
      'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
      'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận',
      'Tân Bình', 'Tân Phú', 'Thủ Đức', 'Bình Tân', 'Nhà Bè', 'Hóc Môn',
      'Củ Chi', 'Bình Chánh', 'Cần Giờ',
    ],
  },
  {
    name: 'Đà Nẵng',
    districts: [
      'Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu',
      'Cẩm Lệ', 'Hòa Vang',
    ],
  },
  {
    name: 'Hải Phòng',
    districts: [
      'Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Hải An', 'Kiến An', 'Đồ Sơn',
      'Dương Kinh', 'Thủy Nguyên', 'An Dương', 'An Lão', 'Kiến Thụy',
    ],
  },
  {
    name: 'Cần Thơ',
    districts: [
      'Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Ô Môn', 'Thốt Nốt',
      'Phong Điền', 'Cờ Đỏ', 'Thới Lai', 'Vĩnh Thạnh',
    ],
  },
  {
    name: 'Bình Dương',
    districts: [
      'Thủ Dầu Một', 'Thuận An', 'Dĩ An', 'Tân Uyên', 'Bến Cát',
      'Bàu Bàng', 'Phú Giáo', 'Dầu Tiếng', 'Bắc Tân Uyên',
    ],
  },
  {
    name: 'Đồng Nai',
    districts: [
      'Biên Hòa', 'Long Khánh', 'Nhơn Trạch', 'Long Thành', 'Trảng Bom',
      'Vĩnh Cửu', 'Xuân Lộc', 'Định Quán', 'Tân Phú', 'Thống Nhất', 'Cẩm Mỹ',
    ],
  },
  {
    name: 'Khánh Hòa',
    districts: [
      'Nha Trang', 'Cam Ranh', 'Ninh Hòa', 'Diên Khánh', 'Vạn Ninh',
      'Khánh Vĩnh', 'Khánh Sơn', 'Cam Lâm',
    ],
  },
  {
    name: 'Thừa Thiên Huế',
    districts: [
      'Huế', 'Phong Điền', 'Quảng Điền', 'Phú Vang', 'Hương Thủy',
      'Hương Trà', 'A Lưới', 'Nam Đông', 'Phú Lộc',
    ],
  },
  {
    name: 'Bắc Ninh',
    districts: [
      'Bắc Ninh', 'Từ Sơn', 'Yên Phong', 'Quế Võ', 'Tiên Du',
      'Thuận Thành', 'Gia Bình', 'Lương Tài',
    ],
  },
  {
    name: 'Quảng Ninh',
    districts: [
      'Hạ Long', 'Cẩm Phả', 'Uông Bí', 'Móng Cái', 'Đông Triều',
      'Quảng Yên', 'Vân Đồn', 'Hoành Bồ',
    ],
  },
  {
    name: 'Thanh Hóa',
    districts: [
      'Thanh Hóa', 'Sầm Sơn', 'Bỉm Sơn', 'Nghi Sơn', 'Đông Sơn',
      'Hoằng Hóa', 'Hậu Lộc', 'Quảng Xương',
    ],
  },
  {
    name: 'Nghệ An',
    districts: [
      'Vinh', 'Cửa Lò', 'Thái Hòa', 'Hoàng Mai', 'Diễn Châu',
      'Yên Thành', 'Quỳnh Lưu', 'Nghi Lộc', 'Hưng Nguyên',
    ],
  },
  {
    name: 'Lâm Đồng',
    districts: [
      'Đà Lạt', 'Bảo Lộc', 'Đức Trọng', 'Di Linh', 'Lâm Hà',
      'Đơn Dương', 'Lạc Dương',
    ],
  },
  {
    name: 'Bà Rịa - Vũng Tàu',
    districts: [
      'Vũng Tàu', 'Bà Rịa', 'Phú Mỹ', 'Long Điền', 'Đất Đỏ',
      'Xuyên Mộc', 'Châu Đức', 'Côn Đảo',
    ],
  },
];
