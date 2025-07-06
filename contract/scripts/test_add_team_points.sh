#!/bin/bash

# Test script to manually add points to a team
# This helps test if StatsPopup will display points correctly

echo "🧪 Test: Adding Points to Team"
echo "==============================="

# Check if team ID and points are provided
if [ $# -ne 2 ]; then
    echo "❌ Please provide team ID and points to add"
    echo "Usage: $0 <team_id> <points>"
    echo "Example: $0 1 5"
    echo ""
    echo "This will add 5 points to team ID 1"
    exit 1
fi

TEAM_ID=$1
POINTS=$2

echo "🎯 Team ID: $TEAM_ID"
echo "➕ Points to add: $POINTS"
echo ""

echo "🔨 Building contract..."
sozo build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "📝 Calling add_team_points function..."
echo "Command: sozo execute game add_team_points $TEAM_ID $POINTS"
echo ""

sozo execute game add_team_points $TEAM_ID $POINTS

echo ""
echo "✅ Points addition attempted!"
echo ""
echo "🔍 To verify the points were added:"
echo "1. Run: ./scripts/query_all_teams.sh"
echo "2. Look for team ID $TEAM_ID in the results"
echo "3. Check if current_league_points increased by $POINTS"
echo ""
echo "🎯 To test StatsPopup:"
echo "1. Make sure your player has selected team ID $TEAM_ID"
echo "2. Open StatsPopup in the frontend"
echo "3. You should see $POINTS+ points displayed" 