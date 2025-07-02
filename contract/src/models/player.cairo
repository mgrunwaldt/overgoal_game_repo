// Starknet import
use starknet::ContractAddress;
use core::num::traits::zero::Zero;

// Constants imports
use full_starter_react::constants;

// Helpers import
use full_starter_react::helpers::timestamp::Timestamp;

// Player Type Enum
#[derive(Serde, Copy, Drop, Introspect, PartialEq, Debug)]
pub enum PlayerType {
    Striker,
    Dribbler,
    Playmaker,
}

impl PlayerTypeIntoFelt252 of Into<PlayerType, felt252> {
    fn into(self: PlayerType) -> felt252 {
        match self {
            PlayerType::Striker => 0,
            PlayerType::Dribbler => 1,
            PlayerType::Playmaker => 2,
        }
    }
}

// Model
#[derive(Copy, Drop, Serde, Introspect, Debug)]
#[dojo::model]
pub struct Player {
    #[key]
    pub owner: ContractAddress,
    pub experience: u32,
    pub health: u32,
    pub coins: u32,
    pub creation_day: u32,
    pub shoot: u32,
    pub dribble: u32,
    pub energy: u32,
    pub stamina: u32,
    pub charisma: u32,
    pub fame: u32,
    pub selected_team_id: u32,  // 0 means no team selected
    pub is_player_created: bool,
    pub is_injured: bool,
    pub passing: u32,
    pub free_kick: u32,
    pub team_relationship: u32, 
    pub intelligence: u32,
    pub player_type: PlayerType,  // ✅ ADD NEW FIELD
}

// Traits Implementations
#[generate_trait]
pub impl PlayerImpl of PlayerTrait {
    fn new(
        owner: ContractAddress,
        experience: u32,
        health: u32,
        coins: u32,
        creation_day: u32,
        shoot: u32,
        dribble: u32,
        energy: u32,
        stamina: u32,
        charisma: u32,
        fame: u32,
        selected_team_id: u32,
        is_player_created: bool,
        // ✅ ADD NEW PARAMETERS
        is_injured: bool,
        passing: u32,
        free_kick: u32,
        team_relationship: u32,
        intelligence: u32,
        player_type: PlayerType,
    ) -> Player {
        Player {
            owner: owner,
            experience: experience,
            health: health,
            coins: coins,
            creation_day: creation_day,
            shoot: shoot,
            dribble: dribble,
            energy: energy,
            stamina: stamina,
            charisma: charisma,
            fame: fame,
            selected_team_id: selected_team_id,
            is_player_created: is_player_created,
            // ✅ ADD INITIALIZATION
            is_injured: is_injured,
            passing: passing,
            free_kick: free_kick,
            team_relationship: team_relationship,
            intelligence: intelligence,
            player_type: player_type,
        }
    }

    // Striker archetype: Powerful finisher
    // Shoot: 60, Dribble: 20, Charisma: 25, Energy: 50, Stamina: 45, Fame: 0
    fn new_striker(
        owner: ContractAddress,
        creation_day: u32,
    ) -> Player {
        Player {
            owner: owner,
            experience: 0,
            health: 100,
            coins: 0,
            creation_day: creation_day,
            shoot: 60,      // High shooting ability
            dribble: 20,    // Low dribbling
            energy: 50,     // Moderate energy
            stamina: 45,    // Moderate stamina
            charisma: 25,   // Low charisma
            fame: 0,        // Starting fame
            selected_team_id: 0,  // No team selected initially
            is_player_created: false,
            // ✅ ADD FIELDS WITH STRIKER VALUES
            is_injured: false,
            passing: 25,    // Moderate passing for striker
            free_kick: 45,  // Good free kick ability
            team_relationship: 30,  // Moderate team relationship
            intelligence: 35,  // Moderate intelligence
            player_type: PlayerType::Striker,
        }
    }

    // Dribbler archetype: Flashy show-boat winger
    // Shoot: 20, Dribble: 50, Charisma: 50, Energy: 40, Stamina: 40, Fame: 0
    fn new_dribbler(
        owner: ContractAddress,
        creation_day: u32,
    ) -> Player {
        Player {
            owner: owner,
            experience: 0,
            health: 100,
            coins: 0,
            creation_day: creation_day,
            shoot: 20,      // Low shooting ability
            dribble: 50,    // High dribbling
            energy: 40,     // Moderate energy
            stamina: 40,    // Moderate stamina
            charisma: 50,   // High charisma
            fame: 0,        // Starting fame
            selected_team_id: 0,  // No team selected initially
            is_player_created: false,
            // ✅ ADD FIELDS WITH DRIBBLER VALUES
            is_injured: false,
            passing: 40,    // Good passing for dribbler
            free_kick: 20,  // Low free kick ability
            team_relationship: 45,  // High team relationship (charismatic)
            intelligence: 30,  // Moderate intelligence
            player_type: PlayerType::Dribbler,
        }
    }

    // Play-maker archetype: Team-oriented chance creator
    // Shoot: 30, Dribble: 30, Charisma: 40, Energy: 50, Stamina: 50, Fame: 0
    fn new_playmaker(
        owner: ContractAddress,
        creation_day: u32,
    ) -> Player {
        Player {
            owner: owner,
            experience: 0,
            health: 100,
            coins: 0,
            creation_day: creation_day,
            shoot: 30,      // Balanced shooting
            dribble: 30,    // Balanced dribbling
            energy: 50,     // High energy
            stamina: 50,    // High stamina
            charisma: 40,   // Good charisma
            fame: 0,        // Starting fame
            selected_team_id: 0,  // No team selected initially
            is_player_created: false,
            // ✅ ADD FIELDS WITH PLAYMAKER VALUES
            is_injured: false,
            passing: 60,    // Excellent passing for playmaker
            free_kick: 35,  // Good free kick ability
            team_relationship: 55,  // Excellent team relationship
            intelligence: 60,  // High intelligence (cerebral orchestrator)
            player_type: PlayerType::Playmaker,
        }
    }

    fn add_coins(ref self: Player, coins_amount: u32) { 
        self.coins += coins_amount;
    }

    fn add_experience(ref self: Player, experience_amount: u32) { 
        self.experience += experience_amount;
    }

    fn add_health(ref self: Player, health_amount: u32) { 
        self.health += health_amount;
    }

    fn add_shoot(ref self: Player, shoot_amount: u32) {
        self.shoot += shoot_amount;
    }

    fn add_dribble(ref self: Player, dribble_amount: u32) {
        self.dribble += dribble_amount;
    }

    fn add_energy(ref self: Player, energy_amount: u32) {
        self.energy += energy_amount;
    }

    fn add_stamina(ref self: Player, stamina_amount: u32) {
        self.stamina += stamina_amount;
    }

    fn remove_stamina(ref self: Player, stamina_amount: u32) {
        self.stamina -= stamina_amount;
    }

    fn add_charisma(ref self: Player, charisma_amount: u32) {
        self.charisma += charisma_amount;
    }

    fn add_fame(ref self: Player, fame_amount: u32) {
        self.fame += fame_amount;
    }

    fn mark_as_created(ref self: Player) {
        self.is_player_created = true;
    }

    fn select_team(ref self: Player, team_id: u32) {
        self.selected_team_id = team_id;
    }

    // ✅ ADD SETTER METHODS FOR NEW FIELDS
    fn set_injured(ref self: Player, injured: bool) {
        self.is_injured = injured;
    }

    fn add_passing(ref self: Player, passing_amount: u32) {
        self.passing += passing_amount;
    }

    fn add_free_kick(ref self: Player, free_kick_amount: u32) {
        self.free_kick += free_kick_amount;
    }

    fn add_team_relationship(ref self: Player, team_relationship_amount: u32) {
        self.team_relationship += team_relationship_amount;
    }

    fn add_intelligence(ref self: Player, intelligence_amount: u32) {
        self.intelligence += intelligence_amount;
    }
}

#[generate_trait]
pub impl PlayerAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: Player) {
        assert(self.is_non_zero(), 'Player: Does not exist');
    }

    #[inline(always)]
    fn assert_not_exists(self: Player) {
        assert(self.is_zero(), 'Player: Already exist');
    }
}

pub impl ZeroablePlayerTrait of Zero<Player> {
    #[inline(always)]
    fn zero() -> Player {
        Player {
            owner: constants::ZERO_ADDRESS(),
            experience: 0,
            health: 0,
            coins: 0,
            creation_day: 0,
            shoot: 0,
            dribble: 0,
            energy: 0,
            stamina: 0,
            charisma: 0,
            fame: 0,
            selected_team_id: 0,
            is_player_created: false,
            is_injured: false,
            passing: 0,
            free_kick: 0,
            team_relationship: 0,
            intelligence: 0,
            player_type: PlayerType::Striker,
        }
    }

    #[inline(always)]
    fn is_zero(self: @Player) -> bool {
       *self.owner == constants::ZERO_ADDRESS()
    }

    #[inline(always)]
    fn is_non_zero(self: @Player) -> bool {
        !self.is_zero()
    }
}

// ✅ ADD PlayerEventHistory Model
#[derive(Copy, Drop, Serde, Introspect, Debug)]
#[dojo::model]
pub struct PlayerEventHistory {
    #[key]
    pub player: ContractAddress,
    pub last_event_id: u32,
    pub last_outcome_id: u32,
    pub last_execution_timestamp: u64,
}

#[generate_trait]
pub impl PlayerEventHistoryImpl of PlayerEventHistoryTrait {
    fn new(
        player: ContractAddress,
        last_event_id: u32,
        last_outcome_id: u32,
        last_execution_timestamp: u64,
    ) -> PlayerEventHistory {
        PlayerEventHistory {
            player: player,
            last_event_id: last_event_id,
            last_outcome_id: last_outcome_id,
            last_execution_timestamp: last_execution_timestamp,
        }
    }

    fn update_last_event(
        ref self: PlayerEventHistory,
        event_id: u32,
        outcome_id: u32,
        timestamp: u64,
    ) {
        self.last_event_id = event_id;
        self.last_outcome_id = outcome_id;
        self.last_execution_timestamp = timestamp;
    }
}

#[generate_trait]
pub impl ZeroablePlayerEventHistoryImpl of ZeroablePlayerEventHistoryTrait {
    fn zero() -> PlayerEventHistory {
        PlayerEventHistory {
            player: constants::ZERO_ADDRESS(),
            last_event_id: 0,
            last_outcome_id: 0,
            last_execution_timestamp: 0,
        }
    }
}

