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



