

## Homepage Updates

### 1. Contact Us Header Fix
**File:** `src/pages/Contact.tsx`
- Change `text-lg font-semibold` to `text-2xl font-bold text-foreground`

### 2. Entry Cards -- New Copy, Routes, and Images
**File:** `src/components/shop/ShopEntry.tsx`

| Card | Title | Description | Route | Image |
|------|-------|-------------|-------|-------|
| 1 | Everything You Need | A wide selection of quality products carefully sourced | `/catalogue` | **New image needed** |
| 2 | Expertly Curated Gift Bundles | Thoughtfully researched bundles, ready to gift | `/gifting` | Reuse current `cardBundles` (card-bundles-preview.png) |
| 3 | Care, Made Continuous | Auto-renewals of orders so care never runs out | `/subscribe` | **New image needed** |

### 3. New Images to Generate

Two new images will be generated using the AI image generation tool:

**Everything You Need:**
> Assorted premium baby care products (diapers, wipes, lotions, oils, creams) arranged abundantly on tiered shelves against a light cream background, warm natural lighting, variety and abundance, clean and minimal, lifestyle product photography, no text. Ultra high resolution.

**Care, Made Continuous:**
> A recurring delivery scene: a branded subscription box on a doorstep with baby care essentials visible inside, warm cream tones, cozy and convenient feeling, natural daylight, lifestyle photography, no text. Ultra high resolution.

### 4. Trust Badge Update
**File:** `src/components/shop/ShopEntry.tsx`

Replace the third trust badge:

| Current | Updated |
|---------|---------|
| Expert Curated (Star, gold) | Keep as-is |
| Premium Brands (Shield, sage) | Keep as-is |
| Auto Delivery (RefreshCw, coral) | **Low Prices** (Tag icon, coral) -- "Premium care at honest prices" |

- Import `Tag` from lucide-react, remove `RefreshCw`

### Summary of File Changes

| File | Change |
|------|--------|
| `src/pages/Contact.tsx` | Header: `text-lg font-semibold` to `text-2xl font-bold text-foreground` |
| `src/components/shop/ShopEntry.tsx` | Update 3 card titles, descriptions, routes; swap trust badge; update image imports |
| 2 new generated images | For "Everything You Need" and "Care, Made Continuous" cards |

