const fs = require('fs');

// We have the complete transcript of all 39 pages from ketoanmay.pdf
const questionsP1_and_P2_raw = `
Phần 1:
Câu 1: "Khi thiết kế bảng Hoàng chọn như trên hình và bấm Next.Thao tác này có ý nghĩa gì?"
a."Lấy danh sách chứng từ để nhập liệu"
*b."Lấy danh mục tài khoản từ bảng khác để nhập liệu"
c."Thiết lập quan hệ giữa các bảng"
d."Tạo bảng con"

Câu 2: "Hãy chọn cách điền ghi chép còn dở dang ngày 8/3?"
*TK Đối ứng = 156, cột Có = 4.000
TK Đối ứng = 642, cột Có = 4.000
TK Đối ứng = 511, cột Nợ = 4.000
TK Đối ứng = 131, cột Nợ = 4.000

Câu 3: "Hãy chọn cách điền ghi chép còn dở dang ngày 7/3?"
TK Đối ứng = 642, cột Có = 2.000
TK Đối ứng = 511, cột Có = 2.000
TK Đối ứng = 511, cột Nợ = 2.000
*TK Đối ứng = 111, cột Nợ = 2.000

Câu 4: "Hãy chọn cách điền ghi chép còn dở dang ngày 8/3?"
"TK Đối ứng = 642, cột Có = 3.000"
"TK Đối ứng = 511, cột Có = 3.000"
*"TK Đối ứng = 511, cột Nợ = 3.000"
"TK Đối ứng = 111, cột Nợ = 3.000"

Câu 5: "Hãy chọn cách điền ghi chép còn dở dang ngày 7/3?"
"TK Đối ứng = 642, cột Có = 3.000"
*"TK Đối ứng = 111, cột Có = 3.000"
"TK Đối ứng = 511, cột Nợ = 3.000"
"TK Đối ứng = 111, cột Nợ = 3.000"

Câu 6: "Công ty HAPRO xuất khẩu nông sản, thực phẩm chế biến, đồ uống, hàng may mặc, hàng thủ công mỹ nghệ và hàng tiêu dùng.Phân phối, bán lẻ với hệ thống trung tâm thương mại, siêu thị, chuỗi cửa hàng tiện ích.Công ty HAPRO là doanh nghiệp?"
*a."Thương mại"
b."Sản xuất"
c."Dịch vụ"
d."Thương mại và dịch vụ"

Câu 7: Khi thiết kế bảng dữ liệu chi tiết chứng từ.Nam cần khiếu dữ liệu số, Văn bản Tiền tệ.Nam cần sử dụng các kiểu dữ liệu nào của Access?
A.autoNumber,Yes/No,Lookupwizard
*B.Number,text,Currency
C.Text,Number,Date/Time
D.Number, Text, AutoNumber

Câu 8: "Các công cụ Kế toán bao gồm?"
a."Bảng lương; phiếu chi, ủy nhiệm chi, hợp đồng lao động, bảng chấm công"
*b."Chứng từ; Số nhật ký; Sổ cái tài khoản; Số chi tiết; Bảng tổng hợp; Bảng cân đối tài khoản"
c."Đăng ký kinh doanh ; mẫu dấu, sổ đăng ký cổ đông,"
d."Phiếu nhập kho; phiếu xuất kho; hóa đơn kiêm vận chuyển nội bộ"

Câu 9: Từ khóa where và order by có tác dụng
*A Đặt điều kiện và sắp xếp dữ liệu khi xử lý
B.Chọn cột dữ liệu, chọn bảng dữ liệu khi xử lý
C.chọn bảng dữ liệu và sắp xếp dữ liệu khi xử lý
D.đặt điều kiện và chọn cột dữ liệu khi xử lý

Câu 10: "Trình tự ghi chép sổ sách chứng từ Kế toán?"
a."Ghi sổ chi tiết => ghi sổ nhật ký => lập chứng từ=> ghi sổ cái"
*b."Căn cứ chứng từ=>ghi sổ nhật ký=>ghi sổ cái tài khoản"
c."Ghi sổ chi tiết=>ghi sổ nhật ký=>lập chứng từ"
d."Lập chứng từ=>ghi sổ chi tiết=>ghi sổ cái tài khoản"

Câu 11: "Công ty Trường Xuân trả tiền nhà tháng 3 năm X cho bà Xiết hết 3 triệu đồng chẵn.Kế toán phải ghi chép sự kiện kinh tế này như thế nào?"
*a."Ghi chép đồng thời vào Sổ cái tài khoản Chi phí và Sổ cái TK tiền mặt"
b."Ghi chép Sổ cái TK Tiền mặt"
c."Ghi chép Sổ cái TK Chi phí"
d."Không cần chép sổ, chỉ cần lập phiếu chi chi 3 triệu."

Câu 12: "Công ty Trường Xuân làm dịch vụ bảo trì cho công ty Vạn An thu về 3 triệu 4 trăm ngàn đồng tiền mặt.Kế toán phải ghi chép sự kiện kinh tế này như thế nào?"
a."Ghi chép Sổ cái TK Doanh thu"
*b."Ghi chép đồng thời vào Sổ cái tài khoản Doanh thu và Sổ cái TK tiền mặt"
c."Ghi chép Sổ cái TK Tiền mặt"
d."Không cần chép sổ, chỉ cần lập phiếu chi chi 3 triệu."

Câu 13: "Để theo dõi các hoạt động doanh nghiệp liên quan đến tiền tệ, người làm kế toán sử dụng hệ thống tài khoản và ghi chép theo nguyên tắc Kế toán kép.Nguyên tắc kế toán kép là gì?"
a."Là nguyên tắc ghi chép phản ánh sự tăng/giảm tiền trên 1 tài khoản"
b."Là nguyên tắc ghi chép phản ánh sự tăng/giảm tiền trên 2 tài khoản"
*c."Là nguyên tắc ghi chép phản ánh sự tăng/giảm đồng thời của 2 hoặc nhiều tài khoản có liên quan đến nghiệp vụ kinh tế."
d."Là nguyên tắc ghi chép số tiền 2 lần trên cùng một sổ kế toán để tránh nhầm lẫn"

Câu 14: "Doanh nghiệp thanh toán tiền công nợ với nhà cung cấp Trần Anh.Kế toán phải ghi chép sự kiện kinh tế này như thế nào?"
a."Ghi giảm tiền phải trả cho nhà cung cấp Trần Anh"
b."Ghi giảm tiền mặt trong quỹ"
*c."Ghi giảm tiền phải trả cho nhà cung cấp Trần Anh, đồng thời ghi giảm tiền mặt trong quỹ."
d."Không cần chép sổ, chỉ cần lập phiếu chi thanh toán công nợ"

Câu 15: "Khái niệm tài khoản?"
a."Là khoản mục tài chính doanh nghiệp cần theo dõi"
b."Là một cuốn sổ ghi chép các hoạt động hàng ngày của doanh nghiệp."
c."Là quyển sổ ghi nhật ký các sự kiện kinh tế"
*d."Là khoản mục tài chính doanh nghiệp cần theo dõi, được thể hiện trên thực tế bằng một cuốn Sổ ghi chép các sự kiện kinh tế theo khoản mục gọi là Sổ cái Tài khoản."

Câu 16: "Cấu trúc của tài khoản hay sổ cái tài khoản bao gồm những gì?"
a."Số dư đầu kỳ, các dòng phát sinh"
b."Các dòng phát sinh, số dư cuối kỳ"
*c."Số dư đầu kỳ, các dòng phát sinh, cộng phát sinh, số dư cuối kỳ"
d."Số dư đầu kỳ, số dư cuối kỳ"

Câu 17: "Doanh nghiệp cần một cuốn sổ để theo dõi mọi sự kiện kinh tế xảy ra trong quý I theo trình tự thời gian.Kế toán phải sử dụng loại sổ sách nào sau đây?"
a."Sổ Cái tài khoản"
b."Chứng từ"
*c."Sổ Nhật ký"
d."Bảng cân đối tài khoản"

Câu 18: "Để theo dõi từng sự kiện kinh tế, mỗi khi có sự kiện phát sinh, sự kiện cần được ghi chép và có xác nhận sự việc diễn ra, số tiền, các đối tượng liên quan.Người làm Kế toán phải lập?"
a."Sổ chi tiết tài khoản"
*b."Chứng từ"
c."Sổ Nhật ký"
d."Sổ cái tài khoản"

Câu 19: "Chứng từ là công cụ kế toán dùng để ghi chép và xác thực sự kiện kinh tế phát sinh.Trên chứng từ cần có các thông tin gì?"
a."Ngày lập, ngày hiệu lực, đối tượng, diễn giải, số tiền"
b."Địa chỉ, số điện thoại đối tượng tham gia, diễn giải sự kiện kinh tế, người lập"
*c."Ngày lập, ngày hiệu lực, đối tượng, diễn giải, số tiền bằng số, bằng chữ, xác nhận của người lập, đối tượng, kế toán trưởng, giám đốc, tài khoản Nợ, Có"
d."Tên doanh nghiệp, tài khoản Nợ, Có"

Câu 20: "Doanh nghiệp cần theo dõi khoản mục vốn góp để nắm tình hình tổng số tiền vốn và lịch sử góp vốn.Kế toán phải sử dụng loại sổ sách nào sau đây để ghi chép lịch sử góp vốn?"
*a."Sổ Cái tài khoản"
b."Chứng từ"
c."Sổ Nhật ký"
d."Bảng cân đối tài khoản"

Câu 21: "Khách hàng đến doanh nghiệp để đối chiếu công nợ.Kế toán doanh nghiệp cần sử dụng loại sổ sách nào để làm việc?"
*a."Sổ chi tiết tài khoản công nợ phải thu"
b."Chứng từ công nợ"
c."Sổ Nhật ký công nợ"
d."Sổ cái tài khoản công nợ phải trả"

Câu 22: "Cuối tháng 3, giám đốc doanh nghiệp muốn biết tổng số tiền khách hàng nợ doanh nghiệp là bao nhiêu.Ngoài con số tổng cộng, giám đốc cũng cần biết tổng dư nợ chi tiết từng khách hàng.Kế toán phải chuẩn bị loại báo cáo, sổ sách gì? (chọn một)"
a."Sổ chi tiết tài khoản công nợ phải thu của khách hàng"
*b."Bảng tổng hợp công nợ phải thu của khách hàng"
c."Sổ chi tiết thanh toán với người bán"
d."Sổ nhật ký"

Câu 23: "Bảng cân đối tài khoản là báo cáo kế toán có nội dung?"
a."Liệt kê danh sách toàn bộ các tài khoản doanh nghiệp sử dụng"
b."Với mỗi tài khoản thể hiện số dư đầu kỳ, số phát sinh trong kỳ, số dư cuối kỳ"
c."Cung cấp cái nhìn tổng thể hoạt động doanh nghiệp thông qua các số liệu tài khoản"
*d."Tất cả các ý trên"

Câu 24: "Trên một báo cáo dạng bảng tổng hợp có các cột sau: Mã Tài Khoản, Tên Tài Khoản, Dư đầu kỳ bên Nợ, Dư đầu kỳ bên Có, Phát sinh Nợ, Phát sinh Có, Dư cuối kỳ bên Nợ, Dư cuối kỳ bên có.Hãy cho biết đây là công cụ kế toán nào:"
a."Bảng tổng hợp công nợ phải thu"
b."Bảng tổng hợp nhập xuất tồn"
*c."Bảng cân đối tài khoản (Bảng cân đối số phát sinh)"
d."Sổ cái tài khoản"

Câu 25: "Trên sổ cái tài khoản 111, kế toán viên đã ghi chép như sau: số dư đầu kỳ: 1000, tổng phát sinh Nợ: 600 tổng phát sinh Có: 400.Hãy xác định số dư cuối kỳ tài khoản 111"
a."800 ghi bên Nợ"
b."1000 ghi bên Có"
*c."1200 ghi bên Nợ"
d."1200 ghi bên Có"

Câu 26: "Trên sổ cái tài khoản 411, kế toán viên đã ghi chép như sau: số dư đầu kỳ: 3000, tổng phát sinh Nợ: 900 tổng phát sinh Có: 4000.Hãy xác định số dư cuối kỳ tài khoản 411"
a."-100 ghi bên Có"
*b."6100 ghi bên Có"
c."7900 ghi bên Có"
d."6100 ghi bên Nợ"

Câu 27: "Khi lập sổ kế toán viên đã sử dụng các cột sau: Ngày Ghi Sổ, Số chứng từ, Ngày chứng từ, Diễn giải, Tài khoản Nợ, Tài khoản Có, Số Tiền.Hãy xác định loại sổ kế toán trên?"
a."Sổ cái tài khoản"
b."Sổ chi tiết tài khoản"
c."Sổ chi tiết công nợ"
*d."Sổ nhật ký"

Câu 28: "Khi lập sổ kế toán để theo dõi công nợ, kế toán viên đã sử dụng các cột sau: Ngày Ghi Sổ, Số chứng từ, Ngày chứng từ, Diễn giải, Tài khoản đối ứng, Nợ, Có.Trên tiêu đề sổ có ghi rõ khoảng thời gian theo dõi và mã đối tượng công nợ, tên đối tượng công nợ.Hãy xác định loại sổ kế toán trên?"
a."Sổ cái tài khoản"
*b."Sổ chi tiết tài khoản"
c."Bảng tổng hợp công nợ"
d."Sổ nhật ký"

Câu 29: "Doanh nghiệp có nhu cầu theo dõi mọi hoạt động kinh tế liên quan đến tiền tệ theo nhiều mức: Theo dõi tổng thể mọi sự kiện, theo dõi theo khoản mục, theo dõi theo đối tượng, theo dõi từng sự kiện.Hãy lựa chọn các công cụ kế toán theo trình tự theo dõi trên?"
a."Sổ cái tài khoản => Sổ nhật ký => Sổ chi tiết tài khoản => Chứng từ"
b."Chứng từ => Sổ nhật ký => Sổ chi tiết tài khoản => Sổ cái tài khoản"
*c."Sổ nhật ký => Sổ cái tài khoản => Sổ chi tiết tài khoản => Chứng từ"
d."Chứng từ => Sổ cái tài khoản => Sổ nhật ký => Sổ chi tiết tài khoản"

Câu 30: "Giám đốc doanh nghiệp cần nắm tình hình lãi lỗ cuối tháng 5 của công ty.Kế toán cần nộp tài liệu nào?"
a."Sổ cái tài khoản doanh thu, sổ cái tài khoản chi phí"
*b."Các tài liệu trong đáp án 1.và 3."
c."Báo cáo kết quả hoạt động kinh doanh"
d."Bảng cân đối kế toán"

Câu 31: "Công ty Trường Xuân thu tiền làm dịch vụ của bệnh viện Hồng Ngọc còn nợ từ tháng trước.Hãy xác định trình tự ghi chép nghiệp vụ kinh tế trên?"
a."Lập phiếu thu, chép sổ nhật ký, chép sổ cái tài khoản 111 tiền mặt, chép sổ cái tài khoản 642 chi phí"
b."Lập phiếu chi, chép sổ cái tài khoản 111 Tiền mặt, chép sổ cái tài khoản 511 Doanh thu"
*c."Lập phiếu thu, chép sổ nhật ký, chép sổ cái tài khoản 111 tiền mặt, chép sổ cái tài khoản 511 Doanh thu"
d."Chép sổ cái tài khoản 111 tiền mặt, chép sổ cái tài khoản 511 Doanh thu, chép sổ Nhật ký"

Câu 32: "Phòng hành chính nộp bảng lương cho phòng Kế toán.Tổng tiền lương là 20 triệu, bảng lương đã được giám đốc ký nhận.Hãy xác định trình tự ghi chép nghiệp vụ kinh tế trên?"
a."Lập phiếu kế toán ghi Nợ tài khoản 642, ghi có tài khoản 334, chép sổ cái tài khoản 334 và 511"
b."Lập phiếu kế toán ghi Nợ tài khoản 642, ghi có tài khoản 334, chép sổ cái tài khoản 334 và 642"
c."Lập phiếu kế toán ghi Nợ tài khoản 642, ghi có tài khoản 334, chép sổ nhật ký, chép sổ cái tài khoản 334 và 111"
*d."Lập phiếu kế toán ghi Nợ tài khoản 642, ghi có tài khoản 334, chép sổ nhật ký, chép sổ cái tài khoản 334 và 642"

Câu 33: Công ty Trường Xuân thay chuột cho nhà máy may Tín Trực, thu tiền ngay.Kế toán cần hạch toán như thế nào?"
a."Ghi Nợ tài khoản 111, ghi Nợ tài khoản 642"
b."Ghi Nợ tài khoản 111, ghi Có tài khoản 642"
*c."Ghi Nợ tài khoản 111, ghi Có tài khoản 511"
d."Ghi Có tài khoản 111, ghi Có tài khoản 511"

Câu 34: "Sau khi một sự kiện kinh tế phát sinh.Kế toán đã ghi Nợ tài khoản 111, ghi Có tài khoản 131 số tiền 5 triệu đồng.Giao dịch trên có ý nghĩa như thế nào?"
a."Khách hàng đến mua hàng trị giá 5 triệu."
*b."Doanh nghiệp thu tiền khách hàng còn nợ trước đó."
c."Doanh nghiệp thanh toán chi phí hoạt động"
d."Doanh nghiệp trả lại tiền thừa cho khách hàng."

Câu 35: "Tài khoản 156 là tài khoản?"
a."Doanh thu - tính chất Nợ"
*b."Hàng hoá - tính chất Nợ"
c."Vốn góp - tính chất Có"
d."Chi phí - tính chất Nợ"

Câu 36: Ngày 12/4 công ty May 10 thanh toán nợ cho Trường Xuân 10 triệu đồng.Kế toán công ty Trường Xuân cần hạch toán như thế nào?"
a."Ghi Nợ tài khoản 111, ghi Có tài khoản 511 số tiền 10 triệu đồng"
b."Ghi Nợ tài khoản 131, ghi Có tài khoản 511 số tiền 10 triệu đồng"
c."Ghi Nợ tài khoản 511, ghi Có tài khoản 131 số tiền 10 triệu đồng"
*d."Ghi Nợ tài khoản 111, ghi Có tài khoản 131 số tiền 10 triệu đồng"

Câu 37: "Doanh nghiệp Trường Xuân nhập từ công ty CMC 30 máy tính trị giá 300 triệu, trả tiền sau.Kế toán phải hạch toán khoản tiền này như thế nào?"
a."Ghi Nợ tài khoản 642, ghi Có tài khoản 511"
b."Ghi Nợ tài khoản 642, ghi Có tài khoản 331"
*c."Ghi Nợ tài khoản 156, ghi Có tài khoản 331"
d."Ghi Nợ tài khoản 156, ghi Có tài khoản 511"

Câu 38: "Một sự kiện kinh tế phát sinh làm giảm giá trị kho hàng hoá và tăng chi phí vốn kinh doanh của doanh nghiệp 7 triệu đồng.Kế toán đã hạch toán khoản tiền này như thế nào?"
a."Ghi Nợ tài khoản 642, ghi Có tài khoản 331"
*b."Ghi Nợ tài khoản 642, ghi Có tài khoản 156"
c."Ghi Nợ tài khoản 156, ghi Có tài khoản 331"
d."Ghi Nợ tài khoản 156, ghi Có tài khoản 511"

Câu 39: "Kế toán công ty Trường Xuân ghi Nợ tài khoản 156, ghi Có tài khoản 331 số tiền 10 triệu đồng.Sự kiện kinh tế nào được ghi chép và hạch toán như trên?"
a."Công ty Trường Xuân trả lương nhân viên"
b."Công ty Trường Xuân mua bàn ghế"
c."Công ty Trường Xuân thuê văn phòng"
*d."Công ty Trường Xuân nhập hàng về bán, trả tiền sau"

Câu 40: "Bệnh viện Hồng Ngọc thuê công ty Trường Xuân bảo trì 50 máy tính hết chi phí 3 triệu đồng và hẹn Công ty Trường Xuân tháng sau trả tiền.Kế toán công ty Trường Xuân cần hạch toán như thế nào?"
a."Ghi Nợ tài khoản 111, ghi Có tài khoản 511 số tiền 3 triệu đồng"
*b."Ghi Nợ tài khoản 131, ghi Có tài khoản 511 số tiền 3 triệu đồng"
c."Ghi Nợ tài khoản 511, ghi Có tài khoản 131 số tiền 3 triệu đồng"
d."Ghi Nợ tài khoản 331, ghi Có tài khoản 511 số tiền 3 triệu đồng"

Câu 41: "Tài khoản 334 được sử dụng để theo dõi tiền lương phải trả người lao động.Hãy xác định cách sử dụng tài khoản 334?"
a."Khi tính lương ghi Có 642, Nợ 334 số tổng tiền lương, khi trả lương ghi Có 334, Nợ 111 số tiền thực trả."
*b."Khi tính lương ghi Nợ 642, Có 334 số tổng tiền lương, khi trả lương ghi Nợ 334, Có 111 số tiền thực trả."
c."Khi tính lương ghi Có 511, Nợ 334 số tổng tiền lương, khi trả lương ghi Có 334, Nợ 111 số tiền thực trả."
d."Khi tính lương ghi Nợ 642, Có 334 số tổng tiền lương, khi trả lương ghi Nợ 334, Có 642 số tiền thực trả."

Câu 42: "Sau khi nhận được bảng lương từ phòng nhân sự với tổng tiền 12 triệu.Kế toán công ty Trường Xuân ghi nhận lương phải trả người lao động trên sổ cái tài khoản 334.Số tiền 12 triệu đã được chép vào cột Có trên sổ cái tài khoản.Hãy xác định tài khoản đối ứng cần ghi chép?"
a."511"
b."111"
*c."642"
d."331"

Câu 43: "Cách sử dụng tài khoản 411?"
*a."Nhà đầu tư góp vốn ghi Có 411, Nợ 111; nhà đầu tư rút vốn: ghi Nợ 411, Có 111"
b."Nhà đầu tư góp vốn ghi Nợ 411, Có 334; nhà đầu tư rút vốn: ghi Có 411, Nợ 334"
c."Nhà đầu tư góp vốn ghi Nợ 411, Có 111; nhà đầu tư rút vốn: ghi Có 411, Nợ 111"
d."Nhà đầu tư góp vốn ghi Có 411, Nợ 642; nhà đầu tư rút vốn: ghi Nợ 411, Có 642"

Câu 44: "Giám đốc doanh nghiệp muốn xem lịch sử lãi lỗ hàng tháng của công ty từ đầu năm.Kế toán cần sử dụng sổ cái tài khoản nào?"
a."Sổ cái tài khoản 511"
*b."Sổ cái tài khoản 421"
c."Sổ cái tài khoản 642"
d."Sổ cái tài khoản 334"

Câu 45: "Công ty Trường Xuân thay 40 bàn phím cho Bệnh viện Hồng Ngọc thu tiền sau.Kế toán công ty cần hạch toán như thế nào?"
a."Ghi Nợ tài khoản 642, Có tài khoản 131"
b."Ghi Nợ tài khoản 642, Có tài khoản 331"
c."Ghi Nợ tài khoản 111, Có tài khoản 511"
*d."Ghi Nợ tài khoản 131, Có tài khoản 511"

Câu 46: "Doanh nghiệp Hoàng Long cho thuê xe du lịch, thu tiền ngay chuyến ngày 24/5 giá 5 triệu.Kế toán cty Hoàng Long cần hạch toán như thế nào?"
a."Ghi Nợ tài khoản 131, Có tài khoản 511 số tiền 5 triệu"
b."Ghi Nợ tài khoản 111, Có tài khoản 331 số tiền 5 triệu"
*c."Ghi Nợ tài khoản 111, Có tài khoản 511 số tiền 5 triệu"
d."Ghi Nợ tài khoản 131, Có tài khoản 511 số tiền 5 triệu"

Câu 47: "Trên sổ cái tài khoản 911 công ty Trường Xuân tháng 4 / X, người ta thấy có 2 dòng: - Tài khoản đối ứng 642 - ghi Nợ 911 số tiền 23 triệu.- Tài khoản đối ứng 511 - ghi Có 911 số tiền 32 triệu.Hãy xác định lãi lỗ và bút toán kết chuyển sang tài khoản 421 (tăng bên Có)?"
*a."Doanh nghiệp lãi 9 triệu, bút toán kết chuyển ghi Nợ 911, Có 421 số tiền 9 triệu"
b."Doanh nghiệp lỗ 9 triệu, bút toán kết chuyển ghi Có 911, Nợ 421 số tiền 9 triệu"
c."Doanh nghiệp lãi 9 triệu, bút toán kết chuyển ghi Nợ 911, Có 421 số tiền 9 triệu"
d."Doanh nghiệp lỗ 9 triệu, bút toán kết chuyển ghi Có 911, Nợ 421 số tiền 9 triệu"

Câu 48: "Điền theo trình tự từ trên xuống dưới là?"
a."Ghi cột Nợ cuối kỳ: 11000, 15000, 8000, 34000"
*b."Ghi cột Nợ cuối kỳ: 9000, 15000, 2000, 26000"
c."Ghi cột Có cuối kỳ: 11000, 15000, 8000, 34000"
d."Ghi cột Có cuối kỳ: 9000, 15000, 2000, 26000"

Câu 49: "Điền theo trình tự từ trên xuống dưới là?"
a."Ghi cột Có đầu kỳ: 15000, 20000, 0, 16000"
b."Ghi cột Có đầu kỳ: 13000, 4000, 10000, 27000"
*c."Ghi cột Nợ đầu kỳ: 13000, 4000, 10000, 27000"
d."Ghi cột Nợ đầu kỳ: 11000, 38000, 4000, 26000"

Câu 50: "Điền theo trình tự từ trên xuống dưới là?"
a."2000, 25000, 12000, 16000"
b."11000, 5000, 5000, 26000"
*c."2000, 25000, 21000, 38000"
d."8000, 5000, 5000, 26000"

Câu 51: "Điền theo trình tự từ trên xuống dưới là?"
*a."SL=7, TT=770; SL=15, TT=6000; SL=10, TT=2000;"
b."SL=7, TT=770; SL=15, TT=6000; SL=10, TT=4250;"
c."SL=2, TT=230; SL=5, TT=-2000; SL=10, TT=2000;"
d."SL=2, TT=230; SL=5, TT=-2000; SL=25, TT=4250;"

Câu 52: "Các con số cần điền vào bảng tổng hợp trên đây là?"
a."Ghi phần dư cuối kỳ, tk 111 cột Nợ = 20.000, tk 331 cột Có = 5.000"
*b."Ghi phần dư cuối kỳ, tk 111 cột Nợ = 10.000, tk 331 cột Có = 3.000"
c."Ghi phần dư cuối kỳ, tk 111 cột Có = 20.000, tk 331 cột Nợ = 5.000"
d."Ghi phần dư cuối kỳ, tk 111 cột Có = 10.000, tk 331 cột Nợ = 3.000"

Câu 53: "Các con số cần điền vào bảng tổng hợp trên đây là?"
a."Ghi phần dư cuối kỳ, tk 131 cột Nợ = 38.000, tk 334 cột Có = 30.000"
*b."Ghi phần dư cuối kỳ, tk 131 cột Nợ = 2.000, tk 334 cột Có = 10.000"
c."Ghi phần dư cuối kỳ, tk 131 cột Có = 38.000, tk 334 cột Nợ = 30.000"
d."Ghi phần dư cuối kỳ, tk 131 cột Có = 2.000, tk 334 cột Nợ = 10.000"

Câu 54: "Anh Minh, một cổ đông của doanh nghiệp muốn rút vốn để ra định cư ở nước ngoài.Tiền vốn anh Minh đã góp vào công ty 20 triệu.Kế toán cần hạch toán giao dịch rút vốn của anh Minh như thế nào?"
*a."Ghi Nợ tài khoản 411, ghi Có tài khoản 111"
b."Ghi Có tài khoản 411, ghi Nợ tài khoản 111"
c."Ghi Nợ tài khoản 411, ghi Có tài khoản 331"
d."Ghi Có tài khoản 411, ghi Nợ tài khoản 331"

Câu 55: "Quy trình sản xuất phần mềm bao gồm 4 giai đoạn cơ bản: Xây dựng (A), Thiết kế (B), Khảo sát (C), Kiểm định (D).Hãy xếp đúng trình tự các giai đoạn?"
a."A-B-C-D"
*b."C-B-A-D"
c."B-C-A-D"
d."D-A-C-B"

Câu 56: "Hậu đang sử dụng các chứng từ thực tế nhập liệu vào các form vừa xây dựng trên Access, sau đó chạy báo cáo xem có khớp với các sổ sách Kế toán vẫn được lập trên giấy hay không.Hậu đang thực hiện giai đoạn nào trong quy trình sản xuất phần mềm?"
a."Thiết kế"
b."Xây dựng"
c."Khảo sát"
*d."Kiểm định"

Câu 57: "Mô hình cấu tạo cơ bản phần mềm bao gồm các thành phần: Đầu vào (I), Đầu ra (O), Xử lý (P), Lưu trữ (S).Bất kỳ một công cụ xây dựng phần mềm nào cũng cần có các thành phần này.Khi nghiên cứu Access, Khương thấy có các loại đối tượng sau: Form (F), Table (T), Query (Q), Report (R).Hãy ghép các loại đối tượng Access tương ứng với các thành phần cấu tạo phần mềm?"
a."IF-OT-PR-QS"
b."OF-PQ-SR-IT"
*c."IF-OR-PQ-ST"
d."SF-OR-PT-IQ"

Câu 58: "Trình tự xây dựng các thành phần phần mềm Kế toán trên Access được sử dụng trong khóa học là?"
a."Xây dựng Table => Xây dựng Report => Xây dựng Form => Xây dựng Query"
b."Xây dựng Table => Xây dựng Report => Xây dựng Query => Xây dựng Form"
*c."Xây dựng Table => Xây dựng Form => Xây dựng Query => Xây dựng Report"
d."Xây dựng Table => Xây dựng Query => Xây dựng Form => Xây dựng Report"

Câu 59: "Các đối tượng cần tin học hóa trong bài toán Kế toán bao gồm?"
a."Con người: Khách hàng, Nhân viên, Nhà cung cấp, Nhà đầu tư..."
b."Tài sản: Tiền mặt, hàng hóa, công cụ, tài sản cố định..."
c."Các công cụ kế toán: Chứng từ, Sổ sách, Báo cáo"
*d."Tất cả các loại đối tượng trên"

Câu 60: "Trình tự làm kế toán máy gồm các bước cơ bản nào?"
a."Lập chứng từ => Ghi sổ nhật ký => Ghi sổ cái => Ghi sổ chi tiết"
b."Ghi sổ chi tiết => Lập bảng tổng hợp => Lập bảng cân đối tài khoản"
*c."Nhập danh mục => Nhập chứng từ => In sổ sách => In báo cáo"
d."Nhập chứng từ => Nhập sổ sách => Nhập báo cáo"

Câu 61: "Để tổng hợp dữ liệu cho các báo cáo Kế toán, cần tạo đối tượng nào trong Access?"
a."Table"
*b."Query"
c."Report"
d."Form"

Câu 62: "Để thiết lập quan hệ một nhiều giữa hai bảng dữ liệu cần thực hiện thao tác nào?"
*a."Mở Relationships, bấm Show Tables và Add thêm bảng, kéo thả 2 trường liên kết"
b."Mở Relationships, kéo thả tiêu đề 2 bảng cần liên kết"
c."Mở Relationships, bấm nút Create Relation, chọn cột liên kết"
d."Mở Relationships, vẽ đường thẳng nối hai bảng"

Câu 63: "Sau khi tạo liên kết giữa bảng tableChungTu và bảng tableChiTiet, hệ thống hiển thị một đường thẳng nối và số 1 cạnh bảng tableChungTu, ký hiệu vô cùng cạnh bảng tableChiTiet.Quan hệ này có ý nghĩa gì?"
*a."Một dòng dữ liệu trên bảng tableChungTu có thể liên kết với nhiều dòng dữ liệu trên bảng tableChiTiet"
b."Một dòng dữ liệu trên bảng tableChiTiet có thể liên kết với nhiều dòng dữ liệu trên bảng tableChungTu"
c."Một bảng tableChungTu có thể liên kết nhiều bảng tableChiTiet"
d."Một bảng tableChiTiet có thể liên kết nhiều bảng dữ liệu tableChungTu"

Câu 64: "Form là đối tượng dùng để nhập liệu vào bảng lưu trữ Table.Để kết nối Form và Table cần thiết đặt như thế nào?"
a."Đặt thuộc tính Table = tên bảng trong mục Data sau khi bấm chuột phải chọn Properties"
b."Đặt thuộc tính SaveTo = tên bảng trong mục Data sau khi bấm chuột phải chọn Properties"
*c."Đặt thuộc tính Record Source = tên bảng trong mục Data sau khi bấm chuột phải chọn Properties"
d."Đặt thuộc tính Record Source = tên bảng trong mục Format sau khi bấm chuột phải chọn Properties"

Câu 65: "Để tạo ô nhập liệu trên Form nhập liệu trực tiếp và các cột dữ liệu trên Table.Cần thực hiện thao tác nào?"
a."Bấm nút Relationships => Chọn cột dữ liệu cần nhập => Bấm nút Create Control"
*b."Bấm nút Field List để hiển thị danh sách trường => Kéo thả trường dữ liệu vào form"
c."Bấm nút Create Input => chọn cột dữ liệu cần tạo"
d."Bấm nút My Fields => Kéo thả trường dữ liệu vào Form"

Câu 66: "Tuấn thực hiện các thao tác sau trên Access: Bấm '' Create form in design view'', bấm chuột phải form chọn Properties \\ Data, chọn Record Source = tableChungTu.Hãy giải nghĩa các thao tác trên?"
a."Tạo bảng dữ liệu tableChungTu"
b."Tạo form nhập liệu"
*c."Tạo form nhập liệu và kết nối Form mới tạo với bảng tableChungTu"
d."Kết nối form với bảng tableChungTu"

Câu 67: "Sau khi tạo các ô nhập liệu trên Form chứng từ.Muốn tạo nút lệnh '' Ghi chứng từ''.Các thao tác cần thực hiện là?"
a."Kéo đối tượng CommandButton vào form, chọn lệnh Record Navigation \\ Find Record"
b."Kéo đối tượng CommandButton vào form, chọn lệnh Record Navigation \\ Delete Record"
*c."Kéo đối tượng CommandButton vào form, chọn lệnh Record Operation \\ Save Record"
d."Kéo đối tượng CommandButton vào form, chọn lệnh Record Operation \\ Save Record"

Câu 68: "Sau khi tạo các ô nhập liệu trên Form chứng từ.Muốn tạo nút lệnh '' Tìm chứng từ''.Các thao tác cần thực hiện là?"
a."Kéo đối tượng CommandButton vào form, chọn lệnh Record Navigation \\ Delete Record"
*b."Kéo đối tượng CommandButton vào form, chọn lệnh Record Navigation \\ Find Record"
c."Kéo đối tượng CommandButton vào form, chọn lệnh Record Operation \\ Goto Previous Record"
d."Kéo đối tượng CommandButton vào form, chọn lệnh Record Operation \\ Add New Record"

Câu 69: "Để tạo bảng nhập liệu chi tiết cho chứng từ, lưu vào bảng tableChiTiet.Cần sử dụng control nào?"
a."TextBox"
b."ComboBox"
c."Command Button"
*d."Subform/SubReport"

Câu 70: "Khi tạo form nhập chi tiết chứng từ.Cần lập trình khả năng tự động tính: Thành tiền dựa vào Số lượng và Đơn giá.Tú đã bấm chuột phải vào control SoLuong, chọn tab Event.Tú cần lập trình cho sự kiện nào?"
a."On Enter"
b."On Focus"
*c."On Exit"
d."On Keydown"

Câu 71: "Phương muốn lấy dữ liệu để lập sổ nhật ký.Các cột dữ liệu cần lấy gồm NgayGhiSo, SoChungTu, DienGiai, TkNo, TkCo, SoTien, dữ liệu lấy trong tháng 3, sắp xếp theo số chứng từ.Hãy chọn câu lệnh Phương cần?"
a."SELECT NgayGhiSo, SoChungTu, DienGiai, TkNo, TkCo, SoTien WHERE Month(NgayGhiSo)=3"
b."SELECT NgayGhiSo, SoChungTu, DienGiai, TkNo, TkCo, SoTien FROM tableChungTu ORDER BY SoChungTu"
*c."SELECT NgayGhiSo, SoChungTu, DienGiai, TkNo, TkCo, SoTien FROM tableChungTu WHERE Month(NgayGhiSo)=3 ORDER BY SoChungTu"
d."SELECT NgayGhiSo, SoChungTu, DienGiai, TkNo, TkCo, SoTien FROM tableChungTu WHERE Month(NgayGhiSo)=3"

Câu 72: "Câu lệnh SQL giúp tổng hợp dữ liệu báo cáo bằng các từ khóa SELECT (S) FROM (F) WHERE (W) ORDER BY (O) cho phép: Chọn bảng dữ liệu (B) Đặt điều kiện lấy dữ liệu (D) Chọn cột dữ liệu (C) Sắp xếp dữ liệu (X).Hãy ghép các từ khóa S,F,W,O với các chức năng C,B,D,X"
a."SX-FB-WC-OD"
*b."SC-FB-WD-OX"
c."SX-FD-WB-OC"
d."SB-FX-WB-OC"

Câu 73: "Từ khóa SUM kết hợp với GROUP BY có tác dụng?"
a."Chọn cột dữ liệu, chọn bảng dữ liệu khi xử lý"
b."Đặt điều kiện và sắp xếp dữ liệu khi xử lý"
*c."Cộng dữ liệu theo nhóm khi xử lý"
d."Đặt điều kiện và chọn cột dữ liệu khi xử lý"

Câu 74: "Bảng dữ liệu số dư tài khoản gồm các cột, TaiKhoan, Thang, Nam, DuDauKyBenNo, DuDauKyBenCo.Hãy xác định kiểu dữ liệu cho các cột này?"
a."Text, Date/Time, Date/Time, Number, Number"
b."Text, Number, Number, Number, Number"
*c."Text, Number, Number, Currency, Currency"
d."Number, Text, Text, Currency, Currency"

Câu 75: "Để đặt điều kiện lấy dữ liệu cho sổ cái tài khoản 131.Huệ cần viết điều kiện WHERE như thế nào?"
a."WHERE TaiKhoanNo=131 OR TaiKhoanCo=131"
b."WHERE TaiKhoanNo=131 AND TaiKhoanCo=131"
*c."WHERE TaiKhoanNo=' 131' OR TaiKhoanCo=' 131' "
d."WHERE TaiKhoanNo OR TaiKhoanCo = ' 131'"

Câu 76: "Để tạo cột BenCo từ cột SoTien khi lấy dữ liệu cho sổ cái tài khoản 411.Cần viết lệnh SELECT như thế nào?"
*a."SELECT SWITCH( TaiKhoanCo='411', SoTien ) AS BenCo"
b."SELECT CHOOSE(TaiKhoanCo='411', SoTien) AS BenCo"
c."SELECT BenCo = SWITCH ( TaiKhoanCo = '411' , SoTien)"
d."SELECT BenCo =CHOOSE ( TaiKhoanCo = '411' , SoTien)"

Câu 77: "Giải thích câu lệnh SQL sau: SELECT TaiKhoan, SUM(BenNo) AS PhatSinhNo FROM queryKeChungTu GROUP BY TaiKhoan ?"
a."Lấy số liệu phát sinh bên Nợ của các tài khoản"
*b."Cộng dồn số tiền Nợ trên queryKeChungTu nhóm theo từng tài khoản"
c."Lấy danh sách tài khoản và danh sách số tiền phát sinh Nợ"
d."Cộng dồn số tiền Nợ trên queryKeChungTu của tất cả các tài khoản"

Câu 78: "Để kết nối báo cáo với nguồn dữ liệu, cần sửa đổi thuộc tính nào của báo cáo?"
a."Data \\ Data Source"
*b."Data \\ Record Source"
c."Format \\ Format Source"
d."Format \\ Data Source"

Câu 79: "Khi in báo cáo muốn định dạng các ô hiển thị số tiền, Hiền đã bấm chuột phải vào control SoTien ở dải Detail trên reportSonNhatKy, chọn tab Format.Muốn định dạng bỏ dấu $ hoặc ký hiệu tiền khác và không có chữ số nào sau dấu thập phân Hiền phải đặt 2 thuộc tính Format và Decimal Places thế nào?"
a."Format = General Number / Decimal Places = 1"
b."Format = Scientific / Decimal Places = 2"
*c."Format = Standard / Decimal Places = 0"
d."Format = Percent / Decimal Places = 0"

Câu 80: "Kẻ một đường chéo vào phần Detail trên màn hình thiết kế Report.Biết nguồn dữ liệu có 6 bản ghi.Hỏi số đường chéo khi hiển thị Report là bao nhiêu?"
a."3 đường chéo"
b."4 đường chéo"
c."1 đường chéo"
*d."6 đường chéo"

Câu 81: "Trên form nhập chứng từ, Kế toán công ty cần một nút bấm để xem Sổ Nhật ký nhằm kiểm tra dữ liệu nhanh chóng trong quá trình nhập.Người lập trình cần tạo Command Button với lệnh nào?"
a."Record Navigation \\ Open Report"
b."Report Operation \\ Open Report"
*c."Report Operation \\ Preview Report"
d."Record Navigation \\ Preview Report"

Câu 82: "Khi xây dựng trường dữ liệu TaiKhoanNo, Muốn lấy danh mục tài khoản có sẵn trong bảng tableTaiKhoan để người dùng nhập tiện dụng và tránh sai sót.Cần sử dụng kiểu dữ liệu nào?"
a."AutoNumber"
b."Text"
*c."Lookupwizard"
d."Date/Time"

Câu 83: "Bảng dữ liệu lưu trữ chứng từ có trường LoaiChungTu.Cần sử dụng kiểu dữ liệu nào để định nghĩa các danh mục chứng từ sẵn có cho LoaiChungTu ?"
a."AutoNumber"
*b."Lookupwizard"
c."Text"
d."Date/Time"

Câu 84: "Để đặt điều kiện lấy dữ liệu cho sổ cái tài khoản 511.Cần viết điều kiện WHERE như thế nào?"
a."WHERE TaiKhoanNo=511 OR TaiKhoanCo=5111"
b."WHERE TaiKhoanNo=511 AND TaiKhoanCo=511"
*c."WHERE TaiKhoanNo=' 511' OR TaiKhoanCo=' 511' "
d."WHERE TaiKhoanNo OR TaiKhoanCo = ' 511'"

Câu 85: "Sau khi nhập và tổng hợp dữ liệu chứng từ, cần tạo đối tượng nào trong Access để xây dựng sổ sách báo cáo Kế toán?"
a."Table"
b."Query"
*c."Report"
d."Form"

Câu 86: "Sau khi tạo Report sổ nhật ký, Hải muốn copy thành reportSoCaiTK111 để sửa lại thành sổ Cái cho nhanh.Hải cần bấm chuột phải vào report và chọn lệnh nào?"
a."Copy Report To.."
*b."Save As..."
c."Copy As"
d."Move Report"

Phần 2:
Câu 1: Ngày 28/4, công ty Trường Xuân thanh toán tiền hàng đợt 2 cho nhà cung cấp Trần Anh 3 triệu.Kế toán công ty TX đã chép khoản tiền 3 triệu vào cột Nợ trên sổ cái TK 331.Hãy xác định tài khoản cho cột Tài khoản đối ứng?
156
*111
131
642

Câu 2: Công ty Trường Xuân thay 40 bàn phím cho Bệnh viện Hồng Ngọc thu tiền sau.Kế toán công ty cần hạch toán như thế nào?
Ghi Nợ tài khoản 642, Có tài khoản 131
Ghi Nợ tài khoản 642, Có tài khoản 331
Ghi Nợ tài khoản 111, Có tài khoản 511
*Ghi Nợ tài khoản 131, Có tài khoản 511

Câu 3: Cuối kỳ, tổng phát sinh bên Có của tài khoản 511 là 32 triệu.Hãy xác định bút toán kết chuyển doanh thu xác định kết quả kinh doanh?
*Ghi Nợ 511, Có 911 số tiền 32 triệu
Ghi Có 511, Nợ 911 số tiền 32 triệu
Ghi Nợ 511, Có 421 số tiền 32 triệu
Ghi Có 511, Nợ 421 số tiền 32 triệu

Câu 4: Tài khoản 511 là tài khoản?
Doanh thu - ghi tăng bên Nợ
*Doanh thu - ghi tăng bên Có
Chi phí - ghi tăng bên Nợ
Chi phí - ghi tăng bên Có

Câu 5: Tháng 3, số dư đầu kỳ bên Có tài khoản 421 = 1000, tổng phát sinh Nợ = 200, tổng phát sinh Có = 0.Hãy xác định số dư đầu kỳ tháng 4 của tài khoản 421?
*Dư đầu kỳ tháng 4 bên Có = 800
Dư đầu kỳ tháng 4 bên Có = 1200
Dư đầu kỳ tháng 4 bên Nợ = 800
Dư đầu kỳ tháng 4 bên Nợ = 1200

Câu 6: Cuối kỳ, tổng phát sinh bên sổ cái tài khoản 911 là: Bên Nợ: 9 triệu, bên Có: 12 triệu.Hãy xác định bút toán kết chuyển lãi lỗ cuối kỳ?
Ghi Nợ 421, Có 911 số tiền 12 triệu
*Ghi Nợ 911, Có 421 số tiền 3 triệu
Ghi Nợ 421, Có 911 số tiền 9 triệu
Ghi Nợ 911, Có 421 số tiền 21 triệu

Câu 7: Giám đốc doanh nghiệp muốn xem lịch sử lãi lỗ hàng tháng của công ty từ đầu năm.Kế toán cần sử dụng sổ cái tài khoản nào?
Sổ cái tài khoản 511
*Sổ cái tài khoản 421
Sổ cái tài khoản 642
Sổ cái tài khoản 334

Câu 8: Sau khi anh Hoàng nộp 10 triệu vào công ty, kế toán hạch toán Nợ 111, Có 411.Hãy giải nghĩa giao dịch trên?
Anh Hoàng nộp doanh thu về công ty
Anh Hoàng thanh toán tiền tạm ứng
*Anh Hoàng góp vốn
Anh Hoàng nộp tiền bảo hiểm

Câu 9: Cách sử dụng tài khoản 411?
*Nhà đầu tư góp vốn ghi Có 411, Nợ 111; nhà đầu tư rút vốn: ghi Nợ 411, Có 111
Nhà đầu tư góp vốn ghi Nợ 411, Có 334; nhà đầu tư rút vốn: ghi Có 411, Nợ 334
Nhà đầu tư góp vốn ghi Nợ 411, Có 111; nhà đầu tư rút vốn: ghi Có 411, Nợ 111
Nhà đầu tư góp vốn ghi Có 411, Nợ 642; nhà đầu tư rút vốn: ghi Nợ 411, Có 642

Câu 10: Anh Minh, một cổ đông của doanh nghiệp muốn rút vốn để ra định cư ở nước ngoài. Tiền vốn anh Minh đã góp vào công ty 20 triệu.Kế toán cần hạch toán giao dịch rút vốn của anh Minh như thế nào?
*Ghi Nợ tài khoản 411, ghi Có tài khoản 111
Ghi Có tài khoản 411, ghi Nợ tài khoản 111
Ghi Nợ tài khoản 411, ghi Có tài khoản 331
Ghi Có tài khoản 411, ghi Nợ tài khoản 331

Câu 11: Tài khoản 411 là tài khoản?
Doanh thu - tính chất Nợ
Hàng hoá - tính chất Nợ
*Vốn góp - tính chất Có
Chi phí - tính chất Nợ

Câu 12: Kế toán công ty bảo trì máy tính Trường Xuân hạch toán Nợ 642 Có 331 trong giao dịch với công ty quảng cáo GoldSun (GS).Hãy giải nghĩa giao dịch trên?
*Trường Xuân thuê dịch vụ quảng cáo của GS trả tiền sau
Trường Xuân bảo trì máy tính cho GS trả tiền sau
Trường Xuân bảo trì máy tính cho GS thu tiền sau.
Trường Xuân làm dịch vụ quảng cáo cho GS

Câu 13: Doanh nghiệp Hoàng Long cho thuê xe du lịch thu tiền ngay chuyến ngày 24/5 giá 5 triệu.Kế toán cty Hoàng Long cần hạch toán như thế nào?
Ghi Nợ tài khoản 131, Có tài khoản 511 số tiền 5 triệu
Ghi Nợ tài khoản 111, Có tài khoản 331 số tiền 5 triệu
*Ghi Nợ tài khoản 111, Có tài khoản 511 số tiền 5 triệu
Ghi Nợ tài khoản 131, Có tài khoản 511 số tiền 5 triệu

Câu 14: Tháng 3 công ty TX nhập hàng trả tiền ngay. Tháng 4 công ty TX nhập hàng trả chậm. Ngày 18/3 TX nhập một đợt hàng trị giá 5 triệu, ngày 20/4 TX nhập hàng trị giá 7 triệu.Kế toán công ty TX phải hạch toán 2 giao dịch này như thế nào?
18/3: ghi Nợ 156, Có 111 số tiền 5 triệu; 20/4: ghi Nợ 156 Có 111 số tiền 7 triệu.
18/3: ghi Có 156, Nợ 111 số tiền 5 triệu; 20/4: ghi Có 156 Nợ 111 số tiền 7 triệu.
*18/3: ghi Nợ 156, Có 111 số tiền 5 triệu; 20/4: ghi Nợ 156 Có 331 số tiền 7 triệu.
18/3: ghi Nợ 156, Có 331 số tiền 5 triệu; 20/4: ghi Nợ 156 Có 331 số tiền 7 triệu.

Câu 15: Để theo dõi công nợ phải trả cho người bán (nhà cung cấp). Kế toán công ty Trường Xuân cần sử dụng tài khoản nào?
411
131
911
*331

Câu 16: Sau khi nhận được bảng lương từ phòng nhân sự với tổng tiền 12 triệu. Kế toán công ty Trường Xuân ghi nhận lương phải trả người lao động trên sổ cái tài khoản 334.Số tiền 12 triệu đã được chép vào cột Có trên sổ cái tài khoản.Hãy xác định tài khoản đối ứng cần ghi chép?
511
111
*642
331

Câu 17: Ngày 3/4/2010 công ty Trường Xuân trả lương khối dịch vụ 10 triệu đồng.Hãy xác định bút toán chính xác?
Ghi Nợ 111, có 334 số tiền 10 triệu đồng.
Ghi Nợ 642, có 334 số tiền 10 triệu đồng.
*Ghi Có 111, Nợ 334 số tiền 10 triệu đồng.
Ghi Có 111, Nợ 642 số tiền 10 triệu đồng.

Câu 18: Tài khoản 334 được sử dụng để theo dõi tiền lương phải trả người lao động.Hãy xác định cách sử dụng tài khoản 334?
Khi tính lương ghi Có 642, Nợ 334 số tổng tiền lương, khi trả lương ghi Có 334, Nợ 111 số tiền thực trả.
*Khi tính lương ghi Nợ 642, Có 334 số tổng tiền lương, khi trả lương ghi Nợ 334, Có 111 số tiền thực trả.
Khi tính lương ghi Có 511, Nợ 334 số tổng tiền lương, khi trả lương ghi Có 334, Nợ 111 số tiền thực trả.
Khi tính lương ghi Nợ 642, Có 334 số tổng tiền lương, khi trả lương ghi Nợ 334, Có 642 số tiền thực trả.

Câu 19: Để theo dõi khoản mục tiền lương phải trả người lao động, cần sử dụng tài khoản nào?
411
511
331
*334

Câu 20: Khi anh Hải đến giao dịch, kế toán công ty Trường Xuân đã hạch toán trên chứng từ như sau: Nợ 111, Có 131 số tiền 2 triệu đồng.Hãy giải nghĩa sự kiện kinh tế trên?
*Công ty Trường Xuân thu tiền nợ của anh Hải
Công ty Trường Xuân bán hàng cho anh Hải
Công ty Trường Xuân trả chi phí cho anh Hải
Công ty Trường Xuân trả nợ cho anh Hải

Câu 21: Tài khoản 131 là tài khoản?
Doanh thu
Hàng hoá
*Phải thu của khách hàng
Chi phí

Câu 22: Ngày 12/4 công ty May 10 thanh toán nợ cho Trường Xuân 10 triệu đồng.Kế toán công ty Trường Xuân cần hạch toán như thế nào?
Ghi Nợ tài khoản 111, ghi Có tài khoản 511 số tiền 10 triệu đồng
Ghi Nợ tài khoản 131, ghi Có tài khoản 511 số tiền 10 triệu đồng
Ghi Nợ tài khoản 511, ghi Có tài khoản 131 số tiền 10 triệu đồng
*Ghi Nợ tài khoản 111, ghi Có tài khoản 131 số tiền 10 triệu đồng

Câu 23: Bệnh viện Hồng Ngọc thuê công ty Trường Xuân bảo trì 50 máy tính hết chi phí 3 triệu đồng và hẹn Công ty Trường Xuân tháng sau trả tiền.Kế toán công ty Trường Xuân cần hạch toán như thế nào?
Ghi Nợ tài khoản 111, ghi Có tài khoản 511 số tiền 3 triệu đồng
*Ghi Nợ tài khoản 131, ghi Có tài khoản 511 số tiền 3 triệu đồng
Ghi Nợ tài khoản 511, ghi Có tài khoản 131 số tiền 3 triệu đồng
Ghi Nợ tài khoản 331, ghi Có tài khoản 511 số tiền 3 triệu đồng

Câu 24: Để tin học hóa bài toán Kế toán, đội dự án nghiên cứu lý thuyết kế toán, tham quan các mô hình thực tế, tìm hiểu và thực hành cách lập chứng từ, ghi sổ sách, tổng hợp báo cáo. Giai đoạn này trong quy trình sản xuất phần mềm được gọi là?
Thiết kế
Xây dựng
*Khảo sát
Kiểm định

Câu 25: Sau khi nhập và tổng hợp dữ liệu chứng từ, cần tạo đối tượng nào trong Access để xây dựng sổ sách báo cáo Kế toán?
Table
Query
*Report
Form

Câu 26: Để có màn hình nhập chứng từ thuận tiện, đầy đủ tính năng, cần tạo đối tượng nào trong Access?
Table
Query
Report
*Form

Câu 27: Để tổng hợp dữ liệu cho các báo cáo Kế toán, cần tạo đối tượng nào trong Access?
Table
*Query
Report
Form

Câu 28: Trình tự làm kế toán máy gồm các bước cơ bản nào?
Lập chứng từ => Ghi sổ nhật ký => Ghi sổ cái => Ghi sổ chi tiết
Ghi sổ chi tiết => Lập bảng tổng hợp => Lập bảng cân đối tài khoản
*Nhập danh mục => Nhập chứng từ => In sổ sách => In báo cáo
Nhập chứng từ => Nhập sổ sách => Nhập báo cáo

Câu 29: Các đối tượng cần tin học hóa trong bài toán Kế toán bao gồm?
Con người: Khách hàng, Nhân viên, Nhà cung cấp, Nhà đầu tư...
Tài sản: Tiền mặt, hàng hóa, công cụ, tài sản cố định...
Các công cụ kế toán: Chứng từ, Sổ sách, Báo cáo
*Tất cả các loại đối tượng trên

Câu 30: Trình tự xây dựng các thành phần phần mềm Kế toán trên Access được sử dụng trong khóa học là?
Xây dựng Table => Xây dựng Report => Xây dựng Form => Xây dựng Query
Xây dựng Table => Xây dựng Report => Xây dựng Query => Xây dựng Form
*Xây dựng Table => Xây dựng Form => Xây dựng Query => Xây dựng Report
Xây dựng Table => Xây dựng Query => Xây dựng Form => Xây dựng Report

Câu 31: Mô hình cấu tạo cơ bản phần mềm bao gồm các thành phần: Đầu vào (I), Đầu ra (O), Xử lý (P), Lưu trữ (S). Bất kỳ một công cụ xây dựng phần mềm nào cũng cần có các thành phần này. Khi nghiên cứu Access, Khương thấy có các loại đối tượng sau: Form (F), Table (T), Query (Q), Report (R).Hãy ghép các loại đối tượng Access tương ứng với các thành phần cấu tạo phần mềm?
IF-OT-PR-QS
OF-PQ-SR-IT
*IF-OR-PQ-ST
SF-OR-PT-IQ

Câu 32: Hậu đang sử dụng các chứng từ thực tế nhập liệu vào các form vừa xây dựng trên Access, sau đó chạy báo cáo xem có khớp với các sổ sách Kế toán vẫn được lập trên giấy hay không. Hậu đang thực hiện giai đoạn nào trong quy trình sản xuất phần mềm?
Thiết kế
Xây dựng
Khảo sát
*Kiểm định

Câu 33: Sau quá trình nghiên cứu đội dự án tin học hóa Kế toán quyết định chọn công cụ Access và bắt đầu sử dụng Access làm các table, viết các câu lệnh SQL tạo query tổng hợp dữ liệu, tạo các đối tượng Report để lên báo cáo. Giai đoạn này trong quy trình sản xuất phần mềm được gọi là?
Thiết kế
*Xây dựng
Khảo sát
Kiểm định

Câu 34: Dựa trên các mẫu sổ sách và yêu cầu làm kế toán của doanh nghiệp, đội dự án phần mềm viết tài liệu phác thảo cơ chế lưu dữ liệu, các thành phần bảng dữ liệu với kiểu dữ liệu cụ thể, vẽ các màn hình nhập liệu, vẽ mẫu báo cáo. Giai đoạn này trong quy trình sản xuất phần mềm được gọi là?
*Thiết kế
Xây dựng
Khảo sát
Kiểm định

Câu 35: Kế toán công ty Trường Xuân ghi Nợ tài khoản 156, ghi Có tài khoản 331 số tiền 10 triệu đồng.Sự kiện kinh tế nào được ghi chép và hạch toán như trên?
Công ty Trường Xuân trả lương nhân viên
Công ty Trường Xuân mua bàn ghế
Công ty Trường Xuân thuê văn phòng
*Công ty Trường Xuân nhập hàng về bán, trả tiền sau

Câu 36: Quy trình sản xuất phần mềm bao gồm 4 giai đoạn cơ bản: Xây dựng (A), Thiết kế (B), Khảo sát (C), Kiểm định (D). Hãy xếp đúng trình tự các giai đoạn?
A-B-C-D
*C-B-A-D
B-C-A-D
D-A-C-B

Câu 37: Trên sổ cái tài khoản 911 công ty Trường Xuân tháng 5 / 2010 người ta thấy có 2 dòng:tài khoản đối ứng 642 - ghi Nợ 911 số tiền 42 triệutài khoản đối ứng 511 - ghi Có 911 số tiền 32 triệu.Hãy xác định lãi lỗ và bút toán kết chuyển sang tài khoản 421 (tăng bên Có)?
Doanh nghiệp lãi 10 triệu, bút toán kết chuyển ghi Nợ 911, Có 421 số tiền 10 triệu
*Doanh nghiệp lỗ 10 triệu, bút toán kết chuyển ghi Có 911, Nợ 421 số tiền 10 triệu
Doanh nghiệp lỗ 10 triệu, bút toán kết chuyển ghi Có 911, Nợ 421 số tiền 10 triệu

Câu 38: Trên sổ cái tài khoản 911 công ty Trường Xuân tháng 4 / 2010 người ta thấy có 2 dòng:tài khoản đối ứng 642 - ghi Nợ 911 số tiền 23 triệutài khoản đối ứng 511 - ghi Có 911 số tiền 32 triệu.Hãy xác định lãi lỗ và bút toán kết chuyển sang tài khoản 421 (tăng bên Có)?
*Doanh nghiệp lãi 9 triệu, bút toán kết chuyển ghi Nợ 911, Có 421 số tiền 9 triệu
Doanh nghiệp lỗ 9 triệu, bút toán kết chuyển ghi Có 911, Nợ 421 số tiền 9 triệu
Doanh nghiệp lãi 9 triệu, bút toán kết chuyển ghi Nợ 911, Có 421 số tiền 9 triệu

Câu 39: Để xác định kết quả kinh doanh trong kỳ, người làm Kế toán tổng hợp sử dụng tài khoản nào?
421
642
511
*911

Câu 40: Anh Toàn thợ điện, đến công ty Vĩnh Phát nhận số tiền 3 triệu đồng tiền sửa chữa hệ thống điều hoà.Kế toán công ty Vĩnh phát đã hạch toán như sau Nợ 642 Có 111 số tiền 3 triệu.Số tiền 3 triệu đã được hạch toán như thế nào?
Ghi tăng tiền mặt, ghi giảm chi phí của Vĩnh Phát.
*Ghi tăng Chi phí, ghi giảm tiền mặt của Vĩnh Phát.
Ghi tăng Doanh thu, ghi tăng tiền mặt của Vĩnh Phát.
Ghi giảm Doanh thu, ghi tăng tiền mặt của Vĩnh Phát.

Câu 41: Cuối kỳ, tổng phát sinh bên Nợ của tài khoản 642 là 23 triệu.Hãy xác định bút toán kết chuyển chi phí để xác định kết quả kinh doanh?
Ghi Nợ 642, Có 911 số tiền 23 triệu
*Ghi Có 642, Nợ 911 số tiền 23 triệu
Ghi Nợ 642, Có 421 số tiền 23 triệu
Ghi Có 642, Nợ 421 số tiền 23 triệu

Câu 42: Tài khoản 642 là tài khoản?
Doanh thu - ghi tăng bên Nợ
Doanh thu - ghi tăng bên Có
Chi phí - ghi tăng bên Nợ
*Chi phí - ghi tăng bên Có

Câu 43: Công ty An Bình trả tiền điện nước tháng 5/2010 số tiền 2 triệu đồng bằng tiền mặt.Hãy xác định hạch toán?
Ghi Nợ tài khoản 411, ghi Có tài khoản 111 số tiền 2 triệu đồng
*Ghi Nợ tài khoản 642, ghi Có tài khoản 111 số tiền 2 triệu đồng
Ghi Nợ tài khoản 511, ghi Có tài khoản 111 số tiền 2 triệu đồng
Ghi Nợ tài khoản 331, ghi Có tài khoản 111 số tiền 2 triệu đồng

Câu 44: Doanh nghiệp cần một cuốn sổ để theo dõi mọi sự kiện kinh tế xảy ra trong quý I theo trình tự thời gian.Kế toán phải sử dụng loại sổ sách nào sau đây?
*Số Cái tài khoản
Chứng từ
Số Nhật ký
Bảng cân đối tài khoản

Câu 45: Hãy chọn cách điền ghi chép còn dở dang ngày 7/3?
TK Đối ứng =642, cột Có = 3.000
*TK Đối ứng = 111, cột Có = 3.000
TK Đối ứng = 511, cột Nợ = 3.000
TK Đối ứng = 111, cột Nợ = 3.000

Câu 46: Trên sổ cái tài khoản 411, kế toán viên đã ghi chép như sau: số dư đầu kỳ: 3000, tổng phát sinh Nợ: 900 tổng phát sinh Có: 4000Hãy xác định số dư cuối kỳ tài khoản 411
-100 ghi bên Có
*6100 ghi bên Có
7900 ghi bên Có
6100 ghi bên Nợ

Câu 47: Trên sổ cái tài khoản 111, kế toán viên đã ghi chép như sau: số dư đầu kỳ: 1000, tổng phát sinh Nợ: 600 tổng phát sinh Có: 400Hãy xác định số dư cuối kỳ tài khoản 111
800 ghi bên Nợ
1000 ghi bên Có
*1200 ghi bên Nợ
1200 ghi bên Có

Câu 48: Trên một báo cáo dạng bảng tổng hợp có các cột sau: Mã Tài Khoản, Tên Tài Khoản, Dư đầu kỳ bên Nợ, Dư đầu kỳ bên Có, Phát sinh Nợ, Phát sinh Có, Dư cuối kỳ bên Nợ, Dư cuối kỳ bên cóHãy cho biết đây là công cụ kế toán nào:
Bảng tổng hợp công nợ phải thu
Bảng tổng hợp nhập xuất tồn
*Bảng cân đối tài khoản (Bảng cân đối số phát sinh)
Số cái tài khoản

Câu 49: Bảng cân đối tài khoản là báo cáo kế toán có nội dung?
Liệt kê danh sách toàn bộ các tài khoản doanh nghiệp sử dụng
Với mỗi tài khoản thể hiện số dư đầu kỳ, số phát sinh trong kỳ, số dư cuối kỳ
Cung cấp cái nhìn tổng thể hoạt động doanh nghiệp thông qua các số liệu tài khoản
*Tất cả các ý trên

Câu 50: Cuối tháng 4, giám đốc doanh nghiệp muốn biết tổng số tiền doanh nghiệp nợ các nhà cung cấp là bao nhiêu. Ngoài con số tổng cộng, giám đốc cũng cần biết tổng dư nợ chi tiết với từng nhà cung cấp. Kế toán phải chuẩn bị loại báo cáo, sổ sách gì? (chọn một)
Sổ chi tiết tài khoản công nợ phải thu của khách hàng
Sổ chi tiết thanh toán với người bán
*Bảng tổng hợp công nợ phải trả người bán
Sổ nhật ký

Câu 51: Cuối tháng 3, giám đốc doanh nghiệp muốn biết tổng số tiền khách hàng nợ doanh nghiệp là bao nhiêu. Ngoài con số tổng cộng, giám đốc cũng cần biết tổng dư nợ chi tiết từng khách hàng. Kế toán phải chuẩn bị loại báo cáo, sổ sách gì? (chọn một)
Sổ chi tiết tài khoản công nợ phải thu của khách hàng
*Bảng tổng hợp công nợ phải thu của khách hàng
Sổ chi tiết thanh toán với người bán
Sổ nhật ký

Câu 52: Khách hàng đến doanh nghiệp để đối chiếu công nợ. Kế toán doanh nghiệp cần sử dụng loại sổ sách nào để làm việc?
*Số chi tiết tài khoản công nợ phải thu
Chứng từ công nợ
Số Nhật ký công nợ
Số cái tài khoản công nợ phải trả

Câu 53: Doanh nghiệp cần theo dõi khoản mục vốn góp để nắm tình hình tổng số tiền vốn và lịch sử góp vốn.Kế toán phải sử dụng loại sổ sách nào sau đây để ghi chép lịch sử góp vốn?
*Số Cái tài khoản
Chứng từ
Số Nhật ký
Bàng cân đối tài khoản

Câu 54: Chứng từ là công cụ kế toán dùng để ghi chép và xác thực sự kiện kinh tế phát sinh.Trên chứng từ cần có các thông tin gì?
Ngày lập, ngày hiệu lực, đối tượng, diễn giải, số tiền
Địa chỉ, số điện thoại đối tượng tham gia, diễn giải sự kiện kinh tế, người lập
*Ngày lập, ngày hiệu lực, đối tượng, diễn giải, số tiền bằng số, bằng chữ, xác nhận của người lập, đối tượng, kế toán trưởng, giám đốc, tài khoản Nợ, Có

Câu 55: Để theo dõi từng sự kiện kinh tế, mỗi khi có sự kiện phát sinh, sự kiện cần được ghi chép và có xác nhận sự việc diễn ra, số tiền, các đối tượng liên quan. Người làm Kế toán phải lập?
Sổ chi tiết tài khoản
*Chứng từ
Số Nhật ký
Số cái tài khoản

Câu 56: Cấu trúc của tài khoản hay sổ cái tài khoản bao gồm những gì?
Số dư đầu kỳ, các dòng phát sinh
Các dòng phát sinh, số dư cuối kỳ
*Số dư đầu kỳ, các dòng phát sinh, cộng phát sinh, số dư cuối kỳ
Số dư đầu kỳ, số dư cuối kỳ

Câu 57: Khái niệm tài khoản?
Là khoản mục tài chính doanh nghiệp cần theo dõi
Là một cuốn sổ ghi chép các hoạt động hàng ngày của doanh nghiệp.
Là quyển sổ ghi nhật ký các sự kiện kinh tế
*Là khoản mục tài chính doanh nghiệp cần theo dõi, được thể hiện trên thực tế bằng một cuốn Sổ ghi chép các sự kiện kinh tế theo khoản mục gọi là Sổ cái Tài khoản.

Câu 58: Doanh nghiệp thanh toán tiền công nợ với nhà cung cấp Trần Anh.Kế toán phải ghi chép sự kiện kinh tế này như thế nào?
Ghi giảm tiền phải trả cho nhà cung cấp Trần Anh
Ghi giảm tiền mặt trong quỹ
*Ghi giảm tiền phải trả cho nhà cung cấp Trần Anh, đồng thời ghi giảm tiền mặt trong quỹ.
Không cần chép sổ, chỉ cần lập phiếu chi thanh toán công nợ

Câu 59: Để theo dõi các hoạt động doanh nghiệp liên quan đến tiền tệ, người làm kế toán sử dụng hệ thống tài khoản và ghi chép theo nguyên tắc Kế toán kép. Nguyên tắc kế toán kép là gì?
Là nguyên tắc ghi chép phản ánh sự tăng/giảm tiền trên 1 tài khoản
Là nguyên tắc ghi chép phản ánh sự tăng/giảm tiền trên 2 tài khoản
*Là nguyên tắc ghi chép phản ánh sự tăng/giảm đồng thời của 2 hoặc nhiều tài khoản có liên quan đến nghiệp vụ kinh tế.
Là nguyên tắc ghi chép số tiền 2 lần trên cùng một sổ kế toán để tránh nhầm lẫn

Câu 60: Công ty Trường Xuân làm dịch vụ bảo trì cho công ty Vạn An thu về 3 triệu 4 trăm ngàn đồng tiền mặt.Kế toán phải ghi chép sự kiện kinh tế này như thế nào?
Ghi chép Sổ cái TK Doanh thu
*Ghi chép đồng thời vào Sổ cái tài khoản Doanh thu và Sổ cái TK tiền mặt
Ghi chép Sổ cái TK Tiền mặt
Không cần chép sổ, chỉ cần lập phiếu chi chi 3 triệu.

Câu 61: Công ty Trường Xuân trả tiền nhà tháng 3 năm 2010 cho bà Xiết hết 3 triệu đồng chẵn.Kế toán phải ghi chép sự kiện kinh tế này như thế nào?
*Ghi chép đồng thời vào Sổ cái tài khoản Chi phí và Sổ cái TK tiền mặt
Ghi chép Sổ cái TK Tiền mặt
Ghi chép Sổ cái TK Chi phí
Không cần chép sổ, chỉ cần lập phiếu chi chi 3 triệu.

Câu 62: Trình tự ghi chép sổ sách chứng từ Kế toán?
Ghi sổ chi tiết => ghi sổ nhật ký => lập chứng từ=> ghi sổ cái
*Căn cứ chứng từ=>ghi sổ nhật ký=>ghi sổ cái tài khoản
Ghi sổ chi tiết=>ghi sổ nhật ký=>lập chứng từ
Lập chứng từ=>ghi sổ chi tiết=>ghi sổ cái tài khoản

Câu 63: Các công cụ Kế toán bao gồm?
Bàng lương; phiếu chi, ủy nhiệm chi, hợp đồng lao động, bảng chấm công
*Chứng từ; Sổ nhật ký; Sổ cái tài khoản; Sổ chi tiết; Bảng tổng hợp; Bảng cân đối tài khoản
Đăng ký kinh doanh ; mẫu dấu, sổ đăng ký cổ đông,
Phiếu nhập kho; phiếu xuất kho; hóa đơn kiêm vận chuyển nội bộ

Câu 64: Công ty HOA LƯ có đội ngũ đông đảo các hoạ sỹ thiết kế tài hoa chuyên nghiệp, thợ thủ công tay nghề cao, chuyên các mặt hàng thủ công mỹ nghệ, các mặt hàng lưu niệm, tặng phẩm từ các chất liệu tự nhiên.Công ty Hoa lư là doanh nghiệp?
Thương mại
*Sản xuất
Dịch vụ
Thương mại và dịch vụ

Câu 65: Công ty Lửa Việt Du lịch Lữ hành Nội Địa & Quốc tế. Làm thủ tục visa, đặt mua: vé máy bay, vé xe lửa, ăn uống, lưu trú, vận chuyển hành khách... huấn luyện dã ngoại, hội nghị, họp mặt..thiết kế và tổ chức tour theo yêu cầu.Công ty Lửa Việt là doanh nghiệp?
Thương mại
Sản xuất
*Dịch vụ
Thương mại và dịch vụ

Câu 66: Doanh nghiệp chi 500 ngàn để mua văn phòng phẩm.Hãy xác định trình tự ghi chép nghiệp vụ kinh tế trên?
Lập phiếu chi, chép sổ cái tài khoản 111 tiền mặt, chép sổ cái tài khoản 642 chi phí
*Lập phiếu chi, chép sổ nhật ký, chép sổ cái tài khoản 111 tiền mặt, chép sổ cái tài khoản 642 chi phí
Chép sổ nhật ký, chép sổ cái tài khoản 111 tiền mặt, chép sổ cái tài khoản 642 chi phí
Chép sổ cái tài khoản 111 tiền mặt, chép sổ cái tài khoản 642 chi phí, chép sổ Nhật ký

Câu 67: Một sự kiện kinh tế phát sinh làm giảm giá trị kho hàng hoá và tăng chi phí vốn kinh doanh của doanh nghiệp 7 triệu đồng.Kế toán đã hạch toán khoản tiền này như thế nào?
Ghi Nợ tài khoản 642, ghi Có tài khoản 331
*Ghi Nợ tài khoản 642, ghi Có tài khoản 156
Ghi Nợ tài khoản 156, ghi Có tài khoản 331
Ghi Nợ tài khoản 156, ghi Có tài khoản 511

Câu 68: Doanh nghiệp Trường Xuân nhập từ công ty CMC 30 máy tính trị giá 300 triệu, trả tiền sau.Kế toán phải hạch toán khoản tiền này như thế nào?
Ghi Nợ tài khoản 642, ghi Có tài khoản 511
Ghi Nợ tài khoản 642, ghi Có tài khoản 331
*Ghi Nợ tài khoản 156, ghi Có tài khoản 331
Ghi Nợ tài khoản 156, ghi Có tài khoản 511

Câu 69: Tài khoản 156 là tài khoản?
Doanh thu - tính chất Nợ
*Hàng hoá - tính chất Nợ
Vốn góp - tính chất Có
Chi phí - tính chất Nợ

Câu 70: Sau khi một sự kiện kinh tế phát sinh. Kế toán đã ghi Nợ tài khoản 111, ghi Có tài khoản 131 số tiền 5 triệu đồng.Giao dịch trên có ý nghĩa như thế nào?
Khách hàng đến mua hàng trị giá 5 triệu.
*Doanh nghiệp thu tiền khách hàng còn nợ trước đó.
Doanh nghiệp thanh toán chi phí hoạt động
Doanh nghiệp trả lại tiền thừa cho khách hàng.

Câu 71: Công ty Trường Xuân thay chuột cho nhà máy may Tín Trực, thu tiền ngay.Kế toán cần hạch toán như thế nào?
Ghi Nợ tài khoản 111, ghi Nợ tài khoản 642
Ghi Nợ tài khoản 111, ghi Có tài khoản 642
*Ghi Nợ tài khoản 111, ghi Có tài khoản 511
Ghi Có tài khoản 111, ghi Có tài khoản 511

Câu 72: Công ty Trường Xuân thuê văn phòng, thanh toán trực tiếp bằng tiền mặt. Kế toán cần hạch toán những tài khoản nào?
111 và 334
421 và 642
911 và 511
*642 và 111

Câu 73: Tài khoản 111 là tài khoản?
*Tiền mặt - tính chất Nợ
Tiền mặt - tính chất Có
Vốn góp - tính chất Có
Vốn góp - tính chất Nợ

Câu 74: Doanh nghiệp Trường Xuân nhập 20 bàn phím máy tính của nhà cung cấp Vĩnh Trinh hết 4 triệu đồng, trả tiền sau.Hãy xác định trình tự ghi chép nghiệp vụ kinh tế trên?
Lập phiếu nhập ghi Nợ TK 156, Có TK 331
Chép nghiệp vụ nhập kho vào sổ chi tiết sản phẩm vật liệu hàng hoá 156, chép công nợ 4 triệu vào sổ chi tiết công nợ 331
Lập phiếu nhập ghi Nợ TK 156, Có TK 331, ghi sổ nhật ký, chép sổ chi tiết tài khoản 156 và 331
*Lập phiếu nhập ghi Nợ TK 156, Có TK 331, ghi sổ nhật ký, cập nhật bảng tổng hợp nhập xuất tồn và công nợ phải trả.

Câu 75: Phòng hành chính nộp bảng lương cho phòng Kế toán. Tổng tiền lương là 20 triệu, bảng lương đã được giám đốc ký nhận.Hãy xác định trình tự ghi chép nghiệp vụ kinh tế trên?
Lập phiếu kế toán ghi Nợ tài khoản 642, ghi có tài khoản 334, chép sổ cái tài khoản 334 và 511
Lập phiếu kế toán ghi Nợ tài khoản 642, ghi có tài khoản 334, chép sổ cái tài khoản 334 và 642
Lập phiếu kế toán ghi Nợ tài khoản 642, ghi có tài khoản 334, chép sổ cái tài khoản 334, chép sổ cái tài khoản 334 và 111
*Lập phiếu kế toán ghi Nợ tài khoản 642, ghi có tài khoản 334, chép sổ nhật ký, chép sổ cái tài khoản 334 và 642

Câu 76: Công ty Trường Xuân thu tiền làm dịch vụ của bệnh viện Hồng Ngọc còn nợ từ tháng trước.Hãy xác định trình tự ghi chép nghiệp vụ kinh tế trên?
Lập phiếu thu, chép sổ nhật ký, chép sổ cái tài khoản 111 tiền mặt, chép sổ cái tài khoản 642 chi phí
Lập phiếu chi, chép sổ cái tài khoản 111 Tiền mặt, chép sổ cái tài khoản 511 Doanh thu
*Lập phiếu thu, chép sổ nhật ký, chép sổ cái tài khoản 111 tiền mặt, chép sổ cái tài khoản 511 Doanh thu
Chép sổ cái tài khoản 111 tiền mặt, chép sổ cái tài khoản 511 Doanh thu, chép sổ Nhật ký

Câu 77: Công ty HAPRO xuất khẩu nông sản, thực phẩm chế biến, đồ uống, hàng may mặc, hàng thủ công mỹ nghệ và hàng tiêu dùng. Phân phối, bán lẻ với hệ thống trung tâm thương mại, siêu thị, chuỗi cửa hàng tiện ích.Công ty HAPRO là doanh nghiệp?
*Thương mại
Sản xuất
Dịch vụ
Thương mại và dịch vụ

Câu 78: Giám đốc doanh nghiệp cần nắm tình hình thu chi tiền mặt của công ty trong tháng 6.Kế toán cần nộp tài liệu nào?
Số cái tài khoản danh thu
Số cái tài khoản vốn góp
*Số quỹ tiền mặt
Bàng cân đối tài khoản

Câu 79: Giám đốc doanh nghiệp tiếp các nhà đầu tư, cần thông tin về tình hình góp vốn. Kế toán cần cung cấp cho giám đốc loại sổ nào?
Số cái tài khoản 111
Số cái tài khoản 511
*Số cái tài khoản 411
Số chi tiết tài khoản 131

Câu 80: Doanh nghiệp có nhu cầu theo dõi mọi hoạt động kinh tế liên quan đến tiền tệ theo nhiều mức: Theo dõi tổng thể mọi sự kiện, theo dõi theo khoản mục, theo dõi theo đối tượng, theo dõi từng sự kiện.Hãy lựa chọn các công cụ kế toán theo trình tự theo dõi trên?
Số cái tài khoản => Sổ nhật ký => Số chi tiết tài khoản => Chứng từ
Chứng từ => Sổ nhật ký => Số chi tiết tài khoản => Sổ cái tài khoản
*Sổ nhật ký => Sổ cái tài khoản => Sổ chi tiết tài khoản => Chứng từ
Chứng từ => Số cái tài khoản => Sổ nhật ký => Sổ chi tiết tài khoản

Câu 81: Doanh nghiệp nhập hàng của rất nhiều nhà cung cấp, cần theo dõi công nợ chi tiết với từng nhà cung cấp (người bán) riêng biệt.Kế toán cần sử dụng loại sổ nào để đáp ứng yêu cầu này?
Số cái tài khoản
*Số chi tiết tài khoản 331
Bàng tổng hợp nhập xuất tồn
Số chi tiết tài khoản 131

Câu 82: Khi lập sổ kế toán để theo dõi công nợ, kế toán viên đã sử dụng các cột sau: Ngày Ghi Sổ, Số chứng từ, Ngày chứng từ, Diễn giải, Tài khoản đối ứng, Nợ, Có trên tiêu đề sổ có ghi rõ khoảng thời gian theo dõi và mã đối tượng công nợ, tên đối tượng công nợ.Hãy xác định loại sổ kế toán trên?
Số cái tài khoản
*Số chi tiết tài khoản

Câu 83: Phòng hành chính và ban giám đốc có nhu cầu theo dõi chi tiết tình hình chi phí hoạt động của doanh nghiệp.Kế toán cần sử dụng tài khoản và loại sổ sách ghi chép nào?
Số chi tiết tài khoản 334
*Số cái tài khoản 642
Số cái tài khoản 511
Số nhật ký

Câu 84: Khi lập sổ kế toán đã sử dụng các cột sau: Ngày Ghi Sổ, Số chứng từ, Ngày chứng từ, Diễn giải, Tài khoản đối ứng, Nợ, CóHãy xác định loại sổ kế toán trên?
*Số cái tài khoản
Số chi tiết tài khoản
Số chi tiết công nợ
Số nhật ký

Câu 85: Khi lập sổ kế toán đã sử dụng các cột sau: Ngày Ghi Sổ, Số chứng từ, Ngày chứng từ, Diễn giải, Tài khoản Nợ, Tái khoản Có, Số TiềnHãy xác định loại sổ kế toán trên?
Số cái tài khoản
Số chi tiết tài khoản
Số chi tiết công nợ
*Số nhật ký

Câu 86: Hãy chọn cách điền ghi chép còn dở dang ngày 9/3?
TK Đối ứng = 511, cột Có = 10.000
TK Đối ứng = 642, cột Có = 10.000
TK Đối ứng = 511, cột Nợ = 10.000
*TK Đối ứng = 411, cột Nợ = 10.000
`;

function parseQuizTextDetailed(fullText) {
  const lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const questions = [];
  let currentPart = 1;
  let current = null;

  const partRegex = /^(?:phần|phan|part)\s*(\d+)/i;
  const qMetaRegex = /^(?:câu|cau)\s*\d+\s*\((?:một|nhiều|mot|nhieu)?\s*đáp án\)/i;
  const qHeaderRegex = /^(?:câu|cau|question|q\s*\.?|bài|bai)\s*(\d+)[\s*:\.\-\)]([\s\S]*)$/i;
  const optPrefixRegex = /^(?:(?:\(([a-eA-E])\)|\[([a-eA-E])\]|([a-eA-E])[\.\:\-\)\]])\s*|\*\s*)+([\s\S]*)$/;

  function finishCurrent() {
    if (!current) return;
    if (current.a.length >= 2) {
      questions.push(current);
    }
  }

  lines.forEach(line => {
    if (qMetaRegex.test(line) || line.startsWith('https://') || line.includes('EduQuiz -') || /^\d+\/\d+$/.test(line)) {
      return;
    }

    const partMatch = line.match(partRegex);
    if (partMatch) {
      currentPart = parseInt(partMatch[1]) || 1;
      return;
    }

    const qMatch = line.match(qHeaderRegex);
    if (qMatch) {
      finishCurrent();
      let qBody = qMatch[2].trim().replace(/^["'“](.*)["'”]$/, '$1').trim();
      current = {
        id: questions.length + 1,
        sourceNumber: Number(qMatch[1]),
        part: currentPart,
        subject: 'Cơ sở công nghệ của hệ thống kế toán máy HUBT (2TC)',
        q: qBody || `Câu ${qMatch[1]}`,
        image: null,
        a: [],
        c: 0
      };
      return;
    }

    if (current) {
      let isCorrect = line.startsWith('*') || line.startsWith('•*') || /\[x\]/i.test(line);
      let optText = line.replace(/^\*\s*/, '');
      const optMatch = optText.match(optPrefixRegex);
      if (optMatch) optText = optMatch[4].trim();
      optText = optText.replace(/^["'“](.*)["'”]$/, '$1').trim();

      if (optText) {
        current.a.push(optText);
        if (isCorrect) current.c = current.a.length - 1;
      }
    }
  });

  finishCurrent();
  return questions;
}

const allQuestions = parseQuizTextDetailed(questionsP1_and_P2_raw);
console.log('Total extracted questions from Both Part 1 & Part 2:', allQuestions.length);
console.log('Part 1 count:', allQuestions.filter(q => q.part === 1).length);
console.log('Part 2 count:', allQuestions.filter(q => q.part === 2).length);

fs.writeFileSync('ketoanmay_173_questions.json', JSON.stringify(allQuestions, null, 2), 'utf8');
console.log('Saved to ketoanmay_173_questions.json');
