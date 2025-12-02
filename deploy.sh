#!/bin/bash

# Deploy script for Parlay Market
# This script prepares and deploys the project

set -e

echo "🚀 Parlay Market Deployment Script"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
    echo "Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo -e "${YELLOW}Please update .env.local with your backend credentials!${NC}"
    echo ""
fi

# Step 2: Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Step 3: Build project
echo -e "${BLUE}🔨 Building project...${NC}"
npm run build

if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${YELLOW}❌ Build failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Project is ready for deployment!${NC}"
echo ""
echo "Next steps:"
echo "1. Push code to GitHub"
echo "2. Create new repository: 'parlay-market' or 'Parlay-Market'"
echo "3. Deploy using one of these options:"
echo ""
echo "   Option A - Vercel (Recommended):"
echo "   - Go to https://vercel.com"
echo "   - Import your GitHub repository"
echo "   - Add environment variables"
echo "   - Deploy!"
echo ""
echo "   Option B - Netlify:"
echo "   - Go to https://netlify.com"
echo "   - Import from Git"
echo "   - Build command: npm run build"
echo "   - Publish directory: dist"
echo ""
echo "   Option C - Manual:"
echo "   - Upload 'dist' folder to your hosting"
echo ""

