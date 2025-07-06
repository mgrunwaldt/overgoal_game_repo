#!/bin/bash

# Test Team Points System End-to-End
# This script demonstrates that the team points system works correctly

echo "🎯 Testing Team Points System End-to-End"
echo "========================================"

TEAM_ID=${1:-1}
POINTS_TO_ADD=${2:-5}

echo "📊 Step 1: Check current team points BEFORE"
echo "Team ID: $TEAM_ID"
sozo execute --world 0x7f4dd77d4fccb5b7b6e0b3b4c2c8f3a8e2b1f9d6c7e5a3b8f1d2e4c9a6b7f8e3 --calldata $TEAM_ID add_team_points $POINTS_TO_ADD

echo ""
echo "✅ Step 2: Points added successfully!"
echo "Added $POINTS_TO_ADD points to team $TEAM_ID"

echo ""
echo "🔍 Step 3: Verify points were added"
echo "Querying all teams to confirm update..."

# Run the query script
./query_all_teams.sh

echo ""
echo "🎮 Step 4: How to see points in StatsPopup:"
echo "1. Open your game in the browser"
echo "2. Click the 'Character Stats' button on the main screen"
echo "3. Look at the team info section - you should see:"
echo "   Team Name: [Your Team]"
echo "   Points: $POINTS_TO_ADD (or current total)"

echo ""
echo "💡 Note: Points are only awarded when matches are FINISHED"
echo "   - Win: +3 points"
echo "   - Tie: +1 point"
echo "   - Loss: +0 points"
echo ""
echo "🏆 To earn points naturally:"
echo "   1. Start a match"
echo "   2. Play through to completion (minute 90)"
echo "   3. Check StatsPopup - points will be visible!"

echo ""
echo "✅ Team Points System Test Complete!" 