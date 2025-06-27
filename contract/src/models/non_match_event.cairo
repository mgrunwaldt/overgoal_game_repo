// Starknet import
use starknet::ContractAddress;


// Model for non-match events
#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct NonMatchEvent {
    #[key]
    pub event_id: u32,
    pub name: felt252,           // Event name like "Look for Sponsor Deals"
    pub description: felt252,    // Short description
    pub is_available: bool,      // Whether this event is available to trigger
}

// Model for event outcomes (each event has 4 outcomes: 2 positive, 2 negative)
#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct NonMatchEventOutcome {
    #[key]
    pub event_id: u32,
    #[key]
    pub outcome_id: u32,         // 1-4 for each event
    pub outcome_type: u32,       // 0 = negative, 1 = positive
    pub name: felt252,           // Outcome name like "Sneaker Cinderella"
    pub description: felt252,    // Flavor text
    // Stat consequences (delta values)
    pub coins_delta: i32,
    pub shoot_delta: i32,
    pub dribble_delta: i32,
    pub energy_delta: i32,
    pub stamina_delta: i32,
    pub charisma_delta: i32,
    pub fame_delta: i32,
    pub passing_delta: i32,
    pub free_kick_delta: i32,
    pub team_relationship_delta: i32,
    pub intelligence_delta: i32,
    pub sets_injured: bool,      // Whether this outcome sets is_injured = true
}

// Model to track player's event history
#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct PlayerEventHistory {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub event_id: u32,
    pub times_triggered: u32,    // How many times this event was triggered
    pub last_outcome_id: u32,    // Last outcome that occurred
    pub last_triggered_day: u32, // Day when last triggered
}

// Traits Implementation for NonMatchEvent
#[generate_trait]
pub impl NonMatchEventImpl of NonMatchEventTrait {
    fn new(
        event_id: u32,
        name: felt252,
        description: felt252,
        is_available: bool,
    ) -> NonMatchEvent {
        NonMatchEvent {
            event_id: event_id,
            name: name,
            description: description,
            is_available: is_available,
        }
    }

    fn enable(ref self: NonMatchEvent) {
        self.is_available = true;
    }

    fn disable(ref self: NonMatchEvent) {
        self.is_available = false;
    }
}

// Traits Implementation for NonMatchEventOutcome
#[generate_trait]
pub impl NonMatchEventOutcomeImpl of NonMatchEventOutcomeTrait {
    fn new(
        event_id: u32,
        outcome_id: u32,
        outcome_type: u32,
        name: felt252,
        description: felt252,
        coins_delta: i32,
        shoot_delta: i32,
        dribble_delta: i32,
        energy_delta: i32,
        stamina_delta: i32,
        charisma_delta: i32,
        fame_delta: i32,
        passing_delta: i32,
        free_kick_delta: i32,
        team_relationship_delta: i32,
        intelligence_delta: i32,
        sets_injured: bool,
    ) -> NonMatchEventOutcome {
        NonMatchEventOutcome {
            event_id: event_id,
            outcome_id: outcome_id,
            outcome_type: outcome_type,
            name: name,
            description: description,
            coins_delta: coins_delta,
            shoot_delta: shoot_delta,
            dribble_delta: dribble_delta,
            energy_delta: energy_delta,
            stamina_delta: stamina_delta,
            charisma_delta: charisma_delta,
            fame_delta: fame_delta,
            passing_delta: passing_delta,
            free_kick_delta: free_kick_delta,
            team_relationship_delta: team_relationship_delta,
            intelligence_delta: intelligence_delta,
            sets_injured: sets_injured,
        }
    }

    fn is_positive(self: NonMatchEventOutcome) -> bool {
        self.outcome_type == 1
    }

    fn is_negative(self: NonMatchEventOutcome) -> bool {
        self.outcome_type == 0
    }
}

// Traits Implementation for PlayerEventHistory
#[generate_trait]
pub impl PlayerEventHistoryImpl of PlayerEventHistoryTrait {
    fn new(
        player: ContractAddress,
        event_id: u32,
        times_triggered: u32,
        last_outcome_id: u32,
        last_triggered_day: u32,
    ) -> PlayerEventHistory {
        PlayerEventHistory {
            player: player,
            event_id: event_id,
            times_triggered: times_triggered,
            last_outcome_id: last_outcome_id,
            last_triggered_day: last_triggered_day,
        }
    }

    fn increment_triggers(ref self: PlayerEventHistory) {
        self.times_triggered += 1;
    }

    fn update_last_outcome(ref self: PlayerEventHistory, outcome_id: u32, day: u32) {
        self.last_outcome_id = outcome_id;
        self.last_triggered_day = day;
    }
}

