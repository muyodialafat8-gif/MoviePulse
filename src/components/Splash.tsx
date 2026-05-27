import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const [letters, setLetters] = useState<string[]>([]);
  const logoText = "MOVIEPULSE";

  useEffect(() => {
    // Populate letters incrementally
    const timer = setTimeout(() => {
      setLetters(logoText.split(""));
    }, 400);

    // Fade out splash after 2.8 seconds
    const finishTimer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Radiant back lighting */}
      <div className="absolute w-[300px] h-[300px] bg-red-600/10 rounded-full blur-[100px]" />

      <div className="flex flex-col items-center">
        {/* Animated Text Logo */}
        <div className="flex gap-1.5 md:gap-3 select-none">
          {logoText.split("").map((char, idx) => (
            <motion.span
              key={idx}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={letters.length > 0 ? {
                opacity: 1,
                y: 0,
                scale: 1,
                textShadow: [
                  "0 0 10px rgba(229,9,20, 0.4)",
                  "0 0 30px rgba(229,9,20, 0.8)",
                  "0 0 10px rgba(229,9,20, 0.4)"
                ]
              } : {}}
              transition={{
                duration: 0.6,
                delay: idx * 0.08,
                ease: "easeOut"
              }}
              className="font-bebas text-5xl md:text-8xl tracking-wider text-[#e50914]"
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Pulse Bar Indicator */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 140, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.6 }}
          className="h-1 bg-gradient-to-r from-transparent via-[#ff0a16] to-transparent mt-4 relative"
        >
          <motion.div
            animate={{ left: ["0%", "85%", "0%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-0.5 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#fff]"
          />
        </motion.div>

        {/* Cinematic subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="text-white/60 text-xs md:text-sm uppercase tracking-[0.4em] font-mono mt-4 text-center px-4"
        >
          Uganda's Translated VJ Streaming Home
        </motion.p>
      </div>

      {/* Floating Sparkles in the background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight + 200
            }}
            animate={{
              opacity: [0, 0.5, 0],
              y: [null, Math.random() * -300]
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            className="absolute w-1 h-1 bg-red-500 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}
export type { SplashProps };
