import React, { useRef, useState, useEffect } from "react";
import { ShortClip } from "../types";
import { Play, Pause, Bookmark, Sparkles, Navigation, Send, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ShortsSwipeProps {
  shorts: ShortClip[];
  onWatchFullMovie: (movieId: string) => void;
}

export default function ShortsSwipe({ shorts, onWatchFullMovie }: ShortsSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [savedClips, setSavedClips] = useState<string[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Setup vertical observer or trigger autoplay
  useEffect(() => {
    videoRefs.current.forEach((ref, idx) => {
      if (ref) {
        if (idx === currentIndex) {
          ref.currentTime = 0;
          if (isPlaying) {
            ref.play().catch(() => {});
          }
        } else {
          ref.pause();
        }
      }
    });
  }, [currentIndex, isPlaying, shorts]);

  const activeShort = shorts[currentIndex];

  const handleNext = () => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const toggleSaveClip = (clipId: string) => {
    setSavedClips((prev) =>
      prev.includes(clipId) ? prev.filter((id) => id !== clipId) : [...prev, clipId]
    );
  };

  const shareToSocial = (network: string, short: ShortClip) => {
    const text = encodeURIComponent(`*MoviePulse Uganda* 🎬 Check out VJ ${short.vjName}'s crazy translated translation of ${short.movieTitle}! Watch full movie here now: https://moviepulse.com/movie/${short.movieId}`);
    let url = "";
    if (network === "whatsapp") {
      url = `https://api.whatsapp.com/send?text=${text}`;
    } else if (network === "facebook") {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://moviepulse.com")}`;
    } else {
      url = `https://t.me/share/url?url=${encodeURIComponent("https://moviepulse.com")}&text=${text}`;
    }
    window.open(url, "_blank");
  };

  if (!shorts || shorts.length === 0) {
    return (
      <div className="h-[75vh] flex flex-col items-center justify-center text-center">
        <Sparkles size={40} className="text-red-500 animate-pulse mb-3" />
        <p className="text-white/60 text-sm font-mono">No short clips uploaded by Kampala Admins yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[75vh] max-w-4xl mx-auto">
      
      {/* Vertical Video Viewport CARD */}
      <div className="flex-1 bg-black rounded-3xl overflow-hidden relative shadow-2xl border border-white/5 flex flex-col h-full bg-gradient-to-b from-[#111] to-black">
        
        {/* Active Short Video loop */}
        <div className="w-full flex-1 relative bg-black aspect-[9/16] overflow-hidden">
          <video
            ref={(el) => {
              videoRefs.current[currentIndex] = el;
            }}
            src={activeShort.videoUrl}
            loop
            muted={false}
            playsInline
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-full h-full object-cover"
          />

          {/* Autoplay status Indicator HUD */}
          <AnimatePresence>
            {!isPlaying && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 m-auto w-16 h-16 bg-black/60 rounded-full flex items-center justify-center border border-white/20 z-10 pointer-events-none"
              >
                <Pause size={24} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Left Floating Info Overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-5 pt-16 flex flex-col gap-2 pointer-events-none z-10">
            <div className="pointer-events-auto">
              <span className="bg-[#ff004f] text-[10px] text-white font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">
                🔥 VJ {activeShort.vjName} RECOMMENDS
              </span>
            </div>

            <h4 className="text-white font-bold text-base select-text pointer-events-auto">
              @{activeShort.movieTitle} Shorts
            </h4>
            
            <p className="text-white/80 text-xs leading-snug line-clamp-2 select-text pointer-events-auto">
              {activeShort.description}
            </p>

            <div className="flex flex-wrap gap-1.5 mt-1 pointer-events-auto">
              {activeShort.hashtags.map((tag) => (
                <span key={tag} className="text-[#ff004f] text-xs font-semibold hover:underline cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-2 pointer-events-auto text-white/50 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#ff004f] animate-ping" />
              🔊 {activeShort.musicLabel || "Original Translated VJ audio track"}
            </div>
          </div>

          {/* RIGHT ACTION COLUMN BAR - (Clean, strictly no comments or likes!) */}
          <div className="absolute right-4 bottom-20 flex flex-col gap-5 items-center z-10">
            {/* Real-time views indicator */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white text-base">
                👁️
              </div>
              <span className="text-[10px] font-mono font-bold mt-1 text-white/90">
                {(activeShort.views / 1000).toFixed(1)}K
              </span>
            </div>

            {/* Save Clip */}
            <button
              onClick={() => toggleSaveClip(activeShort.id)}
              className="group flex flex-col items-center cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-full transition border flex items-center justify-center ${
                savedClips.includes(activeShort.id)
                  ? "bg-yellow-500 border-yellow-400 text-black shadow-lg"
                  : "bg-black/60 border-white/10 text-white hover:bg-black/80"
              }`}>
                <Bookmark size={16} className={savedClips.includes(activeShort.id) ? "fill-black" : ""} />
              </div>
              <span className="text-[10px] font-mono mt-1 text-white/70">Save Clip</span>
            </button>

            {/* Shares Column */}
            <div className="flex flex-col gap-1.5 pt-2">
              <p className="text-[9px] font-mono text-white/40 text-center select-none">SHARE TO</p>
              
              <button
                onClick={() => shareToSocial("whatsapp", activeShort)}
                className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md hover:scale-110 transition cursor-pointer"
                title="Share to WhatsApp"
              >
                <span className="text-sm">💬</span>
              </button>

              <button
                onClick={() => shareToSocial("telegram", activeShort)}
                className="w-8 h-8 rounded-full bg-[#26A5E4] text-white flex items-center justify-center shadow-md hover:scale-110 transition cursor-pointer"
                title="Share to Telegram"
              >
                <Send size={12} />
              </button>
            </div>
          </div>

          {/* LARGE GLOWING BUTTON AT THE VERY BOTTOM */}
          <div className="absolute bottom-5 inset-x-5 z-25">
            <button
              onClick={() => onWatchFullMovie(activeShort.movieId)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#e50914] to-[#ff0b16] text-white text-xs font-bold tracking-widest uppercase hover:scale-102 active:scale-98 transition shadow-[0_4px_20px_rgba(229,9,20,0.5)] border border-red-500 flex items-center justify-center gap-2 cursor-pointer"
            >
              🎬 WATCH FULL MOVIE (Dynamic Redirectout)
            </button>
          </div>
        </div>

        {/* Up/Down Swipe Indicators at Mobile Header / Left Margin */}
        <div className="bg-[#1a1a1a] p-3 flex items-center justify-between border-t border-white/5 text-xs font-mono text-white/60">
          <span>Clips Loop: {currentIndex + 1} of {shorts.length}</span>
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-1 rounded bg-[#2a2a2a] disabled:opacity-30 cursor-pointer text-white"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === shorts.length - 1}
              className="p-1 rounded bg-[#2a2a2a] disabled:opacity-30 cursor-pointer text-white"
            >
              <ArrowDown size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Side list column detailing Shorts queue */}
      <div className="w-full md:w-64 flex flex-col gap-3 h-full overflow-y-auto">
        <h3 className="font-bebas text-lg uppercase tracking-wide text-[#ff004f]">
          🎦 Kampala Trending Shorts
        </h3>
        <p className="text-white/40 text-[11px] leading-relaxed">
          Swipe through high-octane 30s VJ previews. Direct click standard watch to access deep catalog.
        </p>

        <div className="flex flex-col gap-2 mt-2">
          {shorts.map((sh, idx) => (
            <button
              key={sh.id}
              onClick={() => setCurrentIndex(idx)}
              className={`text-left p-2.5 rounded-xl border transition flex gap-3 cursor-pointer items-center ${
                currentIndex === idx
                  ? "bg-[#ff004f]/10 border-[#ff004f] text-white"
                  : "bg-[#161616] border-white/5 text-white/50 hover:bg-[#202020]"
              }`}
            >
              <span className="text-lg">🍿</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white line-clamp-1">{sh.movieTitle} clip</span>
                <span className="text-[10px] font-mono text-white/40">VJ {sh.vjName} • {(sh.views/1000).toFixed(0)}k views</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
export type { ShortsSwipeProps };
