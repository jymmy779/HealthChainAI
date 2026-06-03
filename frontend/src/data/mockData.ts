// ============================================================
// CLEAN DATA CONFIGURATION - HealthChain AI
// ============================================================

export const currentUser = {
  id: '',
  name: '',
  phone: '',
  email: '',
  avatar: null,
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  height: 0,
  weight: 0,
  bmi: 0,
  allergies: [] as string[],
  chronicDiseases: [] as string[],
  emergencyContact: {
    name: '',
    relationship: '',
    phone: ''
  },
  insuranceNumber: '',
  createdAt: '',
  twoFactorEnabled: false,
  passkeyEnabled: false,
  language: 'vi',
  notificationsEnabled: true,
};

export const healthMetrics: any[] = [];

export const healthRecords: any[] = [];

export const healthRecordTypes = [
  { value: 'xet-nghiem-mau', label: 'Xét nghiệm máu', icon: 'blood' },
  { value: 'don-thuoc', label: 'Đơn thuốc', icon: 'prescription' },
  { value: 'hinh-anh', label: 'Hình ảnh chẩn đoán', icon: 'image' },
  { value: 'bao-cao', label: 'Báo cáo bác sĩ', icon: 'report' },
];

export const aiAnalysisResults = {
  current: {
    date: '',
    overallRisk: 'low',
    diseases: [] as any[],
    lifestyleScore: 100,
    lifestyleRecommendations: [] as string[]
  },
  history: [] as any[]
};

export const accessPermissions: any[] = [];

export const accessHistory: any[] = [];

export const notifications: any[] = [];

export const reminders: any[] = [];

export const faqItems = [
  {
    id: 'faq-001',
    question: 'Làm thế nào để upload hồ sơ sức khỏe lên Blockchain?',
    answer: 'Bạn chỉ cần vào mục "Upload Hồ sơ", chọn file cần tải lên (hỗ trợ PDF, JPG, PNG), điền mô tả và nhấn "Lưu lên Blockchain". Hệ thống sẽ tự động mã hóa dữ liệu, lưu lên IPFS và ghi hash lên Blockchain Polygon.',
  },
  {
    id: 'faq-002',
    question: 'Dữ liệu của tôi có an toàn không?',
    answer: 'Hoàn toàn an toàn. Dữ liệu của bạn được mã hóa trước khi lưu trữ, chỉ có bạn và những người được bạn cấp quyền mới có thể xem. Mỗi hồ sơ đều được ghi nhận bằng một hash bất biến trên Blockchain Polygon, đảm bảo tính toàn vẹn và chống giả mạo.',
  },
  {
    id: 'faq-003',
    question: 'Làm sao để cấp quyền xem hồ sơ cho bác sĩ?',
    answer: 'Vào mục "Quản lý Quyền Truy cập" > "Cấp quyền mới", nhập thông tin bác sĩ, chọn thời hạn (7 ngày, 30 ngày, 90 ngày) và mức độ truy cập. Bác sĩ sẽ nhận được thông báo và có thể xem hồ sơ của bạn trong thời gian đã cấp.',
  },
  {
    id: 'faq-004',
    question: 'AI phân tích sức khỏe dựa trên dữ liệu nào?',
    answer: 'AI phân tích dựa trên các chỉ số sức khỏe bạn nhập (BMI, huyết áp, đường huyết...) và lịch sử hồ sơ bệnh án đã upload. Hệ thống sử dụng mô hình Machine Learning được huấn luyện trên dữ liệu y khoa để dự đoán nguy cơ bệnh.',
  },
  {
    id: 'faq-005',
    question: 'Tôi có thể xóa hồ sơ đã lưu trên Blockchain không?',
    answer: 'Dữ liệu trên Blockchain là bất biến và không thể xóa. Tuy nhiên, bạn có thể ẩn hồ sơ khỏi tầm nhìn của người khác hoặc thu hồi quyền truy cập bất kỳ lúc nào. Dữ liệu gốc được mã hóa và chỉ bạn mới có chìa khóa.',
  },
  {
    id: 'faq-006',
    question: 'Mất điện thoại thì làm sao để đăng nhập lại?',
    answer: 'Bạn có thể đăng nhập bằng email + mật khẩu, hoặc sử dụng Passkey (vân tay/khuôn mặt) trên thiết bị mới. Nếu quên hết, bạn có thể dùng số điện thoại để nhận OTP và khôi phục tài khoản.',
  },
  {
    id: 'faq-007',
    question: 'Chi phí sử dụng HealthChain AI là bao nhiêu?',
    answer: 'Các tính năng cơ bản như lưu hồ sơ, theo dõi chỉ số sức khỏe và xem phân tích AI là MIỄN PHÍ. Tính năng lưu trữ trên Blockchain có thể có phí gas nhỏ (trên Polygon Testnet là miễn phí).',
  },
  {
    id: 'faq-008',
    question: 'Tôi có thể thêm hồ sơ cho người thân không?',
    answer: 'Có! Bạn có thể thêm hồ sơ cho thành viên gia đình trong mục "Quản lý gia đình". Mỗi thành viên sẽ có một hồ sơ sức khỏe riêng biệt và bạn có thể quản lý tất cả từ một tài khoản.',
  },
];

export const onboardingSlides = [
  {
    title: 'Quản lý sức khỏe thông minh',
    description: 'Lưu trữ toàn bộ hồ sơ bệnh án của bạn và gia đình một cách an toàn, bất biến trên công nghệ Blockchain.',
    icon: 'health',
    color: '#4CAF50',
  },
  {
    title: 'Bảo mật tuyệt đối',
    description: 'Dữ liệu được mã hóa đầu cuối, chỉ bạn mới có quyền truy cập. Chia sẻ an toàn với bác sĩ khi cần.',
    icon: 'security',
    color: '#1E88E5',
  },
  {
    title: 'AI dự đoán nguy cơ bệnh',
    description: 'Trí tuệ nhân tạo phân tích sức khỏe của bạn, dự đoán sớm các nguy cơ bệnh phổ biến như tiểu đường, tim mạch.',
    icon: 'ai',
    color: '#9C27B0',
  },
  {
    title: 'Dễ dàng sử dụng',
    description: 'Giao diện đơn giản, thân thiện với người lớn tuổi. Nút to, chữ rõ ràng, dễ thao tác.',
    icon: 'easy',
    color: '#FF9800',
  },
];

export const accessLogs: any[] = [];

export const aiReports: any[] = [];

export const quickHealthTips = [
  'Uống đủ 2 lít nước mỗi ngày giúp thận hoạt động tốt',
  'Đi bộ 30 phút mỗi ngày giảm 30% nguy cơ tim mạch',
  'Ăn nhiều rau xanh giúp kiểm soát đường huyết hiệu quả',
  'Ngủ đủ giấc giúp huyết áp ổn định hơn',
  'Giảm muối trong khẩu phần ăn để phòng cao huyết áp',
];