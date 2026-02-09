 export interface ProductType {
   id: string;
   name: string;
   price: number;
   description?: string;
 }
 
 export interface ProductSizeOption {
   id: string;
   name: string;
   weightRange: string;
   priceDelta: number;
   description?: string;
 }
 
 export interface CatalogueProduct {
   id: string;
   name: string;
   brand: string;
   categoryId: string;
   image?: string;
   types: ProductType[];
   sizes?: ProductSizeOption[];
 }
 
 export const catalogueProducts: CatalogueProduct[] = [
   // Diapers
   {
     id: 'kisskids-superdry',
     name: 'Super Dry',
     brand: 'KissKids',
     categoryId: 'diapers',
     types: [
      { id: 'jumbo', name: 'Jumbo', price: 5000, description: '60 pieces per pack' },
        { id: 'eco-small', name: 'Eco Small', price: 2500, description: '30 pieces per pack' },
     ],
     sizes: [
       { id: 'size-1', name: 'Size 1', weightRange: '2-5 kg', priceDelta: 0 },
       { id: 'size-2', name: 'Size 2', weightRange: '3-6 kg', priceDelta: 0 },
       { id: 'size-3', name: 'Size 3', weightRange: '5-9 kg', priceDelta: 200 },
       { id: 'size-4', name: 'Size 4', weightRange: '7-14 kg', priceDelta: 400 },
     ],
   },
   {
     id: 'pampers-premium',
     name: 'Premium Care',
     brand: 'Pampers',
     categoryId: 'diapers',
     types: [
      { id: 'jumbo', name: 'Jumbo', price: 6500, description: '58 pieces per pack' },
        { id: 'midi', name: 'Midi', price: 4000, description: '34 pieces per pack' },
     ],
     sizes: [
       { id: 'size-1', name: 'Size 1', weightRange: '2-5 kg', priceDelta: 0 },
       { id: 'size-2', name: 'Size 2', weightRange: '3-6 kg', priceDelta: 0 },
       { id: 'size-3', name: 'Size 3', weightRange: '5-9 kg', priceDelta: 300 },
       { id: 'size-4', name: 'Size 4', weightRange: '7-14 kg', priceDelta: 500 },
     ],
   },
   {
     id: 'huggies-comfort',
     name: 'Comfort',
     brand: 'Huggies',
     categoryId: 'diapers',
     types: [
      { id: 'jumbo', name: 'Jumbo', price: 5500, description: '56 pieces per pack' },
        { id: 'big', name: 'Big', price: 3500, description: '36 pieces per pack' },
     ],
     sizes: [
       { id: 'size-1', name: 'Size 1', weightRange: '2-5 kg', priceDelta: 0 },
       { id: 'size-2', name: 'Size 2', weightRange: '3-6 kg', priceDelta: 0 },
       { id: 'size-3', name: 'Size 3', weightRange: '5-9 kg', priceDelta: 150 },
       { id: 'size-4', name: 'Size 4', weightRange: '7-14 kg', priceDelta: 350 },
     ],
   },
   {
     id: 'kisskids-eco',
     name: 'Eco Care',
     brand: 'KissKids',
     categoryId: 'diapers',
     types: [
      { id: 'jumbo', name: 'Jumbo', price: 4500, description: '54 pieces per pack' },
        { id: 'eco-small', name: 'Eco Small', price: 2200, description: '28 pieces per pack' },
     ],
     sizes: [
       { id: 'size-1', name: 'Size 1', weightRange: '2-5 kg', priceDelta: 0 },
       { id: 'size-2', name: 'Size 2', weightRange: '3-6 kg', priceDelta: 0 },
       { id: 'size-3', name: 'Size 3', weightRange: '5-9 kg', priceDelta: 200 },
       { id: 'size-4', name: 'Size 4', weightRange: '7-14 kg', priceDelta: 400 },
     ],
   },
   // Wipes - no sizes, only types
   {
     id: 'pears-unscented',
     name: 'Unscented',
     brand: 'Pears',
     categoryId: 'wipes',
     types: [
      { id: 'big', name: 'Big', price: 1800, description: '80 wipes' },
        { id: 'medium', name: 'Medium', price: 1200, description: '50 wipes' },
        { id: 'small', name: 'Small', price: 800, description: '30 wipes' },
     ],
   },
   {
     id: 'pampers-sensitive',
     name: 'Sensitive',
     brand: 'Pampers',
     categoryId: 'wipes',
     types: [
      { id: 'big', name: 'Big', price: 2200, description: '80 wipes' },
        { id: 'medium', name: 'Medium', price: 1500, description: '50 wipes' },
        { id: 'small', name: 'Small', price: 1000, description: '30 wipes' },
     ],
   },
   {
     id: 'huggies-pure',
     name: 'Pure Water',
     brand: 'Huggies',
     categoryId: 'wipes',
     types: [
      { id: 'big', name: 'Big', price: 2000, description: '80 wipes' },
        { id: 'medium', name: 'Medium', price: 1400, description: '50 wipes' },
        { id: 'small', name: 'Small', price: 900, description: '30 wipes' },
     ],
   },
   {
     id: 'johnsons-gentle',
     name: 'Gentle Clean',
     brand: 'Johnsons',
     categoryId: 'wipes',
     types: [
      { id: 'big', name: 'Big', price: 1900, description: '80 wipes' },
        { id: 'medium', name: 'Medium', price: 1300, description: '50 wipes' },
        { id: 'small', name: 'Small', price: 850, description: '30 wipes' },
     ],
   },
   // Skincare
   {
     id: 'johnsons-baby-lotion',
     name: 'Baby Lotion',
     brand: 'Johnsons',
     categoryId: 'skincare',
     types: [
       { id: 'large', name: 'Large', price: 3500 },
       { id: 'medium', name: 'Medium', price: 2500 },
       { id: 'small', name: 'Small', price: 1500 },
     ],
   },
   {
     id: 'cetaphil-baby',
     name: 'Baby Wash',
     brand: 'Cetaphil',
     categoryId: 'skincare',
     types: [
       { id: 'large', name: 'Large', price: 4500 },
       { id: 'medium', name: 'Medium', price: 3000 },
     ],
   },
   {
     id: 'aveeno-baby',
     name: 'Daily Moisture',
     brand: 'Aveeno',
     categoryId: 'skincare',
     types: [
       { id: 'large', name: 'Large', price: 5000 },
       { id: 'medium', name: 'Medium', price: 3500 },
       { id: 'small', name: 'Small', price: 2200 },
     ],
   },
   {
     id: 'mustela-hydra',
     name: 'Hydra Bebe',
     brand: 'Mustela',
     categoryId: 'skincare',
     types: [
       { id: 'large', name: 'Large', price: 6000 },
       { id: 'medium', name: 'Medium', price: 4200 },
     ],
   },
   // Supplements
   {
     id: 'vitamin-d-drops',
     name: 'Vitamin D Drops',
     brand: 'Enfamil',
     categoryId: 'supplements',
     types: [
       { id: 'standard', name: 'Standard', price: 4500 },
     ],
   },
   {
     id: 'iron-drops',
     name: 'Iron Drops',
     brand: 'Wellkid',
     categoryId: 'supplements',
     types: [
       { id: 'standard', name: 'Standard', price: 3800 },
     ],
   },
   {
     id: 'multivitamin-syrup',
     name: 'Multivitamin Syrup',
     brand: 'Haliborange',
     categoryId: 'supplements',
     types: [
       { id: 'large', name: 'Large', price: 5500 },
       { id: 'small', name: 'Small', price: 3200 },
     ],
   },
   {
     id: 'probiotic-drops',
     name: 'Probiotic Drops',
     brand: 'BioGaia',
     categoryId: 'supplements',
     types: [
       { id: 'standard', name: 'Standard', price: 7500 },
     ],
   },
 ];
 
 export function formatPrice(price: number): string {
   return `₦${price.toLocaleString()}`;
 }
 
 export function getProductPriceRange(product: CatalogueProduct): { min: number; max: number } {
   const typesPrices = product.types.map(t => t.price);
   const minTypePrice = Math.min(...typesPrices);
   const maxTypePrice = Math.max(...typesPrices);
   
   if (product.sizes && product.sizes.length > 0) {
     const minSizeDelta = Math.min(...product.sizes.map(s => s.priceDelta));
     const maxSizeDelta = Math.max(...product.sizes.map(s => s.priceDelta));
     return {
       min: minTypePrice + minSizeDelta,
       max: maxTypePrice + maxSizeDelta,
     };
   }
   
   return { min: minTypePrice, max: maxTypePrice };
 }
 
 export function getProductsByCategory(categoryId: string): CatalogueProduct[] {
   return catalogueProducts.filter(p => p.categoryId === categoryId);
 }