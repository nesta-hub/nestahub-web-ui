export type PointsEntryType = "earned" | "redeemed";

export interface PointsEntry {
  id: string;
  type: PointsEntryType;
  label: string;
  points: number; // positive number; sign derived from type
  date: string; // ISO
}

export const INITIAL_REFERRAL_CODE = "NESTA-AMA248";
export const INITIAL_REFERRAL_POINTS = 24000;
export const INITIAL_CONFIRMED_REFERRALS = 6;

export const INITIAL_POINTS_HISTORY: PointsEntry[] = [
  {
    id: "rp-5",
    type: "earned",
    label: "Referral order — Tola A.",
    points: 4000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "rp-4",
    type: "earned",
    label: "Referral signup bonus — Chioma E.",
    points: 4000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
  {
    id: "rp-3",
    type: "earned",
    label: "Referral order — Bisi K.",
    points: 4000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16).toISOString(),
  },
  {
    id: "rp-2",
    type: "earned",
    label: "Referral order — Ifeoma D.",
    points: 4000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 24).toISOString(),
  },
  {
    id: "rp-1",
    type: "earned",
    label: "Welcome bonus",
    points: 8000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
];
