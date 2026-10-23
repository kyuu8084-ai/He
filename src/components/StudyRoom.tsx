import { triggerHaptic } from '../lib/haptics';
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import io from "socket.io-client";
import { PeerConnectionManager, createBlankVideoTrack, StreamQuality, QUALITY_CONFIGS, CAMERA_QUALITY_CONSTRAINTS } from "../lib/PeerConnectionManager";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Users, Maximize2, Music, Volume2, VolumeX, CloudRain, TreePine, Coffee, Wind, Upload, User, Image as ImageIcon, MessageCircle, Send, X, Monitor, MonitorOff, Timer, Play, Pause, RotateCcw, Edit3, Sparkles, CheckCircle2, Circle, Trash2, ListTodo, FileText, NotebookPen, Lock, Unlock, Info, Award, Sun, CloudSnow, Wand2, Shield, Share2, KeyRound, Copy, Check, Globe, Eye, EyeOff, CircleDot, Square, Download, Disc, FlipHorizontal, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Cpu, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc, deleteDoc, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import Whiteboard from "./Whiteboard";
import { WeatherWidget } from "./WeatherWidget";

interface FirestoreParticipant {
  id: string;
  participantId: string;
  userId?: string | null;
  userName: string;
  userProfilePic?: string;
  joinedAt?: any;
  lastSeen?: any;
}

interface SessionRecordingItem {
  id: string;
  title: string;
  roomId: string;
  type: 'screen' | 'audio';
  durationSeconds: number;
  fileSizeBytes?: number;
  mimeType?: string;
  downloadUrl?: string;
  recordedById: string;
  recordedByName: string;
  createdAt?: any;
}

interface PeerState {
  peerId: string;
  stream?: MediaStream;
  profilePic?: string;
  userName?: string;
  isScreenSharing?: boolean;
  isCameraOff?: boolean;
}

interface Reaction {
  id: string;
  emoji: string;
  timestamp: number;
}

interface Goal {
  id: string;
  text: string;
  completed: boolean;
  authorId: string;
  authorName: string;
}

interface Message {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderProfilePic?: string;
  text: string;
  timestamp: number;
}
interface StudyRoomProps {
  roomId: string;
  initialPin?: string;
  createPrivate?: boolean;
  onLeave: () => void;
  onJoinRoom: (roomId: string, pin?: string, createPrivate?: boolean) => void;
  language: 'en' | 'vi';
}


const HeadlessPeerAudio = ({ stream, muted = false }: { stream?: MediaStream, muted?: boolean }) => {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && stream) {
      el.srcObject = stream;
      el.muted = muted;
      el.play().catch(() => {});
    }
  }, [stream, muted]);

  return <audio ref={ref} autoPlay playsInline muted={muted} className="hidden" />;
};

const Video = ({ 
  stream, 
  profilePic, 
  muted = false, 
  className = "w-full h-full object-cover rounded-2xl bg-black/20", 
  hiddenVideo = false,
  isMirrored = false
}: { 
  stream?: MediaStream, 
  profilePic?: string, 
  muted?: boolean, 
  className?: string, 
  hiddenVideo?: boolean,
  isMirrored?: boolean
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playError, setPlayError] = useState(false);

  useEffect(() => {
    const mediaEl = hiddenVideo ? audioRef.current : videoRef.current;
    if (mediaEl && stream) {
      mediaEl.srcObject = stream;
      mediaEl.muted = muted;
      
      const play = () => {
        if (!mediaEl) return;
        const playPromise = mediaEl.play();
        if (playPromise !== undefined) {
          playPromise.then(() => setPlayError(false)).catch(e => {
            console.warn("Media play failed:", e);
            if (e.name === 'NotAllowedError') {
              setPlayError(true);
              if (mediaEl && !muted) {
                mediaEl.muted = true;
                mediaEl.play().catch(() => {});
              }
            }
          });
        }
      };

      play();
      stream.getVideoTracks().forEach(t => {
        t.onunmute = play;
        t.onended = play;
      });
      stream.onaddtrack = play;
    }
  }, [stream, muted, hiddenVideo]);

  if (!stream && profilePic) {
    return (
      <div className={`flex items-center justify-center bg-zinc-900 overflow-hidden ${className}`}>
        <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (!stream && !profilePic) {
    return (
      <div className={`flex items-center justify-center bg-zinc-900 ${className}`}>
        <User size={48} className="text-white/20" />
      </div>
    );
  }

  if (hiddenVideo) {
    return (
      <div className={`relative ${className} pointer-events-none`}>
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          muted={muted}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
        style={{ 
          objectFit: className?.includes('object-contain') ? 'contain' : 'cover',
          transform: isMirrored ? 'scaleX(-1)' : undefined
        }}
      />
      {playError && !muted && (
        <button 
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.muted = false;
              videoRef.current.play().then(() => setPlayError(false)).catch(e => console.error(e));
            }
          }}
          className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 text-[#dfb76c] border border-[#c5a059]/40 backdrop-blur-md cursor-pointer hover:bg-black transition-all"
        >
          <Volume2 size={14} />
          <span className="text-[10px] font-serif font-bold tracking-wider uppercase">Bật tiếng</span>
        </button>
      )}
    </div>
  );
};

const MaximizedVideoElement = ({ 
  stream, 
  muted, 
  isScreenSharing, 
  language,
  isMirrored = false,
  onToggleMirror
}: { 
  stream: MediaStream; 
  muted: boolean; 
  isScreenSharing: boolean; 
  language: 'en' | 'vi';
  isMirrored?: boolean;
  onToggleMirror?: () => void;
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [playError, setPlayError] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(muted);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>(isScreenSharing ? 'contain' : 'contain');
  const [isLoading, setIsLoading] = useState(true);

  // Sync muted changes
  useEffect(() => {
    setIsAudioMuted(muted);
    if (ref.current) {
      ref.current.muted = muted;
    }
  }, [muted]);

  useEffect(() => {
    const videoEl = ref.current;
    if (!videoEl || !stream) {
      console.warn("[MaximizedVideoElement] Missing videoEl or stream on mount/update", {
        hasVideoEl: !!videoEl,
        hasStream: !!stream
      });
      return;
    }

    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    console.log("[MaximizedVideoElement:Mount] Assigning MediaStream to <video> srcObject:", {
      streamId: stream.id,
      active: stream.active,
      mutedProp: muted,
      isAudioMuted,
      videoTracks: videoTracks.map(t => ({
        id: t.id,
        label: t.label,
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState
      })),
      audioTracks: audioTracks.map(t => ({
        id: t.id,
        label: t.label,
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState
      }))
    });

    // Directly assign srcObject
    videoEl.srcObject = stream;
    videoEl.muted = isAudioMuted;

    console.log("[MaximizedVideoElement:Verification] videoEl.srcObject assigned successfully?", {
      isEqual: videoEl.srcObject === stream,
      assignedStreamId: (videoEl.srcObject as MediaStream)?.id,
      currentSrc: videoEl.currentSrc,
      readyState: videoEl.readyState,
      videoWidth: videoEl.videoWidth,
      videoHeight: videoEl.videoHeight
    });

    // Check if video frames or metadata are already available immediately
    if (videoEl.videoWidth > 0 || videoEl.readyState >= 1) {
      console.log(`[MaximizedVideoElement:QuickReady] Video already has dimensions: ${videoEl.videoWidth}x${videoEl.videoHeight}, readyState: ${videoEl.readyState}`);
      setIsLoading(false);
    }

    const tryPlay = async () => {
      if (!ref.current) return;
      try {
        console.log("[MaximizedVideoElement:Play] Calling videoEl.play()...");
        await ref.current.play();
        console.log("[MaximizedVideoElement:Play] videoEl.play() SUCCESS! Dimensions:", `${ref.current.videoWidth}x${ref.current.videoHeight}`, `paused: ${ref.current.paused}`);
        setPlayError(false);
        setIsLoading(false);
      } catch (err: any) {
        console.warn("[MaximizedVideoElement:Play] videoEl.play() rejected:", err);
        if (err.name === 'NotAllowedError' && !ref.current.muted) {
          console.log("[MaximizedVideoElement:Play] Autoplay blocked unmuted audio; playing muted fallback so video renders immediately...");
          ref.current.muted = true;
          setIsAudioMuted(true);
          setPlayError(true);
          try {
            await ref.current.play();
            console.log("[MaximizedVideoElement:Play] Muted fallback play SUCCESS!");
            setIsLoading(false);
          } catch (e) {
            console.warn("[MaximizedVideoElement:Play] Muted fallback play failed:", e);
          }
        }
      }
    };

    tryPlay();

    const handleLoadedMetadata = () => {
      console.log(`[MaximizedVideoElement:Event] 'loadedmetadata' event fired! Dimensions: ${videoEl.videoWidth}x${videoEl.videoHeight}, readyState: ${videoEl.readyState}`);
      setIsLoading(false);
      tryPlay();
    };

    const handleLoadedData = () => {
      console.log(`[MaximizedVideoElement:Event] 'loadeddata' event fired! readyState: ${videoEl.readyState}`);
      setIsLoading(false);
    };

    const handlePlaying = () => {
      console.log(`[MaximizedVideoElement:Event] 'playing' event fired! Dimensions: ${videoEl.videoWidth}x${videoEl.videoHeight}, paused: ${videoEl.paused}`);
      setIsLoading(false);
    };

    const handleTrackActivity = (e?: Event) => {
      console.log(`[MaximizedVideoElement:TrackEvent] Track activity event (${e?.type || 'trigger'}), re-verifying srcObject...`, {
        streamId: stream.id,
        currentSrcObject: (videoEl.srcObject as MediaStream)?.id
      });
      if (videoEl && videoEl.srcObject !== stream) {
        console.log("[MaximizedVideoElement:TrackEvent] Re-assigning srcObject to stream");
        videoEl.srcObject = stream;
      }
      tryPlay();
    };

    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoEl.addEventListener('loadeddata', handleLoadedData);
    videoEl.addEventListener('playing', handlePlaying);

    stream.getVideoTracks().forEach(t => {
      t.onunmute = (e) => {
        console.log(`[MaximizedVideoElement:Track] Video track '${t.id}' UNMUTED`, e);
        handleTrackActivity(e);
      };
      t.onmute = (e) => console.log(`[MaximizedVideoElement:Track] Video track '${t.id}' MUTED`, e);
      t.onended = (e) => console.log(`[MaximizedVideoElement:Track] Video track '${t.id}' ENDED`, e);
    });

    stream.getAudioTracks().forEach(t => {
      t.onunmute = (e) => {
        console.log(`[MaximizedVideoElement:Track] Audio track '${t.id}' UNMUTED`, e);
        handleTrackActivity(e);
      };
      t.onmute = (e) => console.log(`[MaximizedVideoElement:Track] Audio track '${t.id}' MUTED`, e);
    });

    stream.onaddtrack = (e) => {
      console.log("[MaximizedVideoElement:Stream] Stream onaddtrack:", e.track.kind, e.track.id);
      handleTrackActivity(e);
    };
    stream.onremovetrack = (e) => {
      console.log("[MaximizedVideoElement:Stream] Stream onremovetrack:", e.track.kind, e.track.id);
      handleTrackActivity(e);
    };

    return () => {
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoEl.removeEventListener('loadeddata', handleLoadedData);
      videoEl.removeEventListener('playing', handlePlaying);
      stream.getVideoTracks().forEach(t => {
        t.onunmute = null;
        t.onmute = null;
        t.onended = null;
      });
      stream.getAudioTracks().forEach(t => {
        t.onunmute = null;
        t.onmute = null;
      });
      stream.onaddtrack = null;
      stream.onremovetrack = null;
    };
  }, [stream]);

  const toggleSound = () => {
    if (!ref.current) return;
    const nextMuted = !isAudioMuted;
    ref.current.muted = nextMuted;
    setIsAudioMuted(nextMuted);
    console.log(`[MaximizedVideoElement:SoundToggle] Toggled sound. New isAudioMuted: ${nextMuted}`);
    if (!nextMuted) {
      ref.current.play().then(() => setPlayError(false)).catch(console.error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
      <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={isAudioMuted}
          className={`relative z-10 block w-full h-full max-h-[calc(100vh-210px)] rounded-2xl shadow-2xl transition-all duration-300 ${
            fitMode === 'contain' ? 'object-contain' : 'object-cover'
          }`}
          style={{
            backgroundColor: 'transparent',
            transform: isMirrored && !isScreenSharing ? 'scaleX(-1)' : undefined
          }}
        />

        {/* Loading overlay - pointer-events-none and z-20 so it never obscures the video */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0a08]/70 backdrop-blur-sm rounded-2xl pointer-events-none z-20 transition-opacity duration-300">
            <div className="w-10 h-10 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs font-serif text-[#dfb76c] uppercase tracking-widest">
              {language === 'vi' ? 'Đang kết nối tín hiệu video...' : 'Connecting video stream...'}
            </span>
          </div>
        )}

        {/* Floating Quick Unmute Banner if audio was blocked by autoplay */}
        {playError && isAudioMuted && !muted && (
          <button
            onClick={toggleSound}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#1e1712]/95 hover:bg-[#2b211a] border border-[#c5a059]/60 text-[#f5f0e6] shadow-[0_10px_30px_rgba(0,0,0,0.85)] backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <VolumeX size={18} className="text-[#dfb76c] animate-bounce" />
            <span className="text-xs font-serif font-bold tracking-wider text-[#dfb76c]">
              {language === 'vi' ? 'Âm thanh đang tắt • Chạm để bật tiếng' : 'Audio muted • Tap to unmute'}
            </span>
          </button>
        )}
      </div>

      {/* Classical Bottom Control Ribbon */}
      <div className="mt-3 flex items-center justify-center gap-3 py-2 px-5 rounded-full bg-[#171310]/90 border border-[#c5a059]/35 backdrop-blur-md shadow-xl">
        {/* Fit / Cover mode toggle */}
        <button
          onClick={() => setFitMode(prev => prev === 'contain' ? 'cover' : 'contain')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif font-medium text-[#dfb76c] hover:bg-[#c5a059]/15 transition-all cursor-pointer"
          title={fitMode === 'contain' ? (language === 'vi' ? 'Đổi sang lấp đầy khung hình' : 'Switch to fill') : (language === 'vi' ? 'Đổi sang vừa vặn khung hình' : 'Switch to fit')}
        >
          <Sparkles size={14} className="text-[#c5a059]" />
          <span>
            {fitMode === 'contain' 
              ? (language === 'vi' ? 'Vừa vặn (Fit)' : 'Fit Mode') 
              : (language === 'vi' ? 'Lấp đầy (Fill)' : 'Fill Mode')}
          </span>
        </button>

        {onToggleMirror && !isScreenSharing && (
          <>
            <div className="w-px h-4 bg-[#c5a059]/25" />
            <button
              onClick={onToggleMirror}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif font-medium transition-all cursor-pointer ${
                isMirrored 
                  ? 'text-[#dfb76c] bg-[#c5a059]/20 hover:bg-[#c5a059]/30' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              title={language === 'vi' ? 'Đổi hướng camera (Lật gương)' : 'Flip camera orientation'}
            >
              <FlipHorizontal size={14} className="text-[#c5a059]" />
              <span>
                {language === 'vi' 
                  ? (isMirrored ? 'Lật gương (Bật)' : 'Lật gương (Tắt)') 
                  : (isMirrored ? 'Mirrored (On)' : 'Mirrored (Off)')}
              </span>
            </button>
          </>
        )}

        <div className="w-px h-4 bg-[#c5a059]/25" />

        {/* Audio Mute/Unmute for remote */}
        {!muted ? (
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif font-medium transition-all cursor-pointer ${
              isAudioMuted 
                ? 'text-amber-300 hover:bg-amber-500/15' 
                : 'text-emerald-400 hover:bg-emerald-500/15'
            }`}
          >
            {isAudioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>
              {isAudioMuted 
                ? (language === 'vi' ? 'Bật tiếng' : 'Unmute') 
                : (language === 'vi' ? 'Đang phát âm thanh' : 'Sound active')}
            </span>
          </button>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif text-[#f5f0e6]/50">
            <VolumeX size={15} />
            <span>{language === 'vi' ? 'Micro của bạn (Tự tắt)' : 'Your microphone (Muted)'}</span>
          </span>
        )}
      </div>
    </div>
  );
};



const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    studyRoom: "Study Room",
    leave: "Leave",
    participants: "Participants",
    focus: "Focus",
    break: "Break",
    discover: "Discover",
    suggested: "Suggested",
    basedOnInterest: "Based on your interests",
    waiting: "Waiting...",
    chat: "Chat",
    goals: "Goals",
    notes: "Notes",
    typeMessage: "Type a message...",
    addNewGoal: "Add a new goal...",
    typeNotes: "Type your notes here...",
    ambience: "Ambience",
    lighting: "Lighting",
    uploadPic: "Upload Profile Picture",
    record: "Record",
    recordings: "Recordings",
    recordScreen: "Screen & Audio",
    recordAudio: "Audio Only"
  },
  vi: {
    studyRoom: "Phòng Học",
    leave: "Rời Khỏi",
    participants: "Người",
    focus: "Tập trung",
    break: "Nghỉ ngơi",
    discover: "Khám phá",
    suggested: "Đề xuất",
    basedOnInterest: "Dựa trên sở thích của bạn",
    waiting: "Đang chờ...",
    chat: "Trò chuyện",
    goals: "Mục tiêu",
    notes: "Ghi chú",
    typeMessage: "Nhập tin nhắn...",
    addNewGoal: "Thêm mục tiêu mới...",
    typeNotes: "Nhập ghi chú của bạn ở đây...",
    ambience: "Âm thanh",
    lighting: "Ánh sáng",
    uploadPic: "Tải lên ảnh hồ sơ",
    record: "Ghi lại",
    recordings: "Bản ghi",
    recordScreen: "Màn hình & âm thanh",
    recordAudio: "Chỉ âm thanh"
  }
};

const AMBIENT_SOUNDS = [
  { id: 'none', name: { en: 'None', vi: 'Tắt Nhạc (Mới)' }, icon: VolumeX, url: null },
  { id: 'rain', name: { en: 'Rain', vi: 'Tiếng mưa' }, icon: CloudRain, url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785316695/eryliaa-gentle-rain-for-relaxation-and-sleep-337279_kjbcn8.mp3' },
  { id: 'forest', name: { en: 'Forest', vi: 'Khu rừng' }, icon: TreePine, url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785316797/audiopapkin-forest-ambience-296528_pbouzo.mp3' },
  { id: 'cafe', name: { en: 'Cafe', vi: 'Quán cà phê' }, icon: Coffee, url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785317192/YTSave_YouTube_Media_VUFuXk0gECc_009_128k_sjwnrv.mp3' },
  { id: 'lofi', name: { en: 'Lofi Chill', vi: 'Lofi thư giãn' }, icon: Wind, url: 'https://res.cloudinary.com/avv55uce/video/upload/v1785317053/YTSave_YouTube_30-phut-nhac-Lofi-Chill-khong-loi-thu-gi_Media_ZX2mjf9dFH8_009_128k_j2tayp.mp3' },
];

const VISUAL_THEMES = [
  { id: 'lofi', name: { en: 'Lofi Room', vi: 'Phòng Lofi' }, icon: Coffee, url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4' },
  { id: 'ocean', name: { en: 'Ocean', vi: 'Đại dương' }, icon: CloudRain, url: 'https://res.cloudinary.com/demo/video/upload/ac_none,c_scale,w_1280/docs_demo/sea_turtle.mp4' },
  { id: 'snow', name: { en: 'Snow', vi: 'Tuyết rơi' }, icon: CloudSnow, url: 'https://res.cloudinary.com/demo/video/upload/ac_none,c_scale,w_1280/docs_demo/snow.mp4' },
  { id: 'nature', name: { en: 'Nature', vi: 'Thiên nhiên' }, icon: TreePine, url: 'https://res.cloudinary.com/demo/video/upload/ac_none,c_scale,w_1280/video/elephants.mp4' }
];

const StudyRoom: React.FC<StudyRoomProps> = ({ roomId, initialPin, createPrivate, onLeave, onJoinRoom, language }) => {
  const [peers, setPeers] = useState<PeerState[]>([]);
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCameraMirrored, setIsCameraMirrored] = useState(true);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [maximizedPeerId, setMaximizedPeerId] = useState<string | 'local' | null>(null);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  
  const [activeAmbience, setActiveAmbience] = useState('none');
  const [activeVisualTheme, setActiveVisualTheme] = useState('lofi');
  
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenAudioContextRef = useRef<AudioContext | null>(null);
  const [ambienceVolume, setAmbienceVolume] = useState(0.3);

  const localDisplayStream = useMemo(() => {
    if (isScreenSharing && screenTrackRef.current) {
      const currentAudio = userStream?.getAudioTracks()[0];
      const newStream = new MediaStream([screenTrackRef.current]);
      if (currentAudio) newStream.addTrack(currentAudio);
      return newStream;
    }
    if (!isCameraOff && userStream) {
      return userStream;
    }
    return undefined;
  }, [isScreenSharing, isCameraOff, userStream]);

  // Active View & Conditional Rendering for Video Grid to eliminate CPU and memory overhead
  const [activeGridPage, setActiveGridPage] = useState(0);
  const [isGridCollapsed, setIsGridCollapsed] = useState(false);
  const GRID_PAGE_SIZE = 4; // Render at most 4 active video streams simultaneously

  // Unified list of participants for video grid
  const allGridParticipants = useMemo(() => {
    return [
      { id: 'local' as const, isLocal: true, peer: undefined as PeerState | undefined },
      ...peers.map(p => ({ id: p.peerId, isLocal: false, peer: p }))
    ];
  }, [peers]);

  const totalGridPages = Math.max(1, Math.ceil(allGridParticipants.length / GRID_PAGE_SIZE));
  const safeActivePage = Math.min(activeGridPage, totalGridPages - 1);

  // Automatically adjust active page if participants leave
  useEffect(() => {
    if (activeGridPage >= totalGridPages) {
      setActiveGridPage(Math.max(0, totalGridPages - 1));
    }
  }, [totalGridPages, activeGridPage]);

  // Participants currently on the active view
  const visibleParticipants = useMemo(() => {
    if (isGridCollapsed) return [];
    const startIndex = safeActivePage * GRID_PAGE_SIZE;
    return allGridParticipants.slice(startIndex, startIndex + GRID_PAGE_SIZE);
  }, [allGridParticipants, safeActivePage, isGridCollapsed]);

  const visibleParticipantIds = useMemo(() => {
    return new Set(visibleParticipants.map(p => p.id));
  }, [visibleParticipants]);

  const isLocalVisibleOnActiveView = visibleParticipantIds.has('local');

  // Peers who are NOT currently visible on the active view
  const offscreenPeers = useMemo(() => {
    return peers.filter(p => !visibleParticipantIds.has(p.peerId));
  }, [peers, visibleParticipantIds]);

  // Active speaker page tracking
  const activeSpeakerPageIndex = useMemo(() => {
    if (!activeSpeakerId || activeSpeakerId === 'local') return -1;
    const idx = allGridParticipants.findIndex(p => p.id === activeSpeakerId);
    return idx >= 0 ? Math.floor(idx / GRID_PAGE_SIZE) : -1;
  }, [activeSpeakerId, allGridParticipants]);
  const [roomLight, setRoomLight] = useState(0.4);
  const [videoBlur, setVideoBlur] = useState(0);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const hideUiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let lastMoveTime = 0;
    const handleMouseMove = () => {
      const now = Date.now();
      if (now - lastMoveTime > 300) {
        lastMoveTime = now;
        setIsUiVisible(true);
      }
      if (hideUiTimeoutRef.current) {
        clearTimeout(hideUiTimeoutRef.current);
      }
      hideUiTimeoutRef.current = setTimeout(() => {
        setIsUiVisible(false);
      }, 5000);
    };
    
    handleMouseMove();
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideUiTimeoutRef.current) {
        clearTimeout(hideUiTimeoutRef.current);
      }
    };
  }, []);
  const [isAmbienceMenuOpen, setIsAmbienceMenuOpen] = useState(false);
  const [profilePic, setProfilePic] = useState<string | undefined>(undefined);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'chat' | 'goals' | 'notes' | 'participants' | 'recordings' | null>(null);
  const [completedSessionData, setCompletedSessionData] = useState<{ durationSeconds: number } | null>(null);
  const [notifications, setNotifications] = useState<{ id: string, message: string, type: 'info' | 'success' }[]>([]);

  // Real-time Firestore text chat synchronization for the room
  // Entirely decoupled from WebRTC to ensure streaming audio/video is never disrupted
  useEffect(() => {
    if (!roomId) return;

    const messagesPath = `rooms/${roomId}/messages`;
    const messagesQuery = query(
      collection(db, messagesPath),
      orderBy('createdAt', 'asc'),
      limit(200)
    );

    console.log(`[StudyRoom:FirestoreChat] Subscribing to messages in '${messagesPath}'`);

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const loadedMessages: ChatMessage[] = snapshot.docs.map(d => {
        const data = d.data();
        let ts = Date.now();
        if (data.createdAt?.toMillis) {
          ts = data.createdAt.toMillis();
        } else if (data.createdAt?.seconds) {
          ts = data.createdAt.seconds * 1000;
        }
        return {
          id: d.id,
          senderId: data.senderId || 'anon',
          senderName: data.senderName || (language === 'vi' ? 'Học viên' : 'Student'),
          senderProfilePic: data.senderProfilePic,
          text: data.text || '',
          timestamp: ts
        };
      });

      setMessages(loadedMessages);

      if (activeSidebarTab !== 'chat') {
        const addedChanges = snapshot.docChanges().filter(c => c.type === 'added');
        if (addedChanges.length > 0 && !snapshot.metadata.hasPendingWrites) {
          setUnreadChatCount(prev => prev + addedChanges.length);
        }
      }
    }, (error) => {
      console.warn("Firestore chat listener error:", error);
      handleFirestoreError(error, OperationType.GET, messagesPath);
    });

    return () => {
      console.log(`[StudyRoom:FirestoreChat] Unsubscribing from '${messagesPath}'`);
      unsubscribe();
    };
  }, [roomId, activeSidebarTab, language]);

  // Reset unread count when switching to chat tab
  useEffect(() => {
    if (activeSidebarTab === 'chat') {
      setUnreadChatCount(0);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [activeSidebarTab]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (activeSidebarTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeSidebarTab]);

  const addNotification = (message: string, type: 'info' | 'success' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };
  const [isLocked, setIsLocked] = useState(false);
  const [hostId, setHostId] = useState<string | null>(null);
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [isPrivateRoom, setIsPrivateRoom] = useState<boolean>(!!createPrivate);
  const [roomPin, setRoomPin] = useState<string | null>(initialPin || null);
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinPassword, setShowPinPassword] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityPinInput, setSecurityPinInput] = useState(initialPin || '');
  const [securityIsPrivate, setSecurityIsPrivate] = useState<boolean>(!!createPrivate);
  const [showCopiedLink, setShowCopiedLink] = useState(false);
  const [showCopiedPin, setShowCopiedPin] = useState(false);

  const [goals, setGoals] = useState<any[]>([]);
  const [sharedNotes, setSharedNotes] = useState('');
  const [newGoalText, setNewGoalText] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [notes, setNotes] = useState('');
  const [inputText, setInputText] = useState('');

  const callsRef = useRef<Map<string, any>>(new Map());
  const [recommendedRooms, setRecommendedRooms] = useState<any[]>([]);

  
  const [timerActive, setTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [timerTime, setTimerTime] = useState(25 * 60);
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [isTimerVisible, setIsTimerVisible] = useState(true);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [timerInputMinutes, setTimerInputMinutes] = useState('25');
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    // Initial check
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [reactions, setReactions] = useState<Record<string, { id: string; emoji: string }[]>>({});

  const [myUserName, setMyUserName] = useState<string>(() => {
    if (auth.currentUser?.displayName) return auth.currentUser.displayName;
    const saved = localStorage.getItem("study_user_name");
    if (saved) return saved;
    const randomNum = Math.floor(100 + Math.random() * 900);
    const genName = language === 'vi' ? `Học viên #${randomNum}` : `Student #${randomNum}`;
    localStorage.setItem("study_user_name", genName);
    return genName;
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(myUserName);

  const handleSaveName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setMyUserName(trimmed);
    localStorage.setItem("study_user_name", trimmed);
    setIsEditingName(false);
    if (socketRef.current) {
      socketRef.current.emit("update-user-name", { roomId, userName: trimmed });
    }
  };

  const [firestoreParticipants, setFirestoreParticipants] = useState<FirestoreParticipant[]>([]);

  // Stable session identifier for current participant presence document
  const [myParticipantSessionId] = useState<string>(() => {
    if (auth.currentUser?.uid) return auth.currentUser.uid;
    const sessionKey = `study_participant_sid_${roomId}`;
    let sid = sessionStorage.getItem(sessionKey);
    if (!sid) {
      sid = `guest_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
      try { sessionStorage.setItem(sessionKey, sid); } catch (_) {}
    }
    return sid;
  });

  // Real-time Firestore presence announcer and heartbeat
  useEffect(() => {
    if (!roomId) return;
    const participantDocRef = doc(db, 'rooms', roomId, 'participants', myParticipantSessionId);

    const publishPresence = async () => {
      try {
        await setDoc(participantDocRef, {
          participantId: myParticipantSessionId,
          userId: auth.currentUser?.uid || null,
          userName: myUserName,
          ...(profilePic ? { userProfilePic: profilePic } : {}),
          lastSeen: serverTimestamp()
        }, { merge: true });
        console.log(`[StudyRoom:FirestorePresence] Presence published for ${myUserName}`);
      } catch (err) {
        console.warn("[StudyRoom:FirestorePresence] Failed to publish presence:", err);
      }
    };

    publishPresence();
    const heartbeatTimer = setInterval(publishPresence, 25000);

    const cleanupPresence = async () => {
      try {
        await deleteDoc(participantDocRef);
      } catch (err) {
        console.warn("[StudyRoom:FirestorePresence] Cleanup error:", err);
      }
    };

    const handleBeforeUnload = () => {
      cleanupPresence();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupPresence();
    };
  }, [roomId, myParticipantSessionId, myUserName, profilePic]);

  // Real-time Firestore listener for all active participants in the study room
  useEffect(() => {
    if (!roomId) return;
    const participantsColRef = collection(db, 'rooms', roomId, 'participants');

    console.log(`[StudyRoom:FirestorePresence] Subscribing to participants in 'rooms/${roomId}/participants'`);

    const unsubscribe = onSnapshot(participantsColRef, (snapshot) => {
      const now = Date.now();
      const list: FirestoreParticipant[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        let lastSeenMs = now;
        if (data.lastSeen?.toMillis) {
          lastSeenMs = data.lastSeen.toMillis();
        } else if (data.lastSeen?.seconds) {
          lastSeenMs = data.lastSeen.seconds * 1000;
        }

        // Active if heartbeat updated within last 75 seconds or local pending write
        if ((now - lastSeenMs < 75000) || docSnap.metadata.hasPendingWrites || docSnap.id === myParticipantSessionId) {
          list.push({
            id: docSnap.id,
            participantId: data.participantId || docSnap.id,
            userId: data.userId,
            userName: data.userName || (language === 'vi' ? 'Học viên' : 'Student'),
            userProfilePic: data.userProfilePic,
            lastSeen: lastSeenMs
          });
        }
      });

      // Guarantee local user is always represented
      const hasSelf = list.some(p => p.id === myParticipantSessionId || p.participantId === myParticipantSessionId);
      if (!hasSelf) {
        list.push({
          id: myParticipantSessionId,
          participantId: myParticipantSessionId,
          userId: auth.currentUser?.uid,
          userName: myUserName,
          userProfilePic: profilePic,
          lastSeen: now
        });
      }

      setFirestoreParticipants(list);
    }, (error) => {
      console.warn("[StudyRoom:FirestorePresence] Listener error:", error);
      handleFirestoreError(error, OperationType.GET, `rooms/${roomId}/participants`);
    });

    return () => {
      console.log(`[StudyRoom:FirestorePresence] Unsubscribing from 'rooms/${roomId}/participants'`);
      unsubscribe();
    };
  }, [roomId, myParticipantSessionId, myUserName, profilePic, language]);

  // Session Screen & Audio Recording States
  const [recordingsList, setRecordingsList] = useState<SessionRecordingItem[]>([]);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'screen' | 'audio' | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [previewRecording, setPreviewRecording] = useState<{ url: string; title: string; type: 'screen' | 'audio'; size?: number } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localBlobUrlsMap = useRef<Map<string, string>>(new Map());

  // Real-time Firestore recordings synchronization for the room
  useEffect(() => {
    if (!roomId) return;
    const recordingsPath = `rooms/${roomId}/recordings`;
    const q = query(
      collection(db, recordingsPath),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    console.log(`[StudyRoom:Recordings] Subscribing to recordings in '${recordingsPath}'`);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: SessionRecordingItem[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let ts = Date.now();
        if (data.createdAt?.toMillis) ts = data.createdAt.toMillis();
        else if (data.createdAt?.seconds) ts = data.createdAt.seconds * 1000;

        const localUrl = localBlobUrlsMap.current.get(docSnap.id);

        return {
          id: docSnap.id,
          title: data.title || (language === 'vi' ? 'Bản ghi phòng học' : 'Study Session Recording'),
          roomId: data.roomId || roomId,
          type: data.type === 'audio' ? 'audio' : 'screen',
          durationSeconds: data.durationSeconds || 0,
          fileSizeBytes: data.fileSizeBytes,
          mimeType: data.mimeType,
          downloadUrl: localUrl || data.downloadUrl || '',
          recordedById: data.recordedById || '',
          recordedByName: data.recordedByName || (language === 'vi' ? 'Học viên' : 'Student'),
          createdAt: ts
        };
      });

      setRecordingsList(items);
    }, (error) => {
      console.warn("[StudyRoom:Recordings] Listener error:", error);
      handleFirestoreError(error, OperationType.GET, recordingsPath);
    });

    return () => {
      console.log(`[StudyRoom:Recordings] Unsubscribing from '${recordingsPath}'`);
      unsubscribe();
    };
  }, [roomId, language]);

  const startRecording = async (type: 'screen' | 'audio') => {
    try {
      let stream: MediaStream;
      if (type === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        // Optionally add local mic audio if enabled and available
        if (userStream && !isMuted) {
          const micTrack = userStream.getAudioTracks()[0];
          if (micTrack) {
            try {
              stream.addTrack(micTrack.clone());
            } catch (_) {}
          }
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
      }

      recordingStreamRef.current = stream;
      recordedChunksRef.current = [];

      let mimeType = '';
      if (type === 'screen') {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          mimeType = 'video/webm;codecs=vp9,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        }
      } else {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const finalBlob = new Blob(recordedChunksRef.current, {
          type: mimeType || (type === 'screen' ? 'video/webm' : 'audio/webm')
        });
        const localBlobUrl = URL.createObjectURL(finalBlob);
        const finalDuration = recordingDuration;

        // Cleanup media tracks
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach(t => t.stop());
          recordingStreamRef.current = null;
        }

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date().toLocaleDateString();
        const defaultTitle = type === 'screen'
          ? (language === 'vi' ? `Bản ghi màn hình • ${timeStr} (${dateStr})` : `Screen Recording • ${timeStr} (${dateStr})`)
          : (language === 'vi' ? `Bản ghi âm thanh • ${timeStr} (${dateStr})` : `Audio Recording • ${timeStr} (${dateStr})`);

        const currentUserId = auth.currentUser?.uid || peerManagerRef.current?.getPeerId() || myPeerId || 'anon';
        const recordingsPath = `rooms/${roomId}/recordings`;

        try {
          const docRef = await addDoc(collection(db, recordingsPath), {
            title: defaultTitle,
            roomId,
            type,
            durationSeconds: finalDuration,
            fileSizeBytes: finalBlob.size,
            mimeType: finalBlob.type,
            downloadUrl: localBlobUrl,
            recordedById: currentUserId,
            recordedByName: myUserName,
            createdAt: serverTimestamp()
          });

          localBlobUrlsMap.current.set(docRef.id, localBlobUrl);

          setPreviewRecording({
            url: localBlobUrl,
            title: defaultTitle,
            type,
            size: finalBlob.size
          });

          addNotification(
            language === 'vi' ? 'Đã lưu bản ghi phòng học vào Firestore thành công!' : 'Study recording saved to Firestore successfully!',
            'success'
          );
        } catch (err) {
          console.error("[StudyRoom:Recording] Error saving to Firestore:", err);
          handleFirestoreError(err, OperationType.CREATE, recordingsPath);
        }
      };

      // Auto stop if user clicks browser "Stop sharing" button
      if (type === 'screen') {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            stopRecording();
          };
        }
      }

      recorder.start(1000);
      setIsRecording(true);
      setRecordingType(type);
      setRecordingDuration(0);
      setIsRecordingPaused(false);
      setIsRecordingModalOpen(false);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      triggerHaptic('medium');
      addNotification(
        language === 'vi' 
          ? `Bắt đầu ghi ${type === 'screen' ? 'màn hình & âm thanh' : 'âm thanh'}...` 
          : `Started recording ${type === 'screen' ? 'screen & audio' : 'audio'}...`,
        'info'
      );
    } catch (err: any) {
      console.warn("[StudyRoom:Recording] Start error:", err);
      if (err.name !== 'NotAllowedError') {
        addNotification(language === 'vi' ? 'Không thể bắt đầu ghi âm/hình.' : 'Could not start recording.', 'info');
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsRecordingPaused(true);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      triggerHaptic('light');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsRecordingPaused(false);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      triggerHaptic('light');
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsRecordingPaused(false);
    triggerHaptic('success');
  };

  const deleteRecording = async (recordingId: string) => {
    const recordingsPath = `rooms/${roomId}/recordings`;
    try {
      await deleteDoc(doc(db, 'rooms', roomId, 'recordings', recordingId));
      addNotification(language === 'vi' ? 'Đã xóa bản ghi' : 'Recording deleted', 'info');
    } catch (err) {
      console.error("[StudyRoom:Recording] Delete error:", err);
      handleFirestoreError(err, OperationType.DELETE, `${recordingsPath}/${recordingId}`);
    }
  };

  const handleMaximizePeer = useCallback((targetId: string | 'local') => {
    const isLocal = targetId === 'local';
    const targetPeer = isLocal ? null : peers.find(p => p.peerId === targetId);
    const targetStream = isLocal ? localDisplayStream : targetPeer?.stream;
    console.log(`[StudyRoom:UserAction] User expanded stream for target '${targetId}':`, {
      isLocal,
      targetPeerName: isLocal ? myUserName : targetPeer?.userName,
      targetIsCameraOff: isLocal ? isCameraOff : targetPeer?.isCameraOff,
      targetIsScreenSharing: isLocal ? isScreenSharing : targetPeer?.isScreenSharing,
      hasStream: !!targetStream,
      streamId: targetStream?.id,
      streamActive: targetStream?.active,
      tracks: targetStream ? targetStream.getTracks().map(t => ({
        kind: t.kind,
        id: t.id,
        label: t.label,
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState
      })) : []
    });
    setMaximizedPeerId(targetId);
  }, [peers, localDisplayStream, myUserName, isCameraOff, isScreenSharing]);

  const userVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<any>(null);
  const peerManagerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number>(0);
  const audioAnalyzers = useRef<Map<string, { analyzer: AnalyserNode, dataArray: Uint8Array }>>(new Map());

  // Handle translation
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  
  const saveNotes = (newNotes: string) => { socketRef.current.emit('update-notes', { roomId, notes: newNotes }); };
  const resetTimer = () => {
    setTimerActive(false);
    setTimerTime(initialTime);
  };

  const handleSetTimer = () => {
    const mins = parseInt(timerInputMinutes) || 0;
    const totalSeconds = mins * 60;
    setTimerTime(totalSeconds);
    setInitialTime(totalSeconds);
    setIsEditingTimer(false);
  };
  
  const toggleTimer = () => {
    if (!timerActive && timerTime === 0) {
      handleSetTimer();
    }
    setTimerActive(prev => !prev);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timerTime > 0) {
      interval = setInterval(() => {
        setTimerTime(prev => prev - 1);
      }, 1000);
    } else if (timerTime === 0 && timerActive) {
      setTimerActive(false);
      const sessionDuration = initialTime > 0 ? initialTime : 25 * 60;
      if (auth.currentUser) {
        addDoc(collection(db, 'studySessions'), {
          userId: auth.currentUser.uid,
          durationSeconds: sessionDuration,
          startTime: sessionStartTime,
          endTime: new Date(),
          isAmbientActive: activeAmbience !== 'none'
        }).catch(console.error);
      }
      setCompletedSessionData({ durationSeconds: sessionDuration });
      // auto hide after 8s
      setTimeout(() => setCompletedSessionData(null), 8000);
      addNotification(language === 'vi' ? '🎉 Hoàn thành phiên học tập tập trung!' : '🎉 Focus session completed!', 'success');
    }
    return () => clearInterval(interval);
  }, [timerActive, timerTime, initialTime, sessionStartTime, activeAmbience, language]);



  // Ambient sound player handler
  const playAmbience = (soundId: string) => {
    const nextAmbience = activeAmbience === soundId ? 'none' : soundId;
    setActiveAmbience(nextAmbience);
    
    // Play synchronously to avoid browser autoplay blocking
    if (audioRef.current) {
      const soundObj = AMBIENT_SOUNDS.find(s => s.id === nextAmbience);
      if (!soundObj || !soundObj.url || nextAmbience === 'none') {
        audioRef.current.pause();
      } else {
        audioRef.current.src = soundObj.url;
        audioRef.current.volume = ambienceVolume || 0.3;
        audioRef.current.play().catch(e => console.warn("Direct play failed:", e));
      }
    }
  };

  const handleAmbienceVolumeChange = (vol: number) => {
    setAmbienceVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = ambienceVolume;
    }
  }, [ambienceVolume]);

  // Removed buggy useEffect for audio to ensure synchronous play

  const t = TRANSLATIONS[language];

  // Voice activity detection
  const setupAudioAnalysis = (stream: MediaStream, peerId: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      audioAnalyzers.current.set(peerId, { analyzer, dataArray });
    } catch (err) {
      console.warn("Failed to setup audio analysis for", peerId, err);
    }
  };

  const checkAudioLevels = useCallback(() => {
    let maxLevel = 0;
    let currentSpeaker = null;

    audioAnalyzers.current.forEach(({ analyzer, dataArray }, peerId) => {
      analyzer.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;
      if (average > maxLevel && average > 30) {
        maxLevel = average;
        currentSpeaker = peerId;
      }
    });

    setActiveSpeakerId(currentSpeaker);
    rafRef.current = requestAnimationFrame(checkAudioLevels);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(checkAudioLevels);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [checkAudioLevels]);

  // Main initialization
  useEffect(() => {
    if (!roomId) return;
    
    // Load local profile pic
    const savedPic = localStorage.getItem(`profilePic_${auth.currentUser?.uid || 'anon'}`);
    if (savedPic) setProfilePic(savedPic);

    socketRef.current = io(window.location.origin, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    console.log("Attempting to connect to signaling server at:", window.location.origin);
    
    // "connect" fires on the very first connection AND on every successful
    // reconnect after a drop. We use hasConnectedBefore to tell those apart.
    let hasConnectedBefore = false;
    socketRef.current.on("connect", () => {
      console.log("Connected to signaling server! Socket ID:", socketRef.current.id);

      if (hasConnectedBefore) {
        // This is a reconnect (e.g. the browser's screen-share picker froze
        // the tab long enough to hit the signaling server's ping timeout).
        // The server already dropped us from its room roster on the old
        // socket and told everyone else we "left". Re-join so we show back
        // up in the participant list. Without this, the peer-to-peer media
        // connection can keep running (so you never "left" from your own
        // point of view) while everyone else's participant list drops you.
        console.log("This is a reconnect, re-joining room...");
        const myId = peerManagerRef.current?.getPeerId() || myPeerId;
        if (myId) {
          socketRef.current.emit("join-room", { 
            roomId, 
            peerId: myId, 
            userName: currentUserName, 
            profilePic: savedPic || undefined,
            isCameraOff,
            isScreenSharing,
            pin: roomPin || initialPin || (pinInput ? pinInput.trim() : undefined),
            createPrivate: !!createPrivate,
            initialPin: initialPin ? initialPin.trim() : undefined
          });
          socketRef.current.emit("media-state", {
            roomId,
            peerId: myId,
            isCameraOff,
            isScreenSharing
          });
        }
      }
      hasConnectedBefore = true;
    });

    socketRef.current.on("connect_error", (err: any) => {
      console.error("Signaling connection error details:", err.message, err.type, err.context);
    });

    const currentUserName = myUserName;
    
    const initPeerManager = (stream?: MediaStream) => {
      const manager = new PeerConnectionManager(roomId, currentUserName, stream);
      peerManagerRef.current = manager;

      manager.onStream((peerId, remoteStream, remoteUserName) => {
        console.log(`[StudyRoom:RemoteStream] Remote stream received from peer '${peerId}' (${remoteUserName}):`, {
          streamId: remoteStream.id,
          active: remoteStream.active,
          tracks: remoteStream.getTracks().map(t => ({
            kind: t.kind,
            id: t.id,
            label: t.label,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState
          }))
        });

        remoteStream.onaddtrack = (e) => {
          console.log(`[StudyRoom:RemoteStreamTrack] Track added to stream ${remoteStream.id} from ${peerId}:`, e.track.kind, e.track.id, e.track.label);
        };
        remoteStream.onremovetrack = (e) => {
          console.log(`[StudyRoom:RemoteStreamTrack] Track removed from stream ${remoteStream.id} from ${peerId}:`, e.track.kind, e.track.id);
        };

        setPeers(prev => {
          const exists = prev.find(p => p.peerId === peerId);
          if (exists) {
            return prev.map(p => p.peerId === peerId ? { ...p, stream: remoteStream, userName: remoteUserName || p.userName } : p);
          }
          return [...prev, { peerId, stream: remoteStream, userName: remoteUserName || (language === 'vi' ? "Học viên" : "Student") }];
        });
        setupAudioAnalysis(remoteStream, peerId);
      });

      manager.onUserLeft((peerId) => {
        console.log("PeerJS stream disconnected for:", peerId);
        setPeers(prev => prev.map(p => p.peerId === peerId ? { ...p, stream: undefined } : p));
        audioAnalyzers.current.delete(peerId);
      });

      manager.onOpen((peerId) => {
        console.log("My Peer ID is ready:", peerId);
        setMyPeerId(peerId);
        const currentPic = savedPic || undefined;
        socketRef.current.emit("join-room", { 
          roomId, 
          peerId, 
          userName: currentUserName, 
          profilePic: currentPic,
          isCameraOff: true,
          isScreenSharing: false,
          pin: roomPin || initialPin || (pinInput ? pinInput.trim() : undefined),
          createPrivate: !!createPrivate,
          initialPin: initialPin ? initialPin.trim() : undefined
        });
        // Emit our initial state to the room so people know if we are muted/black screen
        setTimeout(() => {
          socketRef.current.emit("media-state", { roomId, peerId, isCameraOff: true, isScreenSharing: false });
        }, 500);
      });
    };

    // 1. Setup Local Stream
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true }).then((stream) => {
      // Set initial camera & microphone state to OFF (muted) when first entering
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = false;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = false;
      
      setUserStream(stream);
      streamRef.current = stream;
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }
      setupAudioAnalysis(stream, 'local');
      initPeerManager(stream);
    }).catch(err => {
      console.warn("Media access denied:", err);
      initPeerManager(undefined);
    });

    const refreshConnections = () => {
      console.log("Manually refreshing connections...");
      socketRef.current.emit("request-all-users", roomId);
    };

    // 2. Socket Events
    socketRef.current.on("user-joined", (payload: { peerId: string, userName: string, profilePic?: string, isCameraOff?: boolean, isScreenSharing?: boolean }) => {
      console.log("User joined notification received:", payload);
      const myId = peerManagerRef.current?.getPeerId() || myPeerId;
      if (!payload.peerId || payload.peerId === myId) return;
      
      // When someone joins, broadcast our current state so they know
      socketRef.current.emit("media-state", { 
        roomId, 
        peerId: myId, 
        isCameraOff,
        isScreenSharing
      });

      const formattedName = payload.userName || (language === 'vi' ? "Học viên" : "Student");
      addNotification(`${formattedName} ${language === 'vi' ? "đã tham gia phòng" : "joined the room"}`, 'success');

      // Add to peers list immediately
      setPeers(prev => {
        const exists = prev.find(p => p.peerId === payload.peerId);
        if (exists) {
          return prev.map(p => p.peerId === payload.peerId ? { 
            ...p, 
            userName: formattedName, 
            profilePic: payload.profilePic,
            isCameraOff: payload.isCameraOff ?? p.isCameraOff,
            isScreenSharing: payload.isScreenSharing ?? p.isScreenSharing
          } : p);
        }
        return [...prev, { 
          peerId: payload.peerId, 
          userName: formattedName, 
          profilePic: payload.profilePic,
          isCameraOff: payload.isCameraOff ?? true,
          isScreenSharing: payload.isScreenSharing ?? false
        }];
      });
    });

    socketRef.current.on("all-users", (users: { socketId: string, peerId: string, userName: string, profilePic?: string, isCameraOff?: boolean, isScreenSharing?: boolean }[]) => {
      console.log("Received all room users:", users);
      const myId = peerManagerRef.current?.getPeerId() || myPeerId;
      const otherUsers = users.filter(u => u.peerId && u.peerId !== myId);
      
      // Update participants list immediately
      setPeers(prev => {
        const existingMap = new Map(prev.map(p => [p.peerId, p]));
        otherUsers.forEach(u => {
          const uName = u.userName || (language === 'vi' ? "Học viên" : "Student");
          const existing = existingMap.get(u.peerId);
          existingMap.set(u.peerId, { 
            peerId: u.peerId, 
            userName: uName, 
            profilePic: u.profilePic,
            isCameraOff: u.isCameraOff ?? true,
            isScreenSharing: u.isScreenSharing ?? false,
            stream: existing?.stream
          });
        });
        return Array.from(existingMap.values());
      });

      // Call each existing user with increasing delays
      otherUsers.forEach((user, index) => {
        setTimeout(() => {
          if (peerManagerRef.current) {
            console.log("Calling existing user:", user.userName, user.peerId);
            peerManagerRef.current?.callUser(user.peerId, currentUserName);
          }
        }, 500 + (index * 500));
      });
    });


    socketRef.current.on("user-updated", (payload: { peerId: string, profilePic?: string, userName?: string }) => {
      setPeers(prev => prev.map(p => p.peerId === payload.peerId ? { 
        ...p, 
        profilePic: payload.profilePic !== undefined ? payload.profilePic : p.profilePic, 
        userName: payload.userName || p.userName 
      } : p));
    });

    socketRef.current.on("user-updated-name", (payload: { peerId: string, userName: string }) => {
      setPeers(prev => prev.map(p => p.peerId === payload.peerId ? { ...p, userName: payload.userName } : p));
    });

    socketRef.current.on("user-left", (payload: { socketId: string, peerId?: string }) => {
      if (payload.peerId) {
        setPeers(prev => {
          const leavingUser = prev.find(p => p.peerId === payload.peerId);
          if (leavingUser) {
            addNotification(`${leavingUser.userName || (language === 'vi' ? "Học viên" : "Student")} ${language === 'vi' ? "đã rời phòng" : "left the room"}`, 'info');
          }
          return prev.filter(p => p.peerId !== payload.peerId);
        });
        audioAnalyzers.current.delete(payload.peerId);
      }
    });

        socketRef.current.on("media-state", (payload: { peerId: string, isScreenSharing?: boolean, isCameraOff?: boolean }) => {
      setPeers(prev => prev.map(p => {
        if (p.peerId === payload.peerId) {
          return {
            ...p,
            ...(payload.isScreenSharing !== undefined && { isScreenSharing: payload.isScreenSharing }),
            ...(payload.isCameraOff !== undefined && { isCameraOff: payload.isCameraOff })
          };
        }
        return p;
      }));
    });

    socketRef.current.on("receive-message", () => {
      // Ignored for UI state: persistent real-time chat is synchronized via Firestore onSnapshot
    });

    socketRef.current.on("receive-reaction", (payload: { reaction: string, targetPeerId: string, senderId: string }) => {
      setReactions(prev => ({
        ...prev,
        [payload.targetPeerId]: [...(prev[payload.targetPeerId] || []), { id: Math.random().toString(), emoji: payload.reaction }]
      }));
      setTimeout(() => {
        setReactions(prev => ({
          ...prev,
          [payload.targetPeerId]: prev[payload.targetPeerId].slice(1)
        }));
      }, 3000);
    });

    socketRef.current.on("update-goals", (goals: any[]) => {
      setGoals(goals);
    });

    socketRef.current.on("update-notes", (notes: string) => {
      setSharedNotes(notes);
      setNotes(notes);
    });

    socketRef.current.on("room-info", (info: { hostId: string, isLocked: boolean, isPrivate?: boolean, pin?: string }) => {
      setHostId(info.hostId);
      setIsLocked(info.isLocked);
      setIsPrivateRoom(!!info.isPrivate);
      setSecurityIsPrivate(!!info.isPrivate);
      if (info.pin) {
        setRoomPin(info.pin);
        setSecurityPinInput(info.pin);
      } else if (!info.isPrivate) {
        setRoomPin(null);
      }
    });

    socketRef.current.on("room-locked-update", (payload: { isLocked: boolean }) => {
      setIsLocked(payload.isLocked);
    });

    socketRef.current.on("join-failed", (payload: { reason: string, roomId?: string, requiresPin?: boolean, message?: string }) => {
      if (payload.reason === "invalid-pin") {
        setIsPinPromptOpen(true);
        setPinError(payload.message || (language === "vi" ? "Phòng này yêu cầu mã PIN chính xác để vào." : "This room requires a valid PIN to enter."));
      } else if (payload.reason === "locked") {
        alert(language === "vi" ? "Phòng này đã bị khóa bởi chủ phòng." : "This room has been locked by the host.");
        onLeave();
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (peerManagerRef.current) {
        peerManagerRef.current.destroy();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: any) => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
        
      }
    };
  }, [roomId, auth.currentUser]);

  
  const sendReaction = (reaction: string, targetPeerId: string) => {
    socketRef.current.emit('send-reaction', { roomId, reaction, targetPeerId });
    setReactions(prev => ({
      ...prev,
      [targetPeerId]: [...(prev[targetPeerId] || []), { id: Math.random().toString(), emoji: reaction }]
    }));
    setTimeout(() => {
      setReactions(prev => ({
        ...prev,
        [targetPeerId]: prev[targetPeerId].slice(1)
      }));
    }, 3000);
  };

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePic(base64String);
        try { 
          localStorage.setItem(`profilePic_${auth.currentUser?.uid || "anon"}`, base64String); 
        } catch (e) { 
          console.warn("Quota exceeded for profile pic", e); 
        }
        if (socketRef.current && roomId) {
          socketRef.current.emit("update-profile-pic", { roomId, profilePic: base64String });
        }
        addNotification(language === 'vi' ? 'Cập nhật ảnh đại diện thành công' : 'Avatar updated successfully', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = async () => {
    // If local stream has no video track yet, request it
    if (!streamRef.current || streamRef.current.getVideoTracks().length === 0) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
        setUserStream(stream);
        streamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
        setupAudioAnalysis(stream, 'local');
        setIsCameraOff(false);
        setIsMuted(false);
        const vTrack = stream.getVideoTracks()[0];
        if (vTrack) {
          vTrack.enabled = true;
          peerManagerRef.current?.replaceVideoTrack(vTrack);
        }
        socketRef.current?.emit("media-state", {
          roomId,
          peerId: peerManagerRef.current?.getPeerId() || myPeerId,
          isCameraOff: false,
          isScreenSharing: false
        });
        return;
      } catch (err) {
        console.warn("Could not get camera access:", err);
        addNotification(language === 'vi' ? 'Không thể truy cập camera' : 'Cannot access camera', 'info');
        return;
      }
    }

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const nextState = !isCameraOff; // if was on (isCameraOff false), turn off (true)
      videoTrack.enabled = !nextState;
      setIsCameraOff(nextState);

      if (!nextState) {
        // Turning camera ON -> replace with live camera track
        peerManagerRef.current?.replaceVideoTrack(videoTrack);
      } else {
        // Turning camera OFF -> replace with blank video track
        try {
          const blankTrack = createBlankVideoTrack();
          peerManagerRef.current?.replaceVideoTrack(blankTrack);
        } catch (e) {
          console.warn(e);
        }
      }

      socketRef.current?.emit("media-state", {
        roomId,
        peerId: peerManagerRef.current?.getPeerId() || myPeerId,
        isCameraOff: nextState,
        isScreenSharing: false
      });
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Close active screen audio mixer
      if (screenAudioContextRef.current) {
        screenAudioContextRef.current.close().catch(() => {});
        screenAudioContextRef.current = null;
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      setIsScreenSharing(false);

      // Revert audio track back to microphone
      const originalMicTrack = streamRef.current?.getAudioTracks()[0];
      if (originalMicTrack && peerManagerRef.current) {
        peerManagerRef.current.replaceAudioTrack(originalMicTrack);
      }
      
      // Revert back to camera track if camera was on, or blank track if camera was off
      if (streamRef.current && !isCameraOff) {
        const camTrack = streamRef.current.getVideoTracks()[0];
        if (camTrack) {
          camTrack.enabled = true;
          peerManagerRef.current?.replaceVideoTrack(camTrack);
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = streamRef.current;
          }
        }
      } else {
        try {
          const blankTrack = createBlankVideoTrack();
          peerManagerRef.current?.replaceVideoTrack(blankTrack);
        } catch (e) {}
      }

      socketRef.current?.emit("media-state", {
        roomId,
        peerId: peerManagerRef.current?.getPeerId() || myPeerId,
        isScreenSharing: false,
        isCameraOff
      });
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return;
      
      screenTrackRef.current = screenTrack;
      const screenAudioTrack = screenStream.getAudioTracks()[0];

      // Screen audio mixing with microphone
      if (screenAudioTrack) {
        try {
          const micTrack = streamRef.current?.getAudioTracks()[0];
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            screenAudioContextRef.current = audioCtx;
            const dest = audioCtx.createMediaStreamDestination();
            
            // Connect screen audio
            const screenSource = audioCtx.createMediaStreamSource(new MediaStream([screenAudioTrack]));
            screenSource.connect(dest);

            // Connect microphone audio if present
            if (micTrack) {
              const micSource = audioCtx.createMediaStreamSource(new MediaStream([micTrack]));
              micSource.connect(dest);
            }

            const mixedTrack = dest.stream.getAudioTracks()[0];
            if (peerManagerRef.current && mixedTrack) {
              peerManagerRef.current.replaceAudioTrack(mixedTrack);
              console.log("[StudyRoom:ScreenAudio] Broadcasted mixed screen and mic audio to peers.");
            }
          } else if (peerManagerRef.current) {
            peerManagerRef.current.replaceAudioTrack(screenAudioTrack);
          }
        } catch (audioMixErr) {
          console.warn("[StudyRoom:ScreenAudio] Audio mixing fallback to direct screen audio:", audioMixErr);
          if (peerManagerRef.current && screenAudioTrack) {
            peerManagerRef.current.replaceAudioTrack(screenAudioTrack);
          }
        }
      }
      
      screenTrack.onended = () => {
        toggleScreenShare(); // revert when stopped from browser chrome UI
      };
      
      if (userVideoRef.current) {
        const currentAudio = streamRef.current?.getAudioTracks()[0];
        const newStream = new MediaStream([screenTrack]);
        if (currentAudio) newStream.addTrack(currentAudio);
        userVideoRef.current.srcObject = newStream;
      }
      
      setIsScreenSharing(true);
      setIsCameraOff(false);
      
      // Update peers video
      if (peerManagerRef.current) {
        peerManagerRef.current.replaceVideoTrack(screenTrack);
      }
      
      socketRef.current?.emit("media-state", {
        roomId,
        peerId: peerManagerRef.current?.getPeerId() || myPeerId,
        isScreenSharing: true,
        isCameraOff: false
      });
    } catch (e) {
      console.warn("Screen share cancelled or failed:", e);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    setInputText("");
    const currentUserId = auth.currentUser?.uid;
    const currentPeerId = peerManagerRef.current?.getPeerId() || myPeerId;
    const currentSocketId = socketRef.current?.id;
    const senderId = currentUserId || currentPeerId || currentSocketId || 'anon';
    const senderName = myUserName;
    const senderProfilePic = profilePic || undefined;

    // Send to Firestore in the background - strictly independent from WebRTC streams
    const messagesPath = `rooms/${roomId}/messages`;
    try {
      await addDoc(collection(db, messagesPath), {
        text,
        senderId,
        senderName,
        ...(senderProfilePic ? { senderProfilePic } : {}),
        createdAt: serverTimestamp()
      });
      console.log("[StudyRoom:FirestoreChat] Message successfully written to Firestore");
    } catch (error) {
      console.error("[StudyRoom:FirestoreChat] Error writing message to Firestore:", error);
      handleFirestoreError(error, OperationType.CREATE, messagesPath);
    }
  };

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;
    const newGoal = {
      id: Math.random().toString(36).substring(7),
      text: goalInput,
      completed: false
    };
    socketRef.current.emit('add-goal', { roomId, goal: newGoal });
    setGoalInput("");
  };

  const toggleGoal = (goalId: string) => {
    socketRef.current.emit('toggle-goal', { roomId, goalId });
  };

  const deleteGoal = (goalId: string) => {
    socketRef.current.emit('delete-goal', { roomId, goalId });
  };

  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) {
      setPinError(language === 'vi' ? 'Vui lòng nhập mã PIN' : 'Please enter the room PIN');
      return;
    }
    setPinError(null);
    const myId = peerManagerRef.current?.getPeerId() || myPeerId;
    const currentPic = localStorage.getItem(`profilePic_${auth.currentUser?.uid || 'anon'}`) || undefined;
    
    socketRef.current?.emit("join-room", {
      roomId,
      peerId: myId,
      userName: myUserName,
      profilePic: currentPic,
      isCameraOff,
      isScreenSharing,
      pin: pinInput.trim()
    });
    setRoomPin(pinInput.trim());
    setIsPinPromptOpen(false);
  };

  const handleSaveSecurity = async (makePrivate: boolean, newPin?: string) => {
    if (makePrivate && (!newPin || !newPin.trim())) {
      alert(language === 'vi' ? 'Vui lòng nhập mã PIN cho phòng riêng tư' : 'Please enter a PIN for the private room');
      return;
    }
    const cleanPin = makePrivate ? newPin?.trim() : undefined;
    socketRef.current?.emit("set-room-security", {
      roomId,
      isPrivate: makePrivate,
      pin: cleanPin
    });

    // Sync room security and PIN to Firestore
    try {
      await setDoc(doc(db, 'rooms', roomId), {
        roomId,
        isPrivate: makePrivate,
        pin: cleanPin || '',
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn("Could not sync room security to Firestore:", e);
    }

    setIsPrivateRoom(makePrivate);
    if (makePrivate && newPin) {
      setRoomPin(newPin.trim());
      setSecurityPinInput(newPin.trim());
    } else if (!makePrivate) {
      setRoomPin(null);
      setSecurityPinInput('');
    }
    setIsSecurityModalOpen(false);
    addNotification(
      language === 'vi'
        ? (makePrivate ? 'Đã kích hoạt chế độ riêng tư có mã PIN' : 'Đã chuyển sang phòng cộng đồng công khai')
        : (makePrivate ? 'Switched to private room with PIN' : 'Switched to public community room'),
      'success'
    );
  };

  const copyRoomDetails = () => {
    const text = isPrivateRoom && roomPin
      ? `${language === 'vi' ? 'Tham gia phòng học riêng tư StudyWithMe' : 'Join my private study room on StudyWithMe'}\nRoom ID: ${roomId}\nMã PIN: ${roomPin}\nLink: ${window.location.origin}`
      : `${language === 'vi' ? 'Tham gia phòng học cộng đồng StudyWithMe' : 'Join my study room on StudyWithMe'}\nRoom ID: ${roomId}\nLink: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setShowCopiedLink(true);
    setTimeout(() => setShowCopiedLink(false), 2500);
    addNotification(language === 'vi' ? 'Đã sao chép thông tin phòng vào clipboard' : 'Copied room info to clipboard', 'success');
  };

  const copyOnlyPin = () => {
    if (roomPin) {
      navigator.clipboard.writeText(roomPin);
      setShowCopiedPin(true);
      setTimeout(() => setShowCopiedPin(false), 2000);
      addNotification(language === 'vi' ? 'Đã sao chép mã PIN' : 'Copied PIN', 'success');
    }
  };

  const toggleLock = () => {
    const nextLocked = !isLocked;
    socketRef.current.emit('lock-room', { roomId, locked: nextLocked });
  };

  const isHost = hostId && myPeerId === hostId;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[100] flex flex-col text-white font-inter bg-black overflow-hidden ${!isUiVisible ? "cursor-none" : ""}`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      
      <audio 
        ref={audioRef} 
        loop 
        preload="auto"
        className="hidden"
        
      />
      {VISUAL_THEMES.filter(theme => theme.id === activeVisualTheme).map(theme => (
        <video 
          key={theme.id}
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-all duration-[1500ms] ease-in-out opacity-100 scale-100"
          style={{ filter: `blur(${videoBlur}px)` }}
          src={theme.url} 
        />
      ))}
      
      {/* Room Light Overlay */}
      <motion.div 
        animate={{ opacity: roomLight }}
        className="absolute inset-0 bg-black pointer-events-none z-10"
      />

      {/* Header */}
      <header className={`relative z-20 p-2 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0 border-b border-white/10 bg-black/40 backdrop-blur-md transition-opacity duration-700 ${isUiVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto flex-wrap">
          <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
          <h2 className="italic text-xl" style={{ fontFamily: "'Source Serif 4', serif" }}>{t.studyRoom}</h2>
          {isHost && (
            <span className="px-1.5 py-0.5 rounded-md bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 text-[8px] font-black uppercase tracking-tighter">Host</span>
          )}
          <span className="text-xs text-white/60 font-mono uppercase tracking-wider px-2 py-1 rounded bg-white/10 border border-white/20">
            {roomId}
          </span>
          {/* Room Security Badge */}
          {isPrivateRoom ? (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-sm shadow-purple-500/10">
              <Lock size={12} className="text-purple-400" />
              <span>{language === 'vi' ? 'Riêng tư' : 'Private'}</span>
              {isHost && roomPin && (
                <span className="ml-1 text-[10px] text-purple-200/80 font-mono bg-purple-500/30 px-1.5 py-0.5 rounded">PIN: {roomPin}</span>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10">
              <Globe size={12} className="text-emerald-400" />
              <span>{language === 'vi' ? 'Cộng đồng' : 'Public'}</span>
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto hide-scrollbar w-full md:w-auto pb-1 md:pb-0">
          <WeatherWidget language={language} />
          
          {/* Share Room / PIN Info */}
          <button 
            onClick={copyRoomDetails}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/10 transition-all text-xs font-semibold cursor-pointer"
            title={language === 'vi' ? 'Sao chép thông tin phòng & mã PIN' : 'Share room info & PIN'}
          >
            {showCopiedLink ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
            <span>{showCopiedLink ? (language === 'vi' ? 'Đã chép' : 'Copied') : (language === 'vi' ? 'Mời bạn' : 'Invite')}</span>
          </button>

          {/* Host PIN / Security Settings Button */}
          {isHost && (
            <button
              onClick={() => {
                setSecurityIsPrivate(isPrivateRoom);
                setSecurityPinInput(roomPin || '');
                setIsSecurityModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all text-xs font-semibold cursor-pointer"
              title={language === 'vi' ? 'Cài đặt mã PIN / Chế độ phòng' : 'Room PIN & Security'}
            >
              <KeyRound size={13} />
              <span>{language === 'vi' ? 'Cài đặt PIN' : 'Security'}</span>
            </button>
          )}

          <button 
            onClick={() => {
              console.log("Manual refresh triggered");
              socketRef.current.emit("request-all-users", roomId);
            }}
            className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
            title={language === "vi" ? "Làm mới kết nối" : "Refresh Connections"}
          >
            <RotateCcw size={14} />
          </button>
          <button 
            onClick={() => setIsTimerVisible(!isTimerVisible)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${timerActive ? "bg-white/10 border-white/30 text-white" : "bg-white/10 border-white/20 text-white/60"} border text-xs font-bold uppercase tracking-wider cursor-pointer`}
          >
            <Timer size={14} className={timerActive ? "animate-pulse" : ""} />
            <span>{formatTime(timerTime)}</span>
          </button>
          {isHost && (
            <button 
              onClick={toggleLock}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border text-xs font-bold uppercase tracking-wider cursor-pointer ${isLocked ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-green-500/10 border-green-500/20 text-green-400"}`}
              title={isLocked ? (language === "vi" ? "Mở khóa phòng" : "Unlock Room") : (language === "vi" ? "Khóa phòng" : "Lock Room")}
            >
              {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
              <span>{isLocked ? (language === "vi" ? "Đã khóa" : "Locked") : (language === "vi" ? "Mở khóa" : "Open")}</span>
            </button>
          )}
          {/* Real-time Firestore Participant Counter */}
          <div className="relative">
            <button 
              onClick={() => { triggerHaptic('light'); setActiveSidebarTab(activeSidebarTab === 'participants' ? null : 'participants'); }}
              className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border transition-all text-xs font-serif ${
                activeSidebarTab === 'participants' 
                  ? 'bg-[#c5a059]/25 text-[#f5ebd7] border-[#c5a059] shadow-md shadow-[#c5a059]/20' 
                  : 'bg-[#18120c]/85 text-[#e6ded3] border-[#c5a059]/35 hover:bg-[#261d15] hover:border-[#d4af37]/60'
              }`}
              title={language === 'vi' ? 'Số học viên trực tuyến qua Firestore' : 'Live scholars in room via Firestore'}
            >
              {/* Live Pulsing Dot */}
              <div className="relative flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute opacity-75" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 relative" />
              </div>

              {/* Firestore Real-Time Avatars Stack */}
              <div className="flex -space-x-2 mr-0.5">
                {firestoreParticipants.slice(0, 3).map((p, i) => (
                  <div 
                    key={p.id} 
                    className="w-6 h-6 rounded-full ring-1 ring-[#c5a059]/60 border border-black flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shadow-sm"
                    style={{ zIndex: 10 - i }} 
                    title={p.userName}
                  >
                    {p.userProfilePic ? (
                      <img src={p.userProfilePic} alt={p.userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#2a2016] text-[#c5a059] flex items-center justify-center font-serif text-[10px] font-bold">
                        {(p.userName || "S").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                {firestoreParticipants.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-[#1b1510] border border-[#c5a059]/40 flex items-center justify-center text-[#d4af37] text-[8px] font-bold shadow-sm" style={{ zIndex: 0 }}>
                    +{firestoreParticipants.length - 3}
                  </div>
                )}
              </div>

              {/* Counter Text */}
              <span className="font-semibold text-xs tracking-wide">
                <span className="text-[#d4af37] font-bold mr-1">{firestoreParticipants.length}</span>
                <span className="text-[#a69684]">
                  {firestoreParticipants.length === 1 
                    ? (language === "vi" ? "học viên" : "scholar") 
                    : (language === "vi" ? "học viên" : "scholars")}
                </span>
              </span>
            </button>
          </div>
          <button 
            onClick={onLeave}
            className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white transition-all text-sm font-semibold flex items-center gap-2"
          >
            <PhoneOff size={16} />
            {t.leave}
          </button>
        </div>
      </header>
      {/* Video Grid Area */}
      <main className="relative z-20 flex-1 w-full flex overflow-hidden">
        <div className="relative flex-1 w-full h-full flex flex-col">
          {/* Whiteboard Overlay */}
            <AnimatePresence>
              {isWhiteboardOpen && (
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 z-30 pointer-events-auto flex items-center justify-center p-2 md:p-12"
                >
<Whiteboard socket={socketRef.current} roomId={roomId} onClose={() => setIsWhiteboardOpen(false)} />
                </motion.div>
              )}
            </AnimatePresence>

                        {/* Pomodoro Overlay */}
            <AnimatePresence>
              {isTimerVisible && (
                <motion.div
                  drag
                  dragMomentum={false}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className={`absolute ${isMobile ? 'left-4 top-28' : 'left-6 top-6'} w-48 md:w-52 liquid-glass-strong p-4 md:p-5 pointer-events-auto flex flex-col gap-4 md:gap-5 shadow-2xl z-40 cursor-grab active:cursor-grabbing`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer size={18} className="text-white" />
                      <span className="text-xs font-bold uppercase tracking-widest">{timerMode === 'work' ? t.focus : t.break}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {!timerActive && (
                        <button 
                          onClick={() => setIsEditingTimer(!isEditingTimer)}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="text-[10px] uppercase tracking-wider bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full transition-colors cursor-pointer text-white/70"
                        >
                          {language === 'en' ? 'Set' : 'Cài đặt'}
                        </button>
                      )}
                      <button onClick={() => setIsTimerVisible(false)} className="text-white/40 hover:text-white">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="relative flex items-center justify-center">
                    {isEditingTimer && !timerActive ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60 rounded-full backdrop-blur-sm">
                        <input 
                          type="number" 
                          value={timerInputMinutes}
                          onChange={(e) => setTimerInputMinutes(e.target.value)}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="w-16 bg-black/40 border border-white/20 rounded-xl px-2 py-1 text-center text-xl text-white outline-none focus:border-white/50"
                          min="1"
                          max="999"
                        />
                        <button 
                          onClick={handleSetTimer}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="mt-2 bg-white text-black px-3 py-1 rounded-xl text-xs font-semibold hover:bg-white/90 cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    ) : null}
                    <svg viewBox="0 0 128 128" className="w-24 h-24 md:w-32 md:h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-white/10"
                      />
                      <motion.circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray="440"
                        animate={{ strokeDashoffset: initialTime > 0 ? 352 * (1 - timerTime / initialTime) : 0 }}
                        transition={{ duration: 1, ease: "linear" }}
                        className="text-white"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-2xl md:text-3xl font-light tracking-tighter tabular-nums">{formatTime(timerTime)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button 
                      onClick={resetTimer}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all"
                    >
                      <RotateCcw size={18} />
                    </button>
                    <button 
                      onClick={toggleTimer}
                      className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-white/20"
                    >
                      {timerActive ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
                    </button>
                    <div className="w-10 h-10" />
                  </div>
                  <div className="flex bg-white/10 rounded-full p-1 mt-2">
                    <button 
                      onClick={() => {
                        setTimerMode('work');
                        setTimerActive(false);
                      }}
                      className={`flex-1 py-2 rounded-full text-[10px] font-bold uppercase transition-all ${
                        timerMode === 'work' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      Work
                    </button>
                    <button 
                      onClick={() => {
                        setTimerMode('break');
                        setTimerActive(false);
                      }}
                      className={`flex-1 py-2 rounded-full text-[10px] font-bold uppercase transition-all ${
                        timerMode === 'break' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      Break
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

                    {/* Discovery Overlay */}
          <AnimatePresence>
            {isDiscoveryOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                className="absolute right-0 md:right-6 top-0 md:top-6 bottom-0 md:bottom-6 w-full md:w-80 liquid-glass-strong shadow-2xl pointer-events-auto flex flex-col overflow-hidden z-50 md:z-40"
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-white" />
                    <span className="text-xs font-bold uppercase tracking-wider">{t.discover}</span>
                  </div>
                  <button onClick={() => setIsDiscoveryOpen(false)} className="text-white/40 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                  <div className="mb-6">
                    <h4 className="text-sm font-bold">{t.suggested}</h4>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{t.basedOnInterest}</p>
                  </div>
                  <div className="space-y-3">
                    {recommendedRooms.map((room) => (
                      <div 
                        key={room.id}
                        className="group p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer hover:bg-white/10"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/5 transition-colors">
                                <Users size={16} className="text-white/40 group-hover:text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white group-hover:text-white transition-colors">{room.name[language]}</p>
                                <div className="flex items-center gap-2 mt-1 opacity-40">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                  <span className="text-[10px] uppercase tracking-widest">{room.participants} online</span>
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                if (room.id !== roomId) {
                                  onJoinRoom(room.id);
                                  setIsDiscoveryOpen(false);
                                }
                              }}
                              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all ${
                                room.id === roomId 
                                  ? 'bg-white/10 text-white/40 cursor-default' 
                                  : 'bg-white text-black hover:bg-white/80'
                              }`}
                            >
                              {room.id === roomId ? 'Current' : 'Join'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video Grid (Zoom-style Active View & Conditional Rendering) */}
          {isGridCollapsed ? (
            <motion.div 
              drag
              dragMomentum={false}
              className="absolute right-4 md:right-8 top-24 md:top-32 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl liquid-glass-strong border border-white/20 hover:border-[#c5a059]/60 shadow-2xl text-white cursor-pointer select-none transition-all hover:scale-105"
              onClick={() => {
                triggerHaptic('light');
                setIsGridCollapsed(false);
              }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-xs font-serif font-bold text-[#f5f0e6]">
                  {language === 'vi' ? 'Lưới video đã thu gọn' : 'Video Grid Collapsed'}
                </span>
                <span className="text-[10px] text-white/50">
                  {allGridParticipants.length} {language === 'vi' ? 'học viên trong phòng' : 'participants'}
                </span>
              </div>
              <span className="text-[9px] uppercase font-bold text-[#dfb76c] px-2 py-0.5 rounded-full bg-[#c5a059]/20 border border-[#c5a059]/40 flex items-center gap-1">
                <Cpu size={10} />
                {language === 'vi' ? 'Tiết kiệm CPU' : 'Eco'}
              </span>
              <ChevronDown size={14} className="text-white/60 hover:text-white" />
            </motion.div>
          ) : (
            <motion.div 
              drag
              dragMomentum={false}
              className="absolute right-4 md:right-8 top-24 md:top-32 z-30 flex flex-col gap-2 p-2 md:p-3 liquid-glass-strong overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing rounded-2xl border border-white/15"
              style={{ 
                width: isMobile ? (visibleParticipants.length === 1 ? '180px' : 'calc(100vw - 32px)') : (visibleParticipants.length === 1 ? '240px' : '360px'),
                maxHeight: '65vh'
              }}
            >
              {/* Active View Header */}
              <div className="flex items-center justify-between px-1 pb-1 border-b border-white/10 text-xs select-none">
                <div className="flex items-center gap-1.5 text-white/80 font-serif">
                  <Cpu size={13} className="text-[#c5a059]" />
                  <span className="text-[10px] uppercase tracking-wider text-[#dfb76c] font-bold">
                    {language === 'vi' ? 'Khung nhìn' : 'Active View'}
                  </span>
                  <span className="text-[9px] text-white/40">
                    ({visibleParticipants.length}/{allGridParticipants.length})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {totalGridPages > 1 && (
                    <div className="flex items-center gap-1 bg-black/40 rounded-full px-1.5 py-0.5 border border-white/10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          setActiveGridPage(p => Math.max(0, p - 1));
                        }}
                        disabled={safeActivePage === 0}
                        className="p-1 rounded-full text-white/70 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-all"
                        title={language === 'vi' ? 'Trang trước' : 'Previous page'}
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <span className="text-[10px] font-mono px-1 text-[#dfb76c] font-bold">
                        {safeActivePage + 1}/{totalGridPages}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          setActiveGridPage(p => Math.min(totalGridPages - 1, p + 1));
                        }}
                        disabled={safeActivePage >= totalGridPages - 1}
                        className="p-1 rounded-full text-white/70 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-all"
                        title={language === 'vi' ? 'Trang sau' : 'Next page'}
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      setIsGridCollapsed(true);
                    }}
                    className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
                    title={language === 'vi' ? 'Thu gọn lưới (Tiết kiệm CPU)' : 'Collapse grid (Save CPU)'}
                  >
                    <ChevronUp size={14} />
                  </button>
                </div>
              </div>

              {/* Speaker on Another Page Notification */}
              {activeSpeakerPageIndex >= 0 && activeSpeakerPageIndex !== safeActivePage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('medium');
                    setActiveGridPage(activeSpeakerPageIndex);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all text-[10px] font-serif cursor-pointer animate-pulse"
                >
                  <Sparkles size={11} className="text-amber-400" />
                  <span>
                    {language === 'vi' 
                      ? `Có người đang nói ở Trang ${activeSpeakerPageIndex + 1} • Bấm để xem` 
                      : `Speaker on Page ${activeSpeakerPageIndex + 1} • Click to switch`}
                  </span>
                </button>
              )}

              {/* Active View Grid Tiles */}
              <div 
                className={`grid gap-2 md:gap-3 w-full overflow-y-auto custom-scrollbar ${
                  visibleParticipants.length <= 1 ? 'grid-cols-1' : 'grid-cols-2'
                }`}
              >
                {/* Render ONLY participants currently on the active view page */}
                {visibleParticipants.map((item) => {
                  if (item.isLocal) {
                    return (
                      <motion.div layout key="local" className={`relative w-full max-h-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg group border transition-all duration-500 ${activeSpeakerId === 'local' ? 'border-[#dfb76c] ring-2 ring-[#dfb76c]/50' : 'border-white/10 hover:border-white/30'}`}
                      >
                        {maximizedPeerId === 'local' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#171310] border border-[#c5a059]/40 text-[#dfb76c] p-4 text-center rounded-xl">
                            <Eye size={22} className="animate-pulse text-[#c5a059]" />
                            <span className="text-[11px] font-serif font-medium tracking-wide">
                              {language === 'vi' ? 'Bạn đang xem ở màn hình chính' : 'You are in focus view'}
                            </span>
                          </div>
                        ) : isCameraOff && profilePic ? (
                          <img src={profilePic} alt="Me" className="w-full h-full object-cover" />
                        ) : !localDisplayStream ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white/20">
                            <User size={48} />
                          </div>
                        ) : (
                          <Video 
                            stream={localDisplayStream} 
                            muted 
                            isMirrored={!isScreenSharing && isCameraMirrored}
                            className={`w-full h-full bg-white/5 ${isScreenSharing ? 'object-contain' : 'object-cover'}`} 
                          />
                        )}
                        
                        <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {myUserName} ({language === 'vi' ? 'Bạn' : 'You'})
                          {isMuted && <MicOff size={12} className="text-white ml-1" />}
                        </div>

                        {/* Local Video Controls (Flip Mirror & Maximize) */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          {!isScreenSharing && !isCameraOff && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('light');
                                setIsCameraMirrored(prev => {
                                  const next = !prev;
                                  addNotification(
                                    language === 'vi' 
                                      ? (next ? 'Đã đổi hướng camera: Lật gương' : 'Đã đổi hướng camera: Hướng thường') 
                                      : (next ? 'Camera mirrored' : 'Camera normal'),
                                    'info'
                                  );
                                  return next;
                                });
                              }}
                              className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all border cursor-pointer ${
                                isCameraMirrored
                                  ? 'bg-[#c5a059]/30 border-[#c5a059]/60 text-[#dfb76c] hover:bg-[#c5a059]/50'
                                  : 'bg-black/50 border-white/20 text-white/80 hover:text-white hover:bg-black/70'
                              }`}
                              title={language === 'vi' ? 'Đổi hướng camera (Lật gương/Thường)' : 'Flip camera orientation'}
                            >
                              <FlipHorizontal size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => handleMaximizePeer('local')}
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-all border border-white/10 cursor-pointer"
                            title={language === 'vi' ? 'Phóng to' : 'Maximize'}
                          >
                            <Maximize2 size={16} />
                          </button>
                        </div>

                        {/* Reactions Overlay */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                          <AnimatePresence>
                            {(reactions[peerManagerRef.current?.getPeerId() || 'local'] || []).map((r) => (
                              <motion.div
                                key={r.id}
                                animate={{ 
                                  opacity: [0, 1, 1, 0],
                                }}
                                exit={{ opacity: 0 }}
                                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-3xl"
                              >
                                {r.emoji}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  }

                  const peer = item.peer!;
                  const isCurrentlyMaximized = maximizedPeerId === peer.peerId;
                  const hasLiveVideoTrack = peer.stream
                    ? peer.stream.getVideoTracks().some(t => t.readyState === 'live' && t.enabled)
                    : false;

                  return (
                    <motion.div layout key={peer.peerId} className={`relative w-full max-h-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg group border transition-all duration-500 ${activeSpeakerId === peer.peerId ? 'border-[#dfb76c] ring-2 ring-[#dfb76c]/50' : 'border-white/10 hover:border-white/30'}`}
                    >
                      {isCurrentlyMaximized ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#171310] border border-[#c5a059]/40 text-[#dfb76c] p-4 text-center rounded-xl">
                          <Eye size={22} className="animate-pulse text-[#c5a059]" />
                          <span className="text-[11px] font-serif font-medium tracking-wide">
                            {language === 'vi' ? 'Đang phóng to trên màn hình chính' : 'In focus view'}
                          </span>
                        </div>
                      ) : peer.stream && !peer.isCameraOff && !peer.isScreenSharing && hasLiveVideoTrack ? (
                        <Video stream={peer.stream} className="max-w-full max-h-full object-cover rounded-xl shadow-2xl" />
                      ) : peer.stream && peer.isScreenSharing && hasLiveVideoTrack ? (
                        <Video stream={peer.stream} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/40 bg-zinc-900/90 relative">
                          {peer.stream && <Video stream={peer.stream} hiddenVideo={true} className="absolute inset-0" />}
                          {peer.profilePic ? (
                            <img src={peer.profilePic} alt={peer.userName} className="w-14 h-14 rounded-full object-cover border border-white/20 shadow-lg" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-xl font-bold">
                              {(peer.userName || "H").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-semibold text-white/80">{peer.userName || (language === 'vi' ? 'Học viên' : 'Student')}</span>
                          <span className="text-[10px] text-white/40 uppercase tracking-widest">
                            {peer.isCameraOff ? (language === 'vi' ? 'Camera tắt' : 'Camera off') : (language === 'vi' ? 'Sẵn sàng' : 'Ready')}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {peer.userName || (language === 'vi' ? 'Học viên' : 'Student')}
                      </div>

                      {/* Maximize Button for Peer */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleMaximizePeer(peer.peerId)}
                          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-all border border-white/10 cursor-pointer"
                          title={language === 'vi' ? 'Phóng to' : 'Maximize'}
                        >
                          <Maximize2 size={18} />
                        </button>
                      </div>

                      {/* Reactions for Peer */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                        <AnimatePresence>
                          {(reactions[peer.peerId] || []).map((r) => (
                            <motion.div
                              key={r.id}
                              animate={{ 
                                opacity: [0, 1, 1, 0],
                              }}
                              exit={{ opacity: 0 }}
                              className="absolute bottom-10 left-1/2 -translate-x-1/2 text-3xl"
                            >
                              {r.emoji}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Quick Reaction Bar */}
                      <div className="absolute top-3 left-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {['👏', '🧠', '❤️', '🔥', '✨'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('light');
                              sendReaction(peer.peerId, emoji);
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Off-screen Headless Audio: Continues audio transmission for non-visible peers with zero video decoder GPU/CPU overhead */}
          {offscreenPeers.map(peer => (
            peer.stream ? (
              <HeadlessPeerAudio key={`headless-audio-${peer.peerId}`} stream={peer.stream} />
            ) : null
          ))}

          {/* Maximized Peer / Screen Overlay (High-Definition, No Black Screen) */}
          <AnimatePresence>
            {maximizedPeerId && (() => {
              const isLocal = maximizedPeerId === 'local';
              const targetPeer = isLocal ? null : peers.find(p => p.peerId === maximizedPeerId);
              const targetUserName = isLocal
                ? `${myUserName} (${language === 'vi' ? 'Bạn' : 'You'})`
                : (targetPeer?.userName || (language === 'vi' ? 'Học viên' : 'Student'));
              const targetProfilePic = isLocal ? profilePic : targetPeer?.profilePic;
              const targetIsScreenSharing = isLocal ? isScreenSharing : !!targetPeer?.isScreenSharing;
              const targetIsCameraOff = isLocal ? isCameraOff : (targetPeer?.isCameraOff ?? true);
              const targetStream = isLocal ? localDisplayStream : targetPeer?.stream;
              const isMuted = isLocal;

              const hasVideoTrack = targetStream
                ? targetStream.getVideoTracks().length > 0
                : false;
              
              const shouldRenderVideo = (targetIsScreenSharing || !targetIsCameraOff) && hasVideoTrack;

              console.log(`[StudyRoom:OverlayRender] Rendering maximized overlay for '${maximizedPeerId}':`, {
                shouldRenderVideo,
                hasVideoTrack,
                targetIsScreenSharing,
                targetIsCameraOff,
                hasTargetStream: !!targetStream,
                streamId: targetStream?.id,
                streamActive: targetStream?.active,
                videoTrackCount: targetStream?.getVideoTracks().length,
                audioTrackCount: targetStream?.getAudioTracks().length,
                tracks: targetStream?.getTracks().map(t => ({ kind: t.kind, id: t.id, enabled: t.enabled, readyState: t.readyState }))
              });

              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="fixed inset-0 sm:inset-4 md:inset-6 z-[90] bg-[#120e0b]/98 backdrop-blur-3xl rounded-none sm:rounded-3xl border sm:border border-[#c5a059]/40 overflow-hidden flex flex-col shadow-[0_30px_100px_rgba(0,0,0,0.98)]"
                >
                  {/* Classical Top Bar */}
                  <div className="p-3 sm:p-4 border-b border-[#c5a059]/30 flex items-center justify-between bg-gradient-to-r from-[#241c16] via-[#1a1410] to-[#241c16] shadow-sm select-none">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {targetProfilePic ? (
                          <img src={targetProfilePic} alt={targetUserName} className="w-9 h-9 rounded-full object-cover border border-[#c5a059]/60 shadow-md" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#2a2018] border border-[#c5a059]/50 flex items-center justify-center text-xs font-serif font-bold text-[#dfb76c]">
                            {(targetUserName || "H").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#1a1410] ${activeSpeakerId === maximizedPeerId ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-serif font-bold text-[#f5f0e6] tracking-wide">
                            {targetUserName}
                          </span>
                          {isLocal && (
                            <span className="px-1.5 py-0.5 rounded bg-[#c5a059]/20 text-[#dfb76c] border border-[#c5a059]/40 text-[9px] font-serif uppercase tracking-wider">
                              {language === 'vi' ? 'Bạn' : 'You'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {targetIsScreenSharing ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-serif uppercase tracking-wider flex items-center gap-1">
                              <Monitor size={11} />
                              <span>{language === 'vi' ? 'Đang chia sẻ màn hình' : 'Sharing Screen'}</span>
                            </span>
                          ) : !targetIsCameraOff && hasVideoTrack ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-serif uppercase tracking-wider flex items-center gap-1">
                              <Camera size={11} />
                              <span>{language === 'vi' ? 'Camera trực tiếp' : 'Live Camera'}</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-[#2e2319] text-[#c5a059] border border-[#c5a059]/30 text-[10px] font-serif uppercase tracking-wider flex items-center gap-1">
                              <User size={11} />
                              <span>{language === 'vi' ? 'Hình đại diện học viên' : 'Scholar Profile'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setMaximizedPeerId(null)}
                      className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-[#c5a059]/25 text-[#dfb76c] hover:text-white transition-all cursor-pointer border border-[#c5a059]/35 shadow-md flex items-center gap-1.5 group"
                      title={language === 'vi' ? 'Thu nhỏ (Esc)' : 'Close (Esc)'}
                    >
                      <X size={18} className="group-hover:rotate-90 transition-transform" />
                      <span className="hidden sm:inline text-xs font-serif font-medium pr-1">{language === 'vi' ? 'Đóng' : 'Close'}</span>
                    </button>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0a0807] relative overflow-hidden">
                    {shouldRenderVideo && targetStream ? (
                      <div className="w-full h-full flex items-center justify-center relative">
                        <MaximizedVideoElement
                          stream={targetStream}
                          muted={isLocal}
                          isScreenSharing={targetIsScreenSharing}
                          language={language}
                          isMirrored={isLocal && !targetIsScreenSharing && isCameraMirrored}
                          onToggleMirror={isLocal && !targetIsScreenSharing ? () => {
                            triggerHaptic('light');
                            setIsCameraMirrored(prev => {
                              const next = !prev;
                              addNotification(
                                language === 'vi' 
                                  ? (next ? 'Đã đổi hướng camera: Lật gương' : 'Đã đổi hướng camera: Hướng thường') 
                                  : (next ? 'Camera mirrored' : 'Camera normal'),
                                'info'
                              );
                              return next;
                            });
                          } : undefined}
                        />
                      </div>
                    ) : (
                      /* Avatar / Profile Picture / Student Card Mode */
                      <div className="flex flex-col items-center justify-center gap-5 sm:gap-6 p-6 sm:p-10 text-center max-w-lg select-none">
                        {targetProfilePic ? (
                          <div className="relative group">
                            <img
                              src={targetProfilePic}
                              alt={targetUserName}
                              className="w-48 h-48 sm:w-64 sm:h-64 rounded-full object-cover border-4 border-[#c5a059] shadow-[0_0_60px_rgba(197,160,89,0.35)] ring-8 ring-[#c5a059]/15 transition-transform duration-500 group-hover:scale-105"
                            />
                            {activeSpeakerId === maximizedPeerId && (
                              <span className="absolute inset-0 rounded-full border-4 border-[#dfb76c] animate-ping opacity-75 pointer-events-none" />
                            )}
                          </div>
                        ) : (
                          <div className="relative group">
                            <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-[#2f251c] via-[#1c1611] to-[#120e0b] border-4 border-[#c5a059] flex items-center justify-center text-6xl sm:text-7xl font-serif font-bold text-[#dfb76c] shadow-[0_0_60px_rgba(197,160,89,0.3)] ring-8 ring-[#c5a059]/15 transition-transform duration-500 group-hover:scale-105">
                              {(targetUserName || "H").charAt(0).toUpperCase()}
                            </div>
                            {activeSpeakerId === maximizedPeerId && (
                              <span className="absolute inset-0 rounded-full border-4 border-[#dfb76c] animate-ping opacity-75 pointer-events-none" />
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <h3 className="text-2xl sm:text-4xl font-serif font-bold text-[#f5f0e6] tracking-tight">
                            {targetUserName}
                          </h3>
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e1712]/90 border border-[#c5a059]/35 text-xs uppercase tracking-widest text-[#dfb76c] font-serif shadow-inner">
                            <Sparkles size={13} className="text-[#c5a059]" />
                            <span>
                              {targetIsCameraOff 
                                ? (language === 'vi' ? 'Camera tạm tắt • Đang lắng nghe' : 'Camera Off • Listening') 
                                : (language === 'vi' ? 'Hình đại diện học viên' : 'Student Avatar')}
                            </span>
                          </div>
                        </div>

                        {!isLocal && targetStream && (
                          <audio
                            ref={(el) => {
                              if (el && el.srcObject !== targetStream) {
                                el.srcObject = targetStream;
                                el.play().catch(() => {});
                              }
                            }}
                            autoPlay
                            playsInline
                          />
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        {/* Unified Sidebar */}
        <AnimatePresence>
          {activeSidebarTab && (
            <motion.aside
              initial={{ width: 0, opacity: 0, x: 20 }}
              animate={{ width: isMobile ? '100%' : 380, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: 20 }}
              className={`${isMobile ? 'absolute inset-0 z-50' : 'relative z-30'} bg-white/10 backdrop-blur-3xl border-l border-white/10 flex flex-col overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]`}
            >
              {/* Liquid Effect Background */}
              <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-[100px] animate-pulse" />
              </div>

              {/* Sidebar Header */}
              {isMobile && (
                <button onClick={() => { triggerHaptic('light'); setActiveSidebarTab(null); }} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/40 text-white/70 hover:text-white backdrop-blur-md">
                  <X size={20} />
                </button>
              )}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    {activeSidebarTab === 'chat' && <MessageCircle size={18} className="text-white" />}
                    {activeSidebarTab === 'goals' && <ListTodo size={18} className="text-white" />}
                    {activeSidebarTab === 'notes' && <NotebookPen size={18} className="text-white" />}
                    {activeSidebarTab === 'participants' && <Users size={18} className="text-white" />}
                    {activeSidebarTab === 'recordings' && <Disc size={18} className="text-[#c5a059]" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] block">
                      {activeSidebarTab === 'chat' ? t.chat : activeSidebarTab === 'goals' ? t.goals : activeSidebarTab === 'participants' ? t.participants : activeSidebarTab === 'recordings' ? t.recordings : t.notes}
                    </span>
                    <span className="text-[9px] text-white/30 uppercase tracking-widest">Collaborative Space</span>
                  </div>
                </div>
                <button 
                  onClick={() => { triggerHaptic('light'); setActiveSidebarTab(null); }} 
                  className="group"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              {/* Sidebar Tabs Switcher */}
              <div className="flex border-b border-white/10 overflow-x-auto hide-scrollbar">
                {(['chat', 'goals', 'notes', 'participants', 'recordings'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { triggerHaptic('light'); setActiveSidebarTab(tab); }}
                    className={`flex-1 min-w-[58px] py-3 text-[10px] font-bold uppercase tracking-wider transition-all relative flex items-center justify-center gap-1 shrink-0 ${
                      activeSidebarTab === tab ? "text-white border-b-2 border-white/80"
                      : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    <span>
                      {tab === 'chat' ? (language === "vi" ? "Chat" : "Chat") : 
                       tab === 'goals' ? (language === "vi" ? "Tiêu" : "Goals") : 
                       tab === 'notes' ? (language === "vi" ? "Ghi" : "Notes") : 
                       tab === 'participants' ? (language === "vi" ? "Người" : "Users") : 
                       (language === "vi" ? "Bản ghi" : "Rec")
                      }
                    </span>
                    {tab === 'chat' && unreadChatCount > 0 && activeSidebarTab !== 'chat' && (
                      <span className="px-1.5 py-0.5 min-w-[18px] text-center bg-[#c5a059] text-black text-[9px] font-black rounded-full shadow-sm animate-pulse">
                        {unreadChatCount > 99 ? '99+' : unreadChatCount}
                      </span>
                    )}
                    {tab === 'recordings' && recordingsList.length > 0 && (
                      <span className="px-1.5 py-0.2 min-w-[16px] text-center bg-white/20 text-white text-[8px] font-mono font-bold rounded-full">
                        {recordingsList.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-6 pb-6">
                {activeSidebarTab === 'participants' && (
                  <div className="space-y-6 pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]/80">
                          {language === 'vi' ? 'Đang trực tuyến' : 'Active Now'} ({firestoreParticipants.length})
                        </h3>
                      </div>
                      <button 
                        onClick={() => socketRef.current?.emit("request-all-users", roomId)}
                        className="text-[10px] text-white/40 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={10} />
                        {language === 'vi' ? 'Làm mới' : 'Refresh'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Local User */}
                      <div className="p-4 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {profilePic ? (
                              <img src={profilePic} alt={myUserName} className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-md shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-500/80 border border-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {myUserName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-900" />
                          </div>
                          <div className="flex flex-col">
                            {isEditingName ? (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <input 
                                  type="text" 
                                  value={nameInput}
                                  onChange={(e) => setNameInput(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(nameInput); }}
                                  className="bg-black/60 border border-white/30 rounded px-2 py-0.5 text-xs text-white focus:outline-none w-28"
                                  autoFocus
                                />
                                <button 
                                  onClick={() => handleSaveName(nameInput)}
                                  className="px-2 py-0.5 bg-white text-black text-[10px] font-bold rounded hover:bg-white/90"
                                >
                                  {language === 'vi' ? 'Lưu' : 'Save'}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white tracking-wider">{myUserName}</span>
                                <button 
                                  onClick={() => { setIsEditingName(true); setNameInput(myUserName); }}
                                  className="text-[10px] text-white/50 hover:text-white underline cursor-pointer"
                                  title="Đổi tên"
                                >
                                  {language === 'vi' ? 'Sửa' : 'Edit'}
                                </button>
                                <span className="px-1 py-0.5 rounded bg-white text-[8px] font-black text-black uppercase">{language === 'vi' ? 'Bạn' : 'You'}</span>
                                {isHost && <span className="px-1 py-0.5 rounded bg-yellow-500 text-[8px] font-black text-black uppercase">Host</span>}
                              </div>
                            )}
                            <span className="text-[9px] text-white/40 uppercase tracking-tighter">
                              {isScreenSharing ? (language === 'vi' ? 'Đang chia sẻ màn hình' : 'Sharing Screen') : (language === 'vi' ? 'Đã kết nối' : 'Connected')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isScreenSharing && <Monitor size={14} className="text-blue-400 animate-pulse" />}
                          {isMuted ? <MicOff size={14} className="text-red-400" /> : <Mic size={14} className="text-green-400" />}
                          {isCameraOff ? <CameraOff size={14} className="text-red-400" /> : <Camera size={14} className="text-green-400" />}
                        </div>
                      </div>

                      {/* Peer Users */}
                      {peers.map((peer) => (
                        <div key={peer.peerId} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {peer.profilePic ? (
                                <img src={peer.profilePic} alt={peer.userName} className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-md shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {(peer.userName || "H").charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-900" />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white/80 uppercase tracking-wider">{peer.userName || (language === 'vi' ? 'Học viên' : 'Student')}</span>
                                {hostId === peer.peerId && <span className="px-1 py-0.5 rounded bg-yellow-500/20 text-[8px] font-black text-yellow-500 uppercase border border-yellow-500/30">Host</span>}
                              </div>
                              <span className="text-[9px] text-white/40 uppercase tracking-tighter">
                                {peer.isScreenSharing 
                                  ? (language === 'vi' ? 'Đang chia sẻ màn hình' : 'Sharing Screen') 
                                  : !peer.isCameraOff 
                                    ? (language === 'vi' ? 'Bật camera' : 'Camera On') 
                                    : (language === 'vi' ? 'Camera tắt' : 'Camera Off')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {peer.isScreenSharing && <span title="Screen sharing"><Monitor size={14} className="text-blue-400 animate-pulse" /></span>}
                            {!peer.isCameraOff ? <Camera size={14} className="text-green-400" /> : <CameraOff size={14} className="text-white/30" />}
                          </div>
                        </div>
                      ))}

                      {peers.length === 0 && (
                        <div className="py-12 text-center border border-dashed border-white/10 rounded-3xl opacity-20">
                          <Users size={32} className="mx-auto mb-3" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Waiting for others</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeSidebarTab === 'chat' && (
                  <div className="flex-1 flex flex-col h-full overflow-hidden pt-3">
                    {/* Quiet discourse header note */}
                    <div className="px-3 py-1.5 mb-2 bg-[#c5a059]/10 border border-[#c5a059]/20 rounded-xl flex items-center justify-between text-[10px] text-[#c5a059]/90 shrink-0">
                      <span className="flex items-center gap-1.5 font-serif">
                        <MessageCircle size={12} className="text-[#c5a059]" />
                        {language === 'vi' ? 'Trao đổi phòng học' : 'Study Room Discourse'}
                      </span>
                      <span className="text-[9px] text-white/40 font-mono">
                        {messages.length} {language === 'vi' ? 'tin nhắn' : 'msgs'}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 px-1 pb-4">
                      {messages.length === 0 ? (
                        <div className="py-12 px-4 text-center border border-dashed border-[#c5a059]/20 rounded-2xl bg-[#1c1611]/30">
                          <NotebookPen size={32} className="mx-auto mb-2 text-[#c5a059]/40" />
                          <p className="text-xs font-serif font-medium text-[#e6ded3] mb-1">
                            {language === 'vi' ? 'Chưa có lời nhắn nào' : 'No messages yet'}
                          </p>
                          <p className="text-[10px] text-[#a69684]/70 leading-relaxed max-w-[220px] mx-auto">
                            {language === 'vi' 
                              ? 'Trao đổi, thảo luận bài vở yên tĩnh mà không làm ngắt quãng video hay âm thanh.' 
                              : 'Converse quietly with peers without interrupting streaming audio or video.'}
                          </p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const currentUserId = auth.currentUser?.uid;
                          const currentPeerId = peerManagerRef.current?.getPeerId() || myPeerId;
                          const currentSocketId = socketRef.current?.id;
                          const isMe = (currentUserId && msg.senderId === currentUserId) ||
                                       (currentPeerId && msg.senderId === currentPeerId) ||
                                       (currentSocketId && msg.senderId === currentSocketId) ||
                                       (msg.senderName === myUserName);
                          
                          const timeString = msg.timestamp 
                            ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '';

                          return (
                            <motion.div 
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={msg.id} 
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                            >
                              <div className={`flex items-end gap-2 max-w-[92%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar or Monogram */}
                                {msg.senderProfilePic ? (
                                  <img 
                                    src={msg.senderProfilePic} 
                                    alt={msg.senderName} 
                                    className="w-7 h-7 rounded-full object-cover ring-1 ring-[#c5a059]/40 shrink-0 shadow-sm mb-1" 
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-[#261d15] text-[#c5a059] border border-[#c5a059]/40 flex items-center justify-center font-serif text-[11px] font-bold shrink-0 shadow-sm mb-1">
                                    {(msg.senderName || 'S').charAt(0).toUpperCase()}
                                  </div>
                                )}

                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                  {/* Sender name & time */}
                                  <div className="flex items-center gap-1.5 mb-1 px-1">
                                    {!isMe && (
                                      <span className="text-[11px] font-serif font-medium text-[#d4af37]">
                                        {msg.senderName}
                                      </span>
                                    )}
                                    {timeString && (
                                      <span className="text-[9px] text-[#8c7b6c] font-mono">
                                        {timeString}
                                      </span>
                                    )}
                                  </div>

                                  {/* Bubble */}
                                  <div className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-md transition-all ${
                                    isMe 
                                      ? 'bg-gradient-to-br from-[#c5a059] via-[#b88c3a] to-[#996515] text-[#161007] font-medium rounded-tr-xs border border-[#f3d489]/40 shadow-black/40' 
                                      : 'bg-[#1f1812]/95 text-[#f5ebd7] rounded-tl-xs border border-[#4a3b2c] shadow-black/30'
                                  }`}>
                                    {msg.text}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Composer */}
                    <form onSubmit={sendMessage} className="flex gap-2 shrink-0 pt-3 border-t border-[#c5a059]/20 bg-transparent">
                      <div className="flex-1 relative group">
                        <input 
                          type="text" 
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder={t.typeMessage}
                          className="w-full bg-[#18120d]/80 border border-[#c5a059]/30 rounded-xl px-4 py-2.5 text-xs text-[#f5ebd7] placeholder-[#8c7b6c]/60 focus:outline-none focus:border-[#d4af37] focus:bg-[#201812] transition-all"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={!inputText.trim()}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c5a059] to-[#996515] text-[#161007] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all shadow-md shrink-0"
                        title={language === 'vi' ? 'Gửi tin nhắn' : 'Send message'}
                      >
                        <Send size={15} />
                      </button>
                    </form>
                  </div>
                )}

                {activeSidebarTab === 'goals' && (
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <form onSubmit={addGoal} className="shrink-0 pt-4 pb-4 sticky top-0 bg-transparent z-10">
                      <div className="relative group">
                        <input 
                          type="text" 
                          value={goalInput}
                          onChange={(e) => setGoalInput(e.target.value)}
                          placeholder={t.addNewGoal}
                          className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all pr-12"
                        />
                        <button 
                          type="submit"
                          disabled={!goalInput.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 disabled:opacity-50 transition-colors"
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    </form>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                      <AnimatePresence>
                        {goals.length === 0 ? (
                          <div className="text-center text-white/30 text-xs py-8 italic">
                            No goals yet. Start by adding one!
                          </div>
                        ) : (
                          goals.map(goal => (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              key={goal.id} 
                              className={`group flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                                goal.completed ? 'bg-white/5 border-white/5' : 'bg-white/10 border-white/10 hover:border-white/20'
                              }`}
                            >
                              <button 
                                onClick={() => { triggerHaptic('success'); toggleGoal(goal.id); }}
                                className={`mt-0.5 shrink-0 transition-colors ${goal.completed ? 'text-green-500' : 'text-white/40 hover:text-white'}`}
                              >
                                {goal.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-relaxed break-words ${goal.completed ? 'text-white/40 line-through' : 'text-white/90'}`}>
                                  {goal.text}
                                </p>
                                <span className="text-[10px] text-white/30 uppercase tracking-widest block mt-2">
                                  {goal.authorName}
                                </span>
                              </div>
                              <button 
                                onClick={() => deleteGoal(goal.id)}
                                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white transition-colors shrink-0 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {activeSidebarTab === 'notes' && (
                  <div className="flex-1 flex flex-col h-full pt-4">
                    <textarea 
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value);
                        saveNotes(e.target.value);
                      }}
                      placeholder={t.typeNotes}
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all resize-none custom-scrollbar leading-relaxed"
                    />
                    <div className="shrink-0 pt-4 flex justify-between items-center text-[10px] text-white/30 uppercase tracking-widest font-bold">
                      <span>{language === 'vi' ? 'Tự động lưu' : 'Auto-saving'}</span>
                      <Sparkles size={12} className="text-white" />
                    </div>
                  </div>
                )}

                {activeSidebarTab === 'recordings' && (
                  <div className="flex-1 flex flex-col h-full overflow-hidden pt-3">
                    {/* Header bar */}
                    <div className="px-3 py-2 mb-3 bg-[#c5a059]/10 border border-[#c5a059]/20 rounded-xl flex items-center justify-between text-xs text-[#f5ebd7] shrink-0">
                      <div className="flex items-center gap-1.5 font-serif text-[#d4af37]">
                        <Disc size={14} className={isRecording ? "animate-spin text-red-400" : ""} />
                        <span className="font-bold">{language === 'vi' ? 'Bản ghi phòng học' : 'Room Recordings'}</span>
                      </div>
                      <button
                        onClick={() => {
                          if (isRecording) {
                            stopRecording();
                          } else {
                            setIsRecordingModalOpen(true);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          isRecording 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'bg-gradient-to-r from-[#c5a059] to-[#996515] text-[#161007] hover:brightness-110 shadow-sm'
                        }`}
                      >
                        {isRecording ? <Square size={10} fill="currentColor" /> : <CircleDot size={10} />}
                        <span>{isRecording ? (language === 'vi' ? 'Dừng ghi' : 'Stop') : (language === 'vi' ? '+ Ghi mới' : '+ New')}</span>
                      </button>
                    </div>

                    {/* Recordings list */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 px-1 pb-4">
                      {recordingsList.length === 0 ? (
                        <div className="py-12 px-4 text-center border border-dashed border-[#c5a059]/20 rounded-2xl bg-[#1c1611]/30">
                          <CircleDot size={32} className="mx-auto mb-2 text-[#c5a059]/40" />
                          <p className="text-xs font-serif font-medium text-[#e6ded3] mb-1">
                            {language === 'vi' ? 'Chưa có bản ghi nào' : 'No recordings yet'}
                          </p>
                          <p className="text-[10px] text-[#a69684]/70 leading-relaxed max-w-[220px] mx-auto mb-4">
                            {language === 'vi'
                              ? 'Ghi lại màn hình hoặc âm thanh buổi học trực tiếp và lưu trữ vào Firestore.'
                              : 'Record session screen or audio directly and save to Firestore.'}
                          </p>
                          <button
                            onClick={() => setIsRecordingModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-[#f5ebd7] transition-all font-serif cursor-pointer"
                          >
                            <CircleDot size={13} className="text-red-400" />
                            <span>{language === 'vi' ? 'Bắt đầu ghi đầu tiên' : 'Start first recording'}</span>
                          </button>
                        </div>
                      ) : (
                        recordingsList.map((rec) => {
                          const currentUserId = auth.currentUser?.uid || peerManagerRef.current?.getPeerId() || myPeerId;
                          const canDelete = rec.recordedById === currentUserId || isHost;
                          const isScreen = rec.type === 'screen';
                          const sizeMB = rec.fileSizeBytes ? (rec.fileSizeBytes / (1024 * 1024)).toFixed(1) : null;

                          return (
                            <div
                              key={rec.id}
                              className="p-3.5 rounded-2xl bg-[#1c1611]/90 border border-[#c5a059]/25 hover:border-[#c5a059]/50 transition-all flex flex-col gap-2.5 shadow-md group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2.5">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                    isScreen ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  }`}>
                                    {isScreen ? <Monitor size={15} /> : <Mic size={15} />}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-serif font-bold text-[#f5ebd7] line-clamp-1">
                                      {rec.title}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5 text-[9px] text-[#a69684]">
                                      <span className="font-mono text-[#d4af37]">{formatTime(rec.durationSeconds)}</span>
                                      {sizeMB && <span>• {sizeMB} MB</span>}
                                      <span>• {rec.recordedByName}</span>
                                    </div>
                                  </div>
                                </div>

                                {canDelete && (
                                  <button
                                    onClick={() => deleteRecording(rec.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 transition-all cursor-pointer"
                                    title={language === 'vi' ? 'Xóa bản ghi' : 'Delete recording'}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                {rec.downloadUrl ? (
                                  <>
                                    <button
                                      onClick={() => setPreviewRecording({
                                        url: rec.downloadUrl!,
                                        title: rec.title,
                                        type: rec.type,
                                        size: rec.fileSizeBytes
                                      })}
                                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#f5ebd7] text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <Play size={11} fill="currentColor" />
                                      <span>{language === 'vi' ? 'Phát bản ghi' : 'Play Preview'}</span>
                                    </button>
                                    <a
                                      href={rec.downloadUrl}
                                      download={`${rec.title.replace(/[\s/\\:]+/g, '_')}.webm`}
                                      className="p-1.5 rounded-lg bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#e8c872] transition-all cursor-pointer"
                                      title={language === 'vi' ? 'Tải tệp về máy' : 'Download File'}
                                    >
                                      <Download size={13} />
                                    </a>
                                  </>
                                ) : (
                                  <span className="text-[9px] text-[#a69684]/60 italic">
                                    {language === 'vi' ? 'Đã lưu siêu dữ liệu vào Firestore' : 'Metadata recorded in Firestore'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
</motion.aside>
          )}
        </AnimatePresence>


      </main>

      {/* Controls */}
        <AnimatePresence>
          {isAmbienceMenuOpen && (
            <motion.div 
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute z-[100] bottom-24 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 min-w-[300px] shadow-2xl pointer-events-auto"
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
                      <Volume2 size={14} className="text-blue-400" />
                      {t.ambience}
                    </span>
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                      {Math.round(ambienceVolume * 100)}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={ambienceVolume}
                    onChange={(e) => handleAmbienceVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-400" />
                      {t.lighting}
                    </span>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      {Math.round(roomLight * 100)}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="0.8" 
                    step="0.01" 
                    value={roomLight}
                    onChange={(e) => setRoomLight(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>\n\n                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
                      <ImageIcon size={14} className="text-emerald-400" />
                      {language === 'vi' ? 'Làm Mờ' : 'Background Blur'}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {Math.round((videoBlur / 20) * 100)}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    step="1" 
                    value={videoBlur}
                    onChange={(e) => setVideoBlur(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>


                <div className="grid grid-cols-5 gap-2 pt-1 mt-2">
                  {AMBIENT_SOUNDS.map((sound) => {
                    const Icon = sound.icon;
                    const isActive = activeAmbience === sound.id;
                    return (
                      <button
                        key={sound.id}
                        onClick={() => playAmbience(sound.id)}
                        className={`flex flex-col items-center gap-2 p-2.5 rounded-xl transition-all border ${
                          isActive 
                            ? "bg-white text-black border-white shadow-lg shadow-white/20 scale-105 font-bold" 
                            : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Icon size={18} className={isActive ? "text-black" : "text-white/80"} />
                        <span className="text-[10px] uppercase tracking-tighter truncate w-full text-center">
                          {sound.name[language]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      <footer className={`relative z-20 p-4 md:p-8 flex items-center md:justify-center gap-3 md:gap-6 bg-black/40 backdrop-blur-md border-t border-white/10 overflow-x-auto custom-scrollbar no-scrollbar-mobile whitespace-nowrap transition-opacity duration-700 ${isUiVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>

        <button 
          onClick={() => { triggerHaptic('light'); setActiveSidebarTab(activeSidebarTab === 'chat' ? null : 'chat'); }}
          className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
            activeSidebarTab === 'chat' ? 'bg-[#c5a059] text-[#161007] shadow-lg shadow-[#c5a059]/25 scale-110' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={t.chat}
        >
          <MessageCircle size={20} className="md:size-6" />
          {unreadChatCount > 0 && activeSidebarTab !== 'chat' && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-[#c5a059] text-[#161007] text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md border-2 border-[#16110c] animate-bounce">
              {unreadChatCount > 99 ? '99+' : unreadChatCount}
            </span>
          )}
        </button>

        <button 
          onClick={() => { triggerHaptic('light'); setIsDiscoveryOpen(!isDiscoveryOpen); }}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
            isDiscoveryOpen ? 'bg-white text-black shadow-lg shadow-white/10 scale-110' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={t.discover}
        >
          <Sparkles size={20} className="md:size-6" />
        </button>

        <button 
          onClick={() => { triggerHaptic('light'); setActiveSidebarTab(activeSidebarTab === 'goals' ? null : 'goals'); }}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
            activeSidebarTab === 'goals' ? 'bg-white text-black shadow-lg shadow-white/20 scale-110' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={t.goals}
        >
          <ListTodo size={20} className="md:size-6" />
        </button>

        <button 
          onClick={() => { triggerHaptic('light'); setActiveSidebarTab(activeSidebarTab === 'notes' ? null : 'notes'); }}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
            activeSidebarTab === 'notes' ? 'bg-white text-black shadow-lg shadow-white/10 scale-110' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={t.notes}
        >
          <NotebookPen size={20} className="md:size-6" />
        </button>

        <button 
          onClick={() => { triggerHaptic('light'); setActiveSidebarTab(activeSidebarTab === 'participants' ? null : 'participants'); }}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
            activeSidebarTab === 'participants' ? 'bg-white text-black shadow-lg shadow-white/10 scale-110' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={t.participants}
        >
          <div className="relative">
            <Users size={20} className="md:size-6" />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#c5a059] rounded-full text-[9px] flex items-center justify-center text-black font-black border-2 border-zinc-900 shadow-lg">
              {firestoreParticipants.length}
            </span>
          </div>
        </button>

        <button 
          onClick={() => {
            triggerHaptic('light');
            if (isRecording) {
              stopRecording();
            } else {
              setIsRecordingModalOpen(true);
            }
          }}
          className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
            isRecording 
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 scale-110 animate-pulse' 
              : activeSidebarTab === 'recordings'
                ? 'bg-[#c5a059] text-[#161007] shadow-lg shadow-[#c5a059]/25 scale-110'
                : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isRecording 
            ? (language === 'vi' ? 'Đang ghi âm/hình - Bấm để Dừng & Lưu' : 'Recording - Click to Stop & Save') 
            : (language === 'vi' ? 'Ghi lại phiên học (Màn hình / Âm thanh)' : 'Record study session (Screen / Audio)')
          }
        >
          {isRecording ? <Square size={18} fill="currentColor" /> : <CircleDot size={20} className="md:size-6 text-red-400" />}
          {isRecording ? (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-600 text-white text-[8px] font-black rounded-full border border-black animate-ping">
              REC
            </span>
          ) : recordingsList.length > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 bg-white/20 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center border border-black">
              {recordingsList.length}
            </span>
          ) : null}
        </button>

        <div className="w-px h-8 bg-white/10 mx-1 md:mx-2 flex-shrink-0" />

        <button 
          onClick={() => { setIsAmbienceMenuOpen(!isAmbienceMenuOpen); if (audioRef.current && activeAmbience === 'none') { audioRef.current.play().catch(() => {}); setTimeout(() => { if (activeAmbience === 'none') { audioRef.current?.pause(); } }, 50); } }}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
            activeAmbience !== 'none' || isAmbienceMenuOpen ? 'bg-white text-black shadow-lg shadow-white/10 scale-110' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          <Music size={20} className="md:size-6" />
        </button>

        <div className="w-px h-8 bg-white/10 mx-1 md:mx-2 flex-shrink-0" />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleProfilePicUpload}
          accept="image/*"
          className="hidden"
        />

        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          title={t.uploadPic}
        >
          <Upload size={20} className="md:size-6" />
        </button>

        <button 
          onClick={() => { triggerHaptic('medium'); toggleMute(); }}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
            isMuted ? 'bg-white text-black shadow-lg shadow-white/20' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          {isMuted ? <MicOff size={20} className="md:size-6" /> : <Mic size={20} className="md:size-6" />}
        </button>

        <div className="relative flex items-center shrink-0">
          <button 
            onClick={() => { triggerHaptic('medium'); toggleCamera(); }}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
              isCameraOff ? 'bg-white text-black shadow-lg shadow-white/20' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={language === 'vi' ? (isCameraOff ? 'Bật Camera' : 'Tắt Camera') : (isCameraOff ? 'Turn on Camera' : 'Turn off Camera')}
          >
            {isCameraOff ? <CameraOff size={20} className="md:size-6" /> : <Camera size={20} className="md:size-6" />}
          </button>
          {!isCameraOff && !isScreenSharing && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsCameraMirrored(prev => {
                  const next = !prev;
                  addNotification(
                    language === 'vi' 
                      ? (next ? 'Đã đổi hướng camera: Lật gương (Tự nhiên)' : 'Đã đổi hướng camera: Hướng thường') 
                      : (next ? 'Camera mirrored' : 'Camera normal'),
                    'info'
                  );
                  return next;
                });
              }}
              className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border shadow-md flex items-center justify-center transition-all cursor-pointer ${
                isCameraMirrored 
                  ? 'bg-[#c5a059] border-[#dfb76c] text-[#16110c] hover:scale-110' 
                  : 'bg-zinc-800 border-white/30 text-white/80 hover:text-white'
              }`}
              title={language === 'vi' ? (isCameraMirrored ? 'Đang lật gương (Tự nhiên) • Bấm để đổi hướng' : 'Đang hướng thường • Bấm để đổi hướng') : 'Flip camera orientation'}
            >
              <FlipHorizontal size={13} />
            </button>
          )}
        </div>

        <button 
          onClick={() => { triggerHaptic('medium'); toggleScreenShare(); }}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
            isScreenSharing ? 'bg-white text-black shadow-lg shadow-white/20 scale-110' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title="Share Screen"
        >
          {isScreenSharing ? <MonitorOff size={20} className="md:size-6" /> : <Monitor size={20} className="md:size-6" />}
        </button>

        <button 
          onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
            isWhiteboardOpen ? 'bg-white text-black shadow-lg shadow-white/20 scale-110' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title="Whiteboard"
        >
          <Edit3 size={20} className="md:size-6" />
        </button>

        <button className="w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
          <Maximize2 size={20} className="md:size-6" />
        </button>
      </footer>

      {/* Notifications Toast */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className={`px-6 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center gap-3 min-w-[240px] ${
                n.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/10 border-white/20 text-white/80'
              }`}
            >
              {n.type === 'success' ? <Users size={16} /> : <Info size={16} />}
              <span className="text-xs font-bold uppercase tracking-widest">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>



      {/* Session Summary Toast */}
      <AnimatePresence>
        {completedSessionData && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-12 right-12 z-[100] max-w-sm w-full bg-[#111] text-white p-6 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-[#F598F2]" />
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-1">
                    {language === 'vi' ? 'Hoàn thành!' : 'Session Complete!'}
                  </h3>
                  <p className="text-[11px] text-white/60 font-medium">
                    {language === 'vi' ? 'Bạn đã tập trung rất tốt.' : 'You maintained great focus.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCompletedSessionData(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60 font-medium uppercase tracking-wider">
                  {language === 'vi' ? 'Thời gian học' : 'Focused Time'}
                </span>
                <span className="text-xl font-mono text-white font-bold tracking-tight">
                  {Math.floor(completedSessionData.durationSeconds / 60)}<span className="text-xs text-white/60 ml-1">min</span>
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
              <Coffee size={18} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-200/80 leading-relaxed font-medium">
                {language === 'vi' 
                  ? 'Tuyệt vời! Bây giờ hãy nghỉ ngơi 5 phút, uống một ngụm nước và thư giãn mắt trước khi bắt đầu phiên tiếp theo nhé.' 
                  : 'Great job! Now take a 5-minute break, drink some water, and rest your eyes before the next session.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN Prompt Modal for Private Room */}
      <AnimatePresence>
        {isPinPromptOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-zinc-900/95 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />
              
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 shadow-lg shadow-purple-500/10">
                <Lock size={30} />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {language === 'vi' ? 'Phòng học riêng tư' : 'Private Study Room'}
              </h3>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                {language === 'vi'
                  ? `Phòng "${roomId}" yêu cầu mã PIN để truy cập. Vui lòng nhập mã PIN được chia sẻ bởi chủ phòng.`
                  : `Room "${roomId}" is protected. Please enter the PIN provided by the room host to join.`}
              </p>

              {pinError && (
                <div className="w-full mb-4 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs text-left flex items-center gap-2">
                  <Info size={14} className="shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyPin} className="w-full space-y-4">
                <div className="relative">
                  <input
                    type={showPinPassword ? "text" : "password"}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (pinError) setPinError(null);
                    }}
                    placeholder={language === 'vi' ? 'Nhập mã PIN phòng...' : 'Enter room PIN...'}
                    autoFocus
                    className="w-full bg-black/60 border border-white/20 rounded-2xl px-5 py-3.5 text-center text-lg tracking-wider text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinPassword(!showPinPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPinPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onLeave}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-sm font-semibold transition-all cursor-pointer"
                  >
                    {language === 'vi' ? 'Rời phòng' : 'Leave'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <KeyRound size={16} />
                    <span>{language === 'vi' ? 'Vào phòng' : 'Unlock & Join'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Host Room Security & PIN Modal */}
      <AnimatePresence>
        {isSecurityModalOpen && isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-zinc-900 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {language === 'vi' ? 'Bảo mật & Mã PIN phòng' : 'Room Security & PIN'}
                    </h3>
                    <p className="text-xs text-white/50">
                      {language === 'vi' ? 'Quản lý quyền truy cập của người tham gia' : 'Manage participant access permissions'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mode Selection */}
              <div className="space-y-3 mb-6">
                <label className="text-xs uppercase font-bold tracking-wider text-white/50 block">
                  {language === 'vi' ? 'Chế độ phòng học' : 'Room Access Type'}
                </label>

                {/* Public Room Option */}
                <div 
                  onClick={() => setSecurityIsPrivate(false)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                    !securityIsPrivate 
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-sm' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${
                    !securityIsPrivate ? 'border-emerald-400 bg-emerald-400 text-black' : 'border-white/30'
                  }`}>
                    {!securityIsPrivate && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Globe size={16} className={!securityIsPrivate ? 'text-emerald-400' : 'text-white/60'} />
                      <span className="text-sm font-bold text-white">
                        {language === 'vi' ? 'Phòng học cộng đồng (Công khai)' : 'Community Room (Public)'}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      {language === 'vi' 
                        ? 'Bất kỳ ai cũng có thể vào tự do mà không cần mật khẩu. Thích hợp học mở cùng cộng đồng.' 
                        : 'Anyone can join freely without a password. Great for open group study.'}
                    </p>
                  </div>
                </div>

                {/* Private Room Option */}
                <div 
                  onClick={() => setSecurityIsPrivate(true)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                    securityIsPrivate 
                      ? 'bg-purple-500/15 border-purple-500/50 shadow-sm' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${
                    securityIsPrivate ? 'border-purple-400 bg-purple-400 text-black' : 'border-white/30'
                  }`}>
                    {securityIsPrivate && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Lock size={16} className={securityIsPrivate ? 'text-purple-400' : 'text-white/60'} />
                      <span className="text-sm font-bold text-white">
                        {language === 'vi' ? 'Phòng riêng tư (Bảo vệ bằng mã PIN)' : 'Private Room (PIN Protected)'}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      {language === 'vi' 
                        ? 'Chủ phòng đặt mã PIN. Người dùng phải nhập đúng mã PIN mới được cấp quyền vào.' 
                        : 'Host sets a PIN code. Users must enter the correct PIN to join.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* PIN Settings (Visible when private is selected) */}
              {securityIsPrivate && (
                <div className="mb-6 p-4 rounded-2xl bg-black/40 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <KeyRound size={14} />
                      <span>{language === 'vi' ? 'Mã PIN của phòng' : 'Room PIN Code'}</span>
                    </label>
                    {roomPin && (
                      <button
                        type="button"
                        onClick={copyOnlyPin}
                        className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1 bg-purple-500/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      >
                        {showCopiedPin ? <Check size={12} /> : <Copy size={12} />}
                        <span>{showCopiedPin ? (language === 'vi' ? 'Đã chép' : 'Copied') : (language === 'vi' ? 'Sao chép PIN' : 'Copy PIN')}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={securityPinInput}
                    onChange={(e) => setSecurityPinInput(e.target.value)}
                    placeholder={language === 'vi' ? 'Nhập mã PIN (VD: 1234, study99)...' : 'Enter PIN (e.g. 1234, deepwork)...'}
                    className="w-full bg-zinc-950 border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono placeholder-white/30 text-sm focus:outline-none focus:border-purple-400"
                  />
                  <p className="text-[11px] text-white/40">
                    {language === 'vi' 
                      ? 'Gợi ý: Đặt từ 4 đến 8 ký tự để chia sẻ cho bạn bè cùng nhóm.' 
                      : 'Tip: Choose 4-8 characters to easily share with your study partners.'}
                  </p>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSecurity(securityIsPrivate, securityPinInput)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check size={16} />
                  <span>{language === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Active Recording Status Banner */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-20 left-1/2 z-[110] px-4 py-2 rounded-full bg-black/90 border border-red-500/50 shadow-2xl backdrop-blur-md flex items-center gap-3 text-white pointer-events-auto"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-black tracking-widest text-red-400">REC</span>
            </div>
            <span className="text-xs font-mono font-bold text-white/90 tabular-nums">
              {formatTime(recordingDuration)}
            </span>
            <span className="text-[10px] uppercase font-serif text-[#c5a059] px-2 py-0.5 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/30">
              {recordingType === 'screen' ? (language === 'vi' ? 'Màn hình & Mic' : 'Screen & Audio') : (language === 'vi' ? 'Chỉ âm thanh' : 'Audio Only')}
            </span>
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/20">
              <button
                onClick={isRecordingPaused ? resumeRecording : pauseRecording}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all text-xs cursor-pointer"
                title={isRecordingPaused ? (language === 'vi' ? 'Tiếp tục ghi' : 'Resume') : (language === 'vi' ? 'Tạm dừng' : 'Pause')}
              >
                {isRecordingPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
              </button>
              <button
                onClick={stopRecording}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                title={language === 'vi' ? 'Dừng & Lưu bản ghi vào Firestore' : 'Stop & Save to Firestore'}
              >
                <Square size={11} fill="currentColor" />
                <span>{language === 'vi' ? 'Dừng' : 'Stop'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Starter Modal */}
      <AnimatePresence>
        {isRecordingModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
            onClick={() => setIsRecordingModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#17120c] border border-[#c5a059]/40 rounded-3xl p-6 max-w-md w-full shadow-2xl text-[#f5ebd7]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#c5a059]/20 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <CircleDot size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-[#f5f0e6]">
                      {language === 'vi' ? 'Ghi lại phiên học' : 'Record Study Session'}
                    </h3>
                    <p className="text-[10px] text-[#a69684]/80">
                      {language === 'vi' ? 'Lưu trữ trực tiếp và liên kết trong Firestore' : 'Stored directly and linked in Firestore'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsRecordingModalOpen(false)} className="text-white/40 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {/* Option 1: Screen + Audio */}
                <button
                  onClick={() => startRecording('screen')}
                  className="w-full p-4 rounded-2xl bg-[#241b13]/80 border border-[#c5a059]/30 hover:border-[#d4af37] hover:bg-[#2e2319] transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Monitor size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-serif font-bold text-[#f5ebd7] group-hover:text-[#e8c872]">
                        {language === 'vi' ? 'Ghi màn hình & âm thanh' : 'Screen & Audio Recording'}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                        Video WebM
                      </span>
                    </div>
                    <p className="text-[11px] text-[#a69684] leading-relaxed">
                      {language === 'vi'
                        ? 'Thu lại màn hình bài giảng, slide hoặc chia sẻ bài tập cùng âm thanh trao đổi.'
                        : 'Captures screen presentations, slides, and shared exercises with room dialogue.'}
                    </p>
                  </div>
                </button>

                {/* Option 2: Audio Only */}
                <button
                  onClick={() => startRecording('audio')}
                  className="w-full p-4 rounded-2xl bg-[#241b13]/80 border border-[#c5a059]/30 hover:border-[#d4af37] hover:bg-[#2e2319] transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Mic size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-serif font-bold text-[#f5ebd7] group-hover:text-[#e8c872]">
                        {language === 'vi' ? 'Chỉ ghi âm thanh' : 'Audio Only Recording'}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                        Audio WebM
                      </span>
                    </div>
                    <p className="text-[11px] text-[#a69684] leading-relaxed">
                      {language === 'vi'
                        ? 'Dung lượng nhẹ, ghi lại cuộc thảo luận giọng nói và các phát biểu trong phòng.'
                        : 'Lightweight format capturing voice discussions and lecture dialogues.'}
                    </p>
                  </div>
                </button>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[#c5a059]/20 text-[11px]">
                <button
                  onClick={() => {
                    setIsRecordingModalOpen(false);
                    setActiveSidebarTab('recordings');
                  }}
                  className="text-[#d4af37] hover:underline flex items-center gap-1 cursor-pointer font-serif"
                >
                  <span>{language === 'vi' ? 'Xem các bản ghi trước' : 'View existing recordings'}</span>
                  <span className="text-[10px] font-mono opacity-80">({recordingsList.length})</span>
                </button>
                <button
                  onClick={() => setIsRecordingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium cursor-pointer"
                >
                  {language === 'vi' ? 'Đóng' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview / Playback & Download Modal */}
      <AnimatePresence>
        {previewRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
            onClick={() => setPreviewRecording(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#17120c] border border-[#c5a059]/40 rounded-3xl p-6 max-w-xl w-full shadow-2xl text-[#f5ebd7] flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <h3 className="text-base font-serif font-bold text-[#f5f0e6] truncate max-w-xs sm:max-w-md">
                    {previewRecording.title}
                  </h3>
                </div>
                <button onClick={() => setPreviewRecording(null)} className="text-white/40 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden bg-black/70 border border-[#c5a059]/20 max-h-[360px] flex items-center justify-center">
                {previewRecording.type === 'screen' ? (
                  <video
                    src={previewRecording.url}
                    controls
                    autoPlay
                    className="w-full h-auto max-h-[350px] object-contain rounded-2xl"
                  />
                ) : (
                  <div className="py-12 px-6 w-full flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                      <Mic size={32} />
                    </div>
                    <audio src={previewRecording.url} controls className="w-full max-w-md mt-2" />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-[#a69684]">
                  {previewRecording.size ? (
                    <span>{language === 'vi' ? 'Dung lượng:' : 'Size:'} {(previewRecording.size / (1024 * 1024)).toFixed(2)} MB • {language === 'vi' ? 'Đã lưu Firestore' : 'Saved to Firestore'}</span>
                  ) : (
                    <span>{language === 'vi' ? 'Đã lưu trên Firestore' : 'Saved to Firestore'}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={previewRecording.url}
                    download={`${previewRecording.title.replace(/[\s/\\:]+/g, '_')}.webm`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#996515] text-[#161007] font-semibold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    <Download size={15} />
                    <span>{language === 'vi' ? 'Tải xuống tệp' : 'Download File'}</span>
                  </a>
                  <button
                    onClick={() => setPreviewRecording(null)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                  >
                    {language === 'vi' ? 'Đóng' : 'Close'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default StudyRoom;
