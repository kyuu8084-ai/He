import React, { useState } from "react";
import Community from "./Community";
import { 
  Search, 
  User, 
  Menu, 
  X, 
  Star, 
  Clock, 
  Calendar, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  Compass,
  CheckCircle2,
  Sparkles,
  Briefcase,
  GraduationCap,
  Award,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  BookOpen,
  Zap,
  BarChart3,
  HelpCircle,
  ExternalLink,
  ChevronDown
} from "lucide-react";

interface CareerGuidanceProps {
  onBack?: () => void;
  language?: 'en' | 'vi';
  onOpenStudyRoom?: () => void;
}

interface Slide {
  id: string;
  rating: string;
  duration: string;
  year: string;
  title: string;
  description: string;
  badge: string;
  stats: { label: string; val: string }[];
}

interface MajorDetail {
  id: string;
  title: string;
  category: string;
  badge: string;
  salaryRange: string;
  growthRate: string;
  desc: string;
  skills: string[];
  subjects: string[];
  careers: string[];
  examBlocks?: string[];
  iconBg: string;
  whatIsIt?: string;
  howToStart?: string;
}

interface Mentor {
  id: string;
  name: string;
  role: string;
  company: string;
  experience: string;
  avatar: string;
  rating: number;
  tags: string[];
}

export const CareerGuidance: React.FC<CareerGuidanceProps> = ({ 
  onBack, 
  language = 'vi',
  onOpenStudyRoom 
}) => {
  const isVi = language === 'vi';
  
  // Navigation & Active View State
  const [activeTab, setActiveTab] = useState<'hero' | 'majors' | 'timeline' | 'quiz' | 'salary' | 'mentors' | 'community'>('hero');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  // Modal States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isConsultOpen, setIsConsultOpen] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<MajorDetail | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  const [consultSubmitted, setConsultSubmitted] = useState(false);

  // AI Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<string | null>(null);

  // Salary Calculator State
  const [selectedField, setSelectedField] = useState('ai');
  const [selectedExp, setSelectedExp] = useState('junior');

  // Majors List (20 Hot Careers 2026+)
  const majors: MajorDetail[] = [
    {
      id: 'ai-eng',
      title: isVi ? 'Kỹ Thuật AI & Khoa Học Dữ Liệu' : 'AI & Data Science Engineering',
      category: isVi ? 'Công Nghệ' : 'Technology',
      badge: 'Hot 2026',
      salaryRange: isVi ? '25 - 55 Triệu / tháng' : '$1,200 - $3,000 / mo',
      growthRate: '+38% / năm',
      desc: isVi ? 'Xây dựng mô hình trí tuệ nhân tạo, xử lý dữ liệu lớn, phát triển Agent AI và học máy cho các bài toán doanh nghiệp.' : 'Build AI models, process big data, and engineer autonomous agentic systems.',
      skills: ['Python', 'TensorFlow / PyTorch', 'Prompt Engineering', 'LLMs & Agents', 'SQL & Vector DB'],
      subjects: ['Giải Tích & Đại Số Tuyến Tính', 'Cấu Trúc Dữ Liệu & Giải Thuật', 'Machine Learning Core', 'Deep Learning & Computer Vision'],
      careers: ['AI Engineer', 'Data Scientist', 'ML Ops Engineer', 'Prompt Architect'],
      examBlocks: ['A00', 'A01', 'D01', 'D07'],
      iconBg: 'from-purple-600 to-indigo-600'
    },
    {
      id: 'software-dev',
      title: isVi ? 'Kỹ Thuật Phần Mềm & Cloud Architecture' : 'Software & Cloud Engineering',
      category: isVi ? 'Công Nghệ' : 'Technology',
      badge: 'Bền Vững',
      salaryRange: isVi ? '20 - 45 Triệu / tháng' : '$1,000 - $2,500 / mo',
      growthRate: '+25% / năm',
      desc: isVi ? 'Thiết kế hệ thống phần mềm quy mô lớn, vi dịch vụ (Microservices), ứng dụng di động và hạ tầng Cloud AWS/GCP.' : 'Design scalable software architectures, microservices, mobile apps, and AWS/GCP clouds.',
      skills: ['TypeScript / React', 'Node.js / Go', 'Docker & Kubernetes', 'AWS / GCP Cloud', 'System Design'],
      subjects: ['Lập Trình Hướng Đối Tượng', 'Kiến Trúc Phần Mềm', 'An Toàn Thông Tin', 'Thực Hành DevOps'],
      careers: ['Fullstack Developer', 'Backend Specialist', 'Cloud Solutions Architect', 'DevOps Engineer'],
      examBlocks: ['A00', 'A01', 'D01', 'D08'],
      iconBg: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'cybersecurity',
      title: isVi ? 'An Toàn Thông Tin & Bảo Mật Mạng' : 'Cybersecurity & Information Security',
      category: isVi ? 'Công Nghệ' : 'Technology',
      badge: 'Nhu Cầu Cao',
      salaryRange: isVi ? '22 - 50 Triệu / tháng' : '$1,100 - $2,700 / mo',
      growthRate: '+32% / năm',
      desc: isVi ? 'Bảo vệ hệ thống dữ liệu doanh nghiệp khỏi các đợt tấn công mạng, kiểm thử xâm nhập (PenTest) và ứng phó sự cố an ninh.' : 'Protect enterprise infrastructure, conduct penetration testing, and resolve cyber security incidents.',
      skills: ['Ethical Hacking', 'Network Security', 'Cryptography', 'SIEM & SOC', 'Incident Response'],
      subjects: ['Mạng Máy Tính & Giao Thức', 'Bảo Mật Hệ Điều Hành', 'Mật Mã Học', 'Phân Tích Mã Độc'],
      careers: ['Security Analyst', 'Penetration Tester', 'SOC Engineer', 'Information Security Officer'],
      examBlocks: ['A00', 'A01', 'D01', 'C01'],
      iconBg: 'from-red-600 to-rose-600'
    },
    {
      id: 'semiconductor',
      title: isVi ? 'Thiết Kế Vi Mạch Bán Dẫn & Vật Lý Kỹ Thuật' : 'Semiconductor & Microchip Design',
      category: isVi ? 'Kỹ Thuật' : 'Engineering',
      badge: 'Xu Hướng Mới',
      salaryRange: isVi ? '30 - 65 Triệu / tháng' : '$1,500 - $3,500 / mo',
      growthRate: '+45% / năm',
      desc: isVi ? 'Nghiên cứu, mô phỏng và thiết kế vi mạch tích hợp (IC), chip bán dẫn thế hệ mới phục vụ AI, thiết bị thông minh và ô tô.' : 'Research and design integrated circuits (IC) and semiconductor microchips for AI and IoT.',
      skills: ['Verilog / VHDL', 'EDA Tools (Cadence/Synopsys)', 'Analog/Digital Circuit', 'C/C++ Embedded', 'FPGA'],
      subjects: ['Vật Lý Bán Dẫn', 'Kỹ Thuật Mạch Điện Tử', 'Thiết Kế Vi Mạch VLSI', 'Vi Điều Khiển'],
      careers: ['IC Design Engineer', 'Verification Engineer', 'Physical Design Specialist', 'Semiconductor R&D'],
      examBlocks: ['A00', 'A01', 'B00', 'D07'],
      iconBg: 'from-amber-600 to-orange-600'
    },
    {
      id: 'ui-ux',
      title: isVi ? 'Thiết Kế Trải Nghiệm UI/UX & Sản Phẩm' : 'UI/UX & Product Design',
      category: isVi ? 'Sáng Tạo' : 'Design',
      badge: 'Xu Hướng',
      salaryRange: isVi ? '18 - 40 Triệu / tháng' : '$900 - $2,200 / mo',
      growthRate: '+22% / năm',
      desc: isVi ? 'Kiến tạo giao diện người dùng đỉnh cao, nghiên cứu hành vi khách hàng, thiết kế mẫu Design System chuẩn quốc tế.' : 'Craft intuitive user experiences, design systems, interactive prototypes, and product flows.',
      skills: ['Figma Mastery', 'User Research', 'Interactive Prototyping', 'Design Systems', 'Micro-animations'],
      subjects: ['Tâm Lý Học Người Dùng', 'Thiết Kế Đồ Họa Nền Tảng', 'Kiến Trúc Thông Tin', 'Kiểm Thử Usability'],
      careers: ['UI/UX Designer', 'Product Designer', 'Interaction Architect', 'Design Lead'],
      examBlocks: ['A01', 'D01', 'D08', 'H00'],
      iconBg: 'from-pink-600 to-rose-600'
    },
    {
      id: 'fintech-biz',
      title: isVi ? 'Fintech & Quản Trị Kinh Doanh Số' : 'Fintech & Digital Business',
      category: isVi ? 'Kinh Tế' : 'Business',
      badge: 'Thu Nhập Cao',
      salaryRange: isVi ? '22 - 50 Triệu / tháng' : '$1,100 - $2,800 / mo',
      growthRate: '+30% / năm',
      desc: isVi ? 'Ứng dụng công nghệ tài chính, ngân hàng số, phân tích dữ liệu kinh doanh và quản trị rủi ro trong thời đại 4.0.' : 'Leverage financial technologies, digital banking, business analytics, and risk management.',
      skills: ['Financial Analysis', 'Business Analytics', 'Blockchain Basics', 'SQL & PowerBI', 'Digital Marketing'],
      subjects: ['Tài Chính Doanh Nghiệp', 'Thị Trường Tiền Tệ', 'Phân Tích Dữ Liệu Kinh Doanh', 'Kinh Doanh Quốc Tế'],
      careers: ['Fintech Specialist', 'Business Analyst (BA)', 'Investment Analyst', 'Digital Product Owner'],
      examBlocks: ['A00', 'A01', 'D01', 'D07'],
      iconBg: 'from-amber-600 to-emerald-600'
    },
    {
      id: 'digital-marketing',
      title: isVi ? 'Marketing Dữ Liệu & Truyền Thông Đa Phương Tiện' : 'Data-Driven Marketing & Media',
      category: isVi ? 'Kinh Tế' : 'Business',
      badge: 'Sáng Tạo',
      salaryRange: isVi ? '16 - 38 Triệu / tháng' : '$800 - $2,000 / mo',
      growthRate: '+28% / năm',
      desc: isVi ? 'Tối ưu hóa chiến dịch truyền thông bằng dữ liệu (Growth Hacking), sáng tạo nội dung đa nền tảng và quản trị thương hiệu.' : 'Drive growth marketing, data-backed ad campaigns, content creation, and brand strategy.',
      skills: ['SEO & Performance Ads', 'Google Analytics / Looker', 'Content Strategy', 'Social Media Ops', 'A/B Testing'],
      subjects: ['Hành Vi Tự Nhiên Khách Hàng', 'Phân Tích Dữ Liệu Marketing', 'Xây Dựng Thương Hiệu', 'Kế Hoạch Truyền Thông'],
      careers: ['Growth Marketer', 'Performance Specialist', 'Content Strategist', 'Brand Manager'],
      examBlocks: ['A01', 'D01', 'C00', 'D14'],
      iconBg: 'from-teal-600 to-emerald-600'
    },
    {
      id: 'e-commerce-logistics',
      title: isVi ? 'Thương Mại Điện Tử & Quản Chuỗi Cung Ứng' : 'E-Commerce & Supply Chain Logistics',
      category: isVi ? 'Kinh Tế' : 'Business',
      badge: 'Tăng Trưởng',
      salaryRange: isVi ? '18 - 42 Triệu / tháng' : '$900 - $2,300 / mo',
      growthRate: '+26% / năm',
      desc: isVi ? 'Vận hành sàn giao dịch trực tuyến, tối ưu kho bãi thông minh và điều phối vận tải hàng hóa xuyên biên giới.' : 'Manage online marketplaces, smart warehousing, and international supply chain networks.',
      skills: ['Logistics Management', 'E-Com Operations', 'Supply Chain Analytics', 'SAP / ERP Systems', 'Vendor Relations'],
      subjects: ['Quản Trị Chuỗi Cung Ứng', 'Vận Tải Quốc Tế', 'Thương Mại Điện Tử', 'Quản Trị Tồn Kho'],
      careers: ['Supply Chain Analyst', 'Logistics Manager', 'E-Commerce Ops Lead', 'Procurement Specialist'],
      examBlocks: ['A00', 'A01', 'D01', 'D07'],
      iconBg: 'from-cyan-600 to-blue-600'
    },
    {
      id: 'smart-medicine',
      title: isVi ? 'Y Khoa & Công Nghệ Y Tế Thông Minh' : 'Smart Medicine & Healthcare Tech',
      category: isVi ? 'Y Dược' : 'Healthcare',
      badge: 'Cao Quý',
      salaryRange: isVi ? '25 - 60 Triệu / tháng' : '$1,300 - $3,200 / mo',
      growthRate: '+20% / năm',
      desc: isVi ? 'Thực hành y khoa hiện đại kết hợp ứng dụng chẩn đoán AI, hồ sơ sức khỏe điện tử và thiết bị y tế thông minh.' : 'Practice medicine powered by AI diagnostics, digital health records, and smart medical gear.',
      skills: ['Clinical Diagnosis', 'Medical AI Tools', 'Surgical Protocols', 'Patient Care', 'Health Data Mgmt'],
      subjects: ['Giải Phẫu Học', 'Sinh Lý Học', 'Bệnh Lý Học', 'Ứng Dụng Công Nghệ Trong Y Khoa'],
      careers: ['Bác Sĩ Đa Khoa', 'Chuyên Gia Y Tế Số', 'Quản Lý Dữ Liệu Y Tế', 'Chuyên Viên Y Sinh'],
      examBlocks: ['B00', 'A00', 'D07', 'B08'],
      iconBg: 'from-red-600 to-pink-600'
    },
    {
      id: 'biotech-pharm',
      title: isVi ? 'Công Nghệ Sinh Học & Dược Học Hiện Đại' : 'Biotechnology & Modern Pharmacy',
      category: isVi ? 'Y Dược' : 'Healthcare',
      badge: 'Nghiên Cứu',
      salaryRange: isVi ? '20 - 45 Triệu / tháng' : '$1,000 - $2,400 / mo',
      growthRate: '+24% / năm',
      desc: isVi ? 'Nghiên cứu phát triển thuốc mới, công nghệ gen, vi sinh vật học ứng dụng và thực phẩm chức năng bảo vệ sức khỏe.' : 'Develop new pharmaceuticals, genetic engineering, micro-biology, and health supplements.',
      skills: ['Gene Editing (CRISPR)', 'HPLC Analysis', 'Clinical Research', 'Fermentation Tech', 'Lab Safety'],
      subjects: ['Hóa Sinh Học', 'Di Truyền Học Phân Tử', 'Bào Chế Thuốc', 'Công Nghệ Vi Sinh'],
      careers: ['Biotech Researcher', 'Dược Sĩ Nghiên Cứu', 'QA/QC Specialist', 'Kỹ Sư Bio-Tech'],
      examBlocks: ['B00', 'A00', 'D07', 'A02'],
      iconBg: 'from-emerald-600 to-green-600'
    },
    {
      id: 'finance-banking',
      title: isVi ? 'Tài Chính Ngân Hàng & Phân Tích Đầu Tư' : 'Finance, Banking & Investment Analysis',
      category: isVi ? 'Kinh Tế' : 'Business',
      badge: 'Đầu Tư',
      salaryRange: isVi ? '20 - 48 Triệu / tháng' : '$1,000 - $2,600 / mo',
      growthRate: '+22% / năm',
      desc: isVi ? 'Phân tích báo cáo tài chính, quản trị danh mục đầu tư chứng khoán, thẩm định dự án và ngân hàng thương mại.' : 'Analyze financial statements, manage investment portfolios, and conduct risk valuation.',
      skills: ['Financial Modeling', 'Valuation Methods', 'Excel/VBA Mastery', 'Risk Management', 'Bloomberg Terminal'],
      subjects: ['Tài Chính Doanh Nghiệp', 'Thị Trường Chứng Khoán', 'Đầu Tư Tài Chính', 'Thẩm Định Dự Án'],
      careers: ['Investment Analyst', 'Financial Planner', 'Credit Analyst', 'Fund Manager'],
      examBlocks: ['A00', 'A01', 'D01', 'D07'],
      iconBg: 'from-amber-600 to-yellow-600'
    },
    {
      id: 'hospitality-tourism',
      title: isVi ? 'Quản Trị Khách Sạn & Du Lịch Quốc Tế' : 'International Hospitality & Tourism',
      category: isVi ? 'Dịch Vụ' : 'Services',
      badge: 'Toàn Cầu',
      salaryRange: isVi ? '15 - 35 Triệu / tháng' : '$750 - $1,800 / mo',
      growthRate: '+25% / năm',
      desc: isVi ? 'Điều hành chuỗi khách sạn 5 sao, quản lý sự kiện quy mô lớn và phát triển các tour du lịch sinh thái trải nghiệm.' : 'Manage 5-star hotel chains, international events, and luxury experiential travel destinations.',
      skills: ['Multilingual Fluency', 'Customer Relations', 'Opera PMS System', 'Event Management', 'Service Excellence'],
      subjects: ['Quản Trị Lễ Tân & Buồng Phong', 'Tổ Chức Sự Kiện (MICE)', 'Văn Hóa Du Lịch', 'Quản Trị Am Thuc'],
      careers: ['Hotel Operations Manager', 'Event Director', 'Guest Experience Lead', 'Tourism Planner'],
      examBlocks: ['D01', 'D14', 'C00', 'A01'],
      iconBg: 'from-orange-600 to-amber-600'
    },
    {
      id: 'english-ai-trans',
      title: isVi ? 'Ngôn Ngữ Anh & Ứng Dụng Biên Dịch AI' : 'English Studies & AI Translation',
      category: isVi ? 'Ngôn Ngữ' : 'Languages',
      badge: 'Hội Nhập',
      salaryRange: isVi ? '16 - 36 Triệu / tháng' : '$800 - $1,900 / mo',
      growthRate: '+20% / năm',
      desc: isVi ? 'Chuyên sâu ngôn ngữ quốc tế, ứng dụng công cụ AI trong biên phiên dịch, bản địa hóa phần mềm và giảng dạy.' : 'Master international English, leverage AI for translation, software localization, and cross-cultural comms.',
      skills: ['C2 English Mastery', 'CAT Tools (Trados)', 'Localization', 'Public Speaking', 'Cross-Cultural Comms'],
      subjects: ['Ngữ Pháp Chuyên Sâu', 'Kỹ Thuật Dịch Thuật', 'Văn Học Anh-Mỹ', 'Ứng Dụng AI Trong Dịch Thuật'],
      careers: ['Biên / Phiên Dịch Viên', 'Content Localizer', 'Chuyên Viên Đối Ngoại', 'Giảng Viên Ngoại Ngữ'],
      examBlocks: ['D01', 'D14', 'D15', 'A01'],
      iconBg: 'from-sky-600 to-indigo-600'
    },
    {
      id: 'international-law',
      title: isVi ? 'Luật Kinh Tế Quốc Tế & Sở Hữu Trí Tuệ' : 'International Economic Law & IP',
      category: isVi ? 'Pháp Luật' : 'Law',
      badge: 'Uy Tín',
      salaryRange: isVi ? '20 - 45 Triệu / tháng' : '$1,000 - $2,400 / mo',
      growthRate: '+21% / năm',
      desc: isVi ? 'Tư vấn pháp lý hợp đồng thương mại quốc tế, bảo hộ bản quyền phần mềm / thương hiệu và giải quyết tranh chấp.' : 'Advise on international trade contracts, intellectual property protection, and corporate arbitration.',
      skills: ['Legal Drafting', 'Contract Negotiation', 'IP Law Knowledge', 'Arbitration', 'Critical Thinking'],
      subjects: ['Luật Thương Mại Quốc Tế', 'Luật Sở Hữu Trí Tuệ', 'Luật Doanh Nghiệp', 'Tư Pháp Quốc Tế'],
      careers: ['Luật Sư Tư Vấn', 'Chuyên Viên Pháp Chế (In-House)', 'Cố Vấn Sở Hữu Trí Tuệ', 'Trọng Tài Viên'],
      examBlocks: ['A00', 'A01', 'C00', 'D01'],
      iconBg: 'from-slate-600 to-gray-700'
    },
    {
      id: 'ev-green-tech',
      title: isVi ? 'Kỹ Thuật Ô Tô Điện & Năng Lượng Tái Tạo' : 'Electric Vehicles & Clean Energy Engineering',
      category: isVi ? 'Kỹ Thuật' : 'Engineering',
      badge: 'Bền Vững',
      salaryRange: isVi ? '22 - 48 Triệu / tháng' : '$1,100 - $2,500 / mo',
      growthRate: '+35% / năm',
      desc: isVi ? 'Thiết kế pin xe điện, hệ thống truyền động điện, quản lý năng lượng mặt trời và trạm sạc thông minh.' : 'Design EV battery packs, electric drivetrains, solar energy grids, and smart charging infrastructure.',
      skills: ['MATLAB / Simulink', 'Battery Mgmt Systems (BMS)', 'Power Electronics', 'AutoCAD 3D', 'Thermal Analysis'],
      subjects: ['Lý Thuyết Ô Tô Điện', 'Điện Tử Công Suất', 'Năng Lượng Tái Tạo', 'Hệ Thống Điều Khiển Tự Động'],
      careers: ['Kỹ Sư Ô Tô Điện', 'Kỹ Sư Pin & Năng Lượng', 'Chuyên Viên R&D EV', 'Quản Lý Hệ Thống Trạm Sạc'],
      examBlocks: ['A00', 'A01', 'D07', 'B00'],
      iconBg: 'from-green-600 to-emerald-600'
    },
    {
      id: 'psychology-org',
      title: isVi ? 'Tâm Lý Học Học Đường & Tư Vấn Tổ Chức' : 'Applied Psychology & Organizational Counseling',
      category: isVi ? 'Xã Hội' : 'Social Science',
      badge: 'Nhân Văn',
      salaryRange: isVi ? '15 - 35 Triệu / tháng' : '$750 - $1,800 / mo',
      growthRate: '+23% / năm',
      desc: isVi ? 'Tham vấn tâm lý trường học, chẩn đoán sức khỏe tinh thần và tối ưu hóa môi trường làm việc doanh nghiệp.' : 'Provide school counseling, mental wellness assessments, and workplace organizational psychology.',
      skills: ['Counseling Techniques', 'Psychometric Testing', 'Empathic Listening', 'Crisis Intervention', 'HR Assessment'],
      subjects: ['Tâm Lý Học Phát Triển', 'Tham Vấn Tâm Lý', 'Tâm Lý Học Tổ Chức', 'Đánh Giá Tâm Lý'],
      careers: ['Chuyên Viên Tham Vấn', 'Chuyên Gia Lập Kế Hoạch Nhân Sự', 'Cố Vấn Tâm Lý School', 'Coach Phát Triển'],
      examBlocks: ['B00', 'C00', 'D01', 'D14'],
      iconBg: 'from-violet-600 to-purple-600'
    },
    {
      id: 'pr-global-comm',
      title: isVi ? 'Truyền Thông Quốc Tế & Quan Hệ Công Chúng' : 'International PR & Strategic Communications',
      category: isVi ? 'Sáng Tạo' : 'Design',
      badge: 'Đối Ngoại',
      salaryRange: isVi ? '18 - 40 Triệu / tháng' : '$900 - $2,100 / mo',
      growthRate: '+24% / năm',
      desc: isVi ? 'Quản trị khủng hoảng truyền thông, tổ chức họp báo, xây dựng hình ảnh thương hiệu quốc tế và quan hệ báo chí.' : 'Handle crisis communications, press conferences, global brand building, and media relations.',
      skills: ['Press Release Writing', 'Crisis Management', 'Public Relations', 'Media Planning', 'Event Operations'],
      subjects: ['Quan Hệ Công Chúng Core', 'Quản Trị Khủng Hoảng Truyền Thông', 'Báo Chí Hiện Đại', 'Nghiệp Vụ Ngoại Giao'],
      careers: ['PR Manager', 'Crisis Communication Specialist', 'Media Relations Lead', 'Event Producer'],
      examBlocks: ['D01', 'D14', 'C00', 'D78'],
      iconBg: 'from-indigo-600 to-blue-600'
    },
    {
      id: 'data-auditing',
      title: isVi ? 'Kế Toán Phân Tích Dữ Liệu & Kiểm Toán Quốc Tế' : 'Data Auditing & Forensic Accounting',
      category: isVi ? 'Kinh Tế' : 'Business',
      badge: 'Chuẩn ACCA',
      salaryRange: isVi ? '18 - 42 Triệu / tháng' : '$900 - $2,200 / mo',
      growthRate: '+19% / năm',
      desc: isVi ? 'Kiểm toán báo cáo tài chính Big 4, điều tra gian lận tài chính và tự động hóa quy trình kế toán bằng dữ liệu.' : 'Audit Big 4 financial statements, conduct forensic investigations, and automate accounting workflows.',
      skills: ['ACCA / CPA Knowledge', 'Audit Automation', 'SQL & Excel Analytics', 'IFRS Standards', 'Tax Planning'],
      subjects: ['Kế Toán Tài Chính', 'Kiểm Toán Đại Cương', 'Luật Thuế Doanh Nghiệp', 'Phân Tích Báo Cáo Tài Chính'],
      careers: ['Auditor (Big 4)', 'Financial Controller', 'Tax Consultant', 'Forensic Accountant'],
      examBlocks: ['A00', 'A01', 'D01', 'D07'],
      iconBg: 'from-cyan-700 to-slate-700'
    },
    {
      id: 'smart-architecture',
      title: isVi ? 'Kiến Trúc & Quy Hoạch Đô Thị Thông Minh' : 'Smart Architecture & Urban Planning',
      category: isVi ? 'Sáng Tạo' : 'Design',
      badge: 'BIM & 3D',
      salaryRange: isVi ? '20 - 45 Triệu / tháng' : '$1,000 - $2,300 / mo',
      growthRate: '+22% / năm',
      desc: isVi ? 'Thiết kế công trình xanh, mô phỏng BIM 3D, ứng dụng IoT vào không gian sống và quy hoạch thành phố thông minh.' : 'Design green buildings, 3D BIM simulations, smart home integration, and sustainable urban zones.',
      skills: ['Revit / BIM', '3ds Max / SketchUp', 'Green Building Design', 'Parametric Design', 'Spatial Planning'],
      subjects: ['Nguyên Lý Thiết Kế Kiến Trúc', 'Cấu Tạo Kiến Trúc', 'Quy Hoạch Đô Thị', 'Môi Trường & Cảnh Quan'],
      careers: ['Architect', 'BIM Manager', 'Urban Planner', 'Interior Designer'],
      examBlocks: ['V00', 'V01', 'H00', 'A01'],
      iconBg: 'from-stone-600 to-zinc-700'
    },
    {
      id: 'real-estate-mgmt',
      title: isVi ? 'Quản Lý Bất Động Sản & Quản Trị Tài Sản' : 'Real Estate & Asset Management',
      category: isVi ? 'Kinh Tế' : 'Business',
      badge: 'Giá Trị Cao',
      salaryRange: isVi ? '22 - 55 Triệu / tháng' : '$1,100 - $2,800 / mo',
      growthRate: '+24% / năm',
      desc: isVi ? 'Thẩm định giá bất động sản, phát triển dự án đô thị, quản lý tài sản thương mại và đầu tư tài chính BĐS.' : 'Appraise property value, develop real estate projects, and manage commercial property portfolios.',
      skills: ['Property Valuation', 'Feasibility Study', 'Real Estate Law', 'Asset Management', 'Negotiation'],
      subjects: ['Đầu Tư Bất Động Sản', 'Pháp Luật Bất Động Sản', 'Thẩm Định Giá', 'Quản Lý Tòa Nhà'],
      careers: ['Real Estate Developer', 'Property Valuer', 'Asset Manager', 'Investment Broker'],
      examBlocks: ['A00', 'A01', 'D01', 'C00'],
      iconBg: 'from-amber-700 to-stone-700'
    }
    , {
      id: 'robotics-automation',
      title: isVi ? 'Kỹ Thuật Robot & Tự Động Hóa AI' : 'Robotics & AI Automation',
      category: isVi ? 'Kỹ Thuật' : 'Engineering',
      badge: 'Tương Lai',
      salaryRange: isVi ? '18 - 40 Triệu / tháng' : '$1,000 - $2,200 / mo',
      growthRate: '+31% / năm',
      desc: isVi ? 'Thiết kế, chế tạo robot thông minh và hệ thống điều khiển tự động ứng dụng AI.' : 'Design smart robots and autonomous control systems powered by AI.',
      skills: ['C++', 'ROS', 'Computer Vision', 'PLC', 'Control Theory'],
      subjects: ['Cơ Học Kỹ Thuật', 'Kỹ Thuật Điều Khiển', 'Thị Giác Máy Tính', 'Robotics Động Lực Học'],
      careers: ['Kỹ Sư Robot', 'Chuyên Gia Tự Động Hóa', 'Kỹ Sư Hệ Thống', 'R&D Engineer'],
      examBlocks: ['A00', 'A01'],
      iconBg: 'from-orange-500 to-red-600'
    },
    {
      id: 'game-dev',
      title: isVi ? 'Phát Triển Game & Hoạt Hình 3D' : 'Game Dev & 3D Animation',
      category: isVi ? 'Sáng Tạo' : 'Design',
      badge: 'Thịnh Hành',
      salaryRange: isVi ? '15 - 35 Triệu / tháng' : '$800 - $2,000 / mo',
      growthRate: '+25% / năm',
      desc: isVi ? 'Xây dựng trải nghiệm game nhập vai, thực tế ảo (VR/AR) và thiết kế đồ họa 3D.' : 'Create immersive gaming experiences, VR/AR, and 3D graphic design.',
      skills: ['Unity/Unreal', 'C# / C++', '3D Modeling', 'Game Mechanics', 'Storytelling'],
      subjects: ['Lập Trình Đồ Họa', 'Thiết Kế Game', 'Thực Tế Ảo', 'Kịch Bản Tương Tác'],
      careers: ['Game Developer', '3D Artist', 'Level Designer', 'Technical Artist'],
      examBlocks: ['H00', 'V00', 'A00', 'D01'],
      iconBg: 'from-pink-500 to-rose-600'
    },
    {
      id: 'hr-digital',
      title: isVi ? 'Quản Trị Nhân Sự Khai Thác Dữ Liệu' : 'Data-Driven HR Management',
      category: isVi ? 'Kinh Tế' : 'Business',
      badge: 'Mới',
      salaryRange: isVi ? '15 - 30 Triệu / tháng' : '$800 - $1,800 / mo',
      growthRate: '+15% / năm',
      desc: isVi ? 'Tuyển dụng, đánh giá và quản lý tài năng bằng công cụ dữ liệu và AI.' : 'Recruit, assess, and manage talent using data tools and AI.',
      skills: ['HRIS', 'Data Analysis', 'Talent Acquisition', 'Psychology', 'Labor Law'],
      subjects: ['Quản Trị Nhân Lực', 'Phân Tích Dữ Liệu HR', 'Tâm Lý Tổ Chức', 'Luật Lao Động'],
      careers: ['HR Business Partner', 'Chuyên Gia Tuyển Dụng', 'People Analyst', 'Giám Đốc Nhân Sự'],
      examBlocks: ['A00', 'A01', 'D01'],
      iconBg: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'agri-tech',
      title: isVi ? 'Nông Nghiệp Công Nghệ Cao' : 'High-Tech Agriculture',
      category: isVi ? 'Kỹ Thuật' : 'Engineering',
      badge: 'Thiết Yếu',
      salaryRange: isVi ? '12 - 25 Triệu / tháng' : '$600 - $1,500 / mo',
      growthRate: '+18% / năm',
      desc: isVi ? 'Ứng dụng IoT, Drone và AI vào sản xuất nông nghiệp bền vững, tối ưu năng suất.' : 'Apply IoT, Drones, and AI to sustainable agriculture to optimize yield.',
      skills: ['Agronomy', 'IoT Systems', 'Data Analysis', 'Drone Operation', 'Sustainability'],
      subjects: ['Sinh Lý Thực Vật', 'Nông Nghiệp Chính Xác', 'Hệ Thống IoT', 'Công Nghệ Sinh Học'],
      careers: ['Kỹ Sư Nông Nghiệp', 'Quản Lý Nông Trại Số', 'Chuyên Viên R&D', 'Cố Vấn Nông Nghiệp'],
      examBlocks: ['B00', 'A00'],
      iconBg: 'from-green-500 to-lime-600'
    },
    {
      id: 'aerospace',
      title: isVi ? 'Kỹ Thuật Hàng Không & Vũ Trụ' : 'Aerospace Engineering',
      category: isVi ? 'Kỹ Thuật' : 'Engineering',
      badge: 'Đỉnh Cao',
      salaryRange: isVi ? '20 - 45 Triệu / tháng' : '$1,200 - $2,500 / mo',
      growthRate: '+10% / năm',
      desc: isVi ? 'Thiết kế, bảo trì máy bay, thiết bị bay không người lái (UAV) và công nghệ không gian.' : 'Design and maintain aircraft, UAVs, and space technologies.',
      skills: ['Aerodynamics', 'Thermodynamics', 'CAD/CAM', 'Avionics', 'Materials Science'],
      subjects: ['Khí Động Lực Học', 'Sức Bền Vật Liệu', 'Động Cơ Hàng Không', 'Điều Khiển Bay'],
      careers: ['Kỹ Sư Hàng Không', 'Chuyên Viên Khí Động Học', 'Kỹ Sư Hệ Thống', 'Nhà Nghiên Cứu'],
      examBlocks: ['A00', 'A01'],
      iconBg: 'from-cyan-500 to-blue-600'
    }
  ];

  // Hero Slides
  const slides: Slide[] = majors.map(m => ({
    id: m.id,
    rating: isVi ? "98.5% Khuyên dùng" : "98.5% Recommended",
    duration: isVi ? "4 Năm Lộ Trình" : "4-Year Roadmap",
    year: isVi ? "Khai giảng 2026" : "Semester 2026",
    badge: m.category + " - " + m.badge,
    title: m.title,
    description: m.desc,
    stats: [
      { label: isVi ? "Lương trung bình" : "Avg Salary", val: m.salaryRange },
      { label: isVi ? "Tăng trưởng" : "Growth", val: m.growthRate }
    ]
  }));

  const slide = slides[currentSlide];

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };




const augmentMajor = (m: MajorDetail): MajorDetail => {
  const isVi = true; // For now we assume VI for the detailed text
  let whatIsIt = "Ngành học chuyên sâu về " + m.title.toLowerCase() + ", tập trung vào việc áp dụng công nghệ và tư duy đổi mới để giải quyết các thách thức thực tế. Sinh viên sẽ được học cách kết hợp lý thuyết nền tảng với thực hành chuyên sâu.";
  let howToStart = `1. Xây dựng nền tảng vững chắc về khoa học cơ bản và tư duy logic.\n2. Tham gia các câu lạc bộ, dự án thực tế liên quan đến " + m.title.toLowerCase() + ".\n3. Rèn luyện kỹ năng ngoại ngữ và soft skills.\n4. Thực tập từ sớm tại các doanh nghiệp để cọ xát thực tế.`;
  
  let extraCareers = ["Chuyên gia tư vấn cấp cao", "Giảng viên đại học", "Nghiên cứu viên", "Quản lý dự án", "Chuyên viên phân tích chiến lược"];
  let extraSubjects = ["Đạo đức nghề nghiệp", "Tư duy phản biện", "Phương pháp nghiên cứu khoa học", "Kỹ năng giao tiếp chuyên nghiệp"];
  let extraSkills = ["Problem Solving", "Critical Thinking", "Adaptability", "Team Leadership"];
  let extraExams = ["D01", "A00", "A01", "D07"];

  if (m.category === "Công Nghệ") {
    whatIsIt = "Đây là lĩnh vực mũi nhọn trong kỷ nguyên số. Ngành " + m.title.toLowerCase() + " đào tạo chuyên gia khả năng kiến tạo, quản lý và vận hành các hệ thống công nghệ, phần mềm, trí tuệ nhân tạo quy mô lớn. Công việc hàng ngày bao gồm lập trình, tối ưu thuật toán, phân tích dữ liệu và thiết kế kiến trúc hệ thống.";
    howToStart = "Bắt đầu với việc nắm vững Toán logic và thuật toán. Tham gia các cộng đồng lập trình (GitHub, LeetCode). Học ít nhất 2 ngôn ngữ lập trình phổ biến (Python, JS/TS, C++). Xây dựng các dự án (Pet Projects) thực tế và đưa vào Portfolio. Luôn cập nhật công nghệ mới mỗi ngày.";
  } else if (m.category === "Kinh Tế") {
    whatIsIt = "Ngành " + m.title.toLowerCase() + " là xương sống của mọi doanh nghiệp. Sinh viên sẽ phân tích dòng tiền, dữ liệu khách hàng, xu hướng thị trường và xây dựng chiến lược tăng trưởng. Công việc hàng ngày yêu cầu khả năng xử lý số liệu, đàm phán, quản trị rủi ro và ra quyết định chiến lược.";
    howToStart = "Trau dồi tư duy nhạy bén với số liệu và thị trường. Đọc báo chí kinh tế (Forbes, Bloomberg). Tham gia các cuộc thi Business Case. Học cách sử dụng thành thạo Excel, PowerBI, SQL. Thực tập tại các agency hoặc công ty đa quốc gia (MNCs).";
  } else if (m.category === "Sáng Tạo" || m.category === "Thiết Kế") {
    whatIsIt = "Lĩnh vực " + m.title.toLowerCase() + " tập trung vào việc biến ý tưởng thành sản phẩm trực quan có sức ảnh hưởng. Công việc hàng ngày bao gồm nghiên cứu người dùng, phác thảo ý tưởng (brainstorming), thiết kế bản mẫu (prototyping) và phối hợp với đội ngũ phát triển/marketing.";
    howToStart = "Bắt đầu bằng việc quan sát và phân tích các thiết kế tốt xung quanh. Xây dựng nền tảng về màu sắc, bố cục, typography. Sử dụng thành thạo các công cụ như Figma, Adobe CC. Xây dựng một Portfolio (Behance, Dribbble) thật ấn tượng. Học cách tiếp nhận feedback.";
  } else if (m.category === "Y Dược" || m.category === "Healthcare") {
    whatIsIt = "Ngành " + m.title.toLowerCase() + " đóng vai trò cốt lõi trong việc bảo vệ sức khỏe nhân loại. Sự kết hợp giữa y học truyền thống và công nghệ hiện đại giúp cải thiện chẩn đoán và điều trị. Công việc đòi hỏi sự chính xác tuyệt đối, y đức và khả năng làm việc dưới áp lực cao.";
    howToStart = "Nắm chắc kiến thức Sinh, Hóa. Chuẩn bị tinh thần cho một lộ trình học tập dài hạn (6+ năm). Thực tập và làm tình nguyện viên tại các bệnh viện/phòng khám. Trau dồi tính kiên nhẫn, sự tỉ mỉ và lòng thấu cảm. Liên tục cập nhật các công trình nghiên cứu y khoa.";
  }

  // Deduplicate and append
  const uniqueCareers = Array.from(new Set([...m.careers, ...extraCareers.slice(0, 4)]));
  const uniqueSubjects = Array.from(new Set([...m.subjects, ...extraSubjects.slice(0, 4)]));
  const uniqueSkills = Array.from(new Set([...m.skills, ...extraSkills.slice(0, 4)]));
  
  let newExamBlocks = m.examBlocks || [];
  if (newExamBlocks.length < 6) {
    newExamBlocks = Array.from(new Set([...newExamBlocks, ...extraExams])).slice(0, 6);
  }

  return {
    ...m,
    whatIsIt,
    howToStart,
    careers: uniqueCareers,
    subjects: uniqueSubjects,
    skills: uniqueSkills,
    examBlocks: newExamBlocks
  };
};

const processedMajors = majors.map(augmentMajor);

  // Mentors List
  const mentors: Mentor[] = [
    {
      id: 'm1',
      name: 'TS. Nguyễn Hoàng Nam',
      role: 'Senior AI Specialist',
      company: 'Google / VinAI',
      experience: '12+ năm kinh nghiệm',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      rating: 4.9,
      tags: ['AI & Machine Learning', 'Du học & Học bổng', 'Định hướng 4 năm']
    },
    {
      id: 'm2',
      name: 'Lê Minh Trí',
      role: 'Lead UI/UX Designer',
      company: 'Grab & Shopee',
      experience: '8 năm kinh nghiệm',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 5.0,
      tags: ['Design System', 'Xây dựng Portfolio', 'Phỏng vấn Tech']
    },
    {
      id: 'm3',
      name: 'Phạm Phương Thảo',
      role: 'Fintech Director',
      company: 'Momo & Techcombank',
      experience: '10 năm kinh nghiệm',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      rating: 4.8,
      tags: ['Tài chính số', 'Sự nghiệp Ngân hàng', 'CV & Phỏng vấn']
    }
  ];

  // AI Quiz Logic (10 Comprehensive Questions)
  const quizQuestions = isVi ? [
    {
      id: 1,
      question: 'Bạn cảm thấy hứng thú nhất khi giải quyết nhóm công việc nào?',
      options: [
        { label: 'Viết mã máy tính, phân tích dữ liệu & tối ưu hệ thống thuật toán', code: 'tech' },
        { label: 'Sáng tạo hình ảnh, thiết kế giao diện & phối màu sắc hài hòa', code: 'design' },
        { label: 'Lên chiến lược kinh doanh, quản lý tài chính & đàm phán thương lượng', code: 'biz' },
        { label: 'Nghiên cứu tế bào, thí nghiệm hóa học & phát triển công nghệ y học', code: 'bio' }
      ]
    },
    {
      id: 2,
      question: 'Môi trường làm việc lý tưởng mà bạn mong muốn gắn bó?',
      options: [
        { label: 'Tập đoàn công nghệ lớn, Lab AI hiện đại hoặc Startup phần mềm', code: 'tech' },
        { label: 'Studio thiết kế đồ họa, agency quảng cáo truyền thông năng động', code: 'design' },
        { label: 'Ngân hàng quốc tế, quỹ đầu tư tài chính hoặc sàn thương mại điện tử', code: 'biz' },
        { label: 'Bệnh viện quốc tế, viện nghiên cứu công nghệ sinh học & dược phẩm', code: 'bio' }
      ]
    },
    {
      id: 3,
      question: 'Kỹ năng hoặc thế mạnh cá nhân nổi bật nhất của bạn?',
      options: [
        { label: 'Tư duy logic, giải toán nhanh và tư duy lập trình hệ thống', code: 'tech' },
        { label: 'Gout thẩm mỹ cao, trí tưởng tượng phong phú & sự thấu cảm sâu sắc', code: 'design' },
        { label: 'Khả năng giao tiếp thuyết phục, quản lý thời gian & lãnh đạo nhóm', code: 'biz' },
        { label: 'Sự kiên trì, cẩn trọng tỉ mỉ và niềm đam mê khám phá khoa học', code: 'bio' }
      ]
    },
    {
      id: 4,
      question: 'Môn học phổ thông nào bạn cảm thấy tự tin và hào hứng học nhất?',
      options: [
        { label: 'Toán Học & Tin Học / Vật Lý', code: 'tech' },
        { label: 'Mỹ Thuật / Ngữ Văn & Ngoại Ngữ', code: 'design' },
        { label: 'Toán Học / Tiếng Anh & Giáo Dục Kinh Tế Pháp Luật', code: 'biz' },
        { label: 'Sinh Học / Hóa Học & Khoa Học Tự Nhiên', code: 'bio' }
      ]
    },
    {
      id: 5,
      question: 'Phương thức làm việc nào giúp bạn đạt năng suất cao nhất?',
      options: [
        { label: 'Tập trung độc lập nghiên cứu mã nguồn, thuật toán và tài liệu kỹ thuật', code: 'tech' },
        { label: 'Thảo luận ý tưởng trực quan, vẽ phác thảo (brainstorm) cùng nhóm sáng tạo', code: 'design' },
        { label: 'Chủ động gặp gỡ đối tác, điều phối cuộc họp và theo dõi chỉ số chỉ tiêu', code: 'biz' },
        { label: 'Làm việc theo quy trình chuẩn trong phòng lab hoặc phân tích mẫu thực địa', code: 'bio' }
      ]
    },
    {
      id: 6,
      question: 'Khi đối mặt với sự cố bất ngờ hoặc thử thách khó, bạn phản ứng ra sao?',
      options: [
        { label: 'Bình tĩnh tìm lỗi (debug), phân tích nguyên nhân bằng dữ liệu và bằng chứng', code: 'tech' },
        { label: 'Nhìn nhận vấn đề dưới góc nhìn mới và đề xuất cách tiếp cận đột phá', code: 'design' },
        { label: 'Đánh giá rủi ro tài chính, bàn bạc giải pháp và quyết đoán đưa ra phương án', code: 'biz' },
        { label: 'Nghiên cứu lại nguyên lý cốt lõi, thử nghiệm nhiều giả thuyết cho tới khi đúng', code: 'bio' }
      ]
    },
    {
      id: 7,
      question: 'Thành tựu hoặc sản phẩm nào sẽ khiến bạn tự hào nhất khi hoàn thành?',
      options: [
        { label: 'Một phần mềm / ứng dụng AI hoạt động mượt mà với hàng triệu người dùng', code: 'tech' },
        { label: 'Một bộ nhận diện thương hiệu hay giao diện ứng dụng đẹp mắt được tán thưởng', code: 'design' },
        { label: 'Một chiến dịch kinh doanh đem lại doanh thu kỷ lục cho doanh nghiệp', code: 'biz' },
        { label: 'Một công trình nghiên cứu y sinh có tính ứng dụng cao bảo vệ sức khỏe', code: 'bio' }
      ]
    },
    {
      id: 8,
      question: 'Giá trị cá nhân quan trọng nhất mà bạn tìm kiếm ở sự nghiệp?',
      options: [
        { label: 'Sự đổi mới công nghệ liên tục và tự do giải quyết bài toán khó', code: 'tech' },
        { label: 'Sự tự do sáng tạo nghệ thuật và mang lại giá trị trải nghiệm cho người dùng', code: 'design' },
        { label: 'Thành công tài chính, sự thăng tiến và uy tín trong giới doanh nhân', code: 'biz' },
        { label: 'Đóng góp tri thức cho nhân loại và nâng cao chất lượng cuộc sống con người', code: 'bio' }
      ]
    },
    {
      id: 9,
      question: 'Hoạt động ngoại khóa hoặc dự án cá nhân bạn yêu thích nhất?',
      options: [
        { label: 'Tham gia cuộc thi Hackathon, lập trình web/game hoặc dựng mô hình IoT', code: 'tech' },
        { label: 'Làm nội dung mạng xã hội, quay dựng video hoặc thiết kế bài đăng, poster', code: 'design' },
        { label: 'Thực hiện dự án khởi nghiệp nhỏ, quản lý ngân sách sự kiện hoặc bán hàng', code: 'biz' },
        { label: 'Tham gia câu lạc bộ STEM khoa học, chiến dịch bảo vệ môi trường hay y tế', code: 'bio' }
      ]
    },
    {
      id: 10,
      question: 'Hình mẫu chuyên gia mà bạn hướng tới trong 5-10 năm nữa?',
      options: [
        { label: 'Kỹ Sư Trưởng Công Nghệ (Chief Technology Officer / Senior AI Architect)', code: 'tech' },
        { label: 'Giám Đốc Sáng Tạo (Creative Director) hoặc Trưởng Thiết Kế Sản Phẩm', code: 'design' },
        { label: 'CEO Khởi Nghiệp, Giám Đốc Tài Chính (CFO) hoặc Chuyên Gia Đầu Tư', code: 'biz' },
        { label: 'Nhà Khoa Học Y Sinh, Bác Sĩ Chuyên Khoa hoặc Chuyên Gia Dược Học', code: 'bio' }
      ]
    }
  ] : [
    {
      id: 1,
      question: 'What type of problems do you enjoy solving most?',
      options: [
        { label: 'Coding, algorithm optimization & big data analysis', code: 'tech' },
        { label: 'Visual design, color harmony & user experience flows', code: 'design' },
        { label: 'Business strategies, finance management & deal negotiation', code: 'biz' },
        { label: 'Cellular research, chemistry experiments & medical tech', code: 'bio' }
      ]
    },
    {
      id: 2,
      question: 'What is your ideal workplace in 3-5 years?',
      options: [
        { label: 'Tech giants, AI research labs, or software startups', code: 'tech' },
        { label: 'Creative graphic studios & dynamic ad agencies', code: 'design' },
        { label: 'Multinational banks, investment funds, or e-commerce firms', code: 'biz' },
        { label: 'International hospitals, biotech labs & pharma research centers', code: 'bio' }
      ]
    },
    {
      id: 3,
      question: 'What is your strongest personal skill?',
      options: [
        { label: 'Logical reasoning, math skills & structured programming logic', code: 'tech' },
        { label: 'High aesthetic sense, rich imagination & deep empathy', code: 'design' },
        { label: 'Persuasive communication, time management & team leadership', code: 'biz' },
        { label: 'Perseverance, attention to detail & scientific curiosity', code: 'bio' }
      ]
    },
    {
      id: 4,
      question: 'Which high school subject did you excel at or enjoy most?',
      options: [
        { label: 'Mathematics & Computer Science / Physics', code: 'tech' },
        { label: 'Art & Design / Literature & Foreign Languages', code: 'design' },
        { label: 'Mathematics / English & Business / Economics', code: 'biz' },
        { label: 'Biology / Chemistry & Natural Sciences', code: 'bio' }
      ]
    },
    {
      id: 5,
      question: 'Which working style makes you most productive?',
      options: [
        { label: 'Deep solo focus on code, algorithms, and technical specs', code: 'tech' },
        { label: 'Visual brainstorming and sketching prototypes with a creative team', code: 'design' },
        { label: 'Meeting partners, coordinating teams, and tracking key metrics', code: 'biz' },
        { label: 'Following structured lab protocols or field sample analysis', code: 'bio' }
      ]
    },
    {
      id: 6,
      question: 'How do you react when encountering an unexpected crisis?',
      options: [
        { label: 'Calmly debug the issue using log data and system evidence', code: 'tech' },
        { label: 'Look from new creative angles and suggest fresh workarounds', code: 'design' },
        { label: 'Assess financial risks, discuss options, and decisively choose a direction', code: 'biz' },
        { label: 'Review core scientific principles and test hypotheses methodically', code: 'bio' }
      ]
    },
    {
      id: 7,
      question: 'What achievement would make you proudest after graduation?',
      options: [
        { label: 'A smooth AI software application serving millions of users', code: 'tech' },
        { label: 'A stunning brand identity or app interface acclaimed by users', code: 'design' },
        { label: 'A business campaign generating record-breaking revenue', code: 'biz' },
        { label: 'A biomedical research breakthrough protecting human health', code: 'bio' }
      ]
    },
    {
      id: 8,
      question: 'What is the most critical personal value in your career?',
      options: [
        { label: 'Continuous technological innovation & freedom to solve hard problems', code: 'tech' },
        { label: 'Creative freedom & designing delightful user experiences', code: 'design' },
        { label: 'Financial prosperity, rapid promotion, and business leadership', code: 'biz' },
        { label: 'Contributing knowledge to humanity and improving quality of life', code: 'bio' }
      ]
    },
    {
      id: 9,
      question: 'What extracurricular project do you enjoy most?',
      options: [
        { label: 'Joining Hackathons, web/game dev projects, or IoT builds', code: 'tech' },
        { label: 'Creating social media content, editing videos, or designing posters', code: 'design' },
        { label: 'Running a micro-startup, managing event budgets, or sales', code: 'biz' },
        { label: 'Joining STEM science clubs, environmental campaigns, or healthcare drives', code: 'bio' }
      ]
    },
    {
      id: 10,
      question: 'Which professional role model do you aspire to become in 5-10 years?',
      options: [
        { label: 'Chief Technology Officer (CTO) or Senior AI Architect', code: 'tech' },
        { label: 'Creative Director or Head of Product Design', code: 'design' },
        { label: 'Startup CEO, Chief Financial Officer (CFO), or Investment Director', code: 'biz' },
        { label: 'Biomedical Scientist, Specialist Physician, or Lead Pharmacist', code: 'bio' }
      ]
    }
  ];

  const handleQuizAnswer = (questionId: number, code: string) => {
    const updated = { ...quizAnswers, [questionId]: code };
    setQuizAnswers(updated);

    if (Object.keys(updated).length === quizQuestions.length) {
      // Calculate winner
      const counts: Record<string, number> = {};
      Object.values(updated).forEach(c => { counts[c] = (counts[c] || 0) + 1; });
      let maxCode = 'tech';
      let maxCount = 0;
      Object.entries(counts).forEach(([code, count]) => {
        if (count > maxCount) {
          maxCount = count;
          maxCode = code;
        }
      });
      setQuizResult(maxCode);
    }
  };

  const navLinks = [
    { id: 'hero', name: isVi ? "Lộ Trình Tổng Quan" : "Overview" },
    { id: 'majors', name: isVi ? "Ngành Trọng Điểm" : "Key Majors" },
    { id: 'timeline', name: isVi ? "Bản Đồ 4 Năm" : "4-Year Roadmap" },
    { id: 'quiz', name: isVi ? "Trắc Nghiệm AI" : "AI Career Quiz" },
    { id: 'salary', name: isVi ? "Dự Báo Lương" : "Salary Forecast" },
    { id: 'mentors', name: isVi ? "Cố Vấn 1-1" : "1-on-1 Mentors" },
    { id: 'community', name: isVi ? "Diễn Đàn Cộng Đồng" : "Forum Community" }
  ];

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-['Inter',sans-serif] select-none flex flex-col justify-between overflow-x-hidden">
      {/* Font & Styles Injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        body {
          font-family: 'Inter', sans-serif;
          background-color: #000;
        }

        .liquid-glass {
          background: rgba(255, 255, 255, 0.05);
          background-blend-mode: luminosity;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .liquid-glass::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.2px;
          background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        @keyframes blurFadeUp {
          from {
            opacity: 0;
            filter: blur(12px);
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
          }
        }

        .animate-blur-fade-up {
          animation: blurFadeUp 0.8s ease-out forwards;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>

      {/* BACKGROUND VIDEO */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 z-0 h-full w-full object-cover opacity-90 pointer-events-none"
      >
        <source 
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4" 
          type="video/mp4" 
        />
        <source 
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4" 
          type="video/mp4" 
        />
      </video>

      {/* LIGHTER TRANSLUCENT OVERLAY */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-black/25 via-black/10 to-black/35 pointer-events-none" />

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3.5 sm:px-6 md:px-12 backdrop-blur-md bg-black/20 border-b border-white/10">
        {/* Left Logo / Back button */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="liquid-glass flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition-colors hover:text-white cursor-pointer"
              title={isVi ? "Quay lại Trang chủ" : "Back to Home"}
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('hero')}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black font-bold text-xs shadow-glow">
              <Compass size={18} />
            </div>
            <span className="text-sm sm:text-base font-bold tracking-widest text-white uppercase">
              {isVi ? "ĐỊNH HƯỚNG NGHỀ NGHIỆP" : "CAREER GUIDANCE"}
            </span>
          </div>
        </div>

        {/* Center Nav Tabs (Desktop) */}
        <div className="hidden xl:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
          {navLinks.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-white text-black shadow-md' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="liquid-glass hidden sm:flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 cursor-pointer"
          >
            <Search size={15} />
            <span>{isVi ? "Tra cứu" : "Search"}</span>
          </button>

          <button
            onClick={() => setIsConsultOpen(true)}
            className="liquid-glass flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/20"
          >
            <User size={15} />
            <span className="hidden sm:inline">{isVi ? "Tư Vấn 1-1" : "1-on-1 Advisory"}</span>
          </button>

          {/* Hamburger Menu Button (mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="liquid-glass flex h-9 w-9 items-center justify-center rounded-full text-white xl:hidden cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* MOBILE NAV DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="fixed top-[57px] left-0 right-0 z-40 bg-black/95 backdrop-blur-2xl border-b border-white/10 p-4 space-y-2 xl:hidden animate-blur-fade-up">
          {navLinks.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === tab.id ? 'bg-white text-black' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      )}

      {/* MAIN CONTAINER CONTENT AREA */}
      <main className={`relative z-10 flex-1 max-w-[1380px] w-full mx-auto px-4 py-6 sm:px-6 md:px-10 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}>
        
        {/* VIEW 1: HERO OVERVIEW SLIDER */}
        {activeTab === 'hero' && (
          <div key={`hero-${currentSlide}`} className="flex flex-col min-h-[75vh] justify-between py-4 animate-blur-fade-up">
            {/* Top Info Banner */}
            <div className="flex items-center justify-between w-full mb-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-medium text-gray-200 backdrop-blur-md">
                <Sparkles size={14} className="text-amber-300" />
                <span>{slide.badge}</span>
              </div>

              <div className="flex items-center gap-4 text-xs text-white/70">
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-amber-300 text-amber-300" />
                  <span>{slide.rating}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1">
                  <Clock size={14} />
                  <span>{slide.duration}</span>
                </div>
              </div>
            </div>

            {/* Giant Title & Description */}
            <div className="space-y-4 max-w-4xl my-auto">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.15] animate-blur-fade-up">
                {slide.title}
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-white/80 font-normal leading-relaxed max-w-2xl animate-blur-fade-up">
                {slide.description}
              </p>

              {/* Stats Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-xl">
                {slide.stats.map((st, i) => (
                  <div key={i} className="liquid-glass p-3 rounded-xl border border-white/10 bg-white/5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-white/50 block mb-0.5">
                      {st.label}
                    </span>
                    <span className="text-sm font-bold text-amber-300">
                      {st.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <button 
                  onClick={() => setActiveTab('majors')}
                  className="bg-white text-black rounded-full font-semibold px-6 py-3 text-xs sm:text-sm flex items-center gap-2 hover:bg-gray-200 transition-all cursor-pointer shadow-xl active:scale-95"
                >
                  <Play size={16} className="fill-black" />
                  <span>{isVi ? "Khám Phá Các Ngành Học" : "Explore Key Majors"}</span>
                </button>

                <button 
                  onClick={() => setActiveTab('quiz')}
                  className="liquid-glass border border-white/30 hover:border-white/50 rounded-full font-semibold px-6 py-3 text-xs sm:text-sm text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Zap size={16} className="text-amber-300" />
                  <span>{isVi ? "Trắc Nghiệm AI Phù Hợp" : "Take AI Career Match"}</span>
                </button>
              </div>
            </div>

            {/* Bottom Slider Navigation Bar */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-8">
              <div className="flex items-center gap-2">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="liquid-glass flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-white hover:bg-white/10 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">{isVi ? "Trước" : "Prev"}</span>
                </button>
                <span className="text-xs font-mono text-white/60 px-2">
                  {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                </span>
                <button
                  onClick={handleNext}
                  className="liquid-glass flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-white hover:bg-white/10 cursor-pointer"
                >
                  <span className="hidden sm:inline">{isVi ? "Tiếp" : "Next"}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: MAJORS GRID & DETAILS */}
        {activeTab === 'majors' && (
          <div className="space-y-6 py-4 animate-blur-fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <GraduationCap className="text-amber-300" size={24} />
                  {isVi ? "Bản Đồ Ngành Học & Xu Hướng 2026+" : "Key Majors & Career Pathways 2026+"}
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  {isVi ? "Nhấp vào ngành để xem chi tiết lộ trình môn học, kỹ năng cốt lõi và vị trí tuyển dụng." : "Click on any major to view core curriculum, skills, and job placement."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="liquid-glass px-4 py-2 rounded-xl text-xs font-semibold text-white/90 hover:text-white flex items-center gap-2 border border-white/10 cursor-pointer"
                >
                  <Search size={14} />
                  {isVi ? "Lọc ngành học" : "Filter Majors"}
                </button>
              </div>
            </div>

            {/* Majors Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processedMajors.map((m) => (
                <div 
                  key={m.id}
                  onClick={() => setSelectedMajor(m)}
                  className="liquid-glass p-5 rounded-2xl border border-white/15 hover:border-white/35 bg-black/20 hover:bg-white/[0.08] backdrop-blur-xl transition-all hover:scale-[1.01] cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
                        {m.category}
                      </span>
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {m.badge}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      {m.title}
                    </h3>

                    <p className="text-xs text-white/70 mt-1.5 leading-relaxed line-clamp-2">
                      {m.desc}
                    </p>
                  </div>

                  {/* Exam Blocks badge */}
                  {m.examBlocks && m.examBlocks.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-amber-300 font-semibold block">
                        {isVi ? 'Khối thi xét tuyển:' : 'Exam Blocks:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.examBlocks.map((blk, idx) => (
                          <span key={idx} className="text-[10px] bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded text-amber-200 font-mono font-bold">
                            {blk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills tags */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-mono text-white/40 block">
                      {isVi ? 'Kỹ năng trọng tâm:' : 'Core Skills:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.skills.map((sk, idx) => (
                        <span key={idx} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-white/80 font-mono">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-white/80">
                    <div className="flex items-center gap-1 font-semibold text-emerald-400">
                      <DollarSign size={13} />
                      <span>{m.salaryRange}</span>
                    </div>
                    <span className="text-[11px] text-white/50 group-hover:text-white transition-colors flex items-center gap-1 font-semibold">
                      {isVi ? "Xem chi tiết" : "View detail"} →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: 4-YEAR ROADMAP TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-6 py-4 animate-blur-fade-up">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Compass className="text-amber-300" size={24} />
                {isVi ? "Lộ Trình Từng Bước 4 Năm Đại Học -> Doanh Nghiệp" : "4-Year Step-by-Step University Roadmap"}
              </h2>
              <p className="text-xs text-white/60 mt-1">
                {isVi ? "Khung chuẩn mực thiết kế giúp sinh viên phát triển toàn diện từ năm nhất đến khi ứng tuyển." : "Standard framework guiding students from freshman year to dream career."}
              </p>
            </div>

            {/* Timeline Steps */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  year: isVi ? 'Năm 1: Nền Tảng' : 'Year 1: Foundation',
                  badge: isVi ? 'Xây Nền Vững' : 'Core Knowledge',
                  items: [
                    isVi ? 'Nắm vững kiến thức đại cương & ngoại ngữ (IELTS 6.5+)' : 'Master general courses & foreign language',
                    isVi ? 'Học lập trình / tư duy thiết kế / kinh tế cơ bản' : 'Basic coding / design thinking / economics',
                    isVi ? 'Tham gia các CLB học thuật & kỹ năng mềm' : 'Join academic clubs & soft skill workshops'
                  ]
                },
                {
                  year: isVi ? 'Năm 2: Thực Chiến' : 'Year 2: Practice',
                  badge: isVi ? 'Xây Đồ Án' : 'Build Projects',
                  items: [
                    isVi ? 'Làm 2-3 đồ án chuyên ngành thực tế' : 'Complete 2-3 real-world portfolio projects',
                    isVi ? 'Thi lấy chứng chỉ quốc tế (AWS, Google, PMP)' : 'Earn certs (AWS, Google, Microsoft)',
                    isVi ? 'Xây dựng CV & Hồ sơ GitHub / Behance chuyên nghiệp' : 'Build professional GitHub/Behance profile'
                  ]
                },
                {
                  year: isVi ? 'Năm 3: Thực Tập' : 'Year 3: Internship',
                  badge: isVi ? 'Vào Doanh Nghiệp' : 'Corporate Entry',
                  items: [
                    isVi ? 'Ứng tuyển thực tập sinh tại công ty/tập đoàn' : 'Apply for corporate internships',
                    isVi ? 'Làm việc trực tiếp với cố vấn doanh nghiệp (Mentor)' : 'Direct mentorship from industry seniors',
                    isVi ? 'Mở rộng mạng lưới quan hệ (Networking)' : 'Expand professional network'
                  ]
                },
                {
                  year: isVi ? 'Năm 4: Bứt Phá' : 'Year 4: Launch',
                  badge: isVi ? 'Tuyển Dụng Official' : 'Official Career',
                  items: [
                    isVi ? 'Hoàn thành Khóa luận / Đồ án tốt nghiệp xuất sắc' : 'Complete Graduation Thesis',
                    isVi ? 'Phỏng vấn vị trí Junior / Specialist chính thức' : 'Interview for full-time Junior/Specialist roles',
                    isVi ? 'Nhận mức lương khởi điểm tối ưu' : 'Secure top starting compensation package'
                  ]
                }
              ].map((step, idx) => (
                <div key={idx} className="liquid-glass p-5 rounded-2xl border border-white/15 bg-black/20 hover:bg-white/[0.08] backdrop-blur-xl space-y-3 relative transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-amber-300 font-bold">0{idx + 1}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/90">
                      {step.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{step.year}</h3>
                  <ul className="space-y-2 pt-2 border-t border-white/10">
                    {step.items.map((item, i) => (
                      <li key={i} className="text-xs text-white/70 flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: AI CAREER QUIZ */}
        {activeTab === 'quiz' && (
          <div className="space-y-6 py-4 animate-blur-fade-up max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
                <Zap size={14} />
                {isVi ? "Trắc Nghiệm Khám Phá Nghề Nghiệp AI" : "AI Career Discovery Assessment"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {isVi ? "Khám Phá Ngành Học & Sự Nghiệp Phù Hợp" : "Find Your Best Matching Career & Major"}
              </h2>
              <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto">
                {isVi ? "Hoàn thành 10 câu hỏi để hệ thống AI phân tích thiên hướng năng lực, tư duy và đối chiếu trực tiếp với 20 ngành nghề HOT nhất thị trường 2026+." : "Complete 10 questions to let AI analyze your aptitudes and map them to 20 top-demand careers."}
              </p>
            </div>

            {!quizResult ? (
              <div className="space-y-6">
                {/* Progress Bar Header */}
                <div className="liquid-glass p-4 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {isVi ? "Tiến độ bài test:" : "Progress:"}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {Object.keys(quizAnswers).length} / {quizQuestions.length} {isVi ? "câu đã chọn" : "completed"}
                    </span>
                  </div>
                  <div className="w-full sm:w-48 h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/10">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300 rounded-full"
                      style={{ width: `${(Object.keys(quizAnswers).length / quizQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question List */}
                <div className="space-y-5">
                  {quizQuestions.map((q) => (
                    <div key={q.id} className="liquid-glass p-5 rounded-2xl border border-white/15 bg-black/20 backdrop-blur-xl space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs flex items-center justify-center font-bold font-mono shrink-0">
                          {q.id}
                        </span>
                        <h3 className="text-sm font-semibold text-white pt-0.5">
                          {q.question}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-2 pt-1">
                        {q.options.map((opt, idx) => {
                          const isSelected = quizAnswers[q.id] === opt.code;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleQuizAnswer(q.id, opt.code)}
                              className={`w-full text-left p-3.5 rounded-xl text-xs font-medium transition-all cursor-pointer border flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-lg shadow-amber-400/20'
                                  : 'bg-white/5 text-white/85 border-white/10 hover:bg-white/12 hover:border-white/20'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Sparkles size={14} className="text-black shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* RESULT VIEW WITH DETAILED DOMAIN BREAKDOWN & MATCHED CAREERS */
              <div className="space-y-6 animate-blur-fade-up">
                {/* Result Summary Banner */}
                <div className="liquid-glass p-6 sm:p-8 rounded-3xl border border-amber-400/40 bg-black/50 backdrop-blur-2xl text-center space-y-5 relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                  <Sparkles className="mx-auto text-amber-300 animate-bounce" size={36} />
                  
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-widest block mb-1">
                      {isVi ? "Báo Cáo Phân Tích Định Hướng AI 2026+" : "AI Career Match Report 2026+"}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                      {quizResult === 'tech' && (isVi ? 'Công Nghệ AI, Vi Mạch & Phần Mềm' : 'AI, Semiconductors & Software')}
                      {quizResult === 'design' && (isVi ? 'Thiết Kế UI/UX, Sáng Tạo & Truyền Thông' : 'UI/UX Design, Creative & Media')}
                      {quizResult === 'biz' && (isVi ? 'Fintech, Kinh Doanh Số & Tài Chính' : 'Fintech, Digital Business & Finance')}
                      {quizResult === 'bio' && (isVi ? 'Y Khoa Thông Minh, Bio-Tech & Y Dược' : 'Smart Medicine, Biotech & Healthcare')}
                    </h3>
                  </div>

                  {/* Domain Scores Progress Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                    {(() => {
                      const counts: Record<string, number> = { tech: 0, design: 0, biz: 0, bio: 0 };
                      Object.values(quizAnswers).forEach(c => { if (counts[c] !== undefined) counts[c]++; });
                      const total = Object.keys(quizAnswers).length || 1;
                      const getPct = (k: string) => Math.round((counts[k] / total) * 100);

                      return [
                        { key: 'tech', name: isVi ? 'Công Nghệ & AI' : 'Tech & AI', pct: getPct('tech'), color: 'bg-purple-500' },
                        { key: 'design', name: isVi ? 'Sáng Tạo & UI/UX' : 'Design & Media', pct: getPct('design'), color: 'bg-pink-500' },
                        { key: 'biz', name: isVi ? 'Kinh Tế & Fintech' : 'Business & Fintech', pct: getPct('biz'), color: 'bg-emerald-500' },
                        { key: 'bio', name: isVi ? 'Y Khoa & Sinh Học' : 'Medicine & Bio', pct: getPct('bio'), color: 'bg-amber-500' },
                      ].map((d) => (
                        <div key={d.key} className="p-3 rounded-xl bg-white/5 border border-white/10 text-left space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-white/80 font-medium">
                            <span>{d.name}</span>
                            <span className="font-mono font-bold text-amber-300">{d.pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.pct}%` }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => { setQuizAnswers({}); setQuizResult(null); }}
                      className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all border border-white/15"
                    >
                      {isVi ? 'Làm lại bài trắc nghiệm' : 'Retake Test'}
                    </button>
                    <button
                      onClick={() => setActiveTab('majors')}
                      className="px-6 py-2.5 rounded-full text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 cursor-pointer transition-all shadow-lg shadow-amber-400/20"
                    >
                      {isVi ? 'Xem tất cả 20 ngành nghề' : 'Browse All 20 Majors'}
                    </button>
                  </div>
                </div>

                {/* MATCHED TOP CAREERS LIST */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="text-amber-300" size={18} />
                      {isVi ? "Các Ngành Nghề Đột Phá Phù Hợp Nhất Với Bạn:" : "Top Recommended Careers For You:"}
                    </h4>
                    <span className="text-xs font-mono text-amber-300">
                      {isVi ? "Khớp chỉ số AI > 85%" : "AI Fit Score > 85%"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(() => {
                      const matchedIds = 
                        quizResult === 'tech' ? ['ai-eng', 'software-eng', 'cybersecurity', 'semiconductor', 'ev-green-tech'] :
                        quizResult === 'design' ? ['ui-ux', 'pr-global-comm', 'smart-architecture', 'english-ai-trans'] :
                        quizResult === 'biz' ? ['fintech', 'digital-marketing', 'e-commerce-logistics', 'finance-banking', 'international-law', 'data-auditing'] :
                        ['smart-medicine', 'biotech-pharm', 'psychology-org', 'ev-green-tech'];

                      const matchedMajors = processedMajors.filter(m => matchedIds.includes(m.id));

                      return matchedMajors.map((m) => (
                        <div 
                          key={m.id}
                          onClick={() => setSelectedMajor(m)}
                          className="liquid-glass p-5 rounded-2xl border border-amber-400/25 bg-black/30 hover:bg-white/[0.08] backdrop-blur-xl transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                                {m.badge}
                              </span>
                              <span className="text-[11px] text-emerald-400 font-mono font-bold">
                                {m.growthRate}
                              </span>
                            </div>

                            <h5 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                              {m.title}
                            </h5>
                            <p className="text-xs text-white/60 line-clamp-2 mt-1">
                              {m.desc}
                            </p>
                          </div>

                          {m.examBlocks && m.examBlocks.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                              <span className="text-[10px] text-white/50 font-mono">{isVi ? 'Khối thi:' : 'Exams:'}</span>
                              <div className="flex flex-wrap gap-1">
                                {m.examBlocks.map((blk, idx) => (
                                  <span key={idx} className="text-[9px] bg-amber-400/15 border border-amber-400/30 text-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">
                                    {blk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                            <span className="font-mono text-white/80 font-semibold">{m.salaryRange}</span>
                            <span className="text-amber-300 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              {isVi ? 'Xem lộ trình' : 'Details'} &rarr;
                            </span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: SALARY FORECAST */}
        {activeTab === 'salary' && (
          <div className="space-y-6 py-4 animate-blur-fade-up">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <BarChart3 className="text-emerald-400" size={24} />
                {isVi ? "Công Cụ Tra Cứu Thu Nhập & Thị Trường Tuyển Dụng" : "Salary & Job Demand Analytics Calculator"}
              </h2>
              <p className="text-xs text-white/60 mt-1">
                {isVi ? "Dự báo mức lương thực tế dựa trên cấp độ kinh nghiệm và lĩnh vực hoạt động." : "Real-world salary benchmark based on field and experience level."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Controls */}
              <div className="liquid-glass p-5 rounded-2xl border border-white/15 bg-black/20 backdrop-blur-xl space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-2">
                    {isVi ? 'Chọn Lĩnh Vực' : 'Select Industry'}
                  </label>
                  <select
                    value={selectedField}
                    onChange={(e) => setSelectedField(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-xl p-2.5 text-xs text-white outline-none focus:border-white"
                  >
                    <option value="ai">{isVi ? 'AI & Khoa Học Dữ Liệu' : 'AI & Data Science'}</option>
                    <option value="dev">{isVi ? 'Kỹ Thuật Phần Mềm' : 'Software Engineering'}</option>
                    <option value="ux">{isVi ? 'Thiết Kế UI/UX' : 'UI/UX Design'}</option>
                    <option value="fintech">{isVi ? 'Fintech & Tài Chính Số' : 'Fintech & Finance'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-2">
                    {isVi ? 'Cấp Độ Kinh Nghiệm' : 'Experience Level'}
                  </label>
                  <select
                    value={selectedExp}
                    onChange={(e) => setSelectedExp(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-xl p-2.5 text-xs text-white outline-none focus:border-white"
                  >
                    <option value="intern">{isVi ? 'Thực tập sinh (Intern / Fresher)' : 'Intern / Fresher'}</option>
                    <option value="junior">{isVi ? 'Nhân viên (Junior - 1-2 năm)' : 'Junior (1-2 yrs)'}</option>
                    <option value="senior">{isVi ? 'Chuyên viên (Senior - 3-5 năm)' : 'Senior (3-5 yrs)'}</option>
                    <option value="lead">{isVi ? 'Quản lý (Lead / Director)' : 'Lead / Director'}</option>
                  </select>
                </div>
              </div>

              {/* Display Output */}
              <div className="md:col-span-2 liquid-glass p-6 rounded-2xl border border-white/15 bg-black/20 backdrop-blur-xl flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold tracking-wider block mb-1">
                    {isVi ? 'Mức lương dự báo (Thị trường Việt Nam & Remote)' : 'Estimated Market Compensation'}
                  </span>
                  <div className="text-3xl sm:text-4xl font-bold text-white font-mono">
                    {selectedExp === 'intern' && (isVi ? '8 - 14 Triệu / tháng' : '$400 - $700 / mo')}
                    {selectedExp === 'junior' && (isVi ? '18 - 28 Triệu / tháng' : '$900 - $1,400 / mo')}
                    {selectedExp === 'senior' && (isVi ? '35 - 65 Triệu / tháng' : '$1,800 - $3,200 / mo')}
                    {selectedExp === 'lead' && (isVi ? '70 - 120+ Triệu / tháng' : '$3,500 - $6,000+ / mo')}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10 text-xs text-white/70">
                  <div className="flex justify-between">
                    <span>{isVi ? 'Nhu cầu tuyển dụng:' : 'Market Demand:'}</span>
                    <span className="font-bold text-amber-300">Rất cao (Rất thiếu hụt nhân sự)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isVi ? 'Yêu cầu ưu tiên:' : 'Top Requirement:'}</span>
                    <span className="font-bold text-white">Ngoại ngữ (IELTS/TOEIC) + Kỹ năng làm việc với AI Tools</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: 1-ON-1 MENTORS SHOWCASE */}
        {activeTab === 'mentors' && (
          <div className="space-y-6 py-4 animate-blur-fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Users className="text-purple-400" size={24} />
                  {isVi ? "Đội Ngũ Cố Vấn Doanh Nghiệp & Chuyên Gia" : "Industry Mentors Portfolio"}
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  {isVi ? "Kết nối 1-1 trực tiếp với các chuyên gia hàng đầu đến từ Google, Grab, VinAI, Momo..." : "Connect 1-on-1 with senior leaders from top companies."}
                </p>
              </div>

              <button
                onClick={() => setIsConsultOpen(true)}
                className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-200 cursor-pointer"
              >
                {isVi ? "Đặt lịch hẹn cố vấn" : "Book Advisory Slot"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mentors.map((men) => (
                <div key={men.id} className="liquid-glass p-5 rounded-2xl border border-white/15 bg-black/20 hover:bg-white/[0.08] backdrop-blur-xl transition-all space-y-4">
                  <div className="flex items-center gap-3">
                    <img src={men.avatar} alt={men.name} className="w-12 h-12 rounded-full object-cover border border-white/20" />
                    <div>
                      <h3 className="text-sm font-bold text-white">{men.name}</h3>
                      <p className="text-xs text-amber-300 font-medium">{men.role} • {men.company}</p>
                      <span className="text-[10px] text-white/50">{men.experience}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {men.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/70">
                        {t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => { setSelectedMentor(men); setIsConsultOpen(true); }}
                    className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 cursor-pointer transition-colors"
                  >
                    {isVi ? "Đặt Lịch Hẹn 1-1" : "Book 1-on-1"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 7: COMMUNITY FORUM */}
        {activeTab === 'community' && (
          <div className="animate-blur-fade-up bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <Community />
          </div>
        )}

      </main>

      {/* MAJOR DETAIL MODAL */}
      {selectedMajor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-blur-fade-up">
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/20 bg-gray-900/95 p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar space-y-4">
            <button 
              onClick={() => setSelectedMajor(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 font-mono">
                {selectedMajor.category} • {selectedMajor.badge}
              </span>
              <h3 className="text-xl font-bold text-white">{selectedMajor.title}</h3>
              <p className="text-sm font-medium text-white/90 pb-2">{selectedMajor.desc}</p>
            </div>
            
            <div className="space-y-2 pb-2">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Target size={14} /> {isVi ? 'Ngành này là gì? Công việc thực tế như thế nào?' : 'What is it actually like?'}
              </h4>
              <p className="text-xs text-white/80 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">{selectedMajor.whatIsIt}</p>
            </div>

            <div className="space-y-2 pb-2">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Compass size={14} /> {isVi ? 'Làm sao để bắt đầu? (Lộ trình)' : 'How to start?'}
              </h4>
              <div className="text-xs text-white/80 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10 whitespace-pre-line">
                {selectedMajor.howToStart}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-xl border border-white/10 text-xs">
              <div>
                <span className="text-white/50 block text-[10px] uppercase font-mono">{isVi ? 'Mức lương dự kiến:' : 'Expected Salary:'}</span>
                <span className="font-bold text-emerald-400">{selectedMajor.salaryRange}</span>
              </div>
              <div>
                <span className="text-white/50 block text-[10px] uppercase font-mono">{isVi ? 'Tốc độ tăng trưởng:' : 'Growth Rate:'}</span>
                <span className="font-bold text-amber-300">{selectedMajor.growthRate}</span>
              </div>
            </div>

            {selectedMajor.examBlocks && selectedMajor.examBlocks.length > 0 && (
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs space-y-1.5">
                <span className="text-amber-300 block text-[10px] uppercase font-mono font-bold">
                  {isVi ? 'Khối thi xét tuyển đại học:' : 'Standard Exam Blocks:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedMajor.examBlocks.map((blk, i) => (
                    <span key={i} className="text-xs bg-amber-400/15 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-lg font-mono font-bold">
                      {blk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{isVi ? 'Các môn học cốt lõi (Syllabus):' : 'Core Subjects:'}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedMajor.subjects.map((s, i) => (
                  <div key={i} className="text-xs bg-white/5 p-2 rounded-lg border border-white/10 text-white/80 flex items-center gap-2">
                    <BookOpen size={14} className="text-sky-400 shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{isVi ? 'Vị trí công việc đầu ra:' : 'Career Outcomes:'}</h4>
              <div className="flex flex-wrap gap-2">
                {selectedMajor.careers.map((c, i) => (
                  <span key={i} className="text-xs bg-amber-400/10 border border-amber-400/30 text-amber-300 px-3 py-1 rounded-full font-medium">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => { setSelectedMajor(null); setIsConsultOpen(true); }}
                className="bg-white text-black px-6 py-2.5 rounded-full text-xs font-bold hover:bg-gray-200 cursor-pointer"
              >
                {isVi ? 'Đăng ký nhận lộ trình chi tiết' : 'Get Full Curriculum PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH MODAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-blur-fade-up">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-gray-900/95 p-6 shadow-2xl space-y-4">
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="text-base font-bold text-white">
              {isVi ? "Tra Cứu Lộ Trình & Ngành Học" : "Search Majors & Pathways"}
            </h3>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isVi ? "Nhập tên ngành, từ khóa kỹ năng..." : "Search major, skills..."}
                className="w-full rounded-xl border border-white/20 bg-black/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:border-white focus:outline-none"
                autoFocus
              />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {processedMajors
                .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.category.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((m) => (
                  <button 
                    key={m.id}
                    onClick={() => {
                      setSelectedMajor(m);
                      setIsSearchOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-white/10 text-xs text-gray-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>{m.title}</span>
                    <Sparkles size={14} className="text-amber-400" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* CONSULTATION MODAL / TƯ VẤN 1-1 */}
      {isConsultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-blur-fade-up">
          <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-gray-900/95 p-6 shadow-2xl">
            <button 
              onClick={() => { setIsConsultOpen(false); setSelectedMentor(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="text-base font-bold text-white mb-1">
              {selectedMentor ? (isVi ? `Đặt Lịch Cố Vấn: ${selectedMentor.name}` : `Book Mentor: ${selectedMentor.name}`) : (isVi ? "Đăng Ký Tư Vấn Định Hướng 1-1" : "Register for 1-on-1 Mentorship")}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              {isVi 
                ? "Để lại thông tin để được Cố vấn giàu kinh nghiệm trực tiếp hỗ trợ phân tích năng lực và lên kế hoạch học tập."
                : "Leave your info to get personalized mentorship and academic planning."}
            </p>

            {consultSubmitted ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="mx-auto text-emerald-400" size={36} />
                <p className="text-xs font-semibold text-white">
                  {isVi ? "Đã gửi thông tin đăng ký thành công!" : "Submission Successful!"}
                </p>
                <p className="text-[11px] text-gray-400">
                  {isVi ? "Cố vấn định hướng sẽ liên hệ với bạn qua Email/SĐT trong 24h." : "Our mentors will contact you within 24 hours."}
                </p>
                <button
                  onClick={() => {
                    setConsultSubmitted(false);
                    setIsConsultOpen(false);
                    setSelectedMentor(null);
                  }}
                  className="mt-2 bg-white text-black text-xs font-bold px-6 py-2 rounded-full cursor-pointer"
                >
                  {isVi ? "Đóng" : "Close"}
                </button>
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setConsultSubmitted(true);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-medium text-gray-300 mb-1">
                    {isVi ? "Họ và tên sinh viên" : "Student Name"}
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder={isVi ? "Nguyễn Văn A" : "John Doe"}
                    className="w-full rounded-xl border border-white/20 bg-black/50 p-2 text-xs text-white placeholder-gray-500 focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-300 mb-1">
                    {isVi ? "Email liên hệ" : "Contact Email"}
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="student@university.edu.vn"
                    className="w-full rounded-xl border border-white/20 bg-black/50 p-2 text-xs text-white placeholder-gray-500 focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-300 mb-1">
                    {isVi ? "Số điện thoại / Zalo" : "Phone Number"}
                  </label>
                  <input 
                    type="tel" 
                    required
                    placeholder="0912345678"
                    className="w-full rounded-xl border border-white/20 bg-black/50 p-2 text-xs text-white placeholder-gray-500 focus:border-white focus:outline-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full rounded-full bg-white py-2.5 text-xs font-bold text-black hover:bg-gray-200 transition-colors cursor-pointer mt-1"
                >
                  {isVi ? "Gửi Đăng Ký Tư Vấn" : "Submit Registration"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur-xl py-4 px-4 sm:px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/50 gap-2">
        <span>© 2026 StudyWithMe. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <a href="#privacy" className="hover:text-white transition-colors">{isVi ? "Điều khoản sử dụng" : "Terms"}</a>
          <a href="#privacy" className="hover:text-white transition-colors">{isVi ? "Bảo mật thông tin" : "Privacy"}</a>
        </div>
      </footer>
    </div>
  );
};

export default CareerGuidance;
