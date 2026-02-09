# Nesta Hub - Web UI

Customer-facing frontend for Nesta Hub baby care e-commerce platform.

## 🎨 Tech Stack

- **Framework:** Vite + React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Context API (Cart), Zustand (future)
- **Routing:** React Router DOM v6
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **Date:** date-fns
- **Carousels:** Embla Carousel

## 🚀 Development

```bash
# Install dependencies
npm install

# Start dev server (port 8080)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Lint code
npm run lint
```

## 📂 Project Structure

```
src/
├── components/      # UI Components
│   ├── ui/          # shadcn/ui base components
│   ├── layout/      # Layout components (Header, Footer, Nav)
│   ├── cart/        # Cart components
│   ├── catalogue/   # Product catalogue components
│   ├── bundles/     # Bundle builder components
│   ├── gifting/     # Gifting page components
│   ├── checkout/    # Checkout flow components
│   └── subscribe/   # Subscription components
├── contexts/        # React contexts (CartContext)
├── data/            # Static data (catalogueData, bundleData)
├── pages/           # Route pages
├── hooks/           # Custom hooks
├── lib/             # Utilities
└── assets/          # Images, icons
```

## 🎨 Design System

**Brand:** "Quiet Luxury" aesthetic for baby care

**Colors:**
- Background: Soft warm grey (#F5F3F0)
- Primary: Warm brown/tan (#A08B76)
- Accent: Deep olive/sage (#5B6B5A)
- Card: Soft cream
- Text: Deep warm brown

**Typography:**
- Font: Inter

**Custom Animations:**
- fade-in, scale-in, slide-up, pulse-gentle
- Card hover effects
- Drawer animations

## 🛣️ Routes

All routes are functional:

- `/` - Home page
- `/shop` - Shop entry page
- `/catalogue` - Product catalogue
- `/bundles` - Bundle builder
- `/bundles/:stageId` - Bundle options
- `/configure/:bundleId` - Bundle configurator
- `/gifting` - Gifting page
- `/subscribe` - Subscription management
- `/cart` - Shopping cart
- `/checkout` - Checkout flow
- `/explore` - Explore page
- `/gift-cards` - Gift cards
- `/contact` - Contact page
- `/account` - User account

## 🛒 Features

### Cart Management
- Add/remove products
- Update quantities
- Subscription toggle (auto-renew)
- Floating cart icon with count

### Product Catalogue
- Category filtering
- Product search
- Product detail drawer
- Add to cart

### Bundle Builder
- Select age stage
- Customize products by category
- Delivery/pickup options
- Multi-step configuration

### Checkout Flow
- Guest/signed-in checkout
- Delivery/pickup selection
- Address management
- Order summary
- Auto-renew configuration

## 🔌 API Integration (Phase 2)

Currently using static data from `src/data/`:
- `catalogueData.ts` - Product data
- `bundleData.ts` - Bundle data

Phase 2 will connect to NestJS API.

## 📱 Mobile Support

- Mobile-first responsive design
- Bottom navigation bar
- Touch-optimized interactions
- Safe area insets support

## 🎯 Next Steps (Phase 2)

1. Integrate Supabase Auth
2. Connect to API endpoints
3. Replace static data with API calls
4. Add user profile management
5. Implement real checkout

---

**Status:** Phase 1 Complete - Fully Functional UI ✅
