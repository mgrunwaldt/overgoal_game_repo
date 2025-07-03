export const GAME_MATCH_QUERY = `
  query GetGameMatch($matchId: u32!) {
    fullStarterReactGameMatchModels(where: { match_id: $matchId }) {
      edges {
        node {
          match_id
          my_team_id
          opponent_team_id
          my_team_score
          opponent_team_score
          next_match_action
          next_match_action_minute
          current_time
          prev_time
          match_status
          player_participation
          action_team
          event_counter
        }
      }
    }
  }
`;

export const MATCH_TIMELINE_EVENTS_QUERY = `
    query GetMatchTimelineEvents($matchId: u32!) {
        fullStarterReactMatchTimelineEventModels(where: { match_id: $matchId }) {
            edges {
                node {
                    match_id
                    event_id
                    action
                    minute
                    team
                    description
                    team_score
                    opponent_team_score
                    team_scored
                    opponent_team_scored
                    player_participates
                    match_end
                    half_time
                }
            }
        }
    }
`; 