# 🌐 Parlay Market

**Multi-Market Prediction Platform with Parlay (Multi-Leg) Betting  
Powered by the Polymarket Public API**

Parlay Market is a modern prediction-market interface that enhances the Polymarket ecosystem by adding **parlay mechanics** — the ability to combine multiple outcomes from different markets into a single amplified bet.  
The platform loads live markets, outcomes, volumes, liquidity, metadata, images, and charts directly from the Polymarket public API and organizes them into clean, category-based UI sections.

The goal: create a professional, fast, production-ready UX for exploring markets and building parlay combinations.

---

## 🛠 Tech Stack

**Frontend**
- React  
- TypeScript  
- Vite  
- TailwindCSS  
- shadcn/ui  
- Zustand / React Context  

**Backend**
- Node.js  
- Serverless functions  
- Polymarket Public API integrations  
- Caching layer (interval refresh 30–60s)

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

## 📄 License

This project is licensed under the MIT License.

---

## 💡 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ by the Parlay Market team**
