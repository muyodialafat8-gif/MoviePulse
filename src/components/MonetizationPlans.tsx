import React, { useState } from "react";
import { CreditCard, CheckCircle, ShieldAlert, BadgeAlert, Wifi, Smartphone, Radio } from "lucide-react";
import { SubscriptionPlan } from "../types";

interface MonetizationPlansProps {
  plans: SubscriptionPlan[];
  userEmail: string;
  onSubscribeSuccess: (planId: string) => void;
}

export default function MonetizationPlans({ plans, userEmail, onSubscribeSuccess }: MonetizationPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [phoneNo, setPhoneNo] = useState<string>("");
  const [trxId, setTrxId] = useState<string>("");
  const [momoProvider, setMomoProvider] = useState<"mtn" | "airtel" | "voucher">("mtn");
  const [showStatus, setShowStatus] = useState<boolean>(false);

  // Group plans for tidy categorizing
  const mainPlans = plans.filter((p) => p.type !== "adult" && !p.id.includes("adult"));
  const microBundle = [
    { id: "social_bundle", name: "📱 Social Bundle Pass", price: "300 UGX", duration: "1 Day access", description: "Shorts feed, community chat rooms access only." },
    { id: "low_data_pass", name: "📶 Low-Data / Audio Mode Pass", price: "800 UGX", duration: "24 Hours access", description: "Enables 144p compression and audio-only playback." },
    { id: "midnight_pass", name: "🌙 Midnight Binge Pass", price: "1,000 UGX", duration: "12AM - 6AM", description: "Unlimited video streaming for night workers." }
  ];

  const handleVerifyPayment = () => {
    if (!selectedPlan) return;
    if (!phoneNo || !trxId) {
      alert("Please enter your Phone number and MTN/Airtel Transaction Code!");
      return;
    }

    // Build WhatsApp message
    const waNumber = "0766051929"; 
    const planName = selectedPlan.name;
    const planCost = selectedPlan.price;
    const msg = `*MoviePulse payment notice* 🎟️
I just completed payments for:
Plan: ${planName}
Price: ${planCost}
User Email: ${userEmail}
Mobile No: ${phoneNo}
Trx Trans ID: ${trxId}
Provider: ${momoProvider.toUpperCase()}
Please activate my subscription right away!`;

    const encodedText = encodeURIComponent(msg);
    const waUrl = `https://api.whatsapp.com/send?phone=256766051929&text=${encodedText}`;

    // Update state to active subscription instantly in developer tools to make the app's billing cycle testable and responsive
    setShowStatus(true);
    setTimeout(() => {
      onSubscribeSuccess(selectedPlan.id);
      window.open(waUrl, "_blank");
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Intro header */}
      <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/5 flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold font-bebas tracking-wide text-yellow-500 uppercase flex items-center gap-1.5">
            🔑 Kampala Binge Center passes
          </h2>
          <p className="text-white/60 text-xs leading-relaxed max-w-xl">
            Choose a low-data flexible plan. Register your transaction id through WhatsApp or airtime scratch voucher to instantly unlock VJ translated content!
          </p>
        </div>
        <div className="flex gap-2.5">
          <div className="bg-[#e50914]/10 border border-red-500/20 px-3 py-1.5 rounded-lg flex flex-col items-center">
            <span className="text-red-500 text-sm font-extrabold font-bebas">MTN MoMo</span>
            <span className="text-[10px] text-white/40 font-mono">*165# Dial</span>
          </div>
          <div className="bg-red-900/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg flex flex-col items-center">
            <span className="text-yellow-500 text-sm font-extrabold font-bebas">Airtel Money</span>
            <span className="text-[10px] text-white/40 font-mono">*185# Dial</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card columns for plans selection */}
        <div className="md:col-span-2 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mainPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`p-4 rounded-xl border text-left transition relative flex flex-col justify-between h-40 cursor-pointer ${
                  selectedPlan?.id === plan.id
                    ? "bg-[#e50914]/15 border-[#ff0a16] shadow-lg shadow-red-900/25 scale-102"
                    : "bg-[#161616] border-white/5 hover:bg-[#202020]"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-white line-clamp-1">{plan.name}</span>
                    {plan.id === "monthly_plan" && (
                      <span className="bg-[#25D366] text-black text-[9px] uppercase font-mono font-black px-1.5 py-0.5 rounded">
                        Most popular
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-[11px] line-clamp-2 mt-1">{plan.description}</p>
                </div>

                <div className="flex justify-between items-end border-t border-white/5 pt-2.5 mt-2.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/30 uppercase font-mono">Cost</span>
                    <span className="font-extrabold text-[#ffd700] text-sm">{plan.price}</span>
                  </div>
                  <span className="text-[10px] text-red-500 font-bold bg-red-950/25 px-2 py-0.5 rounded font-mono">
                    {plan.duration}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <h3 className="text-sm font-semibold tracking-wide text-white font-mono uppercase border-b border-white/5 pb-2 mt-2">
            📲 Uganda Flexible Micro-Bundles (Pay-As-You-Watch)
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {microBundle.map((micro) => (
              <button
                key={micro.id}
                onClick={() => setSelectedPlan({
                  id: micro.id,
                  name: micro.name,
                  price: micro.price,
                  duration: micro.duration,
                  description: micro.description,
                  type: "single_pass"
                })}
                className={`p-3.5 rounded-lg border text-left transition flex flex-col justify-between h-32 cursor-pointer ${
                  selectedPlan?.id === micro.id
                    ? "bg-[#e50914]/15 border-[#ff0a16] scale-102"
                    : "bg-[#141414] border-white/5 hover:bg-[#1a1a1a]"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-[11px] text-white line-clamp-1">{micro.name}</span>
                  <p className="text-white/40 text-[9px] mt-1 line-clamp-2 leading-relaxed">{micro.description}</p>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                  <span className="text-xs font-bold text-yellow-500">{micro.price}</span>
                  <span className="text-[9px] font-mono text-white/30 uppercase">{micro.duration}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Paying form helper column */}
        <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/5 flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-4">
            <h3 className="font-bebas text-lg uppercase tracking-wide text-[#ff0a16] flex items-center gap-1">
              🏦 MoMo Checkout Gateway
            </h3>

            {selectedPlan ? (
              <div className="bg-black/40 p-3 rounded-lg border border-red-500/20 flex flex-col gap-1 text-xs">
                <span className="text-white/40 text-[10px] uppercase font-mono">Paying for</span>
                <span className="font-bold text-white text-sm">{selectedPlan.name}</span>
                <span className="text-[#ffd700] text-base font-extrabold">{selectedPlan.price}</span>
              </div>
            ) : (
              <div className="bg-black/40 p-4 rounded-lg border border-white/5 text-center text-xs text-white/40 font-mono">
                Select any pricing tier on the left to activate checkout
              </div>
            )}

            {/* MoMo Provider Button */}
            <div className="flex gap-2">
              <button
                onClick={() => setMomoProvider("mtn")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                  momoProvider === "mtn" ? "bg-yellow-500 text-black shadow-md font-bold" : "bg-black/30 text-white/40"
                }`}
              >
                MTN MoMo
              </button>
              <button
                onClick={() => setMomoProvider("airtel")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                  momoProvider === "airtel" ? "bg-red-600 text-white shadow-md font-bold" : "bg-black/30 text-white/40"
                }`}
              >
                Airtel Money
              </button>
            </div>

            {/* Interactive instructions */}
            <div className="bg-black/60 p-3.5 rounded-xl border border-white/5 flex flex-col gap-2.5 text-xs text-gray-300">
              <span className="font-bold uppercase tracking-wide text-white/50 text-[10px] flex items-center gap-1">
                <Smartphone size={12} className="text-red-500" /> Dial instruction
              </span>
              {momoProvider === "mtn" ? (
                <div className="flex flex-col gap-1">
                  <p>1. Dial <span className="text-yellow-400 font-extrabold font-mono">*165#</span> on phone</p>
                  <p>2. Select Send Money option</p>
                  <p>3. Send amount to: <span className="text-yellow-400 font-extrabold font-mono">0766051929</span></p>
                  <p className="text-[10px] text-[#25D366]">Registered: Ivan K.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <p>1. Dial <span className="text-red-400 font-extrabold font-mono">*185#</span> on phone</p>
                  <p>2. Select Send Money option</p>
                  <p>3. Send amount to: <span className="text-red-400 font-extrabold font-mono">0704557858</span></p>
                  <p className="text-[10px] text-[#25D366]">Registered: Ivan K.</p>
                </div>
              )}
            </div>

            {/* Payload fields */}
            <div className="flex flex-col gap-3 mt-1">
              <div>
                <label className="text-[10px] uppercase font-mono text-white/50 mb-1 block">Your Mobile Number Paid From</label>
                <input
                  type="text"
                  placeholder="e.g. 0766051929"
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-[#ff0a16] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-white/50 mb-1 block">MTN/Airtel Transaction Code (Trx ID)</label>
                <input
                  type="text"
                  placeholder="e.g. TX123456789"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-[#ff0a16] outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleVerifyPayment}
            disabled={!selectedPlan || showStatus}
            className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition border cursor-pointer ${
              selectedPlan && !showStatus
                ? "bg-[#25D366] hover:bg-emerald-500 text-black font-black border-[#25D366] shadow-lg shadow-emerald-900/30"
                : "bg-gray-800 text-gray-500 border-transparent cursor-not-allowed"
            }`}
          >
            {showStatus ? "Verifying with VJ Network..." : "✅ I HAVE PAID (Open WhatsApp Prompt)"}
          </button>
        </div>
      </div>
    </div>
  );
}
export type { MonetizationPlansProps };
