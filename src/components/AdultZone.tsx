import React, { useState } from "react";
import { EyeOff, Play, Key, CheckCircle, ShieldAlert, Award, AlertTriangle } from "lucide-react";
import { Movie } from "../types";

export interface AdultZoneProps {
  adultMovies: Movie[];
  isUnlocked: boolean;
  onUnlockSuccess: () => void;
  onWatchMovie: (movie: Movie) => void;
  onPurchasePass: (planName: string, price: string) => void;
}

export default function AdultZone({ adultMovies, isUnlocked, onUnlockSuccess, onWatchMovie, onPurchasePass }: AdultZoneProps) {
  const [agedConfirmed, setAgedConfirmed] = useState<boolean>(false);
  const [pin, setPin] = useState<string>("");
  const [isIncognito, setIsIncognito] = useState<boolean>(true);
  const [blurThumbnails, setBlurThumbnails] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string>("");

  const defaultPin = "1818"; // Simple testing pin

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === defaultPin) {
      onUnlockSuccess();
      setErrorText("");
    } else {
      setErrorText("Incorrect secure PIN code! Default test PIN is '1818'.");
    }
  };

  return (
    <div className="bg-black text-[gray] rounded-2xl p-6 border border-purple-900/40 relative overflow-hidden flex flex-col gap-6">
      
      {/* Decorative dark element */}
      <div className="absolute right-0 top-0 w-48 h-48 bg-purple-900/10 rounded-full blur-[80px]" />

      <div className="border-b border-purple-900/30 pb-4 text-center">
        <h2 className="text-2xl font-bold font-bebas tracking-widest text-[#a855f7] flex items-center justify-center gap-2">
          🔞 MOVIEPULSE ADULT PRIVACY THEATER
        </h2>
        <p className="text-white/40 text-[11px] font-mono mt-1">
          Secure, discreet mature entertainment hub. Will not write histories or display previews out on dashboards.
        </p>
      </div>

      {!agedConfirmed ? (
        /* Gating Module 1: Age verification declaration */
        <div className="bg-[#0e0a16] border border-purple-900 p-6 rounded-xl flex flex-col items-center text-center gap-4 max-w-lg mx-auto">
          <AlertTriangle size={36} className="text-purple-500 animate-pulse" />
          <h3 className="text-white font-bold text-base">Age Declaration Required</h3>
          <p className="text-white/60 text-xs leading-relaxed">
            This private section hosts movies restricted strictly to individuals aged 18 and older. By tapping below, you confirm residing in Uganda and being of legal age to view explicit material.
          </p>

          <div className="flex flex-col gap-3 w-full mt-2">
            <button
              onClick={() => setAgedConfirmed(true)}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-700 to-indigo-800 text-white font-bold text-xs tracking-wider uppercase transition hover:from-purple-600 hover:to-indigo-700 cursor-pointer"
            >
              ✓ Confirm I am 18+ Years Old
            </button>
            <p className="text-white/30 text-[10px] uppercase font-mono">Discreet name on transaction records</p>
          </div>
        </div>
      ) : !isUnlocked ? (
        /* Gating Module 2: Secure PIN access protection */
        <div className="bg-[#0e0a16] border border-purple-900 p-6 rounded-xl flex flex-col items-center gap-4 max-w-sm mx-auto w-full">
          <Key className="text-purple-500 animate-bounce" size={24} />
          <h3 className="text-white font-bold text-sm">Discreet PIN Required</h3>
          <p className="text-white/60 text-[11px] text-center">
            Enter private session access PIN. To experience or test this feature instantly, utilize default code <span className="text-purple-400 font-bold font-mono">1818</span>.
          </p>

          <form onSubmit={handlePinSubmit} className="w-full flex flex-col gap-3 mt-1">
            <input
              type="password"
              placeholder="••••"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="bg-black text-center border border-purple-500/30 font-extrabold text-white text-xl p-2.5 rounded-lg outline-none tracking-[0.5em] focus:border-purple-500"
            />
            {errorText && <p className="text-red-500 text-[10px] font-semibold text-center mt-1">{errorText}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold tracking-wider uppercase cursor-pointer"
            >
              Unlock Vault
            </button>
          </form>
        </div>
      ) : (
        /* Module 3: Active unlocked adult portal */
        <div className="flex flex-col gap-5">
          {/* Controls toggle */}
          <div className="bg-black rounded-lg p-3.5 border border-purple-950 flex flex-wrap gap-4 items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7] animate-ping" />
              <span className="text-white font-semibold">Private Session Activated</span>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              {/* Incognito mode switches */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-white/70">
                <input
                  type="checkbox"
                  checked={isIncognito}
                  onChange={(e) => setIsIncognito(e.target.checked)}
                  className="accent-[#a855f7] rounded"
                />
                🕵🏼 incognito (Skip Watch History logs)
              </label>

              {/* Blur toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-white/70">
                <input
                  type="checkbox"
                  checked={blurThumbnails}
                  onChange={(e) => setBlurThumbnails(e.target.checked)}
                  className="accent-[#a855f7] rounded"
                />
                👁️ Blur Thumbnails (Kampala Taxi safe)
              </label>
            </div>
          </div>

          {/* Adult Passes micro plan billing box */}
          <div className="bg-[#120a1c] p-4 rounded-xl border border-purple-900/30 flex flex-col gap-3">
            <h4 className="font-bebas text-base uppercase text-white tracking-wide">🔞 Adult Zone Passes</h4>
            <div className="flex flex-wrap gap-3">
              {[
                { name: "Adult Night Pass", price: "3,000 UGX" },
                { name: "Adult Weekly Pass", price: "10,000 UGX" },
                { name: "Adult Premium Monthly", price: "35,000 UGX" }
              ].map((sub) => (
                <button
                  key={sub.name}
                  onClick={() => onPurchasePass(sub.name, sub.price)}
                  className="flex-1 min-w-[140px] p-3 rounded-lg border border-purple-500/10 bg-black/60 text-left hover:border-purple-500 hover:scale-102 transition cursor-pointer"
                >
                  <span className="text-white font-bold text-[11px] block">{sub.name}</span>
                  <span className="text-[#a855f7] font-semibold text-xs">{sub.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Adult Movies Grid list */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            {adultMovies.map((movie) => (
              <div
                key={movie.id}
                className="group bg-[#0c0a12] border border-purple-900/15 rounded-xl overflow-hidden flex flex-col gap-2 relative shadow"
              >
                {/* Image poster (with option to blur) */}
                <div className="aspect-[3/4] overflow-hidden relative bg-black">
                  <img
                    src={movie.posterUrl}
                    referrerPolicy="no-referrer"
                    alt={movie.title}
                    className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${
                      blurThumbnails ? "blur-xl" : "blur-0"
                    }`}
                  />
                  
                  {blurThumbnails && (
                    <div className="absolute inset-0 flex items-center justify-center p-2 text-center bg-black/40 text-[10px] text-white/60 font-mono">
                      <span>Blurred for public protection</span>
                    </div>
                  )}

                  {/* Play trigger overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <button
                      onClick={() => onWatchMovie(movie)}
                      className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition cursor-pointer"
                    >
                      <Play size={16} fill="white" className="ml-0.5" />
                    </button>
                  </div>
                </div>

                <div className="p-2 flex flex-col gap-0.5">
                  <h4 className="text-white font-bold text-xs truncate">{movie.title}</h4>
                  <span className="text-[9px] font-mono text-purple-400">Duration: {movie.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
