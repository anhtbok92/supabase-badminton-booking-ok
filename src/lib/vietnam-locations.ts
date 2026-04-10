/** Vietnamese provinces/cities and districts for club location selection */

export type Province = {
  slug: string;
  name: string;
  districts: District[];
};

export type District = {
  slug: string;
  name: string;
};

export const PROVINCES: Province[] = [
  {
    slug: 'ha-noi', name: 'Hà Nội',
    districts: [
      { slug: 'ba-dinh', name: 'Ba Đình' },
      { slug: 'hoan-kiem', name: 'Hoàn Kiếm' },
      { slug: 'tay-ho', name: 'Tây Hồ' },
      { slug: 'long-bien', name: 'Long Biên' },
      { slug: 'cau-giay', name: 'Cầu Giấy' },
      { slug: 'dong-da', name: 'Đống Đa' },
      { slug: 'hai-ba-trung', name: 'Hai Bà Trưng' },
      { slug: 'hoang-mai', name: 'Hoàng Mai' },
      { slug: 'thanh-xuan', name: 'Thanh Xuân' },
      { slug: 'nam-tu-liem', name: 'Nam Từ Liêm' },
      { slug: 'bac-tu-liem', name: 'Bắc Từ Liêm' },
      { slug: 'ha-dong', name: 'Hà Đông' },
      { slug: 'thanh-tri', name: 'Thanh Trì' },
      { slug: 'gia-lam', name: 'Gia Lâm' },
      { slug: 'dong-anh', name: 'Đông Anh' },
      { slug: 'soc-son', name: 'Sóc Sơn' },
      { slug: 'hoai-duc', name: 'Hoài Đức' },
      { slug: 'thanh-oai', name: 'Thanh Oai' },
      { slug: 'thuong-tin', name: 'Thường Tín' },
      { slug: 'dan-phuong', name: 'Đan Phượng' },
    ],
  },
  {
    slug: 'ho-chi-minh', name: 'TP. Hồ Chí Minh',
    districts: [
      { slug: 'quan-1', name: 'Quận 1' },
      { slug: 'quan-2', name: 'Quận 2' },
      { slug: 'quan-3', name: 'Quận 3' },
      { slug: 'quan-4', name: 'Quận 4' },
      { slug: 'quan-5', name: 'Quận 5' },
      { slug: 'quan-6', name: 'Quận 6' },
      { slug: 'quan-7', name: 'Quận 7' },
      { slug: 'quan-8', name: 'Quận 8' },
      { slug: 'quan-9', name: 'Quận 9' },
      { slug: 'quan-10', name: 'Quận 10' },
      { slug: 'quan-11', name: 'Quận 11' },
      { slug: 'quan-12', name: 'Quận 12' },
      { slug: 'binh-thanh', name: 'Bình Thạnh' },
      { slug: 'go-vap', name: 'Gò Vấp' },
      { slug: 'phu-nhuan', name: 'Phú Nhuận' },
      { slug: 'tan-binh', name: 'Tân Bình' },
      { slug: 'tan-phu', name: 'Tân Phú' },
      { slug: 'thu-duc', name: 'Thủ Đức' },
      { slug: 'binh-tan', name: 'Bình Tân' },
      { slug: 'nha-be', name: 'Nhà Bè' },
      { slug: 'hoc-mon', name: 'Hóc Môn' },
      { slug: 'cu-chi', name: 'Củ Chi' },
      { slug: 'can-gio', name: 'Cần Giờ' },
    ],
  },
  {
    slug: 'da-nang', name: 'Đà Nẵng',
    districts: [
      { slug: 'hai-chau', name: 'Hải Châu' },
      { slug: 'thanh-khe', name: 'Thanh Khê' },
      { slug: 'son-tra', name: 'Sơn Trà' },
      { slug: 'ngu-hanh-son', name: 'Ngũ Hành Sơn' },
      { slug: 'lien-chieu', name: 'Liên Chiểu' },
      { slug: 'cam-le', name: 'Cẩm Lệ' },
      { slug: 'hoa-vang', name: 'Hòa Vang' },
    ],
  },
  {
    slug: 'hai-phong', name: 'Hải Phòng',
    districts: [
      { slug: 'hong-bang', name: 'Hồng Bàng' },
      { slug: 'le-chan', name: 'Lê Chân' },
      { slug: 'ngo-quyen', name: 'Ngô Quyền' },
      { slug: 'kien-an', name: 'Kiến An' },
      { slug: 'hai-an', name: 'Hải An' },
      { slug: 'do-son', name: 'Đồ Sơn' },
    ],
  },
  {
    slug: 'can-tho', name: 'Cần Thơ',
    districts: [
      { slug: 'ninh-kieu', name: 'Ninh Kiều' },
      { slug: 'binh-thuy', name: 'Bình Thủy' },
      { slug: 'cai-rang', name: 'Cái Răng' },
      { slug: 'o-mon', name: 'Ô Môn' },
      { slug: 'thot-not', name: 'Thốt Nốt' },
    ],
  },
  { slug: 'bac-ninh', name: 'Bắc Ninh', districts: [{ slug: 'tp-bac-ninh', name: 'TP. Bắc Ninh' }, { slug: 'tu-son', name: 'Từ Sơn' }] },
  { slug: 'hung-yen', name: 'Hưng Yên', districts: [{ slug: 'tp-hung-yen', name: 'TP. Hưng Yên' }, { slug: 'van-lam', name: 'Văn Lâm' }] },
  { slug: 'hai-duong', name: 'Hải Dương', districts: [{ slug: 'tp-hai-duong', name: 'TP. Hải Dương' }] },
  { slug: 'binh-duong', name: 'Bình Dương', districts: [{ slug: 'thu-dau-mot', name: 'Thủ Dầu Một' }, { slug: 'di-an', name: 'Dĩ An' }, { slug: 'thuan-an', name: 'Thuận An' }] },
  { slug: 'dong-nai', name: 'Đồng Nai', districts: [{ slug: 'bien-hoa', name: 'Biên Hòa' }, { slug: 'long-thanh', name: 'Long Thành' }] },
  { slug: 'khanh-hoa', name: 'Khánh Hòa', districts: [{ slug: 'nha-trang', name: 'Nha Trang' }] },
  { slug: 'thua-thien-hue', name: 'Thừa Thiên Huế', districts: [{ slug: 'tp-hue', name: 'TP. Huế' }] },
  { slug: 'quang-ninh', name: 'Quảng Ninh', districts: [{ slug: 'ha-long', name: 'Hạ Long' }] },
  { slug: 'thanh-hoa', name: 'Thanh Hóa', districts: [{ slug: 'tp-thanh-hoa', name: 'TP. Thanh Hóa' }] },
  { slug: 'nghe-an', name: 'Nghệ An', districts: [{ slug: 'tp-vinh', name: 'TP. Vinh' }] },
];

/** Find province by slug */
export function findProvince(slug: string): Province | undefined {
  return PROVINCES.find(p => p.slug === slug);
}

/** Find district by slug within a province */
export function findDistrict(provinceSlug: string, districtSlug: string): District | undefined {
  const province = findProvince(provinceSlug);
  return province?.districts.find(d => d.slug === districtSlug);
}
