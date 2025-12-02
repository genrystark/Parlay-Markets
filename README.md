# 🎯 Parlay Market

**Prediction Markets Platform with Multi-Leg Parlay Builder**

Parlay Market is a modern prediction markets platform where you can build multi-leg parlays on real-world events. Trade on politics, sports, crypto, finance, and more with intelligent correlation adjustments and combined odds calculation.

![Parlay Market](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ Features

- 📊 **Real-time Market Data** - Live markets from Polymarket
- 🎲 **Parlay Builder** - Combine multiple markets into single bets
- 📈 **Price Charts** - 24h price history for each market
- 🏷️ **Smart Categories** - Politics, Crypto, Sports, Finance, Tech, and more
- ⚡ **Fast & Cached** - Optimized API with intelligent caching
- 🎨 **Modern UI** - Built with React, TypeScript, and Tailwind CSS

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm (or bun/yarn)
- Backend CLI (optional, for local backend testing - see [TESTING.md](./TESTING.md))

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd parlay-palace

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_API_BASE_URL=https://your-backend-url.com
VITE_API_KEY=your-api-key-here
```

> **Note:** Get your backend credentials from your backend service dashboard

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🏗️ Project Structure

```
parlay-palace/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── MarketCard.tsx
│   │   ├── MarketGrid.tsx
│   │   ├── MarketModal.tsx
│   │   └── ParlayPanel.tsx
│   ├── hooks/            # Custom React hooks
│   │   └── usePolymarketData.ts
│   ├── context/          # React context
│   │   └── ParlayContext.tsx
│   ├── types/            # TypeScript types
│   ├── pages/            # Page components
│   └── integrations/     # External integrations
├── backend/
│   └── functions/        # Backend functions
│       └── polymarket/   # Market data fetcher
├── public/               # Static assets
└── README.md
```

---

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Backend Functions

The backend uses edge functions for fetching market data from Polymarket API.

**Deploy functions:**

Backend functions are located in `backend/functions/`. Deploy them using your preferred backend service (e.g., Deno Deploy, Cloudflare Workers, or similar).

See [TESTING.md](./TESTING.md) for detailed testing instructions.

---

## 📦 Tech Stack

- **Frontend**
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - shadcn/ui
  - Recharts (for charts)
  - React Router

- **Backend**
  - Edge Functions (Deno)
  - Polymarket API integration
  - Rate limiting & caching

---

## 🎯 Key Features Explained

### Market Data Fetching

- Fetches markets from Polymarket CLOB API
- Normalizes data with probability and odds calculations
- Caches results for 20-30 seconds
- Handles rate limiting automatically

### Parlay Builder

- Combine multiple markets into single bets
- Automatic correlation adjustments
- Combined odds calculation
- Real-time probability updates

### Charts

- 24-hour price history
- Interactive tooltips
- Downsampled for performance
- Cached for 60 seconds

---

## 📝 API Endpoints

### Market Data

```typescript
// Fetch markets
GET /api/markets

// Query parameters:
?category=Politics    // Filter by category
&search=trump        // Search markets
&sort=volume         // Sort by volume/liquidity
&limit=50            // Limit results
&charts=true         // Include chart data
```

---

## 🧪 Testing

See [TESTING.md](./TESTING.md) for comprehensive testing guide.

Quick test:
```bash
# Test API endpoint
node test-api.js --remote your-project-id
```

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Deploy Options

1. **Vercel** (recommended)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   - Connect your GitHub repo
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Other Hosting**
   - Any static hosting service (AWS S3, Google Cloud Storage, etc.)
   - Upload the `dist` folder to your hosting

### Environment Variables for Production

Make sure to set environment variables in your hosting platform:
- `VITE_API_BASE_URL`
- `VITE_API_KEY`

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🔗 Links

- [Polymarket](https://polymarket.com) - Prediction markets data source
- [shadcn/ui](https://ui.shadcn.com) - UI components

---

## 💡 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ by the Parlay Market team**
