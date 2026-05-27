import React, { useState, useEffect } from "react";
import {
  auth,
  db,
  handleFirestoreError,
  OperationType
} from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  query,
  where,
  limit
} from "firebase/firestore";
import {
  Movie,
  Series,
  Episode,
  ShortClip,
  AdCampaign,
  SubscriptionPlan,
  LiveChannel,
  NotificationItem,
  UserProfile,
  BattleItem
} from "./types";
import {
  seedDatabase,
  isDatabaseEmpty,
  DEFAULT_PLANS,
  DEFAULT_MOVIES,
  DEFAULT_SERIES,
  DEFAULT_EPISODES,
  DEFAULT_SHORTS,
  DEFAULT_ADS,
  DEFAULT_CHANNELS,
  DEFAULT_ADULT_MOVIES
} from "./seeder";

// Modular component imports
import { motion, AnimatePresence } from "motion/react";
import Splash from "./components/Splash";
import MoviePlayer from "./components/MoviePlayer";
import MoodPicker from "./components/MoodPicker";
import DailyRewardWheel from "./components/DailyRewardWheel";
import ShortsSwipe from "./components/ShortsSwipe";
import MonetizationPlans from "./components/MonetizationPlans";
import AdultZone from "./components/AdultZone";

// Lucide icon imports
import {
  Home,
  Search,
  Tv,
  Radio,
  Bookmark,
  Heart,
  Clock,
  User,
  Settings,
  Bell,
  ChevronRight,
  Menu,
  X,
  Flame,
  ShieldAlert,
  Plus,
  Trash,
  Play,
  Share2,
  Award,
  HelpCircle,
  Compass,
  Users,
  LogOut,
  Check,
  Zap,
  Lock,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  HeartPulse,
  MonitorPlay
} from "lucide-react";

export default function App() {
  // Splash & Auth status
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");

  // Firestore Data Collections State
  const [movies, setMovies] = useState<Movie[]>(DEFAULT_MOVIES);
  const [seriesList, setSeriesList] = useState<Series[]>(DEFAULT_SERIES);
  const [shorts, setShorts] = useState<ShortClip[]>(DEFAULT_SHORTS);
  const [ads, setAds] = useState<AdCampaign[]>(DEFAULT_ADS);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>(DEFAULT_CHANNELS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [battles, setBattles] = useState<BattleItem[]>([]);
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);

  // Navigation / UI State
  const [activeScreen, setActiveScreen] = useState<string>("home");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [activeEpisodeList, setActiveEpisodeList] = useState<Episode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showSocialProof, setShowSocialProof] = useState<boolean>(false);
  const [socialProofMessage, setSocialProofMessage] = useState<string>("");

  // Playlists and User states
  const [customVjs, setCustomVjs] = useState<string[]>(["VJ Junior", "VJ Emmy", "VJ Jingo", "VJ Jjunju"]);

  // Admin CRUD temp forms state
  const [newMovie, setNewMovie] = useState<Partial<Movie>>({
    title: "",
    description: "",
    synopsis: "",
    backdropUrl: "",
    posterUrl: "",
    videoUrl: "",
    duration: "2h 00m",
    rating: "PG-13",
    year: 2026,
    views: 0,
    isPremium: false,
    category: "Action",
    tags: []
  });
  const [newMovieVJText, setNewMovieVJText] = useState<string>("VJ Junior, VJ Emmy");
  const [newMovieTagsText, setNewMovieTagsText] = useState<string>("action, Translated");

  // Notifications bell toggle
  const [showNotificationsMenu, setShowNotificationsMenu] = useState<boolean>(false);

  // Auto Seeding helper notification banner
  const [needsSeeding, setNeedsSeeding] = useState<boolean>(false);

  // Authenticate & Profile state listeners
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create profile
        const userRef = doc(db, "users", currentUser.uid);
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            // Setup fresh level bronze profile
            const profile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "Kampala Viewer",
              level: "Bronze Viewer",
              pulseCoins: 150, // Welcome gift!
              streak: 1,
              lastActiveDate: new Date().toISOString().split("T")[0],
              subscriptionActive: currentUser.email === "www.moviepulse.com@gmail.com" ? true : false,
              isAdmin: currentUser.email === "www.moviepulse.com@gmail.com" ? true : false,
              isAdultUnlocked: false,
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, profile);
            setUserProfile(profile);
          }
        } catch (e) {
          console.error("Profile check fallback: ensure schema exists", e);
        }
      } else {
        setUserProfile(null);
      }
    });
    return unsub;
  }, [user]);

  // Firestore Database Real-time listeners setup
  useEffect(() => {
    // 1. Movies Listener
    const unsubMovies = onSnapshot(collection(db, "movies"), (snap) => {
      const data: Movie[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() } as Movie));
      setMovies(data);
      if (data.length === 0) {
        setNeedsSeeding(true);
      } else {
        setNeedsSeeding(false);
      }
    }, (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, "movies");
      } catch (e) {
        console.error(e);
      }
      setMovies(DEFAULT_MOVIES);
      setNeedsSeeding(false);
    });

    // 2. Series Listener
    const unsubSeries = onSnapshot(collection(db, "series"), (snap) => {
      const data: Series[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() } as Series));
      setSeriesList(data);
    }, (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, "series");
      } catch (e) {
        console.error(e);
      }
      setSeriesList(DEFAULT_SERIES);
    });

    // 3. Shorts Clips
    const unsubShorts = onSnapshot(collection(db, "shorts"), (snap) => {
      const data: ShortClip[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() } as ShortClip));
      setShorts(data);
    }, (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, "shorts");
      } catch (e) {
        console.error(e);
      }
      setShorts(DEFAULT_SHORTS);
    });

    // 4. Ads List
    const unsubAds = onSnapshot(collection(db, "ads"), (snap) => {
      const data: AdCampaign[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() } as AdCampaign));
      setAds(data);
    }, (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, "ads");
      } catch (e) {
        console.error(e);
      }
      setAds(DEFAULT_ADS);
    });

    // 5. Subscription Plans
    const unsubSubscriptions = onSnapshot(collection(db, "subscriptions"), (snap) => {
      const data: SubscriptionPlan[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() } as SubscriptionPlan));
      setPlans(data);
    }, (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, "subscriptions");
      } catch (e) {
        console.error(e);
      }
      setPlans(DEFAULT_PLANS);
    });

    // 6. Channels
    const unsubChannels = onSnapshot(collection(db, "live_channels"), (snap) => {
      const data: LiveChannel[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() } as LiveChannel));
      setLiveChannels(data);
    }, (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, "live_channels");
      } catch (e) {
        console.error(e);
      }
      setLiveChannels(DEFAULT_CHANNELS);
    });

    return () => {
      unsubMovies();
      unsubSeries();
      unsubShorts();
      unsubAds();
      unsubSubscriptions();
      unsubChannels();
    };
  }, [user]);

  // Secondary items loaded recursively when user logs in
  useEffect(() => {
    if (!user) return;

    // Load watch history for current authenticated user
    const qHist = query(collection(db, "watchHistory"), where("userId", "==", user.uid));
    const unsubHist = onSnapshot(qHist, (snap) => {
      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setWatchHistory(arr);
    }, (err) => {
      console.warn("Offline or metadata issue loading watch history:", err.message);
      setWatchHistory([]);
    });

    // Load watchlists for current user
    const qList = query(collection(db, "watchlists"), where("userId", "==", user.uid));
    const unsubList = onSnapshot(qList, (snap) => {
      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setWatchlists(arr);
    }, (err) => {
      console.warn("Offline or metadata issue loading watchlists:", err.message);
      setWatchlists([]);
    });

    // Load favorites
    const qFav = query(collection(db, "favorites"), where("userId", "==", user.uid));
    const unsubFav = onSnapshot(qFav, (snap) => {
      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setFavorites(arr);
    }, (err) => {
      console.warn("Offline or metadata issue loading favorites:", err.message);
      setFavorites([]);
    });

    return () => {
      unsubHist();
      unsubList();
      unsubFav();
    };
  }, [user]);

  // Social proof prompt alerts loop
  useEffect(() => {
    const messages = [
      "Mukasa from Kampala just unlocked Daily Pass ⚡",
      "Kavuma shared Bad Boys: Ride or Die into WhatsApp group!",
      "Nalugga completed Lucky Spin and earned 250 PulseCoins 💎",
      "Trending translated movie: Extraction 2",
      "VJ Emmy stream hit 10k live users across Gulu & Entebbe",
      "Namukasa from Mbarara just subscribed to Monthly cinematic pass!"
    ];

    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setSocialProofMessage(randomMsg);
      setShowSocialProof(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setShowSocialProof(false);
      }, 5000);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Dial voucher trigger helper
  const dialCheckMoMo = (dialCode: string) => {
    alert(`Dialing code ${dialCode} automatically in background... Follow instructions to complete stream passes!`);
  };

  // Auth Operations
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authEmail || !authPassword) {
      setAuthError("Email and password fields are required.");
      return;
    }

    try {
      if (isRegisterMode) {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication attempt failed. Double check values.");
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError("");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setAuthError("Google Sign-in failed. Try utilizing Guest Email login below for instant experience.");
    }
  };

  const triggerGuestLogin = async () => {
    setAuthEmail("www.moviepulse.com@gmail.com");
    setAuthPassword("password123");
    setIsRegisterMode(false);
    // Submit login with email & password
    try {
      await signInWithEmailAndPassword(auth, "www.moviepulse.com@gmail.com", "password123");
    } catch (err) {
      try {
        // If not created yet in custom project, create it!
        await createUserWithEmailAndPassword(auth, "www.moviepulse.com@gmail.com", "password123");
      } catch (e: any) {
        setAuthError(e.message);
      }
    }
  };

  const triggerLogout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setActiveScreen("home");
  };

  const executeAdClick = async (ad: AdCampaign) => {
    // Increment clicks
    const ref = doc(db, "ads", ad.id);
    await updateDoc(ref, { clicks: (ad.clicks || 0) + 1 });
    if (ad.redirectUrl === "momo-dial") {
      dialCheckMoMo("*165#");
    } else if (ad.redirectUrl === "airtel-dial") {
      dialCheckMoMo("*185#");
    } else {
      window.open(ad.redirectUrl, "_blank");
    }
  };

  // Standard library interaction adds (favorites, watchlists)
  const toggleWatchlist = async (m: Movie) => {
    if (!user) {
      alert("Sign in to save items to your personal watchlist library!");
      return;
    }
    const targetId = `${user.uid}-${m.id}`;
    const exists = watchlists.find((item) => item.movieId === m.id);

    try {
      if (exists) {
        await deleteDoc(doc(db, "watchlists", targetId));
      } else {
        await setDoc(doc(db, "watchlists", targetId), {
          id: targetId,
          userId: user.uid,
          movieId: m.id,
          title: m.title,
          posterUrl: m.posterUrl,
          createdAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFavorite = async (m: Movie) => {
    if (!user) return;
    const targetId = `${user.uid}-${m.id}`;
    const exists = favorites.find((item) => item.movieId === m.id);

    try {
      if (exists) {
        await deleteDoc(doc(db, "favorites", targetId));
      } else {
        await setDoc(doc(db, "favorites", targetId), {
          id: targetId,
          userId: user.uid,
          movieId: m.id,
          title: m.title,
          posterUrl: m.posterUrl
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Record viewed history
  const logWatchHistory = async (m: Movie) => {
    if (!user) return;
    const targetId = `${user.uid}-${m.id}`;
    try {
      await setDoc(doc(db, "watchHistory", targetId), {
        id: targetId,
        userId: user.uid,
        movieId: m.id,
        title: m.title,
        posterUrl: m.posterUrl,
        lastWatchedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Gamification Wallet Rewards
  const creditUserCoins = async (coinsAmount: number) => {
    if (!user || !userProfile) return;
    const updatedCoins = (userProfile.pulseCoins || 0) + coinsAmount;
    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, { pulseCoins: updatedCoins });
    setUserProfile((prev: any) => ({ ...prev, pulseCoins: updatedCoins }));
  };

  const creditSubPlanHours = async (hoursCount: number) => {
    if (!user) return;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hoursCount);

    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, {
      subscriptionActive: true,
      subscriptionPlanId: `gifted_${hoursCount}h`,
      subscriptionExpiresAt: expiresAt.toISOString()
    });
    if (userProfile) {
      setUserProfile((prev: any) => ({
        ...prev,
        subscriptionActive: true,
        subscriptionPlanId: `gifted_${hoursCount}h`,
        subscriptionExpiresAt: expiresAt.toISOString()
      }));
    }
  };

  const updateSubStatusDirectly = async (planId: string) => {
    if (!user) return;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 1 Month active pass

    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, {
      subscriptionActive: true,
      subscriptionPlanId: planId,
      subscriptionExpiresAt: expiresAt.toISOString()
    });
    if (userProfile) {
      setUserProfile((prev: any) => ({
        ...prev,
        subscriptionActive: true,
        subscriptionPlanId: planId,
        subscriptionExpiresAt: expiresAt.toISOString()
      }));
    }
  };

  // Action: Trigger initial VJ catalog deployment
  const triggerSelfSeederAction = async () => {
    try {
      await seedDatabase();
      alert("Cinematic Kampala VJ database populated successfully! Enjoy your streaming material.");
      setNeedsSeeding(false);
    } catch (e) {
      alert("Error seeding content. Check Firebase configuration console parameters.");
    }
  };

  // Adding movie inside Admin dashboard
  const handleAddNewMovieAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovie.title || !newMovie.videoUrl) {
      alert("Please provide movie title and exact video stream link URL!");
      return;
    }

    const mId = newMovie.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const parsedVjs = newMovieVJText.split(",").map((v) => ({
      name: v.trim(),
      language: "Luganda"
    }));
    const parsedTags = newMovieTagsText.split(",").map((t) => t.trim());

    const payload: Movie = {
      id: mId,
      title: newMovie.title,
      description: newMovie.description || "Kampala Translated Premiere Film",
      synopsis: newMovie.synopsis || "Intensified translations by Ugandan Video Jokers.",
      backdropUrl: newMovie.backdropUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1200",
      posterUrl: newMovie.posterUrl || "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=400",
      videoUrl: newMovie.videoUrl,
      duration: newMovie.duration || "2h 00m",
      rating: newMovie.rating || "PG-13",
      year: Number(newMovie.year) || 2026,
      views: 100,
      vjs: parsedVjs,
      isPremium: newMovie.isPremium || false,
      category: newMovie.category || "Action",
      tags: parsedTags
    };

    try {
      await setDoc(doc(db, "movies", mId), payload);
      alert("Movie added successfully to live Firestore database catalog!");
      // Reset form
      setNewMovie({
        title: "",
        description: "",
        synopsis: "",
        backdropUrl: "",
        posterUrl: "",
        videoUrl: "",
        duration: "2h 00m",
        rating: "PG-13",
        year: 2026,
        views: 0,
        isPremium: false,
        category: "Action",
        tags: []
      });
    } catch (err) {
      alert("Error writing to Firestore rules match gate. Check security credentials.");
    }
  };

  const handleDeleteMovieAdmin = async (mId: string) => {
    if (!confirm("Are you sure you want to delete this film from Kampala directory?")) return;
    try {
      await deleteDoc(doc(db, "movies", mId));
      alert("Removed film.");
    } catch (e) {
      alert("Error deleting movie.");
    }
  };

  // Nav actions
  const watchMovieNow = (m: Movie) => {
    setSelectedMovie(m);
    logWatchHistory(m);
    setActiveScreen("movie");
    // Increment views
    try {
      updateDoc(doc(db, "movies", m.id), { views: (m.views || 0) + 1 });
    } catch (e) {}
  };

  const viewSeriesNow = async (s: Series) => {
    setSelectedSeries(s);
    setActiveScreen("series");
    // Retrieve episodes lists for this series
    try {
      const colRef = collection(db, "series", s.id, "episodes");
      const snap = await getDocs(colRef);
      const arr: Episode[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() } as Episode));
      setActiveEpisodeList(arr.sort((a, b) => a.episodeNumber - b.episodeNumber));
    } catch (e) {
      console.warn("Could not load series episodes.", e);
    }
  };

  // Filters
  const filteredMoviesByMoodAndSearch = movies.filter((m) => {
    // 1. Skip adult movies from normal queries
    if (m.isAdult) return false;

    // 2. Filter by Mood
    if (selectedMood) {
      // Funny -> Comedy, Action -> Action, Romantic -> Romance, etc
      if (selectedMood === "comedy" && m.category.toLowerCase() !== "comedy") return false;
      if (selectedMood === "action" && m.category.toLowerCase() !== "action") return false;
      if (selectedMood === "emotional" && m.category.toLowerCase() !== "drama" && m.category.toLowerCase() !== "ugandan") return false;
      if (selectedMood === "romantic" && !m.tags.includes("Romantic") && !m.tags.includes("Romantic Vibe")) return false;
      if (selectedMood === "horror" && m.category.toLowerCase() !== "horror") return false;
    }

    // 3. Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inTitle = m.title.toLowerCase().includes(q);
      const inDesc = m.description.toLowerCase().includes(q);
      const inVJ = m.vjs.some((v) => v.name.toLowerCase().includes(q));
      return inTitle || inDesc || inVJ;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex flex-col relative font-sans selection:bg-[#e50914] selection:text-white pb-14 md:pb-0">
      
      {/* 2.5s Cinematic Intro Splash */}
      {showSplash && <Splash onComplete={() => setShowSplash(false)} />}

      {/* Social Proof floating alert */}
      <AnimatePresence>
        {showSocialProof && (
          <div className="fixed top-20 right-4 z-40 max-w-sm pointer-events-none">
            <div className="glass-panel text-white text-xs px-4 py-3 rounded-2xl border border-[#ffd700]/30 shadow-2xl flex items-center gap-3 animate-bounce">
              <span className="text-lg">📢</span>
              <div className="flex flex-col">
                <span className="font-extrabold text-[#ffd700] text-[10px] uppercase font-mono">Live social proof</span>
                <span className="text-white/80">{socialProofMessage}</span>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* TOP HEADER NAVIGATION BAR */}
      <header className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-30 border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-white hover:text-red-500 transition cursor-pointer"
          >
            <Menu size={22} />
          </button>
          
          <button
            onClick={() => {
              setSelectedMood(null);
              setSearchQuery("");
              setActiveScreen("home");
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <HeartPulse className="text-[#e50914]" size={26} />
            <h1 className="font-bebas text-2xl md:text-3xl tracking-widest text-[#e50914] bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              MOVIEPULSE
            </h1>
          </button>
        </div>

        {/* Global Search form */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#161616] border border-white/5 rounded-full px-3.5 py-1.5 w-80">
          <Search size={15} className="text-white/40" />
          <input
            type="text"
            placeholder="Search translated films, series or VJs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeScreen !== "search" && e.target.value) {
                setActiveScreen("search");
              }
            }}
            className="bg-transparent border-none text-xs text-white outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white relative cursor-pointer"
            >
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                2
              </span>
            </button>

            {/* Floating Dropdown */}
            {showNotificationsMenu && (
              <div className="absolute right-0 mt-2.5 w-72 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl p-4 z-40 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-white font-mono">Kampala Alerts</span>
                  <button onClick={() => setShowNotificationsMenu(false)} className="text-[10px] text-red-500 hover:underline">
                    Close
                  </button>
                </div>
                
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1 rounded bg-black/40 p-2 border-l-2 border-[#e50914]">
                    <span className="text-[11px] font-bold text-white">🎁 Lucky Wheel Spin Active</span>
                    <p className="text-[10px] text-white/50 leading-snug">Spin today and get up to 250 PulseCoins or 3 hours of ad-free streaming!</p>
                  </div>
                  <div className="flex flex-col gap-1 rounded bg-black/40 p-2 border-l-2 border-green-500">
                    <span className="text-[11px] font-bold text-white">🔥 VJ Junior Uploaded Extraction 2</span>
                    <p className="text-[10px] text-white/50 leading-snug">Enjoy extreme Luganda translations and explosive Kampala commentary.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User profile avatar or signin */}
          {user ? (
            <button
              onClick={() => setActiveScreen("account")}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-yellow-500 flex items-center justify-center text-xs font-bold text-black border border-white/10">
                {user.email?.slice(0, 2).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-white/70 group-hover:text-white transition">
                {userProfile?.displayName || "Viewer"}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setActiveScreen("account")}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition shadow"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* NAVIGATION DRAW_SIDEBAR DRAWER */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />
            
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#121212] border-r border-white/5 z-50 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                {/* Drawer header */}
                <div className="p-5 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={20} className="text-[#e50914]" />
                    <span className="font-bebas text-xl tracking-wider text-white">MoviePulse Hub</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="p-1 hover:text-red-500 text-white cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                {/* Discover anchors */}
                <div className="p-4 flex flex-col gap-1 text-sm">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono px-3 mb-2">Discover</p>
                  
                  {[
                    { id: "home", label: "🏠 Portal Home" },
                    { id: "shorts", label: "🎬 TikTok Reels Shorts" },
                    { id: "live-tv", label: "📺 Uganda Live TV VJs" },
                    { id: "battles", label: "🤺 Cinema Battles" },
                    { id: "leaderboard", label: "🏆 Viewer Streak Leaderboard" },
                    { id: "vj", label: "🎙️ Legendary VJ Showcases" },
                    { id: "kids", label: "👶 Kids Zone Cartoons" },
                    { id: "subscription", label: "💳 Binge passes Checkout" },
                    { id: "adult", label: "🔞 Private Adult Zone", premium: true }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveScreen(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`text-left px-3 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-between ${
                        activeScreen === item.id
                          ? "bg-red-600/10 text-red-400 font-bold border-l-2 border-red-500"
                          : "text-white/60 hover:bg-[#1a1a1a] hover:text-white"
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.premium && (
                        <span className="text-[8px] bg-purple-900/30 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase font-black font-mono">
                          Secure
                        </span>
                      )}
                    </button>
                  ))}

                  {/* Library */}
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono px-3 mt-6 mb-2">My Library</p>
                  {[
                    { id: "watchlist", label: "🔖 My Watchlist" },
                    { id: "history", label: "🕰️ Recent History" },
                    { id: "downloads", label: "⬇️ Downloads Folder" }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveScreen(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`text-left px-3 py-2.5 rounded-xl transition cursor-pointer ${
                        activeScreen === item.id ? "bg-red-600/10 text-red-400 font-bold" : "text-white/60 hover:bg-[#1a1a1aim]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}

                  {/* Support */}
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono px-3 mt-6 mb-2">Support & Info</p>
                  {[
                    { id: "support", label: "📧 Contact Support" },
                    { id: "faq", label: "❓ Uganda FAQ Guide" },
                    { id: "privacy", label: "📜 Privacy Guidelines" },
                    { id: "terms", label: "📋 Terms of Service" }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveScreen(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`text-left px-3 py-2 text-white/60 hover:bg-[#1a1a1a] rounded transition cursor-pointer`}
                    >
                      {item.label}
                    </button>
                  ))}

                  {/* Admin Zone Access */}
                  {userProfile?.isAdmin && (
                    <div className="mt-6 border-t border-white/5 pt-4">
                      <button
                        onClick={() => {
                          setActiveScreen("admin");
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-between ${
                          activeScreen === "admin"
                            ? "bg-yellow-500/10 text-yellow-500 font-bold border-l-2 border-yellow-500"
                            : "text-yellow-500 hover:bg-yellow-500/5"
                        }`}
                      >
                        <span>🛡️ Kampala Admin Console</span>
                        <span className="text-[8px] bg-yellow-400 text-black px-1.5 py-0.5 rounded font-bold font-mono uppercase">
                          Admin
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom drawer auth info */}
              <div className="p-4 border-t border-white/5 bg-black/40 text-xs font-mono flex flex-col gap-2">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-white/40 truncate">Uid: {user.uid}</p>
                    <button
                      onClick={triggerLogout}
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 py-2 rounded-xl cursor-pointer font-bold duration-200"
                    >
                      <LogOut size={13} /> Sign Out VJ Hub
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setActiveScreen("account");
                      setSidebarOpen(false);
                    }}
                    className="w-full bg-[#e50914] text-white py-2 rounded-xl cursor-pointer text-center font-bold"
                  >
                    🚀 Register Member
                  </button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* AUTO SEEDING REQUIRED WARNER */}
      {needsSeeding && (
        <div className="bg-yellow-500 text-black px-4 py-3 flex flex-col sm:flex-row gap-2.5 justify-between items-center text-xs font-semibold z-20">
          <p className="flex items-center gap-1.5">
            <AlertTriangle size={15} /> Your live database is currently empty. Click standard load to seed complete cinematic VJ metadata directly!
          </p>
          <button
            onClick={triggerSelfSeederAction}
            className="bg-black hover:bg-[#111] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition"
          >
            ✓ Seed VJ DB Now
          </button>
        </div>
      )}

      {/* MAIN VIEWPORT LAYOUT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ======================================= */}
        {/* HOMEPAGE VIEW PORTAL                    */}
        {/* ======================================= */}
        {activeScreen === "home" && (
          <div className="flex flex-col gap-7 animate-fadeIn">
            
            {/* 1. Hero Spotlight Carousel Card */}
            {movies.length > 0 ? (
              <div className="relative rounded-2xl md:rounded-3xl aspect-[1.8/1] md:aspect-[2.4/1] bg-black overflow-hidden border border-white/5 group shadow-2xl">
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-500 scale-102 group-hover:scale-105"
                  style={{ backgroundImage: `url(${movies[0].backdropUrl})` }}
                  referrerPolicy="no-referrer"
                />
                
                {/* Contrast overlays */}
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-black via-black/70 to-transparent w-full md:w-3/5" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-transparent to-transparent h-2/3" />

                <div className="absolute inset-y-0 left-0 p-5 md:p-10 flex flex-col justify-end gap-3 max-w-xl">
                  <div>
                    <span className="bg-[#e50914] text-[9px] text-white font-extrabold px-2.5 py-1 rounded tracking-wide uppercase">
                      💡 VJ translated recommendation
                    </span>
                  </div>

                  <h2 className="text-white font-bold leading-tight text-xl md:text-4xl font-bebas tracking-wide">
                    {movies[0].title}
                  </h2>
                  
                  <p className="text-white/70 text-xs hidden md:line-clamp-2 md:block font-sans">
                    {movies[0].description}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 md:mt-3">
                    <button
                      onClick={() => watchMovieNow(movies[0])}
                      className="bg-red-600 hover:bg-red-700 hover:scale-102 transition text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-red-900/30 cursor-pointer"
                    >
                      <Play size={13} fill="white" /> Watch Now
                    </button>
                    
                    <button
                      onClick={() => toggleWatchlist(movies[0])}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 border border-white/10 cursor-pointer"
                    >
                      {watchlists.some((item) => item.movieId === movies[0].id) ? "✓ Watched Saved" : "🔖 Save Clip"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#111] animate-pulse aspect-[1.8/1] md:aspect-[2.4/1] rounded-2xl" />
            )}

            {/* 2. Horizontal Mood Selector */}
            <MoodPicker selectedMood={selectedMood} onSelectMood={(moodId) => setSelectedMood(moodId)} />

            {/* 3. Continue watching (Appears dynamically if user watch history exists) */}
            {user && watchHistory.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-bold tracking-wide uppercase font-bebas text-white">
                  🕰️ Continue Binging (History Sync)
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                  {watchHistory.map((hist) => {
                    const matchedMovie = movies.find((m) => m.id === hist.movieId);
                    return (
                      <div
                        key={hist.id}
                        className="w-40 bg-[#161616] border border-white/5 rounded-xl overflow-hidden shadow shrink-0"
                      >
                        <div className="aspect-video bg-black relative">
                          <img src={hist.posterUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-60" />
                          <button
                            onClick={() => matchedMovie && watchMovieNow(matchedMovie)}
                            className="absolute inset-0 flex items-center justify-center cursor-pointer hover:scale-110 transition text-red-500 font-bold"
                          >
                            ▶ Resume
                          </button>
                        </div>
                        <p className="p-2 text-[11px] font-bold text-white truncate">{hist.title}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Main Streaming catalog */}
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-bold tracking-wide uppercase font-bebas text-white flex items-center gap-2">
                🍿 VJ Translated Premiere Releases
              </h3>
              
              {filteredMoviesByMoodAndSearch.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {filteredMoviesByMoodAndSearch.map((movie) => (
                    <div
                      key={movie.id}
                      className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden flex flex-col gap-2 shadow relative group"
                    >
                      <div className="aspect-[3/4] relative bg-black overflow-hidden">
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover duration-200 group-hover:scale-102"
                        />
                        
                        {/* Tags */}
                        {movie.isPremium && (
                          <div className="absolute top-2 left-2 bg-[#ff0a16] text-[9px] font-black uppercase tracking-wider text-white px-1.5 py-0.5 rounded shadow">
                            Premium VJ
                          </div>
                        )}

                        {/* Interactive overlay play */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition duration-200">
                          <button
                            onClick={() => watchMovieNow(movie)}
                            className="bg-red-600 font-bold hover:bg-red-700 text-white rounded-full p-3.5 hover:scale-110 duration-200 cursor-pointer shadow-lg"
                          >
                            <Play size={18} fill="white" className="ml-0.5" />
                          </button>
                          
                          <div className="flex gap-2.5">
                            <button
                              onClick={() => toggleWatchlist(movie)}
                              className="bg-neutral-800 hover:bg-neutral-700 text-white p-2 rounded-full cursor-pointer text-xs"
                              title="Add Watchlist"
                            >
                              🔖
                            </button>
                            <button
                              onClick={() => toggleFavorite(movie)}
                              className="bg-neutral-800 hover:bg-neutral-700 text-white p-2 rounded-full cursor-pointer text-xs"
                              title="Favorite"
                            >
                              ❤️
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                          <span>{movie.year} • {movie.duration}</span>
                          <span className="text-yellow-500 font-bold">Views: {(movie.views / 1000).toFixed(1)}k</span>
                        </div>
                        
                        <h4 className="text-white font-bold text-xs line-clamp-1">{movie.title}</h4>
                        
                        <div className="flex flex-wrap gap-1 mt-1">
                          {movie.vjs.map((v) => (
                            <span key={v.name} className="bg-white/5 border border-white/5 text-slate-300 text-[9px] px-1.5 py-0.5 rounded font-mono">
                              🎧 VJ {v.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#111] rounded-2xl border border-white/5 text-xs text-white/40 font-mono">
                  No matching translated movies within this category yet. Ensure catalog seeder loaded or try clear filters.
                </div>
              )}
            </div>

            {/* 5. Trending TV Series */}
            <div className="flex flex-col gap-3 mt-2">
              <h3 className="text-base font-bold tracking-wide uppercase font-bebas text-white">
                📺 Hot Season Series (VJ Translated Episodes)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seriesList.map((series) => (
                  <div
                    key={series.id}
                    onClick={() => viewSeriesNow(series)}
                    className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden p-3.5 flex flex-col sm:flex-row gap-4 hover:border-red-500/30 cursor-pointer transition"
                  >
                    <img
                      src={series.posterUrl}
                      referrerPolicy="no-referrer"
                      alt={series.title}
                      className="w-full sm:w-28 aspect-[3/4] object-cover rounded-lg bg-black"
                    />
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="bg-red-500/10 text-[#ff0a16] text-[8px] sm:text-[10px] border border-red-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-extrabold">
                            Episodes Multi-VJ Audio
                          </span>
                        </div>
                        <h4 className="text-white font-bold text-sm md:text-base leading-snug">{series.title}</h4>
                        <p className="text-white/40 text-xs line-clamp-2 mt-1.5 leading-relaxed">{series.description}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-3 text-xs font-mono">
                        <span className="text-white/50">{series.episodesCount} Loaded Episodes</span>
                        <span className="text-yellow-500 font-bold">Views: {series.views || 600}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Sponsored campaign banner cards */}
            {ads.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="bg-[#111] rounded-xl overflow-hidden relative border border-white/5 flex gap-4 p-4 items-center cursor-pointer hover:border-[#ff0a16]/30 duration-300 shadow"
                    onClick={() => executeAdClick(ad)}
                  >
                    <img src={ad.imageUrl} alt="Sponsor Logo" className="w-16 h-16 rounded-lg object-cover bg-black shrink-0" />
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="bg-amber-500/15 text-[#ffd700] border border-amber-500/30 text-[8px] uppercase font-mono px-1.5 py-0.5 rounded w-max">
                        Sponsored partner • {ad.sponsorName}
                      </span>
                      <h4 className="text-xs font-bold text-white uppercase font-mono">Dial MoMocampaign to earn access bonuscoins!</h4>
                      <p className="text-[10px] text-white/40 font-mono">Click to dial *165# code easily now</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 7. Gamification playground daily spin dashboard snippet */}
            <div>
              <DailyRewardWheel
                currentCoins={userProfile?.pulseCoins || 0}
                userLevel={userProfile?.level || "Bronze Viewer"}
                userStreak={userProfile?.streak || 1}
                onCoinsAwarded={creditUserCoins}
                onBonusSubUnlocked={creditSubPlanHours}
              />
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* MOVIE DETAILED PLAYER VIEW              */}
        {/* ======================================= */}
        {activeScreen === "movie" && selectedMovie && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <button
              onClick={() => setActiveScreen("home")}
              className="text-xs text-white/50 hover:text-white font-semibold font-mono flex items-center gap-1 cursor-pointer"
            >
              ← Return Kampala Catalog
            </button>

            {/* Movie Player controls */}
            <MoviePlayer
              movie={selectedMovie}
              hasSubscribed={userProfile?.subscriptionActive || false}
              onOfferSubscription={() => {
                alert("This film is locked. Rent a micro plan hourly/daily pass above with MTN MoMo to unlock complete feature!");
                setActiveScreen("subscription");
              }}
            />

            {/* Descriptions information */}
            <div className="bg-[#141414] rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
              <div className="flex flex-wrap gap-2 items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-xl md:text-3xl font-extrabold text-white leading-tight font-bebas tracking-wide">
                    {selectedMovie.title}
                  </h2>
                  <div className="flex flex-wrap gap-3 items-center text-xs text-white/50 font-mono mt-1.5">
                    <span>Year: {selectedMovie.year}</span>
                    <span>•</span>
                    <span>Duration: {selectedMovie.duration}</span>
                    <span>•</span>
                    <span className="bg-red-600/20 text-[#ff0a16] border border-red-500/20 px-2 py-0.5 rounded">
                      Rating: {selectedMovie.rating}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => toggleWatchlist(selectedMovie)}
                    className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl cursor-pointer font-bold text-xs"
                  >
                    🔖 {watchlists.some((item) => item.movieId === selectedMovie.id) ? "Saved" : "Save Clip"}
                  </button>
                  <button
                    onClick={() => toggleFavorite(selectedMovie)}
                    className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl cursor-pointer font-bold text-xs"
                  >
                    ❤️ Favorite
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-bebas text-sm uppercase tracking-wider text-slate-400">Synopsis / Translated Movie Context</h4>
                <p className="text-white/80 text-sm mt-1 leading-relaxed">{selectedMovie.synopsis}</p>
              </div>

              {/* Share systems panel */}
              <div className="bg-black/60 p-4 rounded-xl border border-white/5 mt-2 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                    <Share2 size={13} className="text-[#25D366]" /> Click WhatsApp Share to Unlock PulseCoins
                  </h4>
                  <p className="text-[10px] text-white/40 font-mono leading-relaxed mt-0.5">
                    Share this translated movie to earn 35 PulseCoins instantly added to your user levels!
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    creditUserCoins(35);
                    const waText = encodeURIComponent(`Streaming Extraction 2 featuring VJ Junior live in Kampala. Dial pass code with MTN MoMo scratch cards now! https://moviepulse.com/movie/${selectedMovie.id}`);
                    window.open(`https://api.whatsapp.com/send?text=${waText}`, "_blank");
                  }}
                  className="bg-[#25D366] hover:bg-emerald-500 text-black text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  💬 Share on WhatsApp VJ Rooms (+35 Coins)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* SERIES VIEW DETAILED LIST               */}
        {/* ======================================= */}
        {activeScreen === "series" && selectedSeries && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <button
              onClick={() => setActiveScreen("home")}
              className="text-xs text-white/50 hover:text-white font-mono flex items-center gap-1 cursor-pointer"
            >
              ← Back to Catalog portal
            </button>

            <div className="bg-[#121212] rounded-2xl p-5 border border-white/5 flex flex-col md:flex-row gap-6 items-center">
              <img src={selectedSeries.posterUrl} referrerPolicy="no-referrer" className="w-40 aspect-[3/4] object-cover rounded-xl bg-black shadow-lg" />
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold font-bebas text-white tracking-wider mb-2">{selectedSeries.title}</h2>
                <p className="text-white/60 text-xs leading-relaxed mb-4">{selectedSeries.description}</p>
                
                <div className="flex gap-4 border-t border-white/5 pt-3 text-xs font-mono text-white/40">
                  <span>Releases: {selectedSeries.year}</span>
                  <span>Category: {selectedSeries.category}</span>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold tracking-wide text-white font-mono uppercase border-b border-white/5 pb-2">
              💿 Available Translated Episodes List
            </h3>

            {activeEpisodeList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeEpisodeList.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => {
                      // Set episode film player link or override
                      setSelectedMovie({
                        id: ep.id,
                        title: `${selectedSeries.title} - ${ep.title}`,
                        description: `Episode ${ep.episodeNumber} in Season ${ep.seasonNumber}`,
                        synopsis: `Action episode of ${selectedSeries.title}. Complete VJ commentary applied.`,
                        backdropUrl: selectedSeries.backdropUrl,
                        posterUrl: selectedSeries.posterUrl,
                        videoUrl: ep.videoUrl,
                        duration: ep.duration,
                        rating: "PG-13",
                        year: selectedSeries.year,
                        vjs: [{ name: "VJ Emmy", language: "Luganda" }],
                        views: 50,
                        isPremium: selectedSeries.isPremium,
                        category: selectedSeries.category,
                        tags: selectedSeries.tags
                      });
                      setActiveScreen("movie");
                    }}
                    className="p-4 bg-[#141414] border border-white/5 hover:border-[#ff0a16] rounded-xl flex items-center justify-between text-left transition cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] text-red-500 font-bold font-mono uppercase block">Episode {ep.episodeNumber}</span>
                      <span className="text-white font-bold text-xs mt-0.5 block">{ep.title}</span>
                      <span className="text-[10px] text-white/30 font-mono">Duration: {ep.duration}</span>
                    </div>
                    <Play size={16} className="text-red-500" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#111] border border-white/5 rounded-2xl text-xs text-white/40 font-mono">
                No episodes configured for this TV show yet.
              </div>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* SHORTS TIKTOK-STYLE PAGE                */}
        {/* ======================================= */}
        {activeScreen === "shorts" && (
          <div className="animate-fadeIn">
            <ShortsSwipe
              shorts={shorts}
              onWatchFullMovie={(movieId) => {
                const found = movies.find((m) => m.id === movieId);
                if (found) {
                  watchMovieNow(found);
                } else {
                  alert("Film details loaded redirectout successfully!");
                }
              }}
            />
          </div>
        )}

        {/* ======================================= */}
        {/* LIVE TV CHANNELS VIEW                   */}
        {/* ======================================= */}
        {activeScreen === "live-tv" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="bg-[#141414] rounded-2xl p-5 border border-white/5">
              <h2 className="text-xl font-bold font-bebas text-white tracking-wide mb-1">🎙️ UGANDA 24/7 VJ STREAMING CHANNELS</h2>
              <p className="text-white/40 text-xs">Zero buffering dynamic video joker streams. Click below to tune in live!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {liveChannels.map((ch) => (
                <div key={ch.id} className="bg-[#111] rounded-2xl p-4 border border-white/5 flex gap-4">
                  <img src={ch.logoUrl} referrerPolicy="no-referrer" className="w-16 h-16 rounded-xl object-cover bg-black" />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="bg-[#ff004f] text-[9px] text-white font-extrabold px-1.5 py-0.5 rounded font-mono uppercase">Live Translated Broadcast</span>
                      <h4 className="text-white font-bold text-xs font-mono mt-1">{ch.name}</h4>
                      <p className="text-[11px] text-[#ffd700] font-mono">Now translates: {ch.nowPlaying}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-2.5">
                      <span className="text-[10px] text-white/40">VJ Anchor: {ch.vjName || "Guest"}</span>
                      <button
                        onClick={() => {
                          setSelectedMovie({
                            id: ch.id,
                            title: `LIVE: ${ch.name}`,
                            description: `Tune in live VJ audio commentary.`,
                            synopsis: `Live broadcast streaming directly to Kampala audience.`,
                            backdropUrl: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=1200",
                            posterUrl: ch.logoUrl,
                            videoUrl: ch.streamUrl,
                            duration: "LIVE",
                            rating: "PG",
                            year: 2026,
                            vjs: [{ name: ch.vjName || "Junior", language: "Luganda" }],
                            views: 120,
                            isPremium: false,
                            category: "Live",
                            tags: ["Live"]
                          });
                          setActiveScreen("movie");
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        📺 Tune In Live
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* LEADERBOARD VIEW                        */}
        {/* ======================================= */}
        {activeScreen === "leaderboard" && (
          <div className="flex flex-col gap-6 animate-fadeIn max-w-2xl mx-auto">
            <div className="bg-[#141414] rounded-2xl p-5 border border-white/5 text-center">
              <Award className="text-yellow-500 mx-auto mb-2 animate-bounce" size={28} />
              <h2 className="text-xl font-bold font-bebas text-white tracking-wide">🏆 KAMPALA VIEWERS LEADERBOARD</h2>
              <p className="text-white/40 text-xs">Unlock streaks, binge movies daily to scale ranks up and earn custom badges!</p>
            </div>

            <div className="bg-[#121212] rounded-xl border border-white/5 overflow-hidden flex flex-col">
              {[
                { name: "Ssewankambo Ivan", level: "Elite Cinephile", streak: 42, points: 2840, rank: "🥇 1" },
                { name: "Namubiru Sarah", level: "Gold Viewer", streak: 28, points: 1950, rank: "🥈 2" },
                { name: "Kato Joseph", level: "Gold Viewer", streak: 19, points: 1420, rank: "🥉 3" },
                { name: "You (Active Viewer)", level: userProfile?.level || "Bronze", streak: userProfile?.streak || 1, points: userProfile?.pulseCoins || 150, rank: "🏅 Active" }
              ].map((row, idx) => (
                <div
                  key={idx}
                  className={`p-4 border-b border-white/5 flex items-center justify-between text-xs ${
                    row.name.includes("You") ? "bg-[#e50914]/10 font-bold" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-[#ffd700] w-12">{row.rank}</span>
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{row.name}</span>
                      <span className="text-[10px] text-white/40 font-mono">{row.level}</span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-5">
                    <span className="text-[#25D366] font-semibold">{row.streak}d streak</span>
                    <span className="text-yellow-500 font-bold font-mono">{row.points} Coins</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* BATTLES PLATFORM VIEW                   */}
        {/* ======================================= */}
        {activeScreen === "battles" && (
          <div className="flex flex-col gap-6 animate-fadeIn max-w-2xl mx-auto">
            <div className="bg-[#141414] rounded-2xl p-5 border border-white/5 text-center">
              <span className="text-2xl mb-1 block">🤺</span>
              <h2 className="text-xl font-bold font-bebas text-white tracking-wider">KAMPALA CINEMA BATTLES</h2>
              <p className="text-white/40 text-xs leading-relaxed">
                Vote for your absolute favorite film. The movie with the most audience votes wins exclusive Premium Ad discounts on next week's theater!
              </p>
            </div>

            <div className="bg-[#121212] rounded-2xl border border-white/5 p-5 flex flex-col gap-5">
              <div className="flex items-center justify-between text-xs font-mono border-b border-white/5 pb-2.5 mb-1.5">
                <span>Battle Ends: tomorrow</span>
                <span className="text-red-500 font-bold">Live Status</span>
              </div>

              <div className="grid grid-cols-2 gap-5 text-center">
                {/* Movie A */}
                <div className="flex flex-col gap-3">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-black border border-white/5">
                    <img src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-white font-bold text-xs">Extraction 2</h4>
                  <button
                    onClick={() => {
                      alert("Vote recorded successfully! 20 PulseCoins awarded.");
                      creditUserCoins(20);
                    }}
                    className="py-2 rounded-lg bg-red-600 text-white font-semibold text-xs hover:scale-102 transition cursor-pointer"
                  >
                    Vote Team VJ Junior
                  </button>
                </div>

                {/* Movie B */}
                <div className="flex flex-col gap-3">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-black border border-white/5">
                    <img src="https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-white font-bold text-xs">The Beekeeper</h4>
                  <button
                    onClick={() => {
                      alert("Vote recorded successfully! 20 PulseCoins awarded.");
                      creditUserCoins(20);
                    }}
                    className="py-2 rounded-lg bg-red-600 text-white font-semibold text-xs hover:scale-102 transition cursor-pointer"
                  >
                    Vote Team VJ Emmy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* ACCOUNT PROFILE VIEW                    */}
        {/* ======================================= */}
        {activeScreen === "account" && (
          <div className="max-w-xl mx-auto w-full animate-fadeIn flex flex-col gap-6">
            
            {!user ? (
              /* Inline Authentication Form Portal */
              <div className="bg-[#141414] rounded-2xl p-6 border border-white/5 flex flex-col gap-5">
                <div className="text-center">
                  <HeartPulse className="text-red-500 mx-auto mb-2 animate-pulse" size={28} />
                  <h2 className="text-2xl font-bold font-bebas tracking-wide text-white">Join MoviePulse VJ Hub</h2>
                  <p className="text-white/40 text-xs">Create an account to lock in daily streaks and sync history.</p>
                </div>

                <form onSubmit={handleEmailAuthSubmit} className="flex flex-col gap-4">
                  {authError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold text-center leading-snug">
                      {authError}
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] uppercase font-mono text-white/50 mb-1.5 block">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. kintu@gmail.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono text-white/50 mb-1.5 block">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-red-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold tracking-widest uppercase shadow transition cursor-pointer"
                  >
                    {isRegisterMode ? "🚀 Create fresh account" : "🔑 Sign In now"}
                  </button>
                </form>

                {/* Simple dividers */}
                <div className="flex items-center gap-3">
                  <div className="h-px bg-white/5 flex-1" />
                  <span className="text-[10px] text-white/30 uppercase font-mono">Or connect via shortcuts</span>
                  <div className="h-px bg-white/5 flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    onClick={handleGoogleLogin}
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-2.5 text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    Google Authentication
                  </button>
                  <button
                    onClick={triggerGuestLogin}
                    className="bg-yellow-500 text-black rounded-xl py-2.5 text-xs font-extrabold cursor-pointer hover:bg-yellow-600 transition"
                  >
                    ⚡ Test Guest Creator Quick Login
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => setIsRegisterMode(!isRegisterMode)}
                    className="text-xs text-white/50 hover:text-white underline font-mono"
                  >
                    {isRegisterMode ? "Already verified? Return to Sign In" : "Need profile? Register fresh member here"}
                  </button>
                </div>
              </div>
            ) : (
              /* Auth Logged in Profile Dashboard panel */
              <div className="flex flex-col gap-5">
                <div className="bg-[#141414] rounded-2xl p-6 border border-white/5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 to-yellow-500 flex items-center justify-center text-xl font-bold font-mono text-black">
                    {user.email?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] bg-red-600/20 text-[#ff0a16] border border-red-500/20 px-2.5 py-0.5 rounded uppercase font-black font-mono">
                      {userProfile?.level || "Bronze Viewer"}
                    </span>
                    <h3 className="text-white text-lg font-bold leading-tight mt-1">{userProfile?.displayName || user.email}</h3>
                    <p className="text-white/40 text-[11px] font-mono select-all">Email: {user.email}</p>
                  </div>
                </div>

                {/* Wallet Balance Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex flex-col justify-between h-24">
                    <span className="text-white/40 text-[10px] uppercase font-mono">PulseCoins Wallet</span>
                    <span className="text-yellow-500 font-extrabold text-2xl font-mono">{userProfile?.pulseCoins || 0} Coins</span>
                  </div>

                  <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex flex-col justify-between h-24">
                    <span className="text-white/40 text-[10px] uppercase font-mono">Subscription Status</span>
                    <span className={`font-bold text-sm ${userProfile?.subscriptionActive ? "text-[#25D366]" : "text-red-500"}`}>
                      {userProfile?.subscriptionActive ? "✓ Active Premium" : "❌ Trial Blocked"}
                    </span>
                  </div>
                </div>

                {/* Achievements List */}
                <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
                  <h4 className="font-bebas text-sm uppercase text-white tracking-widest flex items-center gap-1">
                    <Award size={14} className="text-[#ffd700]" /> Binge milestones achievements
                  </h4>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/5">
                      <span className="text-xl">🥉</span>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-white block">Bronze Viewer Badge</span>
                        <p className="text-[10px] text-white/40 leading-snug">Welcome gift. Credited with 150 startup coins!</p>
                      </div>
                      <span className="text-[#25D366] text-xs font-mono">✓ Unlocked</span>
                    </div>

                    <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/5 opacity-50">
                      <span className="text-xl">🥇</span>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-white block">Ugandan Super Fan</span>
                        <p className="text-[10px] text-white/40 leading-snug">Requires sharing 5 VJ translated clips into WhatsApp groups daily.</p>
                      </div>
                      <span className="text-white/40 text-xs font-mono">Locked</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveScreen("subscription")}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer text-center"
                  >
                    💳 Manage binge passes
                  </button>
                  <button
                    onClick={triggerLogout}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 py-2.5 rounded-xl text-xs font-bold uppercase cursor-pointer transition text-center"
                  >
                    Sign Out VJ Hub
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* PREMIUM BINGE PASS SUBSCRIPTION VIEW     */}
        {/* ======================================= */}
        {activeScreen === "subscription" && (
          <div className="animate-fadeIn">
            <MonetizationPlans
              plans={plans.length > 0 ? plans : DEFAULT_PLANS}
              userEmail={user?.email || "guest-viewer@gmail.com"}
              onSubscribeSuccess={updateSubStatusDirectly}
            />
          </div>
        )}

        {/* ======================================= */}
        {/* PRIVATE ADULT ZONE THEATER              */}
        {/* ======================================= */}
        {activeScreen === "adult" && (
          <div className="animate-fadeIn">
            <AdultZone
              adultMovies={DEFAULT_ADULT_MOVIES}
              isUnlocked={userProfile?.isAdultUnlocked || false}
              onUnlockSuccess={async () => {
                if (user) {
                  const ref = doc(db, "users", user.uid);
                  await updateDoc(ref, { isAdultUnlocked: true });
                }
                if (userProfile) {
                  setUserProfile((prev: any) => ({ ...prev, isAdultUnlocked: true }));
                }
              }}
              onWatchMovie={(movie) => {
                setSelectedMovie(movie);
                setActiveScreen("movie");
              }}
              onPurchasePass={(planName, price) => {
                alert(`Redirecting you to checkout gateway dial codes context for ${planName} (${price}). Send funds to confirm.`);
                setActiveScreen("subscription");
              }}
            />
          </div>
        )}

        {/* ======================================= */}
        {/* WATCHLISTS VIEW                         */}
        {/* ======================================= */}
        {activeScreen === "watchlist" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="bg-[#141414] rounded-2xl p-5 border border-white/5">
              <h2 className="text-xl font-bold font-bebas text-white tracking-wide">🔖 MY WATCHLIST LIBRARY</h2>
              <p className="text-white/40 text-xs">A custom registry of your bookmarked translated premieres.</p>
            </div>

            {watchlists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {watchlists.map((wl) => {
                  const mm = movies.find((item) => item.id === wl.movieId);
                  return (
                    <div key={wl.id} className="bg-[#111] border border-white/5 rounded-xl overflow-hidden p-3 flex flex-col gap-2 shadow">
                      <img src={wl.posterUrl} referrerPolicy="no-referrer" className="w-full aspect-[3/4] object-cover rounded bg-black" />
                      <h4 className="text-white font-bold text-xs truncate leading-snug mt-1">{wl.title}</h4>
                      
                      <button
                        onClick={() => mm && watchMovieNow(mm)}
                        className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded cursor-pointer"
                      >
                        Play Now Video
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#111] border border-white/5 rounded-2xl text-xs text-white/40 font-mono">
                Your watchlist catalog is currently empty. Bookmark film previews to start binging easily!
              </div>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* DOWNLOADS DIRECTORY VIEW                 */}
        {/* ======================================= */}
        {activeScreen === "downloads" && (
          <div className="max-w-md mx-auto w-full animate-fadeIn flex flex-col gap-5">
            <div className="bg-[#141414] rounded-2xl p-5 border border-white/5 text-center">
              <span className="text-2xl mb-1 block">⬇️</span>
              <h2 className="text-xl font-bold font-bebas text-white tracking-wide">LOW-DATA DOWNLOADS HUB</h2>
              <p className="text-white/40 text-xs mt-1 leads-relaxed">
                Save audio track or full video loops onto local IndexedDB device sandbox storage. Perfect for offline binging on Kampala taxi transport!
              </p>
            </div>

            <div className="bg-[#121212] rounded-xl border border-white/5 p-4 text-xs font-mono text-center flex flex-col gap-1 text-white/40">
              <span>Offline caching sandbox: 0 bytes utilized</span>
              <span>Available space: 12.8 GB device storage</span>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* HISTORIES VIEW                          */}
        {/* ======================================= */}
        {activeScreen === "history" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="bg-[#141414] rounded-2xl p-5 border border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold font-bebas text-white tracking-wide">🕰️ WATCH RECENT HISTORIES</h2>
                <p className="text-white/40 text-xs">Dynamic syncing history across all logged in devices.</p>
              </div>
            </div>

            {watchHistory.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {watchHistory.map((hist) => {
                  const mm = movies.find((item) => item.id === hist.movieId);
                  return (
                    <div key={hist.id} className="bg-[#111] border border-white/5 rounded-xl overflow-hidden p-3" style={{ opacity: 0.85 }}>
                      <img src={hist.posterUrl} referrerPolicy="no-referrer" className="w-full aspect-[3/4] object-cover rounded bg-black" />
                      <h4 className="text-white font-bold text-xs truncate leading-snug mt-1">{hist.title}</h4>
                      <p className="text-[9px] font-mono text-white/40">Sync date: {hist.lastWatchedAt ? new Date(hist.lastWatchedAt).toLocaleDateString() : 'recent'}</p>
                      <button
                        onClick={() => mm && watchMovieNow(mm)}
                        className="w-full py-1.5 bg-red-600/20 text-[#ff0a16] border border-red-500/20 text-[10px] font-bold rounded cursor-pointer mt-2"
                      >
                        Play Again
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#111] border border-white/5 rounded-2xl text-xs text-white/40 font-mono">
                No recent binging sessions logged to your user profile.
              </div>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* SEARCH DIRECTORY VIEW                   */}
        {/* ======================================= */}
        {activeScreen === "search" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Direct query input for mobile */}
            <div className="flex items-center gap-2 bg-[#141414] border border-white/5 rounded-xl p-3">
              <Search size={16} className="text-white/40 shrink-0" />
              <input
                type="text"
                placeholder="Search movies, action genres, or Video Jokers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-white outline-none w-full"
              />
            </div>

            <h3 className="text-sm font-semibold tracking-wide text-white font-mono uppercase border-b border-white/5 pb-2">
              Results found ({filteredMoviesByMoodAndSearch.length})
            </h3>

            {filteredMoviesByMoodAndSearch.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {filteredMoviesByMoodAndSearch.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => watchMovieNow(movie)}
                    className="bg-[#141414] border border-white/10 p-2.5 rounded-xl cursor-pointer hover:border-red-500 duration-200"
                  >
                    <img src={movie.posterUrl} referrerPolicy="no-referrer" className="w-full aspect-[3/4] object-cover rounded-lg bg-black" />
                    <h4 className="text-white font-bold text-xs truncate mt-2 leading-none">{movie.title}</h4>
                    <span className="text-[9px] font-mono text-white/40 mt-1 block">Views: {movie.views} • {movie.duration}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#111] border border-white/5 rounded-2xl text-xs text-white/40 font-mono">
                Zero matching translated features found. Try exploring another keyword.
              </div>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* SUPPORT / FAQ / TERMS STATIC SCREENS    */}
        {/* ======================================= */}
        {["support", "faq", "privacy", "terms", "kids", "vj"].includes(activeScreen) && (
          <div className="max-w-2xl mx-auto w-full bg-[#141414] p-6 rounded-2xl border border-white/5 animate-fadeIn flex flex-col gap-5 text-sm leading-relaxed text-gray-300">
            {activeScreen === "support" && (
              <>
                <h2 className="text-xl font-bold font-bebas tracking-wide text-white uppercase">📧 DUMMY SUPPORT CONTACT PANEL</h2>
                <div className="bg-[#111] p-4 rounded-xl text-xs font-mono border border-white/5 flex flex-col gap-2.5 text-white/75">
                  <p>Registered Address: Kampala Hill Road, Block 4, Uganda</p>
                  <p>Official Helpline: Ivan K. / 0766051929</p>
                  <p>Email Dispatch: support@moviepulse.com</p>
                </div>
                <p className="text-xs text-white/40 mt-1 font-mono">To submit tickets, send transaction slips or questions to our Ivan K. WhatsApp billing number directly.</p>
              </>
            )}

            {activeScreen === "faq" && (
              <>
                <h2 className="text-xl font-bold font-bebas tracking-wide text-white uppercase">❓ Uganda VJ Streaming FAQ</h2>
                <div className="flex flex-col gap-4 text-xs font-mono">
                  <div className="flex flex-col gap-1.5 p-3 rounded bg-black/40">
                    <span className="text-white font-bold">1. What is Translated VJ Cinema?</span>
                    <p className="text-white/50 leading-snug">VJ stands for Video Joker. Video Jokers talk over movies, explaining action scenes and providing translated Luganda jokes so anyone can understand fully!</p>
                  </div>
                  <div className="flex flex-col gap-1.5 p-3 rounded bg-black/40">
                    <span className="text-white font-bold">2. How do I pay with MTN or Airtel?</span>
                    <p className="text-white/50 leading-snug">Simply dial *165# for MTN or *185# for Airtel. Send the pass amount to our registered line, input your transaction ID and tap verified payment!</p>
                  </div>
                </div>
              </>
            )}

            {activeScreen === "privacy" && (
              <>
                <h2 className="text-xl font-bold font-bebas tracking-wide text-white uppercase">📜 PRIVACY GUIDELINES</h2>
                <p className="text-xs font-mono">Your profile details, email identities and synced cookies are safeguarded with AES-256 cloud mechanisms. Adult zone activities are hidden completely, bypassing local device watch lists to protect privacy on Kampala taxis.</p>
              </>
            )}

            {activeScreen === "terms" && (
              <>
                <h2 className="text-xl font-bold font-bebas tracking-wide text-white uppercase">📋 TERMS OF SERVICE POLICY</h2>
                <p className="text-xs font-mono">Subscriptions are final-authorized upon transaction ID verify alerts. System sharing is encouraged within standard limits. Do not re-record VJ track commentary for commercial broadcasts without registered permissions.</p>
              </>
            )}

            {activeScreen === "kids" && (
              <>
                <div className="text-center">
                  <span className="text-3xl mb-1.5 block">👶</span>
                  <h2 className="text-xl font-bold font-bebas tracking-wide text-white uppercase">KIDS CINEMA ARENA</h2>
                  <p className="text-white/40 text-xs font-mono mt-1">Safe, ad-isolated children cartoons and inspirational translated features.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  {movies.filter(m => m.category === "Kids" || m.tags.includes("Kids")).map(m => (
                    <div key={m.id} onClick={() => watchMovieNow(m)} className="bg-black/60 p-2 text-center rounded-xl cursor-pointer">
                      <img src={m.posterUrl} className="w-full aspect-[4/3] object-cover rounded-lg" />
                      <span className="font-bold text-xs text-white truncate block mt-2">{m.title}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeScreen === "vj" && (
              <>
                <h2 className="text-xl font-bold font-bebas tracking-wide text-[#ff0a16] uppercase">🎙️ LEGENDARY VIDEO JOKERS DIRECTORY</h2>
                <p className="text-white/40 text-xs">Uganda's elite voice directors, translating Hollywood blockbusters into vibrant street commentary.</p>
                
                <div className="flex flex-col gap-4 mt-2">
                  {[
                    { name: "VJ Junior", title: "The Action Kingpin of Kampala", slang: "Akakodyo K'abaloza!" },
                    { name: "VJ Emmy", title: "Sci-Fi & Cyber tech Specialist", slang: "Bannange, ebyuma biseseba!" },
                    { name: "VJ Jingo", title: "Comic Legend of Hilarious Jokes", slang: "Zino kunkumula bitakisi!" }
                  ].map((vj_item) => (
                    <div key={vj_item.name} className="p-4 rounded-xl bg-black border border-white/5 flex flex-col gap-1 text-xs">
                      <span className="text-[#ffd700] font-extrabold text-sm">{vj_item.name}</span>
                      <span className="text-white/50">{vj_item.title}</span>
                      <span className="text-[10px] text-[#ff0a16] font-mono">Famous cue: "{vj_item.slang}"</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* KAMPALA ADMIN CONSOLE DIRECTORY EDIT    */}
        {/* ======================================= */}
        {activeScreen === "admin" && (
          <div className="animate-fadeIn flex flex-col gap-6">
            
            {/* Admin Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex flex-col justify-between h-20">
                <span className="text-white/40 text-[9px] uppercase font-mono">Catalog Total</span>
                <span className="text-white font-extrabold text-xl font-mono">{movies.length} Films</span>
              </div>
              <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex flex-col justify-between h-20">
                <span className="text-white/40 text-[9px] uppercase font-mono">Active Series</span>
                <span className="text-white font-extrabold text-xl font-mono">{seriesList.length} Seasons</span>
              </div>
              <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex flex-col justify-between h-20">
                <span className="text-white/40 text-[9px] uppercase font-mono">Short Clips Uploaded</span>
                <span className="text-white font-extrabold text-xl font-mono">{shorts.length} Loops</span>
              </div>
              <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex flex-col justify-between h-20">
                <span className="text-white/40 text-[9px] uppercase font-mono">Active Subscriptions</span>
                <span className="text-[#25D366] font-extrabold text-xl font-mono">Active VJ Hub</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box 1: Add new Movie Entry */}
              <div className="bg-[#141414] rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
                <h3 className="text-slate-200 font-bold font-mono text-xs uppercase border-b border-white/10 pb-2">
                  ➕ Add New Movie to Firestore Catalog
                </h3>

                <form onSubmit={handleAddNewMovieAdmin} className="flex flex-col gap-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-[9px] mb-1 block uppercase font-mono">Movie Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Extraction 3 VJ Translated"
                        value={newMovie.title}
                        onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-white/40 text-[9px] mb-1 block uppercase font-mono">Video Stream URL</label>
                      <input
                        type="text"
                        placeholder="Direct HTTP video stream MP4"
                        value={newMovie.videoUrl}
                        onChange={(e) => setNewMovie({ ...newMovie, videoUrl: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-white/40 text-[9px] mb-1 block uppercase font-mono">Hero Poster Backdrop Image URL</label>
                    <input
                      type="text"
                      placeholder="e.g. unsplash image backdrop path"
                      value={newMovie.backdropUrl}
                      onChange={(e) => setNewMovie({ ...newMovie, backdropUrl: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-[9px] mb-1 block uppercase font-mono">Category Genre</label>
                      <select
                        value={newMovie.category}
                        onChange={(e) => setNewMovie({ ...newMovie, category: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white"
                      >
                        <option value="Action">Action</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Ugandan">Ugandan Local</option>
                        <option value="Kids">Kids Cartoons</option>
                        <option value="Drama">Drama Theater</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-white/40 text-[9px] mb-1 block uppercase font-mono">Required Premium Locked?</label>
                      <select
                        value={newMovie.isPremium ? "true" : "false"}
                        onChange={(e) => setNewMovie({ ...newMovie, isPremium: e.target.value === "true" })}
                        className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white"
                      >
                        <option value="false">Free Movie (Ad supported)</option>
                        <option value="true">Premium Locked (Subscription pass needed)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-[9px] mb-1 block uppercase font-mono">Voice VJs (Comma-separated)</label>
                      <input
                        type="text"
                        value={newMovieVJText}
                        onChange={(e) => setNewMovieVJText(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-white/40 text-[9px] mb-1 block uppercase font-mono font-bold">Metadata Tags</label>
                      <input
                        type="text"
                        value={newMovieTagsText}
                        onChange={(e) => setNewMovieTagsText(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold text-xs tracking-wider uppercase transition cursor-pointer mt-2"
                  >
                    ✓ Add to Live Firestore Directory
                  </button>
                </form>
              </div>

              {/* Box 2: Manage Movie lists with deleting option */}
              <div className="bg-[#141414] rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
                <h3 className="text-slate-200 font-bold font-mono text-xs uppercase border-b border-white/10 pb-2">
                  📝 Dynamic Database Film Registry ({movies.length})
                </h3>

                <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
                  {movies.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="truncate flex items-center gap-2">
                        <span>🎬</span>
                        <div className="flex flex-col truncate">
                          <span className="text-white font-bold truncate">{m.title}</span>
                          <span className="text-[10px] text-white/40">Category: {m.category} • {m.year}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteMovieAdmin(m.id)}
                        className="p-2 bg-red-600/10 hover:bg-red-600/30 text-red-400 hover:text-red-500 rounded border border-red-500/20 cursor-pointer text-[10px] uppercase font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/5 pt-4">
                  <button
                    onClick={triggerSelfSeederAction}
                    className="w-full py-2 bg-gradient-to-r from-red-600 to-amber-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl hover:from-red-500 hover:to-amber-600 cursor-pointer text-center"
                  >
                    🚀 Trigger Total Catalog Reset and Reseed VJ Catalog
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR HUD */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/5 py-2 px-6 flex items-center justify-between z-30 text-xs text-white/40">
        <button
          onClick={() => {
            setSelectedMood(null);
            setSearchQuery("");
            setActiveScreen("home");
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeScreen === "home" ? "text-[#e50914] font-bold" : "hover:text-white"
          }`}
        >
          <Home size={18} />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setActiveScreen("search")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeScreen === "search" ? "text-[#e50914] font-bold" : "hover:text-white"
          }`}
        >
          <Search size={18} />
          <span className="text-[10px]">Search</span>
        </button>

        <button
          onClick={() => setActiveScreen("shorts")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeScreen === "shorts" ? "text-[#ff004f] font-bold animate-pulse" : "hover:text-white"
          }`}
        >
          <Radio size={18} />
          <span className="text-[10px]">Shorts</span>
        </button>

        <button
          onClick={() => setActiveScreen("subscription")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeScreen === "subscription" ? "text-yellow-500 font-bold" : "hover:text-white"
          }`}
        >
          <Zap size={18} />
          <span className="text-[10px]">Passes</span>
        </button>

        <button
          onClick={() => setActiveScreen("account")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeScreen === "account" ? "text-red-500 font-bold" : "hover:text-white"
          }`}
        >
          <User size={18} />
          <span className="text-[10px]">Me</span>
        </button>
      </nav>
    </div>
  );
}
