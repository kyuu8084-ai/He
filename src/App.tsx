/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, X, ArrowRight, CheckCircle2, Video as VideoIcon, Maximize, Minimize, Lock, Globe, KeyRound, Sparkles, Plus, LogIn, Users, Shield, Loader2 } from 'lucide-react';
import { triggerHaptic } from './lib/haptics';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { useForm, ValidationError } from '@formspree/react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './lib/firebase';
import DustMotes from './components/DustMotes';
import StudyRoom from './components/StudyRoom';
import Community from './components/Community';
import Dashboard from './components/Dashboard';
import Resources from './components/Resources';
import CareerGuidance from './components/CareerGuidance';
import { MusicPlayer } from './components/MusicPlayer';
import DailyInspiration from './components/DailyInspiration';
import CommandPalette from './components/CommandPalette';
import Entertainment from './components/Entertainment';
import YouTubePlayer from './components/YouTubePlayer';

const VIDEOS = [
  {
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4',
    label: 'Golden Hour'
  },
  {
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_092026_dd05b805-ea0f-40b2-8c52-332b88502592.mp4',
    label: 'Still Water'
  },
  {
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081042_df7202bf-bd80-4b2b-bbc6-1f09ba2870e9.mp4',
    label: 'Deep Woods'
  },
  {
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_080959_4cac5234-3573-464e-a5b7-76b94b8a7d61.mp4',
    label: 'Quiet Dawn'
  }
];

const NAV_LINKS = ["How It Works", "Features", "Pricing", "Community"];

const TRANSLATIONS = {
  en: {
    nav: ["Career Orientation", "Resources", "Community", "Entertainment"],
    getStarted: "Start Studying",
    badge: "Join 50,000+ students mastering deep focus",
    heading: ["Master Your Focus,", "Study Together"],
    subtext: "Join thousands of students in immersive, cinematic study environments. Protect your presence, boost productivity, and reach your academic goals with intention.",
    placeholder: "Your Student Email",
    cta: "Join the Waitlist",
    stats: ["500+ Study Rooms", "50,000+ Students", "Virtual Library", "Deep Focus Tools"],
    videos: ["Golden Hour", "Library Silence", "Study Garden", "Quiet Dawn"],
    successTitle: "You're In!",
    success: "Check your inbox for your study room invitation."
  },
  vi: {
    nav: ["Định hướng nghề nghiệp", "Tài nguyên", "Cộng đồng", "Giải trí"],
    getStarted: "Bắt đầu học",
    badge: "Hơn 50.000 sinh viên đang cùng nhau chinh phục mục tiêu",
    heading: ["Làm chủ sự tập trung,", "Học tập cùng nhau"],
    subtext: "Tham gia cùng hàng ngàn sinh viên trong các môi trường học tập sống động. Bảo vệ sự hiện diện, tăng năng suất và đạt được mục tiêu học tập một cách có chủ đích.",
    placeholder: "Email sinh viên của bạn",
    cta: "Đăng ký ngay",
    stats: ["500+ Phòng học", "50.000+ Sinh viên", "Thư viện ảo", "Công cụ học sâu"],
    videos: ["Giờ vàng", "Thư viện tĩnh", "Vườn học tập", "Bình minh tĩnh lặng"],
    successTitle: "Thành công!",
    success: "Hãy kiểm tra hộp thư để nhận lời mời vào phòng học."
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'community' | 'dashboard' | 'resources' | 'career' | 'entertainment'>('landing');
  const [activeVideo, setActiveVideo] = useState(() => {
    const saved = localStorage.getItem('preferred_video');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'vi'>(() => {
    const saved = localStorage.getItem('preferred_language');
    return (saved === 'en' || saved === 'vi') ? saved : 'vi';
  });
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState("main-study-hall");
  const [roomInitialPin, setRoomInitialPin] = useState<string | undefined>(undefined);
  const [roomIsPrivateCreation, setRoomIsPrivateCreation] = useState(false);
  const [isRoomSelectModalOpen, setIsRoomSelectModalOpen] = useState(false);

  // Room modal form state
  const [selectedRoomTab, setSelectedRoomTab] = useState<'community' | 'private'>('community');
  const [customPublicRoom, setCustomPublicRoom] = useState('');
  const [privateMode, setPrivateMode] = useState<'create' | 'join'>('create');
  const [createRoomName, setCreateRoomName] = useState('');
  const [createRoomPin, setCreateRoomPin] = useState('');
  const [joinRoomName, setJoinRoomName] = useState('');
  const [joinRoomPin, setJoinRoomPin] = useState('');
  const [roomModalError, setRoomModalError] = useState<string | null>(null);
  const [isVerifyingRoom, setIsVerifyingRoom] = useState(false);
  const [verifyingAction, setVerifyingAction] = useState<'main' | 'custom' | 'create' | 'join' | null>(null);

  const handleEnterRoom = async (
    roomIdToJoin: string, 
    pin?: string, 
    isPrivateCreate?: boolean,
    actionType?: 'main' | 'custom' | 'create' | 'join'
  ) => {
    const cleanRoomId = roomIdToJoin.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (!cleanRoomId) {
      setRoomModalError(language === 'vi' ? 'Vui lòng nhập tên phòng hợp lệ' : 'Please enter a valid room ID');
      return;
    }

    const trimmedPin = pin ? pin.trim() : '';

    if (isPrivateCreate && !trimmedPin) {
      setRoomModalError(language === 'vi' ? 'Vui lòng đặt mã PIN cho phòng riêng tư' : 'Please set a PIN for the private room');
      return;
    }

    setIsVerifyingRoom(true);
    setVerifyingAction(actionType || (isPrivateCreate ? 'create' : (trimmedPin ? 'join' : 'main')));
    setRoomModalError(null);

    try {
      const roomDocRef = doc(db, 'rooms', cleanRoomId);
      const docSnap = await getDoc(roomDocRef);

      if (isPrivateCreate) {
        // Creating a new private room
        if (docSnap.exists()) {
          const existingData = docSnap.data();
          // Check if this room already exists as a private room with a different PIN
          if (existingData.isPrivate && existingData.pin && existingData.pin !== trimmedPin) {
            setRoomModalError(
              language === 'vi'
                ? `Phòng "${cleanRoomId}" đã tồn tại với mã PIN khác. Vui lòng nhập đúng PIN phòng cũ hoặc đổi tên phòng.`
                : `Room "${cleanRoomId}" already exists with a different PIN. Please enter the existing PIN or pick a new room name.`
            );
            setIsVerifyingRoom(false);
            setVerifyingAction(null);
            return;
          }
        }

        // Save private room record with PIN to Firestore
        await setDoc(roomDocRef, {
          roomId: cleanRoomId,
          isPrivate: true,
          pin: trimmedPin,
          hostId: auth.currentUser?.uid || 'anon-' + Math.random().toString(36).substring(7),
          hostName: auth.currentUser?.displayName || (language === 'vi' ? 'Chủ phòng' : 'Host'),
          updatedAt: serverTimestamp(),
          createdAt: (docSnap.exists() && docSnap.data().createdAt) ? docSnap.data().createdAt : serverTimestamp()
        }, { merge: true });

      } else {
        // Joining a room (either private join tab, or custom public room, or main-study-hall)
        if (docSnap.exists()) {
          const roomData = docSnap.data();
          const isRoomPrivate = !!roomData.isPrivate || !!roomData.pin;

          if (isRoomPrivate) {
            const storedPin = String(roomData.pin || '').trim();

            if (!trimmedPin) {
              setRoomModalError(
                language === 'vi'
                  ? `Phòng "${cleanRoomId}" được bảo vệ bằng mã PIN. Vui lòng nhập mã PIN bảo mật.`
                  : `Room "${cleanRoomId}" is protected by a PIN. Please enter the security PIN.`
              );
              // Auto switch to private join tab so user can immediately type the PIN
              setSelectedRoomTab('private');
              setPrivateMode('join');
              setJoinRoomName(cleanRoomId);
              setIsVerifyingRoom(false);
              setVerifyingAction(null);
              return;
            }

            // Actual Firebase PIN verification
            if (storedPin !== trimmedPin) {
              setRoomModalError(
                language === 'vi'
                  ? 'Mã PIN không chính xác! Vui lòng kiểm tra lại mật khẩu do chủ phòng chia sẻ.'
                  : 'Incorrect PIN! The PIN provided does not match the room PIN stored in Firebase.'
              );
              setIsVerifyingRoom(false);
              setVerifyingAction(null);
              return;
            }
          }
        } else {
          // Document does not exist yet in Firestore
          if (selectedRoomTab === 'private' && privateMode === 'join') {
            setRoomModalError(
              language === 'vi'
                ? `Không tìm thấy phòng "${cleanRoomId}" trong hệ thống. Vui lòng kiểm tra lại tên phòng hoặc tạo phòng mới.`
                : `Room "${cleanRoomId}" was not found in the database. Please check the room name or create a new room.`
            );
            setIsVerifyingRoom(false);
            setVerifyingAction(null);
            return;
          }

          // If public room, create document in Firestore
          if (!isPrivateCreate) {
            try {
              await setDoc(roomDocRef, {
                roomId: cleanRoomId,
                isPrivate: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              }, { merge: true });
            } catch (err) {
              console.warn("Could not save public room record in Firestore:", err);
            }
          }
        }
      }

      // PIN verification passed! Enter room
      setCurrentRoomId(cleanRoomId);
      setRoomInitialPin(trimmedPin || undefined);
      setRoomIsPrivateCreation(!!isPrivateCreate);
      setIsRoomSelectModalOpen(false);
      setIsRoomOpen(true);
    } catch (error: any) {
      console.error("Firestore error while checking room PIN:", error);
      setRoomModalError(
        language === 'vi'
          ? 'Lỗi kết nối Firebase khi kiểm tra mã PIN phòng. Vui lòng thử lại.'
          : 'Firebase connection error while checking room PIN. Please try again.'
      );
      try {
        handleFirestoreError(error, OperationType.GET, `rooms/${cleanRoomId}`);
      } catch (e) {
        // Handled & logged according to skill
      }
    } finally {
      setIsVerifyingRoom(false);
      setVerifyingAction(null);
    }
  };
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [activeYoutubeVideo, setActiveYoutubeVideo] = useState<string | null>(null);
  const [youtubeQueue, setYoutubeQueue] = useState<{id: string, title: string, author?: string, thumbnail?: string, queueId?: string}[]>([]);
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState(false);
    

  const handleVideoEnded = () => {
    if (youtubeQueue.length > 0) {
      const nextVideo = youtubeQueue[0];
      setYoutubeQueue(prev => prev.slice(1));
      setActiveYoutubeVideo(nextVideo.id);
    } else {
      setActiveYoutubeVideo(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Error enabling fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    localStorage.setItem('preferred_video', activeVideo.toString());
  }, [activeVideo]);

  useEffect(() => {
    localStorage.setItem('preferred_language', language);
  }, [language]);

  const [state, handleSubmit] = useForm('mojgylre');

  const t = TRANSLATIONS[language];

  // Mouse Glow Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleVideoSwitch = useCallback((index: number) => {
    if (index === activeVideo || isTransitioning) return;
    
    setIsTransitioning(true);
    setActiveVideo(index);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
  }, [activeVideo, isTransitioning]);

  const isDarkMode = false;
  const textColor = isDarkMode ? 'text-[#182C41]' : 'text-white';
  const subtextColor = isDarkMode ? 'text-[#182C41]/80' : 'text-white/80';
  const transitionClass = "transition-all duration-700 ease-in-out";

  // Calculate backdrop opacity based on video brightness
  const backdropOpacities = [0.35, 0.4, 0.05, 0.5];
  const currentBackdropOpacity = backdropOpacities[activeVideo];

  
  const renderCurrentView = () => {
    if (currentView === 'community') {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="community"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Community />
            <button 
              onClick={() => setCurrentView('landing')}
              className="fixed bottom-8 left-8 z-[100] bg-black text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl"
            >
              Quay lại trang chủ
            </button>
          </motion.div>
        </AnimatePresence>
      );
    }

    if (currentView === 'dashboard') {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard onBack={() => setCurrentView('landing')} />
          </motion.div>
        </AnimatePresence>
      );
    }

    if (currentView === 'resources') {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="resources"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Resources onBack={() => setCurrentView('landing')} language={language} />
          </motion.div>
        </AnimatePresence>
      );
    }


    if (currentView === 'entertainment') {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="entertainment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Entertainment 
              onBack={() => {
                setCurrentView('landing');
                if (activeYoutubeVideo) setIsMiniPlayerOpen(true);
              }} 
              language={language}
              youtubeQueue={youtubeQueue}
              setYoutubeQueue={setYoutubeQueue}
              onPlayVideo={(id, playInBackground) => {
                setActiveYoutubeVideo(id);
                if (playInBackground) {
                  setIsMiniPlayerOpen(true);
                  setCurrentView('landing');
                } else {
                  setIsMiniPlayerOpen(false);
                }
              }}
            />
          </motion.div>
        </AnimatePresence>
      );
    }

    if (currentView === 'career') {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="career"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CareerGuidance 
              onBack={() => setCurrentView('landing')} 
              language={language} 
              onOpenStudyRoom={() => {
                setCurrentView('landing');
                setIsRoomSelectModalOpen(true);
              }}
            />
          </motion.div>
        </AnimatePresence>
      );
    }

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full h-screen overflow-hidden bg-black font-sans"
    >
      {/* Background Video Layer */}
      {VIDEOS.map((video, index) => (
        <video
          key={video.url}
          src={video.url}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            activeVideo === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Dynamic Dark Overlay for Legibility */}
      <motion.div 
        animate={{ opacity: currentBackdropOpacity }}
        transition={{ duration: 1 }}
        className="absolute inset-0 z-[1] bg-black pointer-events-none" 
      />

      {/* Dust Motes Particles */}
      <DustMotes />

      {/* Mouse Glow Effect */}
      <motion.div 
        className="absolute inset-0 z-5 pointer-events-none opacity-40 mix-blend-soft-light"
        style={{
          background: `radial-gradient(600px circle at var(--x) var(--y), rgba(255,255,255,0.15), transparent 80%)`,
          // @ts-ignore
          '--x': springX,
          '--y': springY
        }}
      />

      {/* Transparent PNG Overlay */}
      <div 
        className="absolute inset-0 z-1 pointer-events-none bg-center bg-cover animate-train-bob"
        style={{ 
          backgroundImage: 'url("https://soft-zoom-63098134.figma.site/_assets/v11/0b4a435b2df2747593c43d7a1c9b4578f7d8d90c.png")'
        }}
      />


      {/* Content Layer */}
      <div className="relative z-10 flex flex-col h-full px-4 py-6 sm:px-12 sm:py-12">
        
        <AnimatePresence>
          {isRoomOpen && (
            <StudyRoom 
              roomId={currentRoomId} 
              initialPin={roomInitialPin}
              createPrivate={roomIsPrivateCreation}
              language={language} 
              onLeave={() => {
                setIsRoomOpen(false);
                setRoomInitialPin(undefined);
                setRoomIsPrivateCreation(false);
              }} 
              onJoinRoom={(newRoomId, pin, isPrivate) => {
                setCurrentRoomId(newRoomId);
                setRoomInitialPin(pin);
                setRoomIsPrivateCreation(!!isPrivate);
              }}
            />
          )}
        </AnimatePresence>
        
        {/* Navigation */}
        <nav className="flex items-center justify-between w-full max-w-7xl mx-auto">
          <div className="font-serif italic text-white text-xl sm:text-2xl tracking-tight cursor-default">
            StudyWithMe
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Fullscreen Toggle */}
            <button 
              onClick={toggleFullscreen}
              className="liquid-glass w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer shrink-0"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>

            {/* Language Toggle */}
            <button 
              onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
              className="liquid-glass px-4 h-11 sm:h-12 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase cursor-pointer shrink-0"
            >
              {language === 'en' ? 'EN' : 'VI'}
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1.5 liquid-glass rounded-full p-1.5 px-2">
            {t.nav.map(link => (
              <motion.button 
                key={link} 
                onClick={() => {
                  if (link === t.nav[0]) setCurrentView('career');
                  if (link === t.nav[1]) setCurrentView('resources');
                  if (link === t.nav[2]) setCurrentView('community');
                  if (link === t.nav[3]) setCurrentView('entertainment');
                }}
                initial={{ opacity: 0.85, y: 0 }}
                whileHover={{ opacity: 1, y: -2 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="px-4 py-2 text-white text-sm font-medium cursor-pointer"
              >
                {link}
              </motion.button>
            ))}
            <button 
              onClick={() => { triggerHaptic('medium'); setIsRoomSelectModalOpen(true); }}
              className="hidden lg:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all backdrop-blur-md border border-white/10 cursor-pointer"
            >
              <VideoIcon size={16} />
              {language === 'en' ? 'Join Study Room' : 'Vào phòng học'}
            </button>
            <button 
              onClick={() => { triggerHaptic('medium'); setIsRoomSelectModalOpen(true); }}
              className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-opacity-90 transition-all ml-2 cursor-pointer"
            >
              {t.getStarted}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => { triggerHaptic('light'); setIsMobileMenuOpen(!isMobileMenuOpen); }}
            className="md:hidden liquid-glass w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white z-[60] shrink-0"
          >
            <div className="relative w-6 h-6">
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, scale: 0.75, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0.75, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, scale: 0.75, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: -90, scale: 0.75, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto px-2 sm:px-0 space-y-6 sm:space-y-10">

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={`font-serif text-[1.75rem] leading-[1.2] sm:text-4xl md:text-5xl lg:text-[4.5rem] md:leading-[1.1] text-glow-strong ${textColor} ${transitionClass}`}
          >
            <span>{t.heading[0]}</span> <br className="hidden sm:block" /> <span>{t.heading[1]}</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={`max-w-xl text-base sm:text-lg leading-relaxed text-glow ${subtextColor} ${transitionClass}`}
          >
            {t.subtext}
          </motion.p>

          <DailyInspiration language={language} isDarkMode={isDarkMode} />

          <AnimatePresence mode="wait">
            {state.succeeded ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`liquid-glass rounded-3xl p-8 flex flex-col items-center gap-4 w-full max-w-sm ${textColor} ${transitionClass}`}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                >
                  <CheckCircle2 size={40} className="opacity-80" />
                </motion.div>
                <div className="space-y-1">
                  <h3 className="font-serif italic text-2xl">{t.successTitle}</h3>
                  <p className="text-sm opacity-80">{t.success}</p>
                </div>
                <button 
                  onClick={() => { triggerHaptic('medium'); setIsRoomSelectModalOpen(true); }}
                  className="mt-2 w-full bg-white text-black px-6 py-3 rounded-full text-sm font-semibold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <VideoIcon size={16} />
                  {language === 'en' ? 'Enter Study Room' : 'Vào phòng học ngay'}
                </button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className={`liquid-glass rounded-full p-1.5 pl-5 flex items-center w-full max-w-[320px] sm:max-w-sm ${transitionClass}`}
              >
                <input 
                  type="email" 
                  name="email"
                  required
                  placeholder={t.placeholder}
                  className={`bg-transparent border-none outline-none flex-1 text-sm ${isDarkMode ? 'placeholder-[#182C41]/50 text-[#182C41]' : 'placeholder-white/50 text-white'}`}
                />
                <ValidationError 
                  prefix="Email" 
                  field="email"
                  errors={state.errors}
                  className="hidden" // We'll keep it simple for now
                />
                <button 
                  type="submit"
                  disabled={state.submitting}
                  className={`bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-opacity-90 transition-all whitespace-nowrap disabled:opacity-50`}
                >
                  {state.submitting ? '...' : t.cta}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Video Switcher */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex flex-wrap justify-center gap-4 sm:gap-8 pt-4"
          >
            {VIDEOS.map((video, index) => (
              <button
                key={video.label}
                onClick={() => handleVideoSwitch(index)}
                className={`text-xs sm:text-sm font-medium uppercase tracking-[0.2em] pb-1 border-b-2 transition-all duration-300 ${
                  activeVideo === index 
                    ? `opacity-100 ${isDarkMode ? 'border-[#182C41]' : 'border-white'} ${textColor}` 
                    : `opacity-50 border-transparent hover:opacity-80 ${textColor}`
                } ${transitionClass}`}
              >
                {t.videos[index]}
              </button>
            ))}
          </motion.div>
        </div>

      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(32px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 bg-black/50 flex flex-col items-center justify-center overflow-hidden"
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.9}
              onDragEnd={(e, info) => {
                if (Math.abs(info.offset.y) > 100 || Math.abs(info.velocity.y) > 500) {
                  triggerHaptic('medium');
                  setIsMobileMenuOpen(false);
                  return;
                }
                
              }}
              className="w-full h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing relative"
            >
              {/* Swipe handle indicators */}
              <div className="absolute top-24 w-12 h-1.5 bg-white/20 rounded-full" />
              <div className="absolute bottom-16 w-12 h-1.5 bg-white/20 rounded-full" />

              <div className="flex flex-col items-center gap-8 w-full px-6">
                {t.nav.map((link, index) => (
                  <motion.button
                    key={link}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 0.85, y: 0 }}
                    whileHover={{ opacity: 1, y: -2 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: 0.1 + index * 0.05,
                      ease: "easeOut"
                    }}
                    onClick={() => {
                      if (link === t.nav[0]) {
                        setCurrentView('career');
                      } else if (link === t.nav[1]) {
                        setCurrentView('resources');
                      } else if (link === t.nav[2]) {
                        setCurrentView('community');
                      } else if (link === t.nav[3]) {
                        setCurrentView('entertainment');
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-white text-3xl font-serif italic"
                  >
                    {link}
                  </motion.button>
                ))}
                <motion.button 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  onClick={() => { triggerHaptic('light'); setIsMobileMenuOpen(false); setIsRoomSelectModalOpen(true); }}
                  className="mt-4 bg-white text-black px-8 py-4 rounded-full text-lg font-semibold hover:scale-105 transition-transform cursor-pointer"
                >
                  {t.getStarted}
                </motion.button>
                <motion.button 
                  onClick={() => {
                  triggerHaptic('medium');
                  setIsMobileMenuOpen(false);
                  setIsRoomSelectModalOpen(true);
                }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="mt-2 bg-white/10 text-white px-8 py-4 rounded-full text-lg font-semibold border border-white/20 flex items-center gap-3 cursor-pointer"
                >
                  <VideoIcon size={20} />
                  {language === 'en' ? 'Study Room' : 'Phòng học'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

  return (
    <>
      {renderCurrentView()}
      <MusicPlayer showUI={currentView === 'landing' && !isRoomOpen} />
      <YouTubePlayer 
        videoId={activeYoutubeVideo}
        onClose={() => setActiveYoutubeVideo(null)}
        isMiniPlayer={isMiniPlayerOpen}
        setIsMiniPlayer={setIsMiniPlayerOpen}
        onEnded={handleVideoEnded}
        queueLength={youtubeQueue.length}
      />
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        onNavigate={(view) => { setCurrentView(view as any); setIsRoomOpen(false); }} 
        onOpenRoom={() => setIsRoomSelectModalOpen(true)}
        language={language}
      />

      {/* Room Selection Modal: Community vs Private (with PIN) */}
      <AnimatePresence>
        {isRoomSelectModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-[#171310] border border-[#c5a059]/35 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col text-[#f5f0e6] font-serif"
            >
              {/* Classical Top Accent Filigree Line */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#c5a059] to-transparent shadow-[0_0_12px_rgba(197,160,89,0.5)]" />

              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#2c2219] to-[#18130e] border border-[#c5a059]/50 text-[#dfb76c] shadow-[0_0_15px_rgba(197,160,89,0.2)]">
                    <VideoIcon size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#f5f0e6] tracking-tight">
                      {language === 'vi' ? 'Không Gian Học Tập' : 'Join Study Space'}
                    </h3>
                    <p className="text-xs text-[#a89f91] italic font-serif mt-0.5">
                      {language === 'vi' 
                        ? 'Lựa chọn không gian yên tĩnh và tập trung cùng bạn học' 
                        : 'Choose the study environment for your focus session'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsRoomSelectModalOpen(false);
                    setRoomModalError(null);
                  }}
                  className="p-2 rounded-full hover:bg-[#c5a059]/20 text-[#a89f91] hover:text-[#f5f0e6] transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Error Banner */}
              {roomModalError && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-[#2b1313] border border-[#a84444]/60 text-[#fca5a5] text-xs flex items-center gap-2 font-serif">
                  <Shield size={14} className="shrink-0 text-red-400" />
                  <span>{roomModalError}</span>
                </div>
              )}

              {/* Tab Selector: Community vs Private (Classical Wood & Brass Segmented Control) */}
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#0f0c0a] border border-[#c5a059]/30 mb-6 font-serif">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedRoomTab('community');
                    setRoomModalError(null);
                  }}
                  className={`py-3 px-4 rounded-xl text-xs font-serif uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedRoomTab === 'community'
                      ? 'bg-gradient-to-b from-[#2e2319] to-[#1e1711] text-[#f5f0e6] border border-[#c5a059]/60 shadow-[0_2px_12px_rgba(0,0,0,0.6)] font-bold'
                      : 'text-[#9c9181] hover:text-[#f5f0e6] hover:bg-[#1f1914]'
                  }`}
                >
                  <Globe size={15} className={selectedRoomTab === 'community' ? 'text-[#dfb76c]' : ''} />
                  <span>{language === 'vi' ? 'Phòng cộng đồng' : 'Community Room'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedRoomTab('private');
                    setRoomModalError(null);
                  }}
                  className={`py-3 px-4 rounded-xl text-xs font-serif uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedRoomTab === 'private'
                      ? 'bg-gradient-to-b from-[#2e2319] to-[#1e1711] text-[#f5f0e6] border border-[#c5a059]/60 shadow-[0_2px_12px_rgba(0,0,0,0.6)] font-bold'
                      : 'text-[#9c9181] hover:text-[#f5f0e6] hover:bg-[#1f1914]'
                  }`}
                >
                  <Lock size={15} className={selectedRoomTab === 'private' ? 'text-[#dfb76c]' : ''} />
                  <span>{language === 'vi' ? 'Phòng riêng tư (PIN)' : 'Private (PIN)'}</span>
                </button>
              </div>

              {/* Tab 1: Community Room */}
              {selectedRoomTab === 'community' && (
                <div className="space-y-4">
                  {/* Default Main Hall Card */}
                  <div className="p-5 rounded-2xl bg-[#1f1812] border border-[#c5a059]/30 flex flex-col gap-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#dfb76c] animate-pulse" />
                        <span className="text-sm font-serif font-bold text-[#dfb76c]">
                          {language === 'vi' ? 'Hội trường tự học chung' : 'Main Study Hall'}
                        </span>
                      </div>
                      <span className="text-[10px] font-serif uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#2d2319] text-[#dfb76c] border border-[#c5a059]/40">
                        {language === 'vi' ? 'Công khai • Không cần PIN' : 'Public • No PIN'}
                      </span>
                    </div>

                    <p className="text-xs text-[#c4b9a9] leading-relaxed font-serif">
                      {language === 'vi'
                        ? 'Không gian học tập chính, kết nối cùng bạn bè và sinh viên khắp nơi. Bật nhạc lofi, camera hoặc chia sẻ màn hình bất cứ lúc nào.'
                        : 'The primary open space to study alongside students worldwide. Relax with lofi ambience and focused energy.'}
                    </p>

                    <button
                      type="button"
                      disabled={isVerifyingRoom}
                      onClick={() => handleEnterRoom('main-study-hall', undefined, false, 'main')}
                      className="mt-1 w-full py-3 rounded-xl bg-gradient-to-r from-[#b38a3e] via-[#dfb76c] to-[#b38a3e] hover:from-[#c59a4a] hover:via-[#ebd08c] hover:to-[#c59a4a] disabled:opacity-50 disabled:cursor-not-allowed text-[#140f0a] text-xs font-serif font-bold uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(197,160,89,0.3)] flex items-center justify-center gap-2 cursor-pointer border border-[#f5dfa3]/40"
                    >
                      {isVerifyingRoom && verifyingAction === 'main' ? (
                        <>
                          <Loader2 size={15} className="animate-spin text-[#140f0a]" />
                          <span>{language === 'vi' ? 'Đang kết nối...' : 'Connecting...'}</span>
                        </>
                      ) : (
                        <>
                          <LogIn size={15} />
                          <span>{language === 'vi' ? 'Vào hội trường ngay' : 'Join Main Hall (Instant)'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Or Custom Public Room */}
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-2 text-xs font-serif text-[#8a8071] uppercase tracking-wider">
                      <div className="h-px bg-[#c5a059]/20 flex-1" />
                      <span>{language === 'vi' ? 'hoặc vào phòng cộng đồng khác' : 'or enter custom public room'}</span>
                      <div className="h-px bg-[#c5a059]/20 flex-1" />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customPublicRoom}
                        disabled={isVerifyingRoom}
                        onChange={(e) => setCustomPublicRoom(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isVerifyingRoom) handleEnterRoom(customPublicRoom || 'main-study-hall', undefined, false, 'custom');
                        }}
                        placeholder={language === 'vi' ? 'Nhập tên phòng (VD: math-club, luyen-thi)...' : 'Room name (e.g. math-club, dev-squad)...'}
                        className="flex-1 bg-[#100d0b] border border-[#c5a059]/30 rounded-xl px-4 py-2.5 text-xs text-[#f5f0e6] placeholder-[#8a8071]/60 focus:outline-none focus:border-[#dfb76c] focus:ring-1 focus:ring-[#dfb76c]/30 font-serif transition-colors disabled:opacity-50"
                      />
                      <button
                        type="button"
                        disabled={isVerifyingRoom}
                        onClick={() => handleEnterRoom(customPublicRoom || 'main-study-hall', undefined, false, 'custom')}
                        className="py-2.5 px-4 rounded-xl bg-[#251e18] hover:bg-[#32271f] disabled:opacity-50 disabled:cursor-not-allowed text-[#dfb76c] text-xs font-serif font-semibold transition-all border border-[#c5a059]/35 cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        {isVerifyingRoom && verifyingAction === 'custom' && (
                          <Loader2 size={13} className="animate-spin" />
                        )}
                        <span>{language === 'vi' ? 'Vào phòng' : 'Join'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Private Room with PIN */}
              {selectedRoomTab === 'private' && (
                <div className="space-y-4 font-serif">
                  {/* Submode Switcher: Create vs Join (Classical Serif tabs) */}
                  <div className="flex items-center gap-3 border-b border-[#c5a059]/25 pb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPrivateMode('create');
                        setRoomModalError(null);
                      }}
                      className={`text-xs font-serif font-bold uppercase tracking-wider pb-1 transition-all cursor-pointer ${
                        privateMode === 'create'
                          ? 'text-[#dfb76c] border-b-2 border-[#c5a059]'
                          : 'text-[#8a8071] hover:text-[#f5f0e6]'
                      }`}
                    >
                      {language === 'vi' ? '+ Tạo phòng riêng mới (Chủ phòng)' : '+ Create Private Room (Host)'}
                    </button>
                    <span className="text-[#c5a059]/40">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPrivateMode('join');
                        setRoomModalError(null);
                      }}
                      className={`text-xs font-serif font-bold uppercase tracking-wider pb-1 transition-all cursor-pointer ${
                        privateMode === 'join'
                          ? 'text-[#dfb76c] border-b-2 border-[#c5a059]'
                          : 'text-[#8a8071] hover:text-[#f5f0e6]'
                      }`}
                    >
                      {language === 'vi' ? 'Tham gia phòng bạn bè' : 'Join Friend\'s Room'}
                    </button>
                  </div>

                  {privateMode === 'create' ? (
                    /* Create New Private Room */
                    <div className="space-y-3.5">
                      <p className="text-xs text-[#c4b9a9] font-serif leading-relaxed">
                        {language === 'vi'
                          ? 'Bạn sẽ là chủ phòng. Hãy đặt tên phòng và mã PIN để bạn bè nhập đúng mã mới vào được.'
                          : 'You will be the host. Set a room name and PIN code that friends must enter to join.'}
                      </p>

                      <div>
                        <label className="text-[11px] font-serif font-bold text-[#c5a059] uppercase tracking-wider block mb-1.5">
                          {language === 'vi' ? 'Tên phòng học' : 'Room Name'}
                        </label>
                        <input
                          type="text"
                          value={createRoomName}
                          disabled={isVerifyingRoom}
                          onChange={(e) => setCreateRoomName(e.target.value)}
                          placeholder={language === 'vi' ? 'VD: nhom-hoc-247, do-an-tot-nghiep...' : 'e.g. project-x, final-prep...'}
                          className="w-full bg-[#100d0b] border border-[#c5a059]/30 rounded-xl px-4 py-2.5 text-xs text-[#f5f0e6] placeholder-[#8a8071]/60 focus:outline-none focus:border-[#dfb76c] focus:ring-1 focus:ring-[#dfb76c]/30 font-serif transition-colors disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-serif font-bold text-[#dfb76c] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <KeyRound size={13} className="text-[#dfb76c]" />
                          <span>{language === 'vi' ? 'Đặt mã PIN phòng (Bắt buộc)' : 'Set Room PIN (Required)'}</span>
                        </label>
                        <input
                          type="text"
                          value={createRoomPin}
                          disabled={isVerifyingRoom}
                          onChange={(e) => setCreateRoomPin(e.target.value)}
                          placeholder={language === 'vi' ? 'Nhập mã PIN (VD: 1234, study99)...' : 'Enter PIN code (e.g. 1234, deepwork)...'}
                          className="w-full bg-[#100d0b] border border-[#c5a059]/45 rounded-xl px-4 py-2.5 text-xs text-[#f5f0e6] font-mono placeholder-[#8a8071]/60 focus:outline-none focus:border-[#dfb76c] focus:ring-1 focus:ring-[#dfb76c]/40 transition-colors disabled:opacity-50"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={isVerifyingRoom}
                        onClick={() => handleEnterRoom(createRoomName, createRoomPin, true, 'create')}
                        className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#b38a3e] via-[#dfb76c] to-[#b38a3e] hover:from-[#c59a4a] hover:via-[#ebd08c] hover:to-[#c59a4a] disabled:opacity-50 disabled:cursor-not-allowed text-[#140f0a] text-xs font-serif font-bold uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(197,160,89,0.3)] flex items-center justify-center gap-2 cursor-pointer border border-[#f5dfa3]/40"
                      >
                        {isVerifyingRoom && verifyingAction === 'create' ? (
                          <>
                            <Loader2 size={15} className="animate-spin text-[#140f0a]" />
                            <span>{language === 'vi' ? 'Đang lưu phòng vào Firebase...' : 'Saving Room to Firebase...'}</span>
                          </>
                        ) : (
                          <>
                            <Lock size={15} />
                            <span>{language === 'vi' ? 'Tạo phòng riêng & Trở thành Chủ phòng' : 'Create & Enter as Host'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* Join Existing Private Room */
                    <div className="space-y-3.5">
                      <p className="text-xs text-[#c4b9a9] font-serif leading-relaxed">
                        {language === 'vi'
                          ? 'Nhập tên phòng và mã PIN do chủ phòng đã chia sẻ cho bạn để vào học.'
                          : 'Enter the room name and PIN code shared by the host to join.'}
                      </p>

                      <div>
                        <label className="text-[11px] font-serif font-bold text-[#c5a059] uppercase tracking-wider block mb-1.5">
                          {language === 'vi' ? 'Tên / Mã phòng' : 'Room ID'}
                        </label>
                        <input
                          type="text"
                          value={joinRoomName}
                          disabled={isVerifyingRoom}
                          onChange={(e) => setJoinRoomName(e.target.value)}
                          placeholder={language === 'vi' ? 'VD: nhom-hoc-247...' : 'e.g. project-x...'}
                          className="w-full bg-[#100d0b] border border-[#c5a059]/30 rounded-xl px-4 py-2.5 text-xs text-[#f5f0e6] placeholder-[#8a8071]/60 focus:outline-none focus:border-[#dfb76c] focus:ring-1 focus:ring-[#dfb76c]/30 font-serif transition-colors disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-serif font-bold text-[#dfb76c] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <KeyRound size={13} className="text-[#dfb76c]" />
                          <span>{language === 'vi' ? 'Mã PIN bảo mật' : 'Room PIN Code'}</span>
                        </label>
                        <input
                          type="password"
                          value={joinRoomPin}
                          disabled={isVerifyingRoom}
                          onChange={(e) => setJoinRoomPin(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isVerifyingRoom) handleEnterRoom(joinRoomName, joinRoomPin, false, 'join');
                          }}
                          placeholder={language === 'vi' ? 'Nhập mã PIN của phòng...' : 'Enter room PIN...'}
                          className="w-full bg-[#100d0b] border border-[#c5a059]/45 rounded-xl px-4 py-2.5 text-xs text-[#f5f0e6] font-mono placeholder-[#8a8071]/60 focus:outline-none focus:border-[#dfb76c] focus:ring-1 focus:ring-[#dfb76c]/40 transition-colors disabled:opacity-50"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={isVerifyingRoom}
                        onClick={() => handleEnterRoom(joinRoomName, joinRoomPin, false, 'join')}
                        className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#b38a3e] via-[#dfb76c] to-[#b38a3e] hover:from-[#c59a4a] hover:via-[#ebd08c] hover:to-[#c59a4a] disabled:opacity-50 disabled:cursor-not-allowed text-[#140f0a] text-xs font-serif font-bold uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(197,160,89,0.3)] flex items-center justify-center gap-2 cursor-pointer border border-[#f5dfa3]/40"
                      >
                        {isVerifyingRoom && verifyingAction === 'join' ? (
                          <>
                            <Loader2 size={15} className="animate-spin text-[#140f0a]" />
                            <span>{language === 'vi' ? 'Đang xác thực PIN với Firebase...' : 'Verifying PIN with Firebase...'}</span>
                          </>
                        ) : (
                          <>
                            <LogIn size={15} />
                            <span>{language === 'vi' ? 'Xác thực & Vào phòng' : 'Verify PIN & Enter'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

}
