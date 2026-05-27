import { doc, setDoc, writeBatch, collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "./firebase";
import { Movie, Series, Episode, ShortClip, AdCampaign, SubscriptionPlan, LiveChannel } from "./types";

export const DEFAULT_PLANS: SubscriptionPlan[] = [
  { id: "hourly_pass", name: "⚡ Hourly Pass", price: "500 UGX", duration: "1 Hour", description: "Full streaming with any VJ audio for 1 hour.", type: "hourly" },
  { id: "daily_plan", name: "📅 Daily Plan", price: "1,600 UGX", duration: "24 Hours", description: "Unrestricted cinema access for a full day.", type: "daily" },
  { id: "weekend_pass", name: "🎉 Weekend Pass", price: "3,000 UGX", duration: "3 Days", description: "Perfect for a massive weekend binge show.", type: "daily" },
  { id: "night_owl", name: "🌙 Night Owl Pass", price: "2,000 UGX", duration: "12 Hours (6PM - 6AM)", description: "Night time unlimited streaming.", type: "daily" },
  { id: "weekly_plan", name: "📆 Weekly Plan", price: "6,000 UGX", duration: "7 Days", description: "Fabulous value for standard weekly users.", type: "weekly" },
  { id: "safari_plan", name: "🦁 Safari Plan", price: "8,000 UGX", duration: "10 Days", description: "Binge movies on long travel journeys.", type: "weekly" },
  { id: "monthly_plan", name: "🔥 Monthly Plan", price: "25,000 UGX", duration: "30 Days", description: "Our ultimate, ultra-popular monthly binge pass.", type: "monthly" },
  { id: "student_monthly", name: "🎓 Student Monthly", price: "15,000 UGX", duration: "30 Days", description: "Discounted rates for verified campus students.", type: "monthly" },
  { id: "movie_pass_extr", name: "🎬 Single Movie Pass (Extraction)", price: "500 UGX", duration: "24 Hours", description: "Unlock Extraction 2 Premium content.", type: "single_pass" },
  { id: "adult_night", name: "🔞 Adult Night Pass", price: "3,000 UGX", duration: "12 Hours", description: "Discreet 18+ Access for 1 night.", type: "adult" },
  { id: "adult_monthly", name: "🔞 Adult Monthly Premium", price: "35,000 UGX", duration: "30 Days", description: "Discreet, secure private catalog streaming.", type: "adult" }
];

export const DEFAULT_MOVIES: Movie[] = [
  {
    id: "extraction-2",
    title: "Extraction 2 (VJ Junior Translated)",
    description: "Tyler Rake is back from the brink of death. Rescued and translated live by legendary VJ Junior with spectacular Luganda commentary.",
    synopsis: "After surviving his cybernetic and physical injuries from his mission in Dhaka, Tyler Rake is back. VJ Junior pumps up the action scene by scene bringing the intense action to Kampala with emotional and hilarious translations (\"Akakodyo, ffe abali wano embeera ekyuse!!\").",
    backdropUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1200",
    posterUrl: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=400",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    duration: "2h 02m",
    rating: "R",
    year: 2023,
    views: 18400,
    isPremium: false,
    category: "Action",
    tags: ["Hot", "VJ Translated", "Trending", "Uganda Favorite"],
    vjs: [
      { name: "VJ Junior", language: "Luganda" },
      { name: "VJ Emmy", language: "Luganda" }
    ]
  },
  {
    id: "the-beekeeper",
    title: "The Beekeeper (VJ Emmy Translated)",
    description: "One man's brutal campaign for vengeance takes on national stakes after he is revealed to be a former operative of a powerful organization.",
    synopsis: "Classic action thriller featuring Jason Statham, animated beautifully with VJ Emmy's signature high-speed storytelling. Emmy explains every technical trick in clear Kampala slang.",
    backdropUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200",
    posterUrl: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=400",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    duration: "1h 45m",
    rating: "PG-13",
    year: 2024,
    views: 12500,
    isPremium: true,
    category: "Action",
    tags: ["New", "Premium", "Action"],
    vjs: [
      { name: "VJ Emmy", language: "Luganda" },
      { name: "VJ Jingo", language: "Luganda" }
    ]
  },
  {
    id: "queen-of-katwe",
    title: "Queen of Katwe (Luganda Pride)",
    description: "The heartwarming true story of Phiona Mutesi, a young girl from the Kampala slums who becomes an international chess champion.",
    synopsis: "Set in Katwe, Kampala, this stunning movie illustrates courage, hope, and determination. Enhanced with Luganda voiceover cues by VJ Junior to celebrate Ugandan excellence.",
    backdropUrl: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&q=80&w=1200",
    posterUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=400",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    duration: "2h 04m",
    rating: "PG",
    year: 2016,
    views: 31200,
    isPremium: false,
    category: "Ugandan",
    tags: ["Inspirational", "Slum Pride", "Must Watch"],
    vjs: [
      { name: "VJ Junior", language: "Luganda" }
    ]
  },
  {
    id: "bad-boys-ride",
    title: "Bad Boys: Ride or Die (VJ Jingo Comic Edition)",
    description: "Miami's finest go on the run to clear the name of their late Captain, translated with hilarious jokes by VJ Jingo.",
    synopsis: "Mike Lowrey and Marcus Burnett return in high-concept action. VJ Jingo throws local Kampala jokes, double entendres, and community warnings that make the audience scream with laughter.",
    backdropUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=1200",
    posterUrl: "https://images.unsplash.com/photo-1542204172-e7052809f852?auto=format&fit=crop&q=80&w=400",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    duration: "1h 58m",
    rating: "R",
    year: 2024,
    views: 22000,
    isPremium: true,
    category: "Comedy",
    tags: ["Funny", "Comic VJ", "Blockbuster"],
    vjs: [
      { name: "VJ Jingo", language: "Luganda" }
    ]
  }
];

export const DEFAULT_ADULT_MOVIES: Movie[] = [
  {
    id: "midnight-desires",
    title: "Midnight Desires (18+ Private Zone Check)",
    description: "Premium adult drama. Private discreet view only. Will not appear on your normal history log.",
    synopsis: "Discreet high-concept mature entertainment for adult subscribers. Features automatic PIN session lock and quick panic-exit triggers for security on public Kampala transportation.",
    backdropUrl: "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&q=80&w=1200",
    posterUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback.mp4",
    duration: "1h 30m",
    rating: "18+",
    year: 2025,
    views: 4500,
    isPremium: true,
    category: "Adult Zone",
    tags: ["18+", "Locked", "Sensual", "Private"],
    vjs: [{ name: "Incognito Voice", language: "English" }],
    isAdult: true
  }
];

export const DEFAULT_SERIES: Series[] = [
  {
    id: "shogun-vj",
    title: "Shogun Season 1 (VJ Emmy)",
    description: "Lord Yoshii Toranaga fights for his life as his enemies on the Council of Regents unite against him.",
    backdropUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=1200",
    posterUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=400",
    year: 2024,
    views: 14800,
    episodesCount: 2,
    isPremium: true,
    category: "Drama",
    tags: ["Legendary", "Action", "Drama"]
  }
];

export const DEFAULT_EPISODES: Episode[] = [
  {
    id: "shogun-ep-1",
    seriesId: "shogun-vj",
    title: "Episode 1: Anjin",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "58m",
    episodeNumber: 1,
    seasonNumber: 1
  },
  {
    id: "shogun-ep-2",
    seriesId: "shogun-vj",
    title: "Episode 2: Servants of Two Masters",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    duration: "55m",
    episodeNumber: 2,
    seasonNumber: 1
  }
];

export const DEFAULT_SHORTS: ShortClip[] = [
  {
    id: "extraction-short-1",
    movieId: "extraction-2",
    movieTitle: "Extraction 2",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    description: "Tyler Rake wipes out a squad on a moving cargo train! Insane translation by VJ Junior!",
    hashtags: ["extraction2", "vjjunior", "actionclash", "pulseclassic"],
    vjName: "VJ Junior",
    views: 42100,
    musicLabel: "Original VJ Translated Audio"
  },
  {
    id: "beekeeper-short-1",
    movieId: "the-beekeeper",
    movieTitle: "The Beekeeper",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    description: "Don't mess with the hive! VJ Emmy translation is pure gold!",
    hashtags: ["beekeeper", "vjemmy", "statham", "kampalacinema"],
    vjName: "VJ Emmy",
    views: 29800,
    musicLabel: "Beekeeper Epic Beat"
  },
  {
    id: "badboys-short-1",
    movieId: "bad-boys-ride",
    movieTitle: "Bad Boys: Ride or Die",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    description: "Marcus Burnett eats Skittles mid shootouts! Jingo's jokes are wild!",
    hashtags: ["badboys", "vjjingo", "comedyug", "skittleslol"],
    vjName: "VJ Jingo",
    views: 55200,
    musicLabel: "Kampala Party Remix"
  }
];

export const DEFAULT_ADS: AdCampaign[] = [
  {
    id: "ad-mtn-momo",
    imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&q=80&w=600",
    redirectUrl: "momo-dial",
    sponsorName: "MTN MoMo",
    type: "banner",
    clicks: 145
  },
  {
    id: "ad-airtel-internet",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600",
    redirectUrl: "airtel-dial",
    sponsorName: "Airtel SupaNetwork",
    type: "card",
    clicks: 85
  }
];

export const DEFAULT_CHANNELS: LiveChannel[] = [
  { id: "vj-jun-tv", name: "VJ Junior 24/7 Action", logoUrl: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=100", streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", nowPlaying: "Extraction 2 Live Translation", vjName: "VJ Junior" },
  { id: "vj-em-tv", name: "VJ Emmy Fantasy Live", logoUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=100", streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", nowPlaying: "The Beekeeper Live", vjName: "VJ Emmy" }
];

export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const q = query(collection(db, "movies"), limit(1));
    const snap = await getDocs(q);
    return snap.empty;
  } catch (error) {
    console.warn("Could not check if DB is empty, defaulting to true to trigger seed mechanism.", error);
    return true;
  }
}

export async function seedDatabase() {
  console.log("Starting Firebase Firestore Seeding...");
  const batch = writeBatch(db);

  // Seed plans
  DEFAULT_PLANS.forEach((plan) => {
    const d = doc(db, "subscriptions", plan.id);
    batch.set(d, plan);
  });

  // Seed movies
  DEFAULT_MOVIES.forEach((movie) => {
    const d = doc(db, "movies", movie.id);
    batch.set(d, movie);
  });

  // Seed adult movies
  DEFAULT_ADULT_MOVIES.forEach((movie) => {
    const d = doc(db, "adult_movies", movie.id);
    batch.set(d, movie);
  });

  // Seed series
  DEFAULT_SERIES.forEach((s) => {
    const d = doc(db, "series", s.id);
    batch.set(d, s);
  });

  // Seed episodes
  DEFAULT_EPISODES.forEach((ep) => {
    const d = doc(db, "series", ep.seriesId, "episodes", ep.id);
    batch.set(d, ep);
  });

  // Seed shorts
  DEFAULT_SHORTS.forEach((sh) => {
    const d = doc(db, "shorts", sh.id);
    batch.set(d, sh);
  });

  // Seed ads
  DEFAULT_ADS.forEach((ad) => {
    const d = doc(db, "ads", ad.id);
    batch.set(d, ad);
  });

  // Seed channels
  DEFAULT_CHANNELS.forEach((ch) => {
    const d = doc(db, "live_channels", ch.id);
    batch.set(d, ch);
  });

  await batch.commit();
  console.log("Database seeded successfully!");
}
