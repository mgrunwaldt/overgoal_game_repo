#!/bin/bash

# Seed Initial Teams Script
# This script creates the 3 default teams: Nacional, Lanus, and Peñarol

echo "🌱 Seeding initial teams..."

# Set the profile (adjust if needed)
PROFILE=${1:-dev}

echo "📋 Using profile: $PROFILE"

# Execute the seed_initial_teams function
echo "🎯 Calling seed_initial_teams system..."
sozo execute --profile $PROFILE game seed_initial_teams

if [ $? -eq 0 ]; then
    echo "✅ Teams seeded successfully!"
    echo ""
    echo "🏆 Created teams:"
    echo "  1. Nacional - Offense: 80, Defense: 80, Intensity: 80 (good in everything)"
    echo "  2. Lanus - Offense: 85, Defense: 65, Intensity: 65 (good in offense, medium in rest)"
    echo "  3. Peñarol - Offense: 40, Defense: 40, Intensity: 40 (bad in everything)"
    echo ""
    echo "🎮 Teams are now available for selection in the game!"
else
    echo "❌ Failed to seed teams. Check the error above."
    exit 1
fi 