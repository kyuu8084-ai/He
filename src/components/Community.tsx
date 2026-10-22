import { triggerHaptic } from '../lib/haptics';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Users, BookOpen, Send, Plus, Search, ChevronRight, 
  LayoutGrid, List as ListIcon, X, Image as ImageIcon, Mic, StopCircle, 
  Play as PlayIcon, Trash2, ArrowLeft, Heart, Share2, MoreHorizontal, 
  Edit, Camera, Link as LinkIcon, Calendar as CalendarIcon, Pin, 
  Sparkles, Flame, Award, Filter, ThumbsUp, CheckCircle2, Tag, Eye, Bookmark, User, PenTool, MessageCircle, Bell
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, where, doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { db, auth, signInWithGoogle } from '../lib/firebase';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/fonts.css';
import '../styles/theme.css';
import AIChat from './AIChat';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorBadge?: string;
  categoryId: string;
  createdAt: any;
  image?: string;
  audio?: string;
  isPinned?: boolean;
  likes?: number;
  commentsCount?: number;
  viewsCount?: number;
  tags?: string[];
}

interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorBadge?: string;
  createdAt: any;
  likes?: number;
  replyToId?: string;
  replyToName?: string;
}

interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: 'post_reply' | 'comment_reply';
  postId: string;
  content: string;
  createdAt: any;
  read: boolean;
}

interface UserProfile {
  id: string;
  displayName: string;
  bio?: string;
  photoURL?: string;
  headerURL?: string;
  createdAt: any;
}

interface Category {
  id: string;
  title: string;
  slug: string;
  desc?: string;
  icon?: string;
}

// Initial High-Quality Seed Data for Forum

interface CommunityBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const getCommunityBadges = (userId: string, allPosts: Post[], allComments: Comment[]): CommunityBadge[] => {
  const userPostsCount = allPosts.filter(p => p.authorId === userId).length;
  const userCommentsCount = allComments.filter(c => c.authorId === userId).length;
  
  const badges: CommunityBadge[] = [];
  
  if (userPostsCount >= 1) {
    badges.push({ id: 'post_1', name: 'Người Khởi Xướng', description: 'Đăng bài viết đầu tiên', icon: 'PenTool', color: 'bg-blue-100 text-blue-700 border-blue-200' });
  }
  if (userPostsCount >= 5) {
    badges.push({ id: 'post_5', name: 'Người Truyền Lửa', description: 'Đăng 5 bài viết', icon: 'Flame', color: 'bg-orange-100 text-orange-700 border-orange-200' });
  }
  if (userPostsCount >= 20) {
    badges.push({ id: 'post_20', name: 'Chuyên Gia Lĩnh Vực', description: 'Đăng 20 bài viết', icon: 'Award', color: 'bg-purple-100 text-purple-700 border-purple-200' });
  }
  
  if (userCommentsCount >= 1) {
    badges.push({ id: 'cmt_1', name: 'Người Lắng Nghe', description: 'Bình luận lần đầu', icon: 'MessageCircle', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' });
  }
  if (userCommentsCount >= 10) {
    badges.push({ id: 'cmt_10', name: 'Nhà Phê Bình', description: 'Đóng góp 10 bình luận', icon: 'ThumbsUp', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' });
  }
  if (userCommentsCount >= 50) {
    badges.push({ id: 'cmt_50', name: 'Trái Tim Cộng Đồng', description: 'Đóng góp 50 bình luận', icon: 'Heart', color: 'bg-pink-100 text-pink-700 border-pink-200' });
  }
  
  return badges;
};

const getPrimaryTitle = (userId: string, allPosts: Post[], allComments: Comment[]): string => {
  const userPostsCount = allPosts.filter(p => p.authorId === userId).length;
  const userCommentsCount = allComments.filter(c => c.authorId === userId).length;
  const total = userPostsCount + userCommentsCount;
  
  if (userPostsCount >= 20) return "🏆 Chuyên Gia Lĩnh Vực";
  if (userPostsCount >= 5) return "⭐ Người Truyền Lửa";
  if (total >= 10) return "🔥 Thành Viên Tích Cực";
  if (total >= 1) return "🌱 Người Khởi Xướng";
  return "👋 Thành Viên Mới";
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'general', title: 'Thảo Luận Chung', slug: 'general', desc: 'Góc hỏi đáp & chia sẻ góc nhìn học tập' },
  { id: 'majors', title: 'Định Hướng Ngành Học', slug: 'majors', desc: 'Chọn ngành, chọn trường ĐH & xu hướng 2026+' },
  { id: 'scholarships', title: 'Săn Học Bổng & Du Học', slug: 'scholarships', desc: 'Kinh nghiệm thi IELTS, làm Hồ sơ & Portfolio' },
  { id: 'career', title: 'Thực Tập & Tuyển Dụng', slug: 'career', desc: 'Review CV, phỏng vấn & cơ hội việc làm Tech/Biz' },
  { id: 'ai-tech', title: 'Công Nghệ & AI', slug: 'ai-tech', desc: 'Ứng dụng công cụ AI & lập trình trong học tập' },
  { id: 'mentors', title: 'Góc Chia Sẻ Cố Vấn', slug: 'mentors', desc: 'Bài viết chuyên sâu từ Chuyên gia & Mentor' }
];

const INITIAL_POSTS: Post[] = [
  {
    id: 'seed-1',
    title: '📌 [Cẩm Nang 2026] Chọn Ngành Học Kỷ Nguyên AI: Nên Chọn Công Nghệ AI, Vi Mạch Bán Dẫn Hay Fintech?',
    content: `Chào các bạn sinh viên và sĩ tử 2026+!

Rất nhiều bạn hỏi tôi: "Em nên chọn Công Nghệ Thông Tin (AI), Kỹ Thuật Vi Mạch Bán Dẫn hay Quản Trị Fintech để không lo bị đào thải trong 5-10 năm tới?"

Dưới đây là 3 điểm cốt lõi giúp các bạn định hướng:

1. Kỹ sư AI & Data Science:
- Nhu cầu cực lớn ở lĩnh vực LLM, Computer Vision, MLOps.
- Lương Fresher dao động 18 - 28 triệu/tháng.
- Yêu cầu bắt buộc: Tư duy Toán giải tích, Xác suất thống kê & Tiếng Anh đọc tài liệu chuẩn.

2. Vi Mạch Bán Dẫn (Semiconductor Design):
- Chiến lược quốc gia đang rót vốn hàng tỷ USD. Các tập đoàn như Synopsys, Marvell, NVIDIA đang mở rộng R&D tại VN.
- Lương kỹ sư mới ra trường từ 22 - 35 triệu/tháng.
- Cần học sâu môn Kỹ thuật Điện tử, Kiến trúc máy tính & ngôn ngữ Verilog/VHDL.

3. Fintech & Quản Trị Kinh Doanh Số:
- Kết hợp giữa tài chính truyền thống & công nghệ ngân hàng số.
- Phù hợp với bạn thích kinh tế nhưng có tư duy phân tích dữ liệu (SQL, Python for Finance).

💡 Lời khuyên: Đừng chỉ chọn ngành vì "Hot Name", hãy nhìn vào năng lực lõi và khả năng kiên trì của bản thân!`,
    authorId: 'mentor-1',
    authorName: 'TS. Nguyễn Hoàng Nam',
    authorBadge: 'Senior AI Specialist @ Google / VinAI',
    categoryId: 'majors',
    createdAt: new Date(Date.now() - 3600000 * 2),
    isPinned: true,
    likes: 342,
    commentsCount: 48,
    viewsCount: 2150,
    tags: ['#ĐịnhHướng2026', '#AI', '#ViMạchBánDẫn', '#Fintech']
  },
  {
    id: 'seed-2',
    title: '📌 Tổng Hợp Các Khối Thi Xét Tuyển ĐH (A00, A01, D01, D07...) & Bí Quyết Phân Bổ Nguyện Vọng An Toàn',
    content: `Để giúp các sĩ tử không bị bỡ ngỡ khi đăng ký nguyện vọng Đại học 2026+, Ban Quản Trị tổng hợp danh sách các khối thi phổ biến nhất:

- Khối A00 (Toán, Lý, Hóa): Ngành Kỹ thuật phần mềm, Vi mạch, Hóa dược.
- Khối A01 (Toán, Lý, Anh): Ngành AI, Khoa học dữ liệu, Ngân hàng, UI/UX.
- Khối D01 (Toán, Văn, Anh): Ngành Truyền thông số, Kinh tế quốc tế, Thương mại điện tử.
- Khối D07 (Toán, Hóa, Anh): Ngành Công nghệ sinh học, Dược học, Kỹ thuật y sinh.

Mẹo xếp nguyện vọng theo công thức 3-Tầng:
- Tầng 1 (1-3 NV): Ngành/Trường mơ ước (Điểm chuẩn có thể cao hơn điểm thi 1-1.5 điểm).
- Tầng 2 (4-6 NV): Ngành/Trường vừa sức (Điểm ngang bằng điểm thi thử).
- Tầng 3 (7-10 NV): Ngành/Trường an toàn chắc chắn đỗ để không bị rớt nguyện vọng.`,
    authorId: 'admin-1',
    authorName: 'Ban Cố Vấn Tuyển Sinh',
    authorBadge: 'Verified Admin',
    categoryId: 'general',
    createdAt: new Date(Date.now() - 3600000 * 5),
    isPinned: true,
    likes: 289,
    commentsCount: 35,
    viewsCount: 1840,
    tags: ['#KhốiThi2026', '#XétTuyểnĐH', '#CẩmNang']
  },
  {
    id: 'seed-3',
    title: 'Review Thực Tế Ngành UI/UX Design: Lương Fresher Có Thực Sự 15-20 Triệu & AI Có Thay Thế Được Không?',
    content: `Chào mọi người! Là một Lead UI/UX đã làm việc 8 năm qua các công ty Grab & Shopee, mình xin chia sẻ thẳng thắn về góc khuất & cơ hội ngành Thiết kế trải nghiệm người dùng:

1. Thiết kế UI/UX khác gì Thiết kế đồ họa (Graphic Design)?
- Graphic tập trung vào thẩm mỹ thị giác (Visual & Brand).
- UI/UX tập trung vào hành vi người dùng, luồng trải nghiệm (User Journey), Wireframing, Figma System & A/B Testing.

2. AI như Figma AI, Midjourney có làm UI/UX thất nghiệp?
- AI hỗ trợ tạo layout cực nhanh, nhưng KHÔNG THỂ thay thế tư duy nghiên cứu người dùng (User Research), thấu cảm khách hàng và đàm phán sản phẩm với lập trình viên (Devs).

3. Portfolio như thế nào sẽ ăn điểm tuyển dụng?
- Làm ít nhất 2 Case Study hoàn chỉnh từ bước Research -> Wireframe -> Prototype -> Usability Testing. Đừng chỉ đăng ảnh thiết kế bóng đòn vô thực!`,
    authorId: 'mentor-2',
    authorName: 'Lê Minh Trí',
    authorBadge: 'Lead UI/UX @ Grab & Shopee',
    categoryId: 'career',
    createdAt: new Date(Date.now() - 3600000 * 12),
    likes: 198,
    commentsCount: 26,
    viewsCount: 1220,
    tags: ['#UIUXDesign', '#LươngFresher', '#Figma', '#CareerPath']
  },
  {
    id: 'seed-4',
    title: 'Lộ Trình Săn Học Bổng Thạc Sĩ/Đại Học AI 100% Tại Châu Âu & Mỹ Cho Sinh Viên Năm 2-4',
    content: `Hôm nay mình xin chia sẻ kinh nghiệm chuẩn bị hồ sơ săn học bổng toàn phần (Erasmus Mundus, Fulbright, Chevening):

1. Điểm GPA (Grade Point Average):
- Đạt tối thiểu 3.2/4.0 (hoặc 8.0/10). Cố gắng duy trì điểm cao ở các môn chuyên ngành.

2. Ngoại Ngữ:
- IELTS 7.0+ (không kỹ năng nào dưới 6.5) hoặc TOEFL iBT 95+.

3. Bài luận mục đích (SOP - Statement of Purpose):
- Hãy trả lời 3 câu hỏi: Bạn là ai? Tại sao lại chọn ngành này? Bạn sẽ cống hiến gì cho cộng đồng sau khi hoàn thành học tập?

4. Hoạt động nghiên cứu / Bài báo khoa học:
- Nếu có 1 bài báo đăng ở Hội nghị quốc tế (IEEE, ACM), tỷ lệ đậu học bổng của bạn lên tới 90%!`,
    authorId: 'mentor-3',
    authorName: 'Phạm Phương Thảo',
    authorBadge: 'Fintech Director @ Momo',
    categoryId: 'scholarships',
    createdAt: new Date(Date.now() - 3600000 * 24),
    likes: 254,
    commentsCount: 42,
    viewsCount: 1690,
    tags: ['#HọcBổngChâuÂu', '#IELTS', '#ThạcSĩAI']
  },
  {
    id: 'seed-5',
    title: 'So Sánh Học CNTT Tại Bách Khoa vs. KHTN vs. FPT: Giáo Trình, Học Phí & Khả Năng Có Việc Làm Tốt?',
    content: `Chào anh chị và các bạn! Em hiện là sinh viên K66 ngành Kỹ thuật Phần mềm Bách Khoa. Xin đưa ra đánh giá khách quan dựa trên trải nghiệm cá nhân & bạn bè ở các trường:

- Bách Khoa (HUST/VNU-HCM): Giáo trình rất nặng về Toán & Lý thuyết nền tảng. Áp lực thi cử lớn nhưng sinh viên ra trường có tư duy thuật toán cực kỳ trâu bò.
- KHTN: Mạnh về nghiên cứu Khoa học máy tính, AI & Học thuật sâu.
- FPT: Giáo trình cập nhật nhanh theo doanh nghiệp, học 100% giáo trình tiếng Anh, môi trường năng động, thực tập OJT sớm từ năm 3.

Mọi người có thắc mắc gì thêm về chọn trường CNTT cứ cmt bên dưới em sẽ giải đáp nhé!`,
    authorId: 'student-1',
    authorName: 'Trần Hoàng Long',
    authorBadge: 'Sinh viên K66 Bách Khoa',
    categoryId: 'majors',
    createdAt: new Date(Date.now() - 3600000 * 36),
    likes: 167,
    commentsCount: 51,
    viewsCount: 1410,
    tags: ['#CNTT', '#BáchKhoa', '#KHTN', '#ĐạihọcFPT']
  }
];

const Community: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'top' | 'discussed'>('newest');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('majors');
  const [newPostTags, setNewPostTags] = useState('');
  
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  
  // Profile view state
  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [profileComments, setProfileComments] = useState<Comment[]>([]);
  const [profileTab, setProfileTab] = useState<'posts' | 'comments'>('posts');

  // Media states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Post detail state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'c-1',
      postId: 'seed-1',
      authorId: 'u-101',
      authorName: 'Nguyễn Văn Anh',
      authorBadge: 'Sinh viên Năm 2',
      content: 'Bài viết rất chi tiết ạ! Em đang phân vân giữa Vi mạch và AI. Thầy cho em hỏi ngành Vi mạch ở Việt Nam thì nên học trường nào tốt nhất ạ?',
      createdAt: new Date(Date.now() - 3600000),
      likes: 12
    },
    {
      id: 'c-2',
      postId: 'seed-1',
      authorId: 'mentor-1',
      authorName: 'TS. Nguyễn Hoàng Nam',
      authorBadge: 'Author',
      content: 'Chào em! Hiện tại ở VN khối trường Bách Khoa (Hà Nội/HCM), ĐH Quốc Gia và ĐH FPT đều đang mở chuyên ngành Vi mạch rất chuẩn. Em nên tập trung học tốt Toán & Tiếng Anh từ bây giờ nhé!',
      createdAt: new Date(Date.now() - 1800000),
      likes: 18
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOpacity, setVideoOpacity] = useState(0);

  // Video background fade
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId: number;
    const fadeDuration = 0.5;

    const monitorVideo = () => {
      const { currentTime, duration } = video;
      if (duration) {
        if (currentTime < fadeDuration) {
          setVideoOpacity(currentTime / fadeDuration);
        } else if (currentTime > duration - fadeDuration) {
          setVideoOpacity((duration - currentTime) / fadeDuration);
        } else {
          setVideoOpacity(1);
        }
      }
      rafId = requestAnimationFrame(monitorVideo);
    };

    rafId = requestAnimationFrame(monitorVideo);

    const handleEnded = () => {
      setVideoOpacity(0);
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(console.error);
      }, 100);
    };

    video.addEventListener('ended', handleEnded);

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Fetch Firestore Realtime Data (Merge with Seed Data)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    const qPosts = query(collection(db, 'forumPosts'), orderBy('createdAt', 'desc'));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      const firebasePosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      if (firebasePosts.length > 0) {
        // Merge firebase posts with initial seeds without duplicates
        const existingIds = new Set(firebasePosts.map(p => p.id));
        const filteredSeeds = INITIAL_POSTS.filter(s => !existingIds.has(s.id));
        setPosts([...firebasePosts, ...filteredSeeds]);
      }
    }, (error) => { 
      console.log("Firebase snapshot notice (using rich local fallback state):", error.message); 
    });

    return () => {
      unsubPosts();
      unsubAuth();
    };
  }, []);


  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    const qNotifs = query(collection(db, 'forumNotifications'), where('recipientId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
      const fbNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(fbNotifs);
    }, (error) => {
      console.log("Firebase notifications error:", error.message);
    });
    return () => unsubNotifs();
  }, [currentUser]);


  useEffect(() => {
    const qComments = query(collection(db, 'forumComments'), orderBy('createdAt', 'asc'));
    const unsubComments = onSnapshot(qComments, (snapshot) => {
      const fbComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date() } as Comment));
      if (fbComments.length > 0) {
        setComments(prev => {
          const prevMap = new Map(prev.map(c => [c.id, c]));
          fbComments.forEach(c => prevMap.set(c.id, c));
          return Array.from(prevMap.values());
        });
      }
    }, (error) => {
      console.log("Firebase snapshot notice (using rich local fallback state):", error.message);
    });
    return () => unsubComments();
  }, []);

  // Like Toggle Function
  const handleToggleLike = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlyLiked = likedPosts[postId];
    setLikedPosts(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
    
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: (p.likes || 0) + (isCurrentlyLiked ? -1 : 1)
        };
      }
      return p;
    }));

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? {
        ...prev,
        likes: (prev.likes || 0) + (isCurrentlyLiked ? -1 : 1)
      } : null);
    }
  };

  // Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const parsedTags = newPostTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => t.startsWith('#') ? t : `#${t}`);

    const newPostObj: Post = {
      id: 'post-' + Date.now(),
      title: newPostTitle,
      content: newPostContent,
      categoryId: newPostCategory || 'majors',
      authorId: currentUser?.uid || 'guest-' + Date.now(),
      authorName: currentUser?.displayName || 'Bạn (Sinh viên)',
      authorBadge: 'Thành viên mới',
      createdAt: new Date(),
      image: selectedImage || undefined,
      audio: audioBlob || undefined,
      likes: 1,
      commentsCount: 0,
      viewsCount: 1,
      tags: parsedTags.length > 0 ? parsedTags : ['#DiễnĐànHọcTập', '#ĐịnhHướng2026']
    };

    // Push to local state first
    setPosts(prev => [newPostObj, ...prev]);
    setIsCreateModalOpen(false);
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostTags('');
    setSelectedImage(null);
    setAudioBlob(null);

    // Sync to Firebase if auth
    if (auth.currentUser) {
      try {
        await addDoc(collection(db, 'forumPosts'), {
          title: newPostTitle,
          content: newPostContent,
          categoryId: newPostCategory,
          authorId: auth.currentUser.uid,
          authorName: auth.currentUser.displayName || 'Anonymous',
          authorBadge: 'Thành viên',
          createdAt: serverTimestamp(),
          image: selectedImage,
          audio: audioBlob,
          likes: 1,
          commentsCount: 0,
          viewsCount: 1,
          tags: parsedTags
        });
      } catch (err) {
        console.log("Post saved locally.");
      }
    }
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !newComment.trim()) return;

    const newCmtObj: Comment = {
      id: 'cmt-' + Date.now(),
      postId: selectedPost.id,
      content: newComment,
      authorId: currentUser?.uid || 'guest-' + Date.now(),
      authorName: currentUser?.displayName || 'Bạn (Thành viên)',
      authorAvatar: currentUser?.photoURL || undefined,
      authorBadge: 'Thành viên thảo luận',
      createdAt: new Date(),
      likes: 0,
      replyToId: replyingTo?.id,
      replyToName: replyingTo?.authorName
    };

    setComments(prev => [...prev, newCmtObj]);

    try {
      await addDoc(collection(db, 'forumComments'), {
        postId: selectedPost.id,
        content: newComment,
        authorId: currentUser?.uid || 'guest-' + Date.now(),
        authorName: currentUser?.displayName || 'Bạn (Thành viên)',
        authorAvatar: currentUser?.photoURL || null,
        authorBadge: 'Thành viên thảo luận',
        createdAt: serverTimestamp(),
        likes: 0,
        replyToId: replyingTo?.id || null,
        replyToName: replyingTo?.authorName || null
      });
    } catch(e) {
      console.error(e);
    }

    setNewComment('');
    setReplyingTo(null);

    // Send Notification if applicable
    if (currentUser && currentUser.uid) {
      try {
        let recipientId = null;
        let type = '';
        
        if (replyingTo && replyingTo.authorId !== currentUser.uid) {
          recipientId = replyingTo.authorId;
          type = 'comment_reply';
        } else if (!replyingTo && selectedPost.authorId !== currentUser.uid) {
          recipientId = selectedPost.authorId;
          type = 'post_reply';
        }

        if (recipientId) {
          await addDoc(collection(db, 'forumNotifications'), {
            recipientId,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || 'Một thành viên',
            senderAvatar: currentUser.photoURL || null,
            type,
            postId: selectedPost.id,
            content: newComment.substring(0, 50) + (newComment.length > 50 ? '...' : ''),
            createdAt: serverTimestamp(),
            read: false
          });
        }
      } catch (err) {
        console.error("Failed to send notification", err);
      }
    }

    // Update comment count on post
    setPosts(prev => prev.map(p => {
      if (p.id === selectedPost.id) {
        return { ...p, commentsCount: (p.commentsCount || 0) + 1 };
      }
      return p;
    }));

    if (selectedPost) {
      setSelectedPost(prev => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null);
    }
  };

  // Profile View Loader
  const openProfile = (userId: string, name: string, avatar?: string) => {
    setViewedProfile({ 
      id: userId, 
      displayName: name, 
      photoURL: avatar,
      bio: 'Thành viên hăng hái chia sẻ kinh nghiệm học tập & định hướng nghề nghiệp.',
      createdAt: new Date() 
    });
    setProfilePosts(posts.filter(p => p.authorId === userId));
  };

  // Audio Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlobObj = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => setAudioBlob(reader.result as string);
        reader.readAsDataURL(audioBlobObj);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };


  // Filtered & Sorted Posts
  const displayPosts = posts
    .filter(p => {
      if (selectedCategory && p.categoryId !== selectedCategory) return false;
      if (selectedTag && !p.tags?.includes(selectedTag)) return false;
      
      if (timeFilter !== 'all') {
        const postDate = new Date(p.createdAt).getTime();
        const now = Date.now();
        if (timeFilter === 'today' && now - postDate > 24 * 60 * 60 * 1000) return false;
        if (timeFilter === 'week' && now - postDate > 7 * 24 * 60 * 60 * 1000) return false;
        if (timeFilter === 'month' && now - postDate > 30 * 24 * 60 * 60 * 1000) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q) ||
          p.tags?.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (sortBy === 'top') return (b.likes || 0) - (a.likes || 0);
      if (sortBy === 'discussed') return (b.commentsCount || 0) - (a.commentsCount || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Extract all unique tags
  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || []))).slice(0, 10);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white selection:bg-black selection:text-white font-sans text-gray-900">
      {/* Background Video Layer */}
      <div 
        className="fixed z-0 pointer-events-none overflow-hidden"
        style={{ top: '240px', inset: 'auto 0 0 0', height: 'calc(100vh - 240px)' }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ opacity: videoOpacity }}
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white" />
      </div>

      {/* Top Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex justify-between items-center border-b border-black/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedPost(null); setSelectedCategory(null); }}>
          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shadow-md">
            <Users size={20} />
          </div>
          <div>
            <span className="text-xl tracking-tight font-extrabold text-black block leading-none">
              StudyWithMe FORUM
            </span>
            <span className="text-[10px] uppercase font-mono text-gray-500 tracking-widest font-bold">
              Diễn Đàn Học Thuật & Định Hướng Nghề Nghiệp
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-gray-600">
          <button onClick={() => setSelectedCategory(null)} className="hover:text-black transition-colors">Tất cả bài viết</button>
          <button onClick={() => setSelectedCategory('majors')} className="hover:text-black transition-colors">Định hướng ngành</button>
          <button onClick={() => setSelectedCategory('scholarships')} className="hover:text-black transition-colors">Săn học bổng</button>
          <button onClick={() => setSelectedCategory('mentors')} className="hover:text-black transition-colors">Góc Cố Vấn</button>
        </div>

        <div className="flex gap-2">

          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative bg-gray-100 hover:bg-gray-200 text-black p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer border border-gray-200"
              >
                <Bell size={18} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 origin-top-right"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-black">Thông báo</h3>
                      {notifications.filter(n => !n.read).length > 0 && (
                        <button 
                          onClick={async () => {
                            // Mark all as read
                            const unreadNotifs = notifications.filter(n => !n.read);
                            for (const notif of unreadNotifs) {
                              try {
                                await setDoc(doc(db, 'forumNotifications', notif.id), { read: true }, { merge: true });
                              } catch (e) {}
                            }
                          }}
                          className="text-[10px] font-bold text-gray-500 hover:text-black transition-colors cursor-pointer"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-500 italic">
                          Chưa có thông báo nào.
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id}
                            onClick={async () => {
                              if (!notif.read) {
                                try {
                                  await setDoc(doc(db, 'forumNotifications', notif.id), { read: true }, { merge: true });
                                } catch (e) {}
                              }
                              const targetPost = posts.find(p => p.id === notif.postId);
                              if (targetPost) {
                                setSelectedPost(targetPost);
                                setIsNotificationsOpen(false);
                              }
                            }}
                            className={`p-4 border-b border-gray-50 transition-colors cursor-pointer flex gap-3 hover:bg-gray-50 ${!notif.read ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className="relative shrink-0">
                              {notif.senderAvatar ? (
                                <img src={notif.senderAvatar} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                                  {notif.senderName[0]}
                                </div>
                              )}
                              {!notif.read && (
                                <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-black leading-relaxed">
                                <span className="font-bold">{notif.senderName}</span>
                                {notif.type === 'post_reply' ? ' đã bình luận về bài viết của bạn: ' : ' đã phản hồi bình luận của bạn: '}
                                <span className="text-gray-600">"{notif.content}"</span>
                              </p>
                              <p className="text-[10px] font-mono text-gray-400 mt-1">
                                {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString('vi-VN') : 'Vừa xong'}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          {currentUser && (
            <button
              onClick={() => {
                setEditName(currentUser.displayName || '');
                setEditAvatarUrl(currentUser.photoURL || '');
                setIsMyProfileOpen(true);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border border-gray-200"
            >
              <User size={16} />
              <span className="hidden sm:inline">Hồ Sơ</span>
            </button>
          )}
          <button 
            onClick={() => currentUser ? setIsCreateModalOpen(true) : signInWithGoogle().catch(() => setIsCreateModalOpen(true))}
            className="bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:scale-105 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Tạo Thảo Luận Mới</span>
          </button>
        </div>
      </nav>

      {/* Hero Header Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-800">
          <Sparkles size={14} className="text-amber-500 animate-pulse" />
          <span>Cộng Đồng Sinh Viên & Chuyên Gia Toàn Quốc</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-black max-w-4xl mx-auto leading-tight">
          Hỏi Đáp Thực Chuyện, Kết Nối <span className="underline decoration-amber-400 decoration-4">Cố Vấn</span> & Kiến Tạo Sự Nghiệp
        </h1>

        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Nơi chia sẻ góc nhìn chân thực nhất về ngành học Đại học, cẩm nang săn học bổng, phỏng vấn doanh nghiệp & lộ trình bứt phá cùng các Mentor hàng đầu.
        </p>

        {/* Global Search Bar */}
        <div className="max-w-2xl mx-auto relative pt-2">
          <Search className="absolute left-4 top-5 text-gray-400" size={18} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tra cứu bài viết, từ khóa, khối thi (vd: AI, IELTS, Bách Khoa, Khối A00)..."
            className="w-full bg-white border border-gray-300 shadow-xl rounded-2xl py-3.5 pl-11 pr-24 text-xs sm:text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-4 text-xs text-gray-400 hover:text-black font-semibold bg-gray-100 px-2.5 py-1 rounded-lg"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </section>

      {/* Main Forum Body */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR: Categories & Trending Tags */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center justify-between">
                <span>Chuyên Mục Thảo Luận</span>
                <Filter size={14} />
              </h3>

              <div className="space-y-1">
                <button 
                  onClick={() => { setSelectedCategory(null); setSelectedTag(null); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    !selectedCategory && selectedCategory !== 'saved' ? 'bg-black text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>Tất cả bài viết</span>
                  <span className="text-[10px] opacity-70 font-mono font-bold">{posts.length}</span>
                </button>
                <button 
                  onClick={() => { setSelectedCategory('saved'); setSelectedTag(null); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    selectedCategory === 'saved' ? 'bg-black text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Bookmark size={14} /> Đã lưu</span>
                  <span className="text-[10px] opacity-70 font-mono font-bold">{savedPostIds.size}</span>
                </button>

                {categories.map(cat => {
                  const count = posts.filter(p => p.categoryId === cat.id).length;
                  const isSel = selectedCategory === cat.id;
                  return (
                    <button 
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setSelectedTag(null); }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        isSel ? 'bg-black text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{cat.title}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSel ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trending Tags Widget */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Flame size={15} className="text-orange-500" />
                <span>Thẻ Nổi Bật (Tags)</span>
              </h3>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                      selectedTag === tag 
                        ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-sm' 
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Forum Statistics Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-900 to-black text-white space-y-3 shadow-xl">
              <span className="text-[10px] uppercase font-mono font-bold text-amber-300 tracking-wider block">
                Chỉ Số Diễn Đàn 2026
              </span>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                  <span className="text-lg font-bold font-mono text-white block">{posts.length}</span>
                  <span className="text-[10px] text-gray-300">Bài thảo luận</span>
                </div>
                <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                  <span className="text-lg font-bold font-mono text-emerald-400 block">{allTags.length}</span>
                  <span className="text-[10px] text-gray-300">Chủ đề</span>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN CENTER: Posts List OR Detail View */}
          <main className="lg:col-span-6 space-y-5">
            <AnimatePresence mode="wait">
              {selectedPost ? (
                /* DETAIL VIEW OF SELECTED THREAD */
                <motion.div 
                  key="post-detail"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xl space-y-6"
                >
                  <button 
                    onClick={() => setSelectedPost(null)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                    <span>&larr; Quay lại danh sách thảo luận</span>
                  </button>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => openProfile(selectedPost.authorId, selectedPost.authorName, selectedPost.authorAvatar)}
                      >
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-black font-extrabold flex items-center justify-center text-sm shadow-md">
                          {selectedPost.authorName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-black group-hover:text-amber-600 transition-colors">
                              {selectedPost.authorName}
                            </span>
                            <CheckCircle2 size={14} className="text-sky-500 shrink-0" />
                          </div>
                          <span className="text-[11px] font-mono text-gray-500 block">
                            {getPrimaryTitle(selectedPost.authorId, posts, comments)}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        {categories.find(c => c.id === selectedPost.categoryId)?.title || 'Chủ đề'}
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-black leading-tight">
                      {selectedPost.title}
                    </h1>

                    {/* Post Tags */}
                    {selectedPost.tags && selectedPost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedPost.tags.map((tg, idx) => (
                          <span key={idx} className="text-[10px] font-mono font-bold bg-amber-400/15 text-amber-800 border border-amber-300 px-2 py-0.5 rounded">
                            {tg}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="prose prose-sm sm:prose-base prose-amber max-w-none prose-p:leading-relaxed text-gray-800 font-sans py-2 border-y border-gray-100"><Markdown remarkPlugins={[remarkGfm]}>{selectedPost.content}</Markdown></div>

                    {selectedPost.image && (
                      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-md">
                        <img src={selectedPost.image} alt="Post Attachment" className="w-full h-auto max-h-[450px] object-cover" />
                      </div>
                    )}

                    {selectedPost.audio && (
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-3">
                        <Mic size={20} className="text-amber-500" />
                        <audio controls src={selectedPost.audio} className="flex-1 h-8" />
                      </div>
                    )}

                    {/* Interaction Bar */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={(e) => { triggerHaptic('light'); handleToggleLike(selectedPost.id, e); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          likedPosts[selectedPost.id]
                            ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        <Heart size={16} className={likedPosts[selectedPost.id] ? 'fill-rose-500 text-rose-500' : ''} />
                        <span>Thích ({selectedPost.likes || 0})</span>
                      </button>

                      <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare size={14} /> {comments.length} phản hồi
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={14} /> {selectedPost.viewsCount || 100} lượt xem
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          const newSaved = new Set(savedPostIds);
                          if (newSaved.has(selectedPost.id)) newSaved.delete(selectedPost.id);
                          else newSaved.add(selectedPost.id);
                          setSavedPostIds(newSaved);
                        }}
                        className={`ml-auto flex items-center gap-1 font-medium cursor-pointer transition-colors ${savedPostIds.has(selectedPost.id) ? 'text-amber-500' : 'text-gray-500 hover:text-black'}`}
                      >
                        <Bookmark size={14} fill={savedPostIds.has(selectedPost.id) ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                        }}
                        className="p-1 text-gray-500 hover:text-black transition-colors cursor-pointer"
                        title="Chia sẻ"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>

                    {/* COMMENTS SECTION */}
                    <div className="pt-6 border-t border-gray-200 space-y-5">
                      <h3 className="text-base font-bold text-black flex items-center gap-2">
                        <MessageSquare size={18} className="text-amber-500" />
                        Thảo luận trực tiếp ({comments.length})
                      </h3>


                      {/* Comment Form */}
                      <form onSubmit={handleAddComment} className="space-y-3">
                        {replyingTo && (
                          <div className="flex items-center justify-between bg-amber-50 text-amber-800 text-xs px-3 py-2 rounded-lg border border-amber-200">
                            <span>Đang phản hồi <strong>{replyingTo.authorName}</strong></span>
                            <button type="button" onClick={() => setReplyingTo(null)} className="text-amber-800 hover:text-black cursor-pointer">
                              <X size={14} />
                            </button>
                          </div>
                        )}
                        <textarea 
                          ref={commentInputRef}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Nhập câu hỏi hoặc chia sẻ góc nhìn của bạn..."
                          rows={3}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-xs sm:text-sm text-black placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none"
                        />
                        <div className="flex justify-end">
                          <button 
                            type="submit"
                            className="bg-black text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer flex items-center gap-2"
                          >
                            <Send size={14} />
                            <span>Gửi bình luận</span>
                          </button>
                        </div>
                      </form>


                      {/* Comment Feed */}
                      <div className="space-y-3 pt-2">
                        {comments.filter(c => c.postId === selectedPost.id).map(c => (
                          <div key={c.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {c.authorAvatar ? (
                                  <img src={c.authorAvatar} alt="" className="w-7 h-7 rounded-full object-cover shadow-sm border border-gray-200" />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center">
                                    {c.authorName[0]}
                                  </div>
                                )}
                                <div>
                                  <span className="text-xs font-bold text-black block">{c.authorName}</span>
                                  <span className="text-[10px] font-mono text-gray-500">{getPrimaryTitle(c.authorId, posts, comments)}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-gray-400">vừa xong</span>
                            </div>
                            <div className="pl-9 space-y-1">
                              {c.replyToName && (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 inline-block mb-1">
                                  @{c.replyToName}
                                </span>
                              )}
                              <p className="text-xs text-gray-800 leading-relaxed font-sans">
                                {c.content}
                              </p>
                              <div className="flex items-center gap-3 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo(c);
                                    setTimeout(() => commentInputRef.current?.focus(), 100);
                                  }}
                                  className="text-[10px] font-bold text-gray-500 hover:text-black transition-colors cursor-pointer"
                                >
                                  Phản hồi
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* POSTS LIST VIEW */
                <motion.div 
                  key="posts-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Sorting & Filter Controls Header */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">
                        Sắp xếp:
                      </span>
                      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                        {[
                          { id: 'newest', label: 'Mới nhất' },
                          { id: 'top', label: '🔥 Thích nhiều' },
                          { id: 'discussed', label: '💬 Thảo luận' }
                        ].map(st => (
                          <button
                            key={st.id}
                            onClick={() => setSortBy(st.id as typeof sortBy)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              sortBy === st.id ? 'bg-white text-black shadow-sm font-bold' : 'text-gray-600 hover:text-black'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <span className="text-xs font-mono text-gray-500 font-bold">
                      Hiển thị {displayPosts.length} bài thảo luận
                    </span>
                  </div>

                  {/* Feed Items */}
                  {displayPosts.length > 0 ? (
                    displayPosts.map(post => (
                      <div 
                        key={post.id}
                        onClick={() => { triggerHaptic('light'); setSelectedPost(post); }}
                        className={`bg-white p-5 sm:p-6 rounded-2xl border transition-all hover:shadow-lg cursor-pointer space-y-3 relative group ${
                          post.isPinned ? 'border-amber-300 bg-amber-50/20 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {post.isPinned && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-800 text-[10px] font-bold font-mono border border-amber-300">
                            <Pin size={12} className="rotate-45" />
                            <span>ĐÃ GHIM BỞI BQT</span>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={(e) => { e.stopPropagation(); openProfile(post.authorId, post.authorName, post.authorAvatar); }}
                              className="w-10 h-10 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
                            >
                              {post.authorName[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-black group-hover:text-amber-600 transition-colors">
                                  {post.authorName}
                                </span>
                                <CheckCircle2 size={13} className="text-sky-500 shrink-0" />
                              </div>
                              <span className="text-[10px] font-mono text-gray-500 block">
                                {getPrimaryTitle(post.authorId, posts, comments)}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                            {categories.find(c => c.id === post.categoryId)?.title || 'Chủ đề'}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-black group-hover:text-amber-600 transition-colors leading-snug">
                          {post.title}
                        </h3>

                        <div className="prose prose-sm prose-amber max-w-none prose-p:leading-relaxed text-gray-600 line-clamp-2"><Markdown remarkPlugins={[remarkGfm]}>{post.content}</Markdown></div>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {post.tags.map((t, idx) => (
                              <span key={idx} className="text-[10px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-medium">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer stats */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={(e) => { triggerHaptic('light'); handleToggleLike(post.id, e); }}
                              className={`flex items-center gap-1 font-semibold transition-colors ${likedPosts[post.id] ? 'text-rose-600 font-bold' : 'hover:text-black'}`}
                            >
                              <Heart size={14} className={likedPosts[post.id] ? 'fill-rose-500 text-rose-500' : ''} />
                              <span>{post.likes || 0}</span>
                            </button>

                            <span className="flex items-center gap-1 font-medium hover:text-black">
                              <MessageSquare size={14} />
                              <span>{post.commentsCount || 0} bình luận</span>
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const newSaved = new Set(savedPostIds);
                                if (newSaved.has(post.id)) newSaved.delete(post.id);
                                else newSaved.add(post.id);
                                setSavedPostIds(newSaved);
                              }}
                              className={`flex items-center gap-1 font-medium hover:text-black cursor-pointer ${savedPostIds.has(post.id) ? 'text-amber-500' : ''}`}
                            >
                              <Bookmark size={14} fill={savedPostIds.has(post.id) ? "currentColor" : "none"} />
                              <span>Lưu</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(window.location.href);
                              }}
                              className="flex items-center gap-1 font-medium hover:text-black cursor-pointer ml-auto"
                              title="Chia sẻ"
                            >
                              <Share2 size={14} />
                            </button>
                          </div>

                          <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Đọc bài viết &rarr;
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
                      <BookOpen size={36} className="mx-auto text-gray-300" />
                      <p className="text-xs text-gray-500 font-medium">Không tìm thấy bài thảo luận phù hợp.</p>
                      <button 
                        onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSelectedTag(null); }}
                        className="text-xs font-bold text-black underline"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* RIGHT SIDEBAR: Leaderboard & Community Guidelines */}
          <aside className="lg:col-span-3 space-y-6">
            
            {/* Daily Check-in Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-2xl shadow-sm text-white relative overflow-hidden group cursor-pointer hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/30">
                  <Flame size={24} className="text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1">Điểm danh nhận Quà!</h3>
                  <p className="text-xs text-white/80 leading-relaxed mb-3">
                    Đăng nhập liên tục để nhận XP và huy hiệu độc quyền hàng tuần.
                  </p>
                  <button className="px-4 py-1.5 bg-white text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm hover:scale-105 transition-transform">
                    Điểm danh ngay (+50 XP)
                  </button>
                </div>
              </div>
            </div>

            {/* Top Contributors Leaderboard */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Award size={16} className="text-amber-500" />
                <span>Bảng Vàng Mentor Tích Cực</span>
              </h3>

              <div className="space-y-3">
                {[
                  { name: 'TS. Nguyễn Hoàng Nam', role: 'Senior AI Specialist', pts: '1,420 điểm', avatar: 'N' },
                  { name: 'Lê Minh Trí', role: 'Lead UI/UX @ Grab', pts: '1,180 điểm', avatar: 'T' },
                  { name: 'Phạm Phương Thảo', role: 'Fintech Director', pts: '950 điểm', avatar: 'P' },
                  { name: 'Trần Hoàng Long', role: 'Sinh viên K66 Bách Khoa', pts: '820 điểm', avatar: 'L' }
                ].map((mb, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] font-mono ${
                        idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-gray-300 text-black' : 'bg-orange-200 text-black'
                      }`}>
                        0{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-black block leading-none">{mb.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{mb.role}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {mb.pts}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Forum Guidelines Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Quy Tắc Văn Hóa Diễn Đàn</span>
              </h3>

              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4 font-sans leading-relaxed">
                <li>Tôn trọng các góc nhìn cá nhân và bình luận văn minh.</li>
                <li>Không đăng nội dung quảng cáo rác, thông tin sai sự thật.</li>
                <li>Khuyến khích chia sẻ bài viết có dẫn chứng & trải nghiệm thực tế.</li>
              </ul>
            </div>
          </aside>

        </div>
      </section>

      {/* CREATE NEW THREAD MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 relative shadow-2xl space-y-5"
            >
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-black p-1 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-wider block">
                  Đóng Góp Cho Cộng Đồng
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-black">
                  Tạo Bài Thảo Luận Mới
                </h2>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tiêu đề thảo luận
                  </label>
                  <input 
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="VD: [Hỏi Đáp] Nên chọn ngành AI hay Lập trình Web năm 2026?"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Chuyên mục
                    </label>
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Thẻ tags (Phân cách bằng dấu phẩy)
                    </label>
                    <input 
                      type="text"
                      value={newPostTags}
                      onChange={(e) => setNewPostTags(e.target.value)}
                      placeholder="VD: #AI, #BáchKhoa, #Lương"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nội dung chi tiết (Hỗ trợ Markdown)
                  </label>
                  <div className="flex items-center gap-2 mb-2 p-1.5 bg-gray-100 rounded-lg border border-gray-200">
                    <button type="button" onClick={() => setNewPostContent(prev => prev + '**In đậm** ')} className="p-1.5 hover:bg-white rounded text-gray-600 hover:text-black transition-colors" title="In đậm"><span className="font-bold">B</span></button>
                    <button type="button" onClick={() => setNewPostContent(prev => prev + '*In nghiêng* ')} className="p-1.5 hover:bg-white rounded text-gray-600 hover:text-black transition-colors" title="In nghiêng"><span className="italic font-serif">I</span></button>
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <button type="button" onClick={() => setNewPostContent(prev => prev + '\n- Danh sách ')} className="p-1.5 hover:bg-white rounded text-gray-600 hover:text-black transition-colors" title="Danh sách"><ListIcon size={14} /></button>
                    <button type="button" onClick={() => setNewPostContent(prev => prev + '\n> Trích dẫn ')} className="p-1.5 hover:bg-white rounded text-gray-600 hover:text-black transition-colors" title="Trích dẫn"><MessageSquare size={14} /></button>
                    <button type="button" onClick={() => setNewPostContent(prev => prev + '\n```\nCode\n```\n')} className="p-1.5 hover:bg-white rounded text-gray-600 hover:text-black transition-colors" title="Code"><span className="font-mono text-xs">{"</>"}</span></button>
                  </div>

                  <textarea 
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Viết chi tiết thắc mắc hoặc góc nhìn của bạn để nhận tư vấn từ Mentor và các bạn sinh viên..."
                    required
                    rows={5}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex gap-2">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700">
                        <ImageIcon size={14} /> Tải ảnh
                      </div>
                    </label>

                    <button 
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Mic size={14} />
                      <span>{isRecording ? 'Đang ghi âm...' : 'Ghi âm'}</span>
                    </button>
                  </div>

                  <button 
                    type="submit"
                    className="bg-black text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer shadow-lg"
                  >
                    Đăng Thảo Luận Mới
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      
      {/* MY PROFILE MODAL */}
      <AnimatePresence>
        {isMyProfileOpen && currentUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 relative shadow-2xl space-y-6">
              <button 
                onClick={() => setIsMyProfileOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black cursor-pointer"
              >
                <X size={20} />
              </button>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-black border-b border-gray-100 pb-2">
                  Hồ Sơ Của Bạn
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Ảnh đại diện (URL)
                  </label>
                  <input 
                    type="text"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  {editAvatarUrl && (
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-xs text-gray-500">Xem trước:</span>
                      <img src={editAvatarUrl} alt="Preview" className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tên hiển thị
                  </label>
                  <input 
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                  <Award size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="w-full">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Danh hiệu hiện tại</h4>
                    <p className="text-sm font-bold text-amber-900 mt-1">
                      {getPrimaryTitle(currentUser.uid, posts, comments)}
                    </p>
                    <p className="text-[10px] text-amber-600/70 mt-1 mb-3 border-b border-amber-200/50 pb-2">
                      Đăng thêm bài thảo luận và bình luận để mở khóa huy hiệu mới!
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getCommunityBadges(currentUser.uid, posts, comments).map(badge => (
                        <div key={badge.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${badge.color}`} title={badge.description}>
                          <span className="text-[10px] font-bold">{badge.name}</span>
                        </div>
                      ))}
                      {getCommunityBadges(currentUser.uid, posts, comments).length === 0 && (
                        <span className="text-xs text-amber-600/50 italic">Chưa có huy hiệu nào</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsMyProfileOpen(false)}
                  className="bg-gray-100 text-gray-700 px-5 py-2 rounded-full text-xs font-bold cursor-pointer hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    try {
                      await updateProfile(currentUser, {
                        displayName: editName,
                        photoURL: editAvatarUrl
                      });
                      setIsMyProfileOpen(false);
                      alert("Cập nhật hồ sơ thành công!");
                    } catch(err) {
                      console.error("Error updating profile", err);
                      alert("Có lỗi xảy ra khi cập nhật!");
                    }
                  }}
                  className="bg-black text-white px-5 py-2 rounded-full text-xs font-bold cursor-pointer hover:bg-gray-800"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROFILE VIEW MODAL */}
      <AnimatePresence>
        {viewedProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 relative shadow-2xl space-y-4">
              <button 
                onClick={() => setViewedProfile(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-black text-white font-extrabold flex items-center justify-center text-xl shadow-lg">
                    {viewedProfile.displayName[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black">{viewedProfile.displayName}</h3>
                    <p className="text-xs text-amber-600 font-mono font-bold mt-1">
                      {getPrimaryTitle(viewedProfile.id, posts, comments)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newFollowed = new Set(followedUserIds);
                    if (newFollowed.has(viewedProfile.id)) newFollowed.delete(viewedProfile.id);
                    else newFollowed.add(viewedProfile.id);
                    setFollowedUserIds(newFollowed);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
                    followedUserIds.has(viewedProfile.id) 
                      ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' 
                      : 'bg-black text-white border-black hover:bg-gray-800'
                  }`}
                >
                  {followedUserIds.has(viewedProfile.id) ? 'Đang theo dõi' : 'Theo dõi'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <span className="text-[10px] text-gray-500 uppercase font-bold w-full mb-1">Huy hiệu thành tựu</span>
                {getCommunityBadges(viewedProfile.id, posts, comments).map(badge => (
                  <div key={badge.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${badge.color}`} title={badge.description}>
                    <span className="text-[10px] font-bold">{badge.name}</span>
                  </div>
                ))}
                {getCommunityBadges(viewedProfile.id, posts, comments).length === 0 && (
                  <span className="text-xs text-gray-400 italic">Chưa có huy hiệu nào</span>
                )}
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 leading-relaxed">
                {viewedProfile.bio}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewedProfile(null)}
                  className="bg-black text-white px-5 py-2 rounded-full text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AIChat />
    </div>
  );
};

export default Community;
