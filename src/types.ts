/**
 * TypeScript Interfaces for MoviePulse
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  level: "Bronze Viewer" | "Silver Viewer" | "Gold Viewer" | "Elite Cinephile";
  pulseCoins: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  subscriptionActive: boolean;
  subscriptionPlanId?: string;
  subscriptionExpiresAt?: string; // ISO string
  isAdultUnlocked: boolean;
  adultPin?: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface VJTrack {
  name: string;
  audioUrl?: string; // Direct external audio track url
  language: string; // e.g. "Luganda"
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  synopsis: string;
  backdropUrl: string;
  posterUrl: string;
  videoUrl: string;
  duration: string; // e.g., "2h 15m"
  rating: string; // e.g., "PG-13", "18+"
  year: number;
  vjs: VJTrack[];
  views: number;
  isPremium: boolean;
  category: string; // e.g., "Action", "Drama", "Ugandan", "Kids"
  tags: string[];
  isAdult?: boolean;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  backdropUrl: string;
  posterUrl: string;
  year: number;
  views: number;
  episodesCount: number;
  isPremium: boolean;
  category: string;
  tags: string[];
}

export interface Episode {
  id: string;
  seriesId: string;
  title: string;
  videoUrl: string;
  duration: string;
  episodeNumber: number;
  seasonNumber: number;
}

export interface ShortClip {
  id: string;
  movieId: string;
  movieTitle: string;
  videoUrl: string;
  description: string;
  hashtags: string[];
  vjName: string;
  views: number;
  musicLabel: string;
}

export interface AdCampaign {
  id: string;
  imageUrl: string;
  redirectUrl: string;
  sponsorName: string;
  type: "banner" | "video" | "interstitial" | "card";
  clicks: number;
}

export interface BattleItem {
  id: string;
  movieAId: string;
  movieATitle: string;
  movieAPoster: string;
  movieAVotes: number;
  movieBId: string;
  movieBTitle: string;
  movieBPoster: string;
  movieBVotes: number;
  endsAt: string;
  voters: string[]; // User IDs who voted
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string; // e.g., "500 UGX"
  duration: string; // e.g., "1 Hour", "24 Hours"
  description: string;
  type: "hourly" | "daily" | "weekly" | "monthly" | "adult" | "single_pass";
}

export interface LiveChannel {
  id: string;
  name: string;
  logoUrl: string;
  streamUrl: string;
  nowPlaying: string;
  vjName?: string;
}

export interface NotificationItem {
  id: string;
  userId: string; // "global" or high-specific user.uid
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
}
