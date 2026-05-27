import React, { useState } from "react";
import { Sparkles, Trophy, Gift, Club, HelpCircle, CheckCircle, Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DailyRewardWheelProps {
  currentCoins: number;
  userLevel: string;
  userStreak: number;
  onCoinsAwarded: (coinsAmount: number) => void;
  onBonusSubUnlocked?: (hoursCount: number) => void;
  onStreakCheckIn?: () => void;
}

const SPIN_SECTORS = [
  { label: "50 PulseCoins", type: "coins", value: 50, angle: 0, color: "bg-red-900" },
  { label: "Free 1Hour Premium", type: "sub", value: 1, angle: 60, color: "bg-amber-900" },
  { label: "10 PulseCoins", type: "coins", value: 10, angle: 120, color: "bg-red-900" },
  { label: "250 Movie JackPot", type: "coins", value: 250, angle: 180, color: "bg-yellow-600 text-black font-extrabold" },
  { label: "100 PulseCoins", type: "coins", value: 100, angle: 240, color: "bg-red-900" },
  { label: "Free 3Hours Premium", type: "sub", value: 3, angle: 300, color: "bg-amber-800" }
];

export default function DailyRewardWheel({
  currentCoins,
  userLevel,
  userStreak,
  onCoinsAwarded,
  onBonusSubUnlocked,
  onStreakCheckIn
}: DailyRewardWheelProps) {
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinDeg, setSpinDeg] = useState<number>(0);
  const [hasSpunToday, setHasSpunToday] = useState<boolean>(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);

  // Guess the Scene Quiz Gamification Section
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const quizOptions = [
    " Phiona goes to Katwe chess championship",
    " Tyler Rake battles mercenary squad on bullet train",
    " Jason Statham burns down phishing call centers"
  ];
  const correctAnswerIdx = 1; // Extraction 2 Scene

  const handleLuckySpin = () => {
    if (isSpinning || hasSpunToday) return;

    setIsSpinning(true);
    setSpinResult(null);

    // Pick a random sector index e.g. index 3 (Jackpot 250) or random index
    const randomIndex = Math.floor(Math.random() * SPIN_SECTORS.length);
    const sector = SPIN_SECTORS[randomIndex];

    // Set high rotation degrees
    const extraRots = 5 * 360; // 5 full turns
    const sectorAngle = 360 - sector.angle;
    const finalAngle = extraRots + sectorAngle;

    setSpinDeg(finalAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setHasSpunToday(true);
      setSpinResult(sector.label);

      if (sector.type === "coins") {
        onCoinsAwarded(sector.value);
      } else if (sector.type === "sub" && onBonusSubUnlocked) {
        onBonusSubUnlocked(sector.value);
      }
    }, 4100);
  };

  const submitQuiz = () => {
    if (selectedAnswer === null) return;
    setQuizSubmitted(true);
    if (selectedAnswer === correctAnswerIdx) {
      onCoinsAwarded(100); // 100 bonus coins awarded
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
      
      {/* Sector 1: Spinner wheel & streak */}
      <div className="bg-[#1a1a1a] rounded-xl p-5 border border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="text-yellow-500 animate-bounce" size={20} />
            <span className="font-bebas text-lg uppercase tracking-wider text-white">Uganda Daily Lucky Spin</span>
          </div>
          <div className="flex items-center gap-1 text-[#25D366] bg-[#25D366]/10 px-2 py-0.5 rounded text-xs font-semibold">
            <Flame size={14} className="fill-[#25D366]" />
            Streak: {userStreak} Days
          </div>
        </div>

        {/* Lucky Spin Graphics */}
        <div className="flex flex-col items-center justify-center relative p-3">
          <div className="relative w-48 h-48 rounded-full border-4 border-[#ff0a16] shadow-[0_0_20px_#e50914] overflow-hidden flex items-center justify-center">
            
            {/* Spinning surface */}
            <div
              style={{
                transform: `rotate(${spinDeg}deg)`,
                transition: isSpinning ? "transform 4s cubic-bezier(0.25, 1, 0.5, 1)" : "none"
              }}
              className="absolute inset-0 rounded-full bg-black flex items-center justify-center"
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  style={{ transform: `rotate(${i * 60}deg)` }}
                  className="absolute inset-0 border-r border-white/10 flex items-start justify-center pt-2 text-[9px] font-mono uppercase text-gray-300 pointer-events-none"
                >
                  <span className="rotate-90 origin-bottom whitespace-nowrap pt-8 pl-1">
                    {SPIN_SECTORS[i].label}
                  </span>
                </div>
              ))}
            </div>

            {/* Static Core Indicator and Trigger */}
            <div className="absolute w-12 h-12 bg-black border-2 border-white rounded-full flex items-center justify-center shadow-lg z-10">
              <span className="text-lg">🎯</span>
            </div>
            
            {/* Pin pointer */}
            <div className="absolute top-0 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-white z-20" />
          </div>

          <button
            onClick={handleLuckySpin}
            disabled={isSpinning || hasSpunToday}
            className={`w-full max-w-[200px] mt-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition cursor-pointer ${
              hasSpunToday
                ? "bg-gray-800 text-gray-500"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-md shadow-red-900/30 font-semibold"
            }`}
          >
            {isSpinning ? "Spinning..." : hasSpunToday ? "Spun Today ✓" : "🎁 SPIN NOW"}
          </button>
        </div>

        <AnimatePresence>
          {spinResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-black/60 p-3 rounded-lg border border-yellow-500/30 text-center text-xs"
            >
              🎉 You landed on <span className="text-yellow-400 font-extrabold">{spinResult}</span>!
              Reward automatically added to your pulse coin wallet.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sector 2: Guess the scene gamified arena */}
      <div className="bg-[#1a1a1a] rounded-xl p-5 border border-white/5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500 animate-pulse" size={18} />
            <span className="font-bebas text-lg uppercase tracking-wider text-white">Daily Scene Arena Quiz</span>
          </div>
          <p className="text-white/50 text-[11.5px] mt-1.5 leading-relaxed">
            Mystery Scene Description: <span className="text-gray-200">"An intensely blood-soaked hero crashes a cargo train down the tracks while VJ Junior screams 'Akakodyo, twakebuka!'"</span>
          </p>

          <div className="flex flex-col gap-2 mt-4">
            {quizOptions.map((opt, idx) => (
              <button
                key={idx}
                disabled={quizSubmitted}
                onClick={() => setSelectedAnswer(idx)}
                className={`text-left p-3 rounded-xl text-xs flex items-center gap-2 border transition ${
                  quizSubmitted && idx === correctAnswerIdx
                    ? "bg-[#25D366]/10 border-[#25D366] text-[#25D366]"
                    : quizSubmitted && selectedAnswer === idx && idx !== correctAnswerIdx
                    ? "bg-red-600/10 border-red-500 text-red-400"
                    : selectedAnswer === idx
                    ? "bg-[#e50914]/10 border-red-500 text-[#e50914] font-medium"
                    : "bg-black/40 border-white/5 text-white/70 hover:bg-[#252525] cursor-pointer"
                }`}
              >
                <HelpCircle size={14} className="shrink-0" />
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {!quizSubmitted ? (
            <button
              onClick={submitQuiz}
              disabled={selectedAnswer === null}
              className={`w-full py-2.5 rounded-lg text-xs font-semibold tracking-wider transition cursor-pointer ${
                selectedAnswer !== null ? "bg-white text-black font-bold" : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              Verify Scene (+100 PulseCoins)
            </button>
          ) : (
            <div className="flex items-center gap-2 justify-center bg-black/40 py-2 px-3 rounded text-xs font-mono">
              {selectedAnswer === correctAnswerIdx ? (
                <span className="text-[#25D366] flex items-center gap-1 font-bold">
                  <CheckCircle size={14} /> Correct (+100 Coins credited!)
                </span>
              ) : (
                <span className="text-red-500 font-bold">Incorrect answer. Try again tomorrow!</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export type { DailyRewardWheelProps };
