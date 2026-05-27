import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, FastForward, Maximize2, Sparkles, Smile, ShieldAlert, CheckCircle, VolumeX } from "lucide-react";
import { Movie, VJTrack } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../firebase";

interface MoviePlayerProps {
  movie: Movie;
  onNextEpisode?: () => void;
  hasSubscribed: boolean;
  onOfferSubscription: () => void;
}

interface FloatingEmoji {
  id: number;
  char: string;
  style: React.CSSProperties;
}

export default function MoviePlayer({ movie, onNextEpisode, hasSubscribed, onOfferSubscription }: MoviePlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentVJ, setCurrentVJ] = useState<string>(movie.vjs[0]?.name || "Original Soundtrack");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [audioBoost, setAudioBoost] = useState<boolean>(false);
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [loadingComplete, setLoadingComplete] = useState<boolean>(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [subtitles, setSubtitles] = useState<string>("off"); // off, "english", "luganda"

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Premium gating timer: non-subscribers can see only the first 30 seconds of content before being prompted to pay!
  useEffect(() => {
    let watchTimer: NodeJS.Timeout;
    if (movie.isPremium && !hasSubscribed && isPlaying) {
      watchTimer = setInterval(() => {
        if (videoRef.current && videoRef.current.currentTime >= 30) {
          setIsPlaying(false);
          videoRef.current.pause();
          onOfferSubscription();
        }
      }, 1000);
    }
    return () => clearInterval(watchTimer);
  }, [movie.isPremium, hasSubscribed, isPlaying, onOfferSubscription]);

  // Loading sequence simulator
  useEffect(() => {
    setLoadingComplete(false);
    const pTimer = setTimeout(() => {
      setLoadingComplete(true);
      setIsPlaying(true);
    }, 2400); // Cinematic prepare duration
    return () => clearTimeout(pTimer);
  }, [movie.id]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(false));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, movie.id]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = (val / 100) * duration;
      setProgress(val);
    }
  };

  const seek = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const triggerReaction = (emoji: string) => {
    const newEmoji: FloatingEmoji = {
      id: Date.now() + Math.random(),
      char: emoji,
      style: {
        left: `${20 + Math.random() * 60}%`,
        bottom: "80px",
      }
    };
    setFloatingEmojis((prev) => [...prev, newEmoji]);
    // Cleanup emoji
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
    }, 2000);
  };

  const enterFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${isCinemaMode ? "bg-black/95 p-4 rounded-xl shadow-2xl" : ""}`}>
      
      {/* Cinematic Preparing / Loading Overlay */}
      <AnimatePresence>
        {!loadingComplete && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full aspect-video bg-black flex flex-col items-center justify-center relative rounded-xl border border-red-600/20 overflow-hidden"
          >
            {/* Background Blur Image */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-md scale-105"
              style={{ backgroundImage: `url(${movie.backdropUrl})` }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

            <div className="relative flex flex-col items-center z-10 text-center px-6">
              {/* Heartbeat symbol */}
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center border border-red-500 mb-4"
              >
                <div className="w-10 h-10 rounded-full bg-red-600 animate-pulse flex items-center justify-center text-white">
                  🎬
                </div>
              </motion.div>

              <motion.h4
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-white text-lg font-medium tracking-wide mb-1"
              >
                Preparing Your MoMo Movie Experience...
              </motion.h4>
              
              <p className="text-white/40 text-xs font-mono">
                VJ {currentVJ} Audio Injecting • Ultra Low Network Adapter Enabled
              </p>

              {/* Loader */}
              <div className="w-48 bg-gray-800 h-1.5 rounded-full mt-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.2, ease: "easeInOut" }}
                  className="bg-[#e50914] h-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main player viewport */}
      <div
        ref={containerRef}
        className="w-full aspect-video bg-black rounded-xl overflow-hidden relative border border-white/5 shadow-2xl group"
      >
        <video
          ref={videoRef}
          src={movie.videoUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          className="w-full h-full object-cover"
          onClick={togglePlay}
          muted={isMuted}
        />

        {/* Double-tap simulated overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-1/4 hidden group-hover:block z-10">
          <button
            onClick={() => seek(-10)}
            className="w-full h-full bg-black/20 hover:bg-black/40 opacity-0 pointer-events-auto transition text-white flex items-center justify-center hover:opacity-100 font-mono text-xs"
          >
            ⏪ -10s
          </button>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/4 hidden group-hover:block z-10">
          <button
            onClick={() => seek(10)}
            className="w-full h-full bg-black/20 hover:bg-black/40 opacity-0 pointer-events-auto transition text-white flex items-center justify-center hover:opacity-100 font-mono text-xs"
          >
            ⏩ +10s
          </button>
        </div>

        {/* Watermark Overlay for protection */}
        <div className="absolute top-4 left-4 pointer-events-none opacity-20 bg-black/50 px-2 py-0.5 rounded text-[10px] font-mono select-none tracking-widest text-white transition-opacity duration-300">
          MOVIEPULSE SECURE • {auth.currentUser?.email || "GUEST"}
        </div>

        {/* Subtitle Display */}
        {subtitles !== "off" && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-1.5 rounded border border-white/10 text-center text-sm md:text-base text-yellow-400 font-medium z-10 pointer-events-none max-w-[80%]">
            {subtitles === "english" ? (
              <span>[EN Sub: "We have to bypass Kampala and strike from the West!"]</span>
            ) : (
              <span>[VJ Translated: "VJ Junior: Bannange, batusaleko ekkubo e Kampala! Tuwaganyule mbale mbale!"]</span>
            )}
          </div>
        )}

        {/* Free trial warning overlay */}
        {movie.isPremium && !hasSubscribed && (
          <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
            <ShieldAlert size={12} className="shrink-0" />
            30s Session Preview
          </div>
        )}

        {/* Floating Reactions Render */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <AnimatePresence>
            {floatingEmojis.map((emoji) => (
              <motion.div
                key={emoji.id}
                initial={{ opacity: 0, y: 150, scale: 0.5 }}
                animate={{ opacity: 1, y: -200, scale: 1.5, rotate: [0, 15, -15, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, ease: "easeOut" }}
                style={emoji.style}
                className="absolute text-5xl filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
              >
                {emoji.char}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Player Controls Panel HUD */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex flex-col gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Progress Timeline Scrubber */}
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="w-full accent-red-600 bg-gray-700 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            {/* Play controls */}
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="text-white hover:text-red-500 cursor-pointer">
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button onClick={() => seek(-10)} className="text-white hover:text-red-500 cursor-pointer">
                <RotateCcw size={16} />
              </button>
              <button onClick={toggleMute} className="text-white hover:text-red-500 cursor-pointer">
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              <div className="text-white/70">
                {videoRef.current ? Math.floor(videoRef.current.currentTime) : 0}s / {duration ? Math.floor(duration) : 0}s
              </div>
            </div>

            {/* Custom quality and playback adjustments */}
            <div className="flex items-center gap-3">
              {/* Subs toggle */}
              <select
                value={subtitles}
                onChange={(e) => setSubtitles(e.target.value)}
                className="bg-black/70 text-white/80 text-[10px] border border-white/20 px-1 py-0.5 rounded cursor-pointer"
              >
                <option value="off">Subs: Off</option>
                <option value="english">Sub: English</option>
                <option value="luganda">VJ Translates</option>
              </select>

              {/* VJ Sound Selector */}
              <select
                value={playbackSpeed}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value);
                  setPlaybackSpeed(rate);
                  if (videoRef.current) videoRef.current.playbackRate = rate;
                }}
                className="bg-black/70 text-white/80 text-[10px] border border-white/20 px-1 py-0.5 rounded cursor-pointer"
              >
                <option value="1">1.0x Speed</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="0.75">0.75x</option>
              </select>

              {/* Audio boost for noisy Kampala surroundings */}
              <button
                onClick={() => setAudioBoost(!audioBoost)}
                className={`flex items-center gap-1 border border-white/20 text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition ${
                  audioBoost ? "bg-red-600 text-white shadow shadow-red-500" : "bg-black/75 text-white/60"
                }`}
              >
                🔊 Boost
              </button>

              <button onClick={enterFullscreen} className="text-white hover:text-red-500 cursor-pointer">
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Extra Interactive VJ Audio tracks Selector & Reactions HUD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* VJ Selector Box */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-semibold tracking-wide flex items-center gap-1 text-white">
              <Sparkles size={14} className="text-red-500" />
              Active Voice Translation VJ
            </h5>
            <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono uppercase">
              Low-Data Mode Active
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-1">
            {movie.vjs.map((vj, index) => (
              <button
                key={vj.name}
                onClick={() => setCurrentVJ(vj.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition overflow-hidden cursor-pointer ${
                  currentVJ === vj.name
                    ? "bg-[#e50914] text-white shadow-lg shadow-red-900/30 font-bold"
                    : "bg-[#2a2a2a] text-white/60 hover:bg-[#333]"
                }`}
              >
                <span className="text-base">🎙️</span>
                {vj.name} ({vj.language})
                {currentVJ === vj.name && <CheckCircle size={10} className="stroke-[3]" />}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentVJ("Original Soundtrack")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                currentVJ === "Original Soundtrack" ? "bg-[#e50914] text-white font-bold" : "bg-[#2a2a2a] text-white/60"
              }`}
            >
              🔈 Original Sound (English)
            </button>
          </div>
          
          <p className="text-white/40 text-[11px] font-sans mt-1">
            VJ {currentVJ} translates English speech live with local slangs and action summaries. Zero extra data charge.
          </p>
        </div>

        {/* Live Emoji Reactions Panel */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 flex flex-col justify-between">
          <div>
            <h5 className="text-sm font-semibold tracking-wide flex items-center gap-1 text-white">
              <Smile size={14} className="text-red-500" />
              Live Group Audience Reaction
            </h5>
            <p className="text-white/40 text-[11px] mt-0.5">
              Press to post a reaction to all live viewers across Uganda.
            </p>
          </div>

          <div className="flex items-center justify-around mt-3">
            {["😂", "😭", "🔥", "😱", "😍"].map((item) => (
              <button
                key={item}
                onClick={() => triggerReaction(item)}
                className="w-12 h-12 rounded-full hover:scale-125 transition active:scale-95 bg-gradient-to-t from-white/5 to-white/10 flex items-center justify-center text-3xl border border-white/5 shadow-inner cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export type { MoviePlayerProps };
