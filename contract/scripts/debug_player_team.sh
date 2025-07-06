#!/bin/bash

# Debug player and team data for StatsPopup
# This script helps debug why StatsPopup shows 0 points

echo "🔍 Debugging Player & Team Data for StatsPopup..."
echo "================================================="

# Check if player address is provided as argument
if [ $# -eq 0 ]; then
    echo "❌ Please provide player address as argument"
    echo "Usage: $0 <player_address>"
    echo "Example: $0 0x1234567890abcdef1234567890abcdef12345678"
    exit 1
fi

PLAYER_ADDRESS=$1
TORII_URL="http://localhost:8080/graphql"

echo "🎯 Player Address: $PLAYER_ADDRESS"
echo "📡 Torii URL: $TORII_URL"
echo ""

# Query player data
echo "1️⃣ Fetching Player Data..."
echo "-------------------------"
PLAYER_QUERY="{\"query\": \"query GetPlayer { fullStarterReactPlayerModels(where: {player: \\\"$PLAYER_ADDRESS\\\"}) { edges { node { player selected_team_id stamina energy charisma dribble fame shoot passing intelligence } } } }\"}"

curl -s -X POST -H "Content-Type: application/json" -d "$PLAYER_QUERY" "$TORII_URL"
echo ""
echo ""

# Query all teams to find the selected team
echo "2️⃣ Fetching All Teams Data..."
echo "----------------------------"
TEAMS_QUERY="{\"query\": \"query GetAllTeams { fullStarterReactTeamModels (first:20, order: { field: \\\"TEAM_ID\\\", direction: \\\"ASC\\\" }) { edges { node { team_id name offense defense intensity current_league_points } } } }\"}"

curl -s -X POST -H "Content-Type: application/json" -d "$TEAMS_QUERY" "$TORII_URL"
echo ""
echo ""

echo "🔍 Debug Steps:"
echo "1. Check if player.selected_team_id matches a team.team_id"
echo "2. Check if that team has current_league_points > 0"
echo "3. Verify the frontend is passing the correct teamPoints prop to StatsPopup"
echo ""
echo "🎯 Common Issues:"
echo "- Player hasn't selected a team (selected_team_id = 0)"
echo "- Team exists but has 0 points (no matches finished)"
echo "- Frontend not finding the team by ID"
echo "- StatsPopup receiving teamPoints=0 prop" 