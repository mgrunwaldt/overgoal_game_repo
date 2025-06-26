#!/bin/bash

# Seed Non-Match Events Script
# This script creates all 11 non-match events with their 44 outcomes

echo "🌱 Seeding non-match events..."

# Set the profile (adjust if needed)
PROFILE=${1:-dev}

echo "📋 Using profile: $PROFILE"

# Execute the seed_non_match_events function
echo "🎯 Calling seed_non_match_events system..."
sozo execute --rpc-url http://katana:5050 --profile $PROFILE game seed_non_match_events


if [ $? -eq 0 ]; then
    echo "✅ Non-match events seeded successfully!"
    echo ""
    echo "🎮 Created 11 events with 44 total outcomes:"
    echo "  1. Look for Sponsor Deals (4 outcomes)"
    echo "  2. Free-Kick Practice (4 outcomes)"
    echo "  3. Go to the Gym (4 outcomes)"
    echo "  4. Meditate (4 outcomes)"
    echo "  5. Party (4 outcomes)"
    echo "  6. Penalty Practice (4 outcomes)"
    echo "  7. Go to a Podcast (4 outcomes)"
    echo "  8. Work on Social Media (4 outcomes)"
    echo "  9. Visit Parents' Home (4 outcomes)"
    echo "  10. Go for a Run (4 outcomes)"
    echo "  11. Play Videogames (4 outcomes)"
    echo ""
    echo "🎲 Each event has 2 positive and 2 negative outcomes"
    echo "📊 Events affect various stats: coins, skills, stamina, charisma, fame, etc."
    echo "⚠️  Some outcomes can cause injuries"
    echo ""
    echo "🎮 Non-match events are now available for players to trigger!"
else
    echo "❌ Failed to seed non-match events. Check the error above."
    exit 1
fi 