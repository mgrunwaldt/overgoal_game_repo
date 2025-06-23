// GameMatch Model - represents a football match between two teams
#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct GameMatch {
    #[key]
    pub match_id: u32,                    // Unique identifier for the match
    pub my_team_id: u32,                  // ID of the controlled team
    pub opponent_team_id: u32,            // ID of the rival team
    pub my_team_score: u8,                // Goals for my team
    pub opponent_team_score: u8,          // Goals for opponent team
    pub next_match_action: MatchAction,   // Next in-game event to resolve
    pub next_match_action_minute: u8,     // In-game minute when next action triggers
    pub current_time: u8,                 // Current minute on the match clock (0-90)
    pub match_status: MatchStatus,        // Lifecycle flag
}

// Match Status Enum - lifecycle flag
#[derive(Copy, Drop, Serde, Introspect, PartialEq, Debug)]
pub enum MatchStatus {
    NotStarted,
    InProgress,
    HalfTime,
    Finished,
}

// Match Action Enum - in-game events
#[derive(Copy, Drop, Serde, Introspect, PartialEq, Debug)]
pub enum MatchAction {
    OpenPlay,
    Jumper,
    Brawl,
    FreeKick,
    Penalty,
    OpenDefense,
}

// Match Decision Enum - player choices during actions
#[derive(Copy, Drop, Serde, Introspect, PartialEq, Debug)]
pub enum MatchDecision {
    Dribble,
    Pass,
    Simulate,
    Shoot,
    StandingTackle,
    SweepingTackle,
    AcceptHug,
    TackleFan,
    JoinBrawl,
    StayOut,
}

// Implement Into trait for MatchStatus to felt252 conversion
impl MatchStatusIntoFelt252 of Into<MatchStatus, felt252> {
    fn into(self: MatchStatus) -> felt252 {
        match self {
            MatchStatus::NotStarted => 0,
            MatchStatus::InProgress => 1,
            MatchStatus::HalfTime => 2,
            MatchStatus::Finished => 3,
        }
    }
}

// Implement Into trait for MatchAction to felt252 conversion
impl MatchActionIntoFelt252 of Into<MatchAction, felt252> {
    fn into(self: MatchAction) -> felt252 {
        match self {
            MatchAction::OpenPlay => 0,
            MatchAction::Jumper => 1,
            MatchAction::Brawl => 2,
            MatchAction::FreeKick => 3,
            MatchAction::Penalty => 4,
            MatchAction::OpenDefense => 5,
        }
    }
}

// Implement Into trait for MatchDecision to felt252 conversion
impl MatchDecisionIntoFelt252 of Into<MatchDecision, felt252> {
    fn into(self: MatchDecision) -> felt252 {
        match self {
            MatchDecision::Dribble => 0,
            MatchDecision::Pass => 1,
            MatchDecision::Simulate => 2,
            MatchDecision::Shoot => 3,
            MatchDecision::StandingTackle => 4,
            MatchDecision::SweepingTackle => 5,
            MatchDecision::AcceptHug => 6,
            MatchDecision::TackleFan => 7,
            MatchDecision::JoinBrawl => 8,
            MatchDecision::StayOut => 9,
        }
    }
}

// Implement Into trait for u8 to MatchDecision conversion
impl U8IntoMatchDecision of Into<u8, MatchDecision> {
    fn into(self: u8) -> MatchDecision {
        match self {
            0 => MatchDecision::Dribble,
            1 => MatchDecision::Pass,
            2 => MatchDecision::Simulate,
            3 => MatchDecision::Shoot,
            4 => MatchDecision::StandingTackle,
            5 => MatchDecision::SweepingTackle,
            6 => MatchDecision::AcceptHug,
            7 => MatchDecision::TackleFan,
            8 => MatchDecision::JoinBrawl,
            9 => MatchDecision::StayOut,
            _ => MatchDecision::Simulate, // Default fallback
        }
    }
}

// GameMatch Trait Implementation
#[generate_trait]
pub impl GameMatchImpl of GameMatchTrait {
    /// Create a new GameMatch with initial state
    fn new(
        match_id: u32,
        my_team_id: u32,
        opponent_team_id: u32,
    ) -> GameMatch {
        GameMatch {
            match_id: match_id,
            my_team_id: my_team_id,
            opponent_team_id: opponent_team_id,
            my_team_score: 0,
            opponent_team_score: 0,
            next_match_action: MatchAction::OpenPlay,
            next_match_action_minute: 1,
            current_time: 0,
            match_status: MatchStatus::NotStarted,
        }
    }

    /// Start the game match - transitions to InProgress and schedules first action
    fn start_match(ref self: GameMatch) -> (MatchAction, u8) {
        self.match_status = MatchStatus::InProgress;
        self.current_time = 1;
        self.next_match_action = MatchAction::OpenPlay;
        self.next_match_action_minute = 1;
        
        (self.next_match_action, self.next_match_action_minute)
    }

    /// Process a match action with player decision (TODO - implementation to be added later)
    fn process_match_action(ref self: GameMatch, match_decision: MatchDecision) -> (MatchAction, u8) {
        // TODO - keep signature; implementation to be added later
        // For now, just advance time and return next action
        self.current_time += 1;
        self.next_match_action_minute = self.current_time + 1;
        
        // Simple progression for now
        if self.current_time >= 45 && self.match_status == MatchStatus::InProgress {
            self.match_status = MatchStatus::HalfTime;
        } else if self.current_time >= 90 {
            self.match_status = MatchStatus::Finished;
        }
        
        (self.next_match_action, self.next_match_action_minute)
    }

    /// Finish the game match (TODO - implementation to be added later)  
    fn finish_match(ref self: GameMatch) {
        // TODO - keep signature; implementation to be added later
        self.match_status = MatchStatus::Finished;
    }

    /// Simulate the entire match - instantly finish with my team always winning
    fn simulate_match(ref self: GameMatch) {
        self.match_status = MatchStatus::Finished;
        self.current_time = 90;
        
        // My team always wins with 1-5 goals, opponent gets 0
        // Simple pseudo-random using match_id for deterministic but varied results
        
        
        self.my_team_score = 3;
        self.opponent_team_score = 0; // Opponent always loses
    }

    /// Add a goal to my team
    fn add_my_team_goal(ref self: GameMatch) {
        if self.my_team_score < 255 {
            self.my_team_score += 1;
        }
    }

    /// Add a goal to opponent team
    fn add_opponent_team_goal(ref self: GameMatch) {
        if self.opponent_team_score < 255 {
            self.opponent_team_score += 1;
        }
    }

    /// Check if match is finished
    fn is_finished(self: GameMatch) -> bool {
        self.match_status == MatchStatus::Finished
    }

    /// Check if match is in progress
    fn is_in_progress(self: GameMatch) -> bool {
        self.match_status == MatchStatus::InProgress
    }

    /// Get match result as string (for display purposes)
    fn get_result_summary(self: GameMatch) -> felt252 {
        if self.my_team_score > self.opponent_team_score {
            'WIN'
        } else if self.my_team_score < self.opponent_team_score {
            'LOSS'
        } else {
            'DRAW'
        }
    }

    /// Calculate total goals in the match
    fn total_goals(self: GameMatch) -> u8 {
        self.my_team_score + self.opponent_team_score
    }
} 