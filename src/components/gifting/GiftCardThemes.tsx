export interface GiftCardTheme {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  textColor: string;
}

// Gradients/textColors/order mirror the Lovable design (essentials).
export const giftCardThemes: GiftCardTheme[] = [
  {
    id: "welcome-world",
    name: "Welcome to the World",
    emoji: "✨",
    gradient: "from-[#FCECE8] via-[#F6D9CE] to-[#FCECE8]",
    textColor: "text-[#5C3A30]",
  },
  {
    id: "little-sunshine",
    name: "Our Little Sunshine",
    emoji: "☀️",
    gradient: "from-[#F0E8DD] via-[#E6D6BE] to-[#F0E8DD]",
    textColor: "text-[#5C4A2E]",
  },
  {
    id: "little-miracle",
    name: "Our Little Miracle",
    emoji: "🌿",
    gradient: "from-[#E8EDE4] via-[#D2DDC9] to-[#E8EDE4]",
    textColor: "text-[#3F4A38]",
  },
  {
    id: "hello-little-one",
    name: "Hello, Little One",
    emoji: "💫",
    gradient: "from-[#E8EEF5] via-[#CFDCEB] to-[#E8EEF5]",
    textColor: "text-[#324461]",
  },
  {
    id: "beautiful-blessing",
    name: "A Beautiful Blessing",
    emoji: "💕",
    gradient: "from-[#F5E4EA] via-[#EBC9D4] to-[#F5E4EA]",
    textColor: "text-[#5C3543]",
  },
];

// Design presets ₦10,000 / 20,000 / 25,000 / 50,000 (min ₦10k), stored in kobo.
export const presetAmounts = [1000000, 2000000, 2500000, 5000000];

// Minimum custom gift-card amount, in kobo (₦10,000).
export const MIN_GIFT_CARD_AMOUNT = 1000000;
