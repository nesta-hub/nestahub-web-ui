export interface GiftCardTheme {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  textColor: string;
}

export const giftCardThemes: GiftCardTheme[] = [
  {
    id: "welcome-world",
    name: "Welcome to the World",
    emoji: "✨",
    gradient: "from-[hsl(20,60%,88%)] via-[hsl(15,50%,85%)] to-[hsl(30,45%,90%)]",
    textColor: "text-[hsl(20,35%,25%)]",
  },
  {
    id: "hello-little-one",
    name: "Hello, Little One",
    emoji: "💫",
    gradient: "from-[hsl(210,55%,88%)] via-[hsl(230,40%,87%)] to-[hsl(250,35%,90%)]",
    textColor: "text-[hsl(220,35%,25%)]",
  },
  {
    id: "little-miracle",
    name: "Our Little Miracle",
    emoji: "🌿",
    gradient: "from-[hsl(150,30%,85%)] via-[hsl(130,25%,87%)] to-[hsl(110,20%,90%)]",
    textColor: "text-[hsl(140,30%,22%)]",
  },
  {
    id: "little-sunshine",
    name: "Our Little Sunshine",
    emoji: "☀️",
    gradient: "from-[hsl(45,65%,85%)] via-[hsl(40,55%,87%)] to-[hsl(35,50%,92%)]",
    textColor: "text-[hsl(35,40%,22%)]",
  },
  {
    id: "beautiful-blessing",
    name: "A Beautiful Blessing",
    emoji: "💕",
    gradient: "from-[hsl(340,40%,88%)] via-[hsl(350,35%,87%)] to-[hsl(10,30%,90%)]",
    textColor: "text-[hsl(340,30%,25%)]",
  },
];

export const presetAmounts = [500000, 1000000, 2000000, 5000000]; // ₦5,000, ₦10,000, ₦20,000, ₦50,000 in kobo
