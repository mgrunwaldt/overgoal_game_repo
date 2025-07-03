#!/bin/bash
# Usage: ./query_game_match.sh <MATCH_ID>
MATCH_ID=$1
TORII_URL="http://localhost:8080/graphql"

QUERY=$(printf '{
  "query": "query GetGameMatch($matchId: u32!) { fullStarterReactGameMatchModels(where: { match_id: $matchId }) { edges { node { match_id my_team_id opponent_team_id my_team_score opponent_team_score next_match_action next_match_action_minute current_time prev_time match_status player_participation action_team event_counter } } } }",
  "variables": { "matchId": %d }
}' "$MATCH_ID")

curl -s -X POST -H "Content-Type: application/json" --data "$QUERY" $TORII_URL 