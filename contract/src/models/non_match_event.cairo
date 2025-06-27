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



