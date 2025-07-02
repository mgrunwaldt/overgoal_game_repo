export interface GameMatch {
    match_id: number;
    my_team_id: number;
    opponent_team_id: number;
    my_team_score: number;
    opponent_team_score: number;
    next_match_action: number;
    next_match_action_minute: number;
    current_time: number;
    prev_time: number;
    match_status: number;
    player_participation: number;
    action_team: number;
    event_counter: number;
}
  
export interface MatchTimelineEvent {
    match_id: number;
    event_id: number;
    action: number;
    minute: number;
    team: number;
    description: string;
    team_score: number;
    opponent_team_score: number;
    team_scored: boolean;
    opponent_team_scored: boolean;
    player_participates: boolean;
    match_end: boolean;
    half_time: boolean;
}

export const matchStatusMapping: { [key: string]: number } = {
    "NOTSTARTED": 0,
    "INPROGRESS": 1,
    "HALFTIME": 2,
    "FINISHED": 3,
};
  
export const matchActionMapping: { [key: string]: number } = {
    "OPENPLAY": 0,
    "JUMPER": 1,
    "BRAWL": 2,
    "FREEKICK": 3,
    "PENALTY": 4,
    "OPENDEFENSE": 5,
    "HALFTIME": 6,
    "MATCHEND": 7,
    "SUBSTITUTE": 8,
};
  
export const playerParticipationMapping: { [key: string]: number } = {
    "NOTPARTICIPATING": 0,
    "PARTICIPATING": 1,
    "OBSERVING": 2,
};
  
export const actionTeamMapping: { [key: string]: number } = {
    "MYTEAM": 0,
    "OPPONENTTEAM": 1,
    "NEUTRAL": 2,
}; 