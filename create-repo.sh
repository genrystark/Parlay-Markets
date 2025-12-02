#!/bin/bash

# Script to create new GitHub repository for Parlay Market
# This will guide you through the process

set -e

echo "🎯 Parlay Market - Repository Setup"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REPO_NAME="parlay-market"
GITHUB_USER=""

echo -e "${BLUE}This script will help you create a new GitHub repository.${NC}"
echo ""

# Check if GitHub CLI is installed
if command -v gh &> /dev/null; then
    echo -e "${GREEN}✅ GitHub CLI found!${NC}"
    echo ""
    
    # Check if authenticated
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✅ GitHub CLI authenticated!${NC}"
        echo ""
        
        # Get current user
        GITHUB_USER=$(gh api user -q .login)
        echo -e "${BLUE}Logged in as: ${GITHUB_USER}${NC}"
        echo ""
        
        read -p "Repository name (default: parlay-market): " REPO_NAME
        REPO_NAME=${REPO_NAME:-parlay-market}
        
        read -p "Description (default: Prediction Markets Platform): " REPO_DESC
        REPO_DESC=${REPO_DESC:-Prediction Markets Platform with Multi-Leg Parlay Builder}
        
        read -p "Make it private? (y/N): " IS_PRIVATE
        IS_PRIVATE=${IS_PRIVATE:-n}
        
        PRIVATE_FLAG=""
        if [[ "$IS_PRIVATE" == "y" || "$IS_PRIVATE" == "Y" ]]; then
            PRIVATE_FLAG="--private"
        else
            PRIVATE_FLAG="--public"
        fi
        
        echo ""
        echo -e "${BLUE}Creating repository...${NC}"
        
        # Create repo
        gh repo create "$REPO_NAME" \
            --description "$REPO_DESC" \
            $PRIVATE_FLAG \
            --source=. \
            --remote=new-origin \
            --push
        
        echo ""
        echo -e "${GREEN}✅ Repository created successfully!${NC}"
        echo ""
        echo "Repository URL: https://github.com/${GITHUB_USER}/${REPO_NAME}"
        echo ""
        echo "Next steps:"
        echo "1. Update remote if needed:"
        echo "   git remote set-url origin https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
        echo ""
        echo "2. Deploy to Vercel/Netlify (see DEPLOYMENT.md)"
        
    else
        echo -e "${YELLOW}GitHub CLI not authenticated.${NC}"
        echo "Run: gh auth login"
        exit 1
    fi
else
    echo -e "${YELLOW}GitHub CLI not installed.${NC}"
    echo ""
    echo "You can either:"
    echo ""
    echo "Option 1: Install GitHub CLI"
    echo "  brew install gh"
    echo "  gh auth login"
    echo "  Then run this script again"
    echo ""
    echo "Option 2: Create repository manually"
    echo "  1. Go to https://github.com/new"
    echo "  2. Repository name: parlay-market"
    echo "  3. Description: Prediction Markets Platform with Multi-Leg Parlay Builder"
    echo "  4. Create repository"
    echo "  5. Then run:"
    echo "     git remote add new-origin https://github.com/YOUR_USERNAME/parlay-market.git"
    echo "     git push -u new-origin main"
    echo ""
    echo "See SETUP_NEW_REPO.md for detailed instructions"
fi

