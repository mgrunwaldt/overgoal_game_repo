#!/bin/bash

# Query all teams script
# This script fetches all teams from Torii GraphQL to debug team points

echo "🔍 Querying all teams from Torii..."
echo "=================================="

# Torii GraphQL URL (adjust if different)
TORII_URL="http://localhost:8080/graphql"

# GraphQL query to get all teams
QUERY='{
  "query": "query GetAllTeams { fullStarterReactTeamModels (first:20, order: { field: \"TEAM_ID\", direction: \"ASC\" }) { edges { node { team_id name offense defense intensity current_league_points } } } }"
}'

# Execute the query
echo "📡 Sending GraphQL query to: $TORII_URL"
echo ""

curl -X POST \
  -H "Content-Type: application/json" \
  -d "$QUERY" \
  "$TORII_URL" | python3 -m json.tool

echo ""
echo "✅ Query complete!"
echo ""
echo "🔍 If you see teams with current_league_points = 0, that means:"
echo "   1. No matches have been finished yet, OR"
echo "   2. The finish_gamematch function isn't being called, OR" 
echo "   3. The add_team_points function isn't working correctly"
echo ""
echo "🎯 Expected results:"
echo "   - Teams that have won matches should have 3+ points"
echo "   - Teams that have tied matches should have 1+ points"
echo "   - New teams should have 0 points" 