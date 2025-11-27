#!/bin/bash

# ==============================================
# Solana DEX MVP - Deployment Script
# ==============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Solana DEX MVP - Deployment Script   ${NC}"
echo -e "${GREEN}========================================${NC}"

# Load environment variables
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '#' | xargs)
fi

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v solana &> /dev/null; then
    echo -e "${RED}Error: Solana CLI not installed${NC}"
    exit 1
fi

if ! command -v anchor &> /dev/null; then
    echo -e "${RED}Error: Anchor not installed${NC}"
    exit 1
fi

echo -e "${GREEN}Prerequisites OK${NC}"

# Display current configuration
echo -e "\n${YELLOW}Current Configuration:${NC}"
solana config get

# Check wallet balance
echo -e "\n${YELLOW}Wallet Balance:${NC}"
BALANCE=$(solana balance)
echo "$BALANCE"

# Determine network
NETWORK=${SOLANA_NETWORK:-devnet}
echo -e "\n${YELLOW}Target Network: ${NC}$NETWORK"

# Build the program
echo -e "\n${YELLOW}Building program...${NC}"
cd ../anchor
anchor build

# Get program ID from keypair
PROGRAM_ID=$(solana address -k target/deploy/dex-keypair.json)
echo -e "${GREEN}Program ID: ${NC}$PROGRAM_ID"

# Update program ID in lib.rs
echo -e "\n${YELLOW}Updating program ID in source...${NC}"
sed -i "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" programs/dex/src/lib.rs

# Update Anchor.toml
sed -i "s/dex = \".*\"/dex = \"$PROGRAM_ID\"/" Anchor.toml

# Rebuild with correct program ID
echo -e "\n${YELLOW}Rebuilding with correct program ID...${NC}"
anchor build

# Deploy
echo -e "\n${YELLOW}Deploying to $NETWORK...${NC}"
anchor deploy --provider.cluster $NETWORK

# Verify deployment
echo -e "\n${YELLOW}Verifying deployment...${NC}"
solana program show $PROGRAM_ID

# Update .env file
echo -e "\n${YELLOW}Updating .env file...${NC}"
cd ..
sed -i "s/^PROGRAM_ID=.*/PROGRAM_ID=$PROGRAM_ID/" .env
sed -i "s/^VITE_PROGRAM_ID=.*/VITE_PROGRAM_ID=$PROGRAM_ID/" .env

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   Deployment Complete!                  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nProgram ID: ${YELLOW}$PROGRAM_ID${NC}"
echo -e "Network: ${YELLOW}$NETWORK${NC}"
echo -e "\nNext steps:"
echo -e "1. Update frontend/.env with VITE_PROGRAM_ID=$PROGRAM_ID"
echo -e "2. Build and deploy frontend: cd frontend && npm run build"
echo -e "3. Create your first pool and add liquidity"
