#!/bin/bash
# Usage: ./query_match_timeline_events.sh <MATCH_ID>
MATCH_ID=$1
TORII_URL="http://localhost:8080/graphql"

QUERY=$(printf '{
  "query": "query GetMatchTimelineEvents($matchId: u32!) { fullStarterReactMatchTimelineEventModels(where: { match_id: $matchId }) { edges { node { match_id event_id action minute team description team_score opponent_team_score team_scored opponent_team_scored } } } }",
  "variables": { "matchId": %d }
}' "$MATCH_ID")

curl -s -X POST -H "Content-Type: application/json" --data "$QUERY" $TORII_URL 