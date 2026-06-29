export interface PackagingOption {
  id: "signature-box" | "gift-bag";
  name: string;
  description: string;
  price: number;
  image: string;
}

export const packagingOptions: PackagingOption[] = [
  {
    id: "signature-box",
    name: "Signature Box",
    description: "Our premium gift box with elegant tissue paper.",
    price: 3500,
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "gift-bag",
    name: "Gift Bag",
    description: "Beautiful keepsake bag that's perfect for any occasion.",
    price: 1500,
    image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=800&q=80",
  },
];

export const getPackagingById = (id: string) =>
  packagingOptions.find((p) => p.id === id);
