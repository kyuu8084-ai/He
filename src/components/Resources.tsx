import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, Menu, Clock } from 'lucide-react';
import DraggableClockWidget from './study-tools/DraggableClockWidget';
import StudyResourcesList from './study-tools/StudyResourcesList';

const VIDEO_URLS = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260629_030107_874273ea-684a-4e90-bb96-8fdfde48d53d.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260629_032424_3c9c2a9d-807b-4482-80e6-dd6d9dfd4545.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260627_094019_4214ea73-b963-46a4-8327-61489192de99.mp4'
];

interface ResourcesProps {
  onBack?: () => void;
  language: 'en' | 'vi';
}

export default function Resources({ onBack, language }: ResourcesProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [time, setTime] = useState('');
  const [videoSources, setVideoSources] = useState<string[]>(VIDEO_URLS);
  const [isVisible, setIsVisible] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showWidget, setShowWidget] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const isVi = language === 'vi';

  // Live Clock (CUP HH:MM:SS)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(now);
      setTime(`CUP ${formatted}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Video Preloading
  useEffect(() => {
    let active = true;
    const loadVideos = async () => {
      try {
        const loaded = await Promise.all(
          VIDEO_URLS.map(async (url) => {
            const res = await fetch(url);
            const blob = await res.blob();
            return URL.createObjectURL(blob);
          })
        );
        if (active) setVideoSources(loaded);
      } catch (err) {
        // Fallback to original URLs
      }
    };
    loadVideos();
    return () => {
      active = false;
    };
  }, []);

  // Reveal Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.35 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, []);

  const videoSwitchers = isVi 
    ? ['01 / CHUẨN SỰ TẬP TRUNG', '02 / ÂM THANH MÔI TRƯỜNG', '03 / KHÔNG GIAN HỌC ẢO']
    : ['01 / DEEP FOCUS', '02 / AMBIENT SOUNDS', '03 / VIRTUAL SPACE'];

  const navItems = isVi
    ? [
        { num: '01', label: 'Tài Liệu Môn Học' },
        { num: '02', label: 'Sổ Tay Học Tâp' },
        { num: '03', label: 'Thư Viện Số' },
        { num: '04', label: 'Hỗ Trợ Sinh Viên' }
      ]
    : [
        { num: '01', label: 'Course Materials' },
        { num: '02', label: 'Study Guides' },
        { num: '03', label: 'Digital Library' },
        { num: '04', label: 'Student Support' }
      ];

  return (
    <div className="font-figtree bg-black min-h-screen text-white overflow-x-hidden relative selection:bg-[#F598F2] selection:text-black">
      {/* CSS Styles & Fonts */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Figtree', sans-serif;
          background-color: #000;
        }

        .font-figtree {
          font-family: 'Figtree', sans-serif;
        }

        .nav-link-underline {
          position: relative;
        }

        .nav-link-underline::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 100%;
          height: 1px;
          background-color: white;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nav-link-underline:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }

        .role-link {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .role-link:hover {
          transform: translateX(4px);
        }

        .btn-hover {
          position: relative;
          overflow: hidden;
          transition: color 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-hover::before {
          content: '';
          position: absolute;
          inset: 0;
          background-color: #F598F2;
          transform: translateY(101%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: -1;
        }

        .btn-hover:hover::before {
          transform: translateY(0);
        }

        .btn-hover:hover {
          color: black !important;
          border-color: #F598F2 !important;
        }

        @keyframes revealUp {
          from {
            opacity: 0;
            transform: translateY(80px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes revealRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes dotPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.45;
            transform: scale(1.45);
          }
        }

        .animate-reveal-up {
          animation: revealUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }

        .animate-reveal-right {
          animation: revealRight 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }

        .delay-80 {
          animation-delay: 0.08s;
        }

        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}} />

      {/* Video Backgrounds */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none" aria-hidden="true">
        {videoSources.map((src, i) => (
          <video
            key={src + i}
            src={src}
            autoPlay
            loop
            muted
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out ${
              activeIndex === i ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-black/20 z-[1]" />
      </div>

      {/* NAVBAR */}
      <header className="absolute top-0 w-full z-20">
        <nav 
          className="max-w-[1340px] mx-auto flex items-center justify-between py-6 px-[18px] md:py-[30px] lg:py-9 lg:px-[15px]" 
          aria-label="Main Navigation"
        >
          {/* Left Nav Items (Desktop) */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setShowResources(true)}
                className="nav-link-underline text-left cursor-pointer group"
              >
                <div className="text-[8px] leading-3 tracking-[-0.08px] font-medium uppercase text-white/60">
                  {item.num} /
                </div>
                <div className="text-xs leading-4 tracking-[-0.12px] font-medium uppercase text-white group-hover:text-white/90">
                  {item.label}
                </div>
              </button>
            ))}
          </div>

          {/* Right Nav Items: Clock & Back Button */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-xs font-mono tracking-wider text-white/80 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 hidden sm:block">
              {time}
            </div>

            {onBack && (
              <button 
                onClick={onBack}
                className="group flex items-center gap-2 text-xs md:text-sm font-semibold uppercase tracking-widest bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 hover:border-white/40 px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-all text-white cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>{isVi ? 'Trang chủ' : 'Home'}</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-full bg-black/40 border border-white/20 text-white cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile Nav Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-black/95 backdrop-blur-xl border-b border-white/10 p-6 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 gap-3">
              {navItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setShowResources(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left p-3 rounded-lg hover:bg-white/10 text-white font-medium text-sm transition-colors"
                >
                  <span className="text-xs text-white/50 mr-2">{item.num} /</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* HERO CONTENT AREA */}
      <main 
        ref={observerRef}
        className="relative z-[2] max-w-[1340px] mx-auto min-h-screen flex flex-col justify-end pt-[140px] px-[18px] pb-11 gap-8 md:gap-20 lg:gap-[120px] lg:pt-[180px] lg:px-[15px] lg:pb-[60px]"
      >
        {/* Section 1 - Video Switcher + Status */}
        <section className="flex flex-col md:flex-row gap-4 md:gap-0 w-full justify-between items-start md:items-center">
          <div className="flex-[4] flex flex-col sm:flex-row gap-3 lg:gap-6 items-start sm:items-center">
            {videoSwitchers.map((label, i) => (
              <button 
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`role-link text-[11px] md:text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300 cursor-pointer ${
                  activeIndex === i 
                    ? 'opacity-100 text-white font-bold' 
                    : 'opacity-55 hover:opacity-80 text-white/80'
                }`}
                aria-pressed={activeIndex === i}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <div className="relative flex items-center justify-center">
              <div 
                className="w-[6px] h-[6px] rounded-full transition-colors duration-500" 
                style={{ 
                  backgroundColor: activeIndex === 0 ? '#F598F2' : '#ffffff',
                  boxShadow: activeIndex === 0 ? '0 0 8px #F598F2' : '0 0 8px #ffffff'
                }}
              />
              <div 
                className="absolute w-[6px] h-[6px] rounded-full transition-colors duration-500"
                style={{ 
                  backgroundColor: activeIndex === 0 ? '#F598F2' : '#ffffff',
                  animation: 'dotPulse 1.6s infinite'
                }}
              />
            </div>
            <span className="text-[11px] uppercase tracking-wider font-medium opacity-80 whitespace-nowrap">
              {isVi ? 'Sẵn sàng học tập' : 'Available for study'}
            </span>
          </div>
        </section>

        {/* Section 2 - Main Content & Title */}
        <section className="flex flex-col xl:flex-row w-full items-start gap-6 mt-auto z-10">
          {/* Left Column: Title + Expand Resources */}
          <div className="flex-[1.8] w-full flex flex-col gap-4 justify-end">
            <div className={`flex flex-wrap items-center gap-3 ${isVisible ? 'animate-reveal-up' : ''}`}>
              {!showResources && (
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase leading-tight tracking-tight text-white">
                  {isVi ? 'Tài Nguyên' : 'Resources'}
                  <span 
                    className="transition-colors duration-500" 
                    style={{ color: activeIndex === 0 ? '#F598F2' : '#ffffff' }}
                  >
                    .
                  </span>
                </h1>
              )}
              {showResources && (
                <button 
                  onClick={() => setShowResources(false)} 
                  className="flex items-center gap-1.5 border border-white/30 bg-white/10 hover:bg-white/20 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                >
                  <X size={13} /> {isVi ? 'Thu gọn' : 'Collapse'}
                </button>
              )}
            </div>

            <div className={`${isVisible ? 'animate-reveal-up delay-80' : ''}`}>
              {!showResources ? (
                <div className="flex flex-col items-start gap-3.5 mt-1">
                  <p className="text-xs sm:text-sm leading-relaxed tracking-normal font-normal text-white/80 max-w-md drop-shadow">
                    {isVi
                      ? 'Kho tài nguyên học tập phong phú: Bộ đề thi, giáo trình chuẩn, sơ đồ tư duy và công cụ đếm giờ đồng hành giúp bạn chinh phục mọi môn học.'
                      : 'Comprehensive learning hub: Exam prep, standard syllabi, mindmaps, and integrated focus tools to help you master every subject.'}
                  </p>
                  <button 
                    onClick={() => setShowResources(true)} 
                    className="btn-hover mt-1 border border-white/30 bg-white/10 hover:bg-white/20 rounded-full px-6 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white transition-colors cursor-pointer"
                  >
                    {isVi ? 'Khám phá ngay' : 'Explore now'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 mt-2">
                  <StudyResourcesList language={language} />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Clock & Study Tools Widget */}
          {!showResources && (
            <div className={`flex-[1] w-full flex justify-center xl:justify-end items-start ${isVisible ? 'animate-reveal-right' : ''}`}>
              {showWidget ? (
                <div className="relative">
                  <DraggableClockWidget language={language} onClose={() => setShowWidget(false)} />
                </div>
              ) : (
                <button 
                  onClick={() => setShowWidget(true)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-full backdrop-blur-md border border-white/20 text-white/80 hover:text-white transition-all text-[11px] font-semibold uppercase tracking-wider cursor-pointer shadow-lg hover:scale-105"
                >
                  <Clock size={14} />
                  {isVi ? 'Hiện tiện ích' : 'Show Widget'}
                </button>
              )}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

