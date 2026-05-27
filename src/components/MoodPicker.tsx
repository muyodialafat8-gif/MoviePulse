import React from "react";

interface Mood {
  id: string;
  emoji: string;
  name: string;
  color: string;
}

export const MOODS: Mood[] = [
  { id: "comedy", emoji: "😂", name: "Funny", color: "from-yellow-500/10 to-transparent hover:border-yellow-500" },
  { id: "romantic", emoji: "❤️", name: "Romantic", color: "from-pink-500/10 to-transparent hover:border-pink-500" },
  { id: "emotional", emoji: "😭", name: "Emotional", color: "from-blue-500/10 to-transparent hover:border-blue-500" },
  { id: "action", emoji: "🔥", name: "Action", color: "from-red-600/10 to-transparent hover:border-red-500" },
  { id: "horror", emoji: "😱", name: "Horror", color: "from-purple-500/10 to-transparent hover:border-purple-500" }
];

interface MoodPickerProps {
  selectedMood: string | null;
  onSelectMood: (moodId: string | null) => void;
}

export default function MoodPicker({ selectedMood, onSelectMood }: MoodPickerProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-wide text-white uppercase font-bebas">
          🎭 Whasya Mood Today? (Kampala Vibe Selector)
        </h3>
        {selectedMood && (
          <button
            onClick={() => onSelectMood(null)}
            className="text-xs text-red-500 hover:underline font-mono"
          >
            Clear (Show All)
          </button>
        )}
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.id;
          return (
            <button
              key={mood.id}
              onClick={() => onSelectMood(isSelected ? null : mood.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-red-600 border-red-500 text-white font-bold scale-102 shadow-lg shadow-red-900/30"
                  : `bg-[#1a1a1a] border-white/5 text-white/70 bg-gradient-to-r ${mood.color}`
              }`}
            >
              <span className="text-xl">{mood.emoji}</span>
              <span className="text-xs font-semibold">{mood.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
export type { MoodPickerProps };
