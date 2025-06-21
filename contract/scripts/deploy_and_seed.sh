#!/bin/bash

# Complete Deployment and Seeding Script
# This script builds, migrates, and seeds the initial teams

set -e  # Exit on any error

echo "🚀 Starting complete deployment and seeding process..."

# Set the profile (adjust if needed)
PROFILE=${1:-dev}

echo "📋 Using profile: $PROFILE"

# Navigate to contract directory
cd "$(dirname "$0")/.."

echo "🔨 Building contracts..."
sozo build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo "📦 Migrating contracts..."
sozo migrate --profile $PROFILE

if [ $? -eq 0 ]; then
    echo "✅ Migration successful!"
else
    echo "❌ Migration failed!"
    exit 1
fi

echo "⏳ Waiting a moment for deployment to settle..."
sleep 2

echo "🌱 Seeding initial teams..."
sozo execute --profile $PROFILE game seed_initial_teams

if [ $? -eq 0 ]; then
    echo "✅ Teams seeded successfully!"
    echo ""
    echo "🎉 Deployment and seeding complete!"
    echo ""
    echo "🏆 Created teams:"
    echo "  1. Nacional - Offense: 80, Defense: 80, Intensity: 80 (good in everything)"
    echo "  2. Lanus - Offense: 85, Defense: 65, Intensity: 65 (good in offense, medium in rest)"
    echo "  3. Peñarol - Offense: 40, Defense: 40, Intensity: 40 (bad in everything)"
    echo ""
    echo "🎮 Your game is ready with pre-seeded teams!"
    echo "💡 You can now start the client and see the teams available for selection."
else
    echo "❌ Failed to seed teams. Deployment successful but seeding failed."
    echo "💡 You can manually run the seeding script later: ./scripts/seed_teams.sh $PROFILE"
    exit 1
fi 