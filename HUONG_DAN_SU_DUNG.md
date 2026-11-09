# BỐC THĂM THI ĐẤU PRO 2027 (Tournament Draw PRO)
**Khẩu hiệu:** *Công bằng – Minh bạch – Chuyên nghiệp*

---

## 1. Giới thiệu tổng quan
**BỐC THĂM THI ĐẤU PRO 2027** là hệ thống phần mềm chuyên nghiệp phục vụ tổ chức bốc thăm công khai, minh bạch cho các giải đấu bóng chuyền, bóng đá, cầu lông, bóng bàn, hội thao cơ quan và các hội thi thể thao.
Phần mềm vận hành hoàn toàn **OFFLINE** trực tiếp trên trình duyệt hiện đại (Chrome, Edge, Safari), không cần Internet, không yêu cầu cài đặt máy chủ, sử dụng chuẩn mật mã **Web Crypto API** không thiên lệch và bộ tổng hợp âm thanh **Web Audio API** cục bộ.

---

## 2. Các chức năng chính
1. **Quản lý giải đấu:** Quản lý thông tin pháp lý, môn thể thao, đơn vị tổ chức, địa điểm, thể thức thi đấu (Chia bảng + Knockout, Đấu loại trực tiếp, Vòng tròn 1 hoặc 2 lượt).
2. **Danh sách đội / Vận động viên:** Nhập đơn lẻ, nhập nhanh nhiều dòng (Copy/Paste từ Word/Excel), Import/Export CSV, phân nhóm hạt giống (Hạt giống 1, 2, 3), kiểm tra tự động trùng tên/mã đội.
3. **Bốc thăm chia bảng (Group Draw):**
   - Phân bổ đội vào các bảng A, B, C, D...
   - Chế độ phân bổ đều hạt giống (Seeded Draw).
   - Chế độ thuật toán CSP tránh các đội cùng đơn vị/cơ quan nằm chung bảng.
   - Quay số từng đội với hiệu ứng hồi hộp hoặc tự động toàn bộ.
4. **Bốc thăm đối đầu (Matchup VS):**
   - Ghép cặp thi đấu ngẫu nhiên công khai.
   - Sân khấu đối đầu điện ảnh (Đội A VS Đội B) kèm âm thanh va chạm.
   - Xử lý tự động suất miễn thi đấu (BYE) khi số đội lẻ.
5. **Bốc thăm số thứ tự (Order Draw):**
   - Chế độ lật thẻ số 3D hoặc vòng quay lăn số không lặp lại.
6. **Bốc thăm vị trí & sân đấu:**
   - Phân bổ nhánh trái / nhánh phải và gán sân đấu.
7. **Sơ đồ thi đấu (Knockout Bracket):**
   - Tự động sinh nhánh đấu Bán kết, Chung kết, Tranh hạng ba từ bảng đấu (Nhất A gặp Nhì B, Nhất B gặp Nhì A).
   - Nhập tỷ số trận và tự động đẩy đội thắng vào vòng tiếp theo.
8. **Lịch thi đấu vòng tròn (Round Robin):**
   - Thuật toán Berger & Circle Method chuẩn quốc tế.
   - Phân bổ sân thi đấu, ngày giờ, thời lượng và nghỉ giữa trận.
9. **Màn hình trình chiếu LED 16:9:**
   - Giao diện Full HD 1920×1080 dành cho máy chiếu và màn hình LED sự kiện.
   - Ẩn toàn bộ thanh menu quản trị, hiển thị chữ lớn, hiệu ứng pháo hoa, ánh sáng và âm thanh sân khấu.
   - Đồng bộ đa màn hình cục bộ qua `BroadcastChannel`.
10. **Xuất báo cáo & In ấn (Mẫu 01 – Mẫu 06):**
    - Mẫu 01: Báo cáo kết quả chia bảng.
    - Mẫu 02: Báo cáo kết quả đối đầu.
    - Mẫu 03: Báo cáo số thứ tự thi đấu.
    - Mẫu 04: Sơ đồ thi đấu.
    - Mẫu 05: Lịch thi đấu toàn giải.
    - Mẫu 06: **Biên bản bốc thăm chính thức** có đầy đủ vị trí chữ ký của Trưởng ban tổ chức, Tổ trọng tài và Đại diện các đoàn.

---

## 3. Hệ thống phím tắt điều khiển nhanh
- `[P]`: Bật / tắt chế độ Trình chiếu LED 16:9.
- `[Space]`: Bốc lượt tiếp theo trong màn hình bốc thăm.
- `[F]`: Bật / tắt toàn màn hình (Fullscreen).
- `[Esc]`: Thoát màn hình trình chiếu.
- `[Ctrl + P]`: Mở hộp thoại In biên bản / Lưu file PDF chuẩn khổ A4.
- `[1]`, `[2]`, `[3]`, `[4]`: Chuyển nhanh giữa các mẫu màn hình trong chế độ LED.

---

## 4. Dữ liệu mẫu chuẩn
Hệ thống cài đặt sẵn giải đấu demo thực tế theo đặc tả Mục XVIII:
- **Tên giải:** GIẢI BÓNG CHUYỀN CHÀO MỪNG NGÀY NHÀ GIÁO VIỆT NAM 20/11.
- **Quy mô:** 8 đội bóng chuyền thuộc các trường THPT và Đại học.
- **Thể thức:** 2 bảng A và B (4 đội/bảng), thi đấu vòng tròn 1 lượt -> 2 đội nhất nhì vào Bán kết (1A vs 2B, 1B vs 2A) -> Chung kết và Tranh hạng ba.
