// Starknet imports
use starknet::{get_caller_address, get_block_timestamp};


// Dojo imports
use dojo::world::WorldStorage;
use dojo::model::ModelStorage;

// Models imports
use full_starter_react::models::player::{Player, PlayerTrait, PlayerEventHistory, PlayerEventHistoryTrait};
use full_starter_react::models::team::{Team, TeamTrait, TeamImpl};
use full_starter_react::models::gamematch::{
    GameMatch, GameMatchTrait, GameMatchImpl, MatchAction, MatchDecision, MatchStatus, ActionTeam,
    MatchTimelineEvent
};
use full_starter_react::models::non_match_event::{
    NonMatchEvent, NonMatchEventImpl, NonMatchEventTrait, NonMatchEventOutcome,
    NonMatchEventOutcomeImpl, NonMatchEventOutcomeTrait
};

// Core imports for hash functions
use core::poseidon::poseidon_hash_span;

// Helpers import
use full_starter_react::helpers::timestamp::Timestamp;

// ===== GAME BALANCE CONSTANTS =====
// These constants control all probability calculations in the match system
// Adjust these values to fine-tune game balance

// === PENALTY PROBABILITIES ===
const PENALTY_BASE_PROBABILITY: u32 = 75; // Base penalty success rate (60%)
const PENALTY_CENTER_MODIFIER: u32 = 90; // Center penalty modifier (90% = -10%)
const PENALTY_CORNER_BASELINE_BOOST: u32 = 105; // Corner penalty boost (105% = +5%)
const PENALTY_PANENKA_BASELINE_PENALTY: u32 = 70; // Panenka penalty (70% = -30%)

// === FREE KICK PROBABILITIES ===
const FREE_KICK_BASE_PROBABILITY: u32 = 20; // Base free kick success rate (10%)
const FREE_KICK_MIN_CLAMP: u32 = 100; // Minimum free kick probability (1%)
const FREE_KICK_MAX_CLAMP: u32 = 4000; // Maximum free kick probability (30.0%)
const FREE_KICK_SHOOT_MIN_GOAL_PROB: u32 = 1000; // Min goal probability (2%)
const FREE_KICK_SHOOT_MAX_GOAL_PROB: u32 = 9000; // Max goal probability (80.0%)
const FREE_KICK_CROSS_MIN_GOAL_PROB: u32 = 4000; // Min cross probability (20%)
const FREE_KICK_CROSS_MAX_GOAL_PROB: u32 = 9000; // Max cross probability (50.0%)

// === OPEN PLAY PROBABILITIES ===
const OPEN_PLAY_SHOOT_BASE_PROBABILITY: u32 = 5000; // Base shoot success rate (5.0% in 0.1% units)
const OPEN_PLAY_SHOOT_MIN_GOAL_PROB: u32 = 2500; // Min goal probability (0.5%)
const OPEN_PLAY_SHOOT_MAX_GOAL_PROB: u32 = 9500; // Max goal probability (90.0%)

// === OPEN PLAY PASS PROBABILITIES ===
const OPEN_PLAY_PASS_PLAYER_PASSING_WEIGHT: u32 = 80; // Weight for player.passing (60% = 0.6)
const OPEN_PLAY_PASS_PLAYER_INTELLIGENCE_WEIGHT: u32 = 25; // Weight for player.intelligence (25% = 0.25)
const OPEN_PLAY_PASS_TEAM_OFFENSE_WEIGHT: u32 = 25; // Weight for team.offense (15% = 0.15)
const OPEN_PLAY_PASS_MIN_SUCCESS_PROB: u32 = 25; // Minimum pass success rate (10%)
const OPEN_PLAY_PASS_MAX_SUCCESS_PROB: u32 = 95; // Maximum pass success rate (95%)

// === OPEN PLAY DRIBBLE PROBABILITIES ===
const OPEN_PLAY_DRIBBLE_PLAYER_DRIBBLE_WEIGHT: u32 = 60; // Weight for player.dribble (60% = 0.6)
const OPEN_PLAY_DRIBBLE_PLAYER_INTELLIGENCE_WEIGHT: u32 = 30; // Weight for player.intelligence (30% = 0.3)
const OPEN_PLAY_DRIBBLE_TEAM_OFFENSE_WEIGHT: u32 = 10; // Weight for team.offense (10% = 0.1)
const OPEN_PLAY_DRIBBLE_MIN_SUCCESS_PROB: u32 = 25; // Minimum dribble success rate (10%)
const OPEN_PLAY_DRIBBLE_MAX_SUCCESS_PROB: u32 = 95; // Maximum dribble success rate (95%)

// === OPEN PLAY SIMULATE FOUL PROBABILITIES ===
const OPEN_PLAY_SIMULATE_PLAYER_INTELLIGENCE_WEIGHT: u32 = 50; // Weight for player.intelligence (40% = 0.4)
const OPEN_PLAY_SIMULATE_PLAYER_DRIBBLE_WEIGHT: u32 = 30; // Weight for player.dribble (30% = 0.3)
const OPEN_PLAY_SIMULATE_TEAM_INTENSITY_WEIGHT: u32 = 30; // Weight for team.intensity (30% = 0.3)
const OPEN_PLAY_SIMULATE_MIN_SUCCESS_PROB: u32 = 15; // Minimum simulate success rate (5%)
const OPEN_PLAY_SIMULATE_MAX_SUCCESS_PROB: u32 = 85; // Maximum simulate success rate (80%)

// === MATCH EVENT PROBABILITIES ===
const MY_TEAM_ATTACK_BASE_PROBABILITY: u32 = 6; // Base attack event probability (7%)
const OPPONENT_TEAM_ATTACK_BASE_PROBABILITY: u32 = 10; // Base opponent attack probability (7%)
const RANDOM_EVENT_BASE_PROBABILITY: u32 = 1; // Base random event probability (4%)
const PENALTY_ACTION_BASE_PROBABILITY: u32 = 10; // Base penalty action probability (4%)
const FREE_KICK_ACTION_BASE_PROBABILITY: u32 = 22; // Base free kick action probability (18%)
const BRAWL_ACTION_BASE_PROBABILITY: u32 = 60; // Base brawl action probability (60%)

// === PARTICIPATION PROBABILITIES ===
const ATTACK_PARTICIPATION_BASE_PROBABILITY: u32 = 100; // Base attack participation (100%)
const DEFENSE_PARTICIPATION_BASE_PROBABILITY: u32 = 15; // Base defense participation (15%)
const SIMULATE_FOUL_PENALTY_CHANCE: u32 = 30; // Chance of penalty from simulation (25%)

// === AI ATTACK OUTCOME PROBABILITIES ===
const AI_PENALTY_SUCCESS_RATE: u32 = 80; // AI penalty success rate (80%)
const AI_FREE_KICK_SUCCESS_RATE: u32 = 15; // AI free kick success rate (10%)
const AI_OPEN_PLAY_SUCCESS_RATE: u32 = 5; // AI open play success rate (1%)

// Helper struct for attack event results
#[derive(Copy, Drop)]
struct AttackEventResult {
    has_event: bool,
    event_minute: u8,
    action_type: MatchAction,
    player_participates: bool,
}

// Store struct
#[derive(Copy, Drop)]
pub struct Store {
    world: WorldStorage,
}

//Implementation of the `StoreTrait` trait for the `Store` struct
#[generate_trait]
pub impl StoreImpl of StoreTrait {
    fn new(world: WorldStorage) -> Store {
        Store { world: world }
    }

    // --------- Getters ---------
    fn read_player(self: Store) -> Player {
        let caller = get_caller_address();
        self.world.read_model(caller)
    }

    fn read_team(self: Store, team_id: u32) -> Team {
        self.world.read_model(team_id)
    }

    fn read_gamematch(self: Store, match_id: u32) -> GameMatch {
        self.world.read_model(match_id)
    }

    fn read_non_match_event(self: Store, event_id: u32) -> NonMatchEvent {
        self.world.read_model(event_id)
    }

    fn read_non_match_event_outcome(self: Store, event_id: u32, outcome_id: u32) -> NonMatchEventOutcome {
        self.world.read_model((event_id, outcome_id))
    }

    fn read_player_event_history(self: Store, player: starknet::ContractAddress) -> PlayerEventHistory {
        self.world.read_model(player)
    }



    // --------- Archetype-specific player creation ---------
    fn create_striker(mut self: Store) {
        let caller = get_caller_address();
        let current_timestamp = get_block_timestamp();

        // Create new striker player with archetype-specific stats
        let new_player = PlayerTrait::new_striker(
            caller,
            Timestamp::unix_timestamp_to_day(current_timestamp),
        );

        self.world.write_model(@new_player);
    }

    fn create_dribbler(mut self: Store) {
        let caller = get_caller_address();
        let current_timestamp = get_block_timestamp();

        // Create new dribbler player with archetype-specific stats
        let new_player = PlayerTrait::new_dribbler(
            caller,
            Timestamp::unix_timestamp_to_day(current_timestamp),
        );

        self.world.write_model(@new_player);
    }

    fn create_playmaker(mut self: Store) {
        let caller = get_caller_address();
        let current_timestamp = get_block_timestamp();

        // Create new playmaker player with archetype-specific stats
        let new_player = PlayerTrait::new_playmaker(
            caller,
            Timestamp::unix_timestamp_to_day(current_timestamp),
        );

        self.world.write_model(@new_player);
    }

    // --------- Team management functions ---------
    fn create_team(mut self: Store, team_id: u32, name: felt252, offense: u8, defense: u8, intensity: u8) {
        // Create new team with clamped stats
        let new_team = TeamTrait::new(team_id, name, offense, defense, intensity);
        self.world.write_model(@new_team);
    }

    fn update_team_points(mut self: Store, team_id: u32, points_delta: i8) {
        let mut team = self.read_team(team_id);
        team.change_current_points(points_delta);
        self.world.write_model(@team);
    }

    fn add_team_points(mut self: Store, team_id: u32, points: u8) {
        let mut team = self.read_team(team_id);
        team.add_points(points);
        self.world.write_model(@team);
    }

    fn remove_team_points(mut self: Store, team_id: u32, points: u8) {
        let mut team = self.read_team(team_id);
        team.remove_points(points);
        self.world.write_model(@team);
    }

    // --------- Player action methods ---------
    fn mark_player_as_created(mut self: Store) {
        let mut player = self.read_player();
        player.mark_as_created();
        self.world.write_model(@player);
    }

    fn mine(mut self: Store) {
        let mut player = self.read_player();
        player.add_coins(10);
       // player.remove_health(10);
        self.world.write_model(@player);
    }

    fn rest(mut self: Store) {
        let mut player = self.read_player();
        player.add_health(10);
        self.world.write_model(@player);
    }

    fn train_shooting(mut self: Store) {
        let mut player = self.read_player();
        player.add_shoot(5);
        player.add_experience(5);
        player.remove_stamina(10);
        self.world.write_model(@player);
    }

    fn train_energy(mut self: Store) {
        let mut player = self.read_player();
        player.add_energy(5);
        player.remove_stamina(10);
        self.world.write_model(@player);
    }

    fn train_dribbling(mut self: Store) {
        let mut player = self.read_player();
        player.add_dribble(5);
        player.add_experience(5);
        self.world.write_model(@player);
    }

    fn restore_stamina(mut self: Store) {
        let mut player = self.read_player();
        player.add_stamina(20);
        self.world.write_model(@player);
    }

    fn improve_charisma(mut self: Store) {
        let mut player = self.read_player();
        player.add_charisma(5);
        self.world.write_model(@player);
    }

    fn improve_fame(mut self: Store) {
        let mut player = self.read_player();
        player.add_fame(5);
        self.world.write_model(@player);
    }
    
    fn select_team(mut self: Store, team_id: u32) {
        let mut player = self.read_player();
        player.select_team(team_id);
        self.world.write_model(@player);
    }

    // ✅ ADD FUNCTIONS FOR NEW ACTIONS
    fn train_passing(mut self: Store) {
        let mut player = self.read_player();
        player.add_passing(5);
        player.add_experience(5);
        player.remove_stamina(10);
        self.world.write_model(@player);
    }

    fn train_free_kick(mut self: Store) {
        let mut player = self.read_player();
        player.add_free_kick(5);
        player.add_experience(5);
        player.remove_stamina(10);
        self.world.write_model(@player);
    }

    fn improve_team_relationship(mut self: Store) {
        let mut player = self.read_player();
        player.add_team_relationship(5);
        self.world.write_model(@player);
    }

    fn improve_intelligence(mut self: Store) {
        let mut player = self.read_player();
        player.add_intelligence(5);
        self.world.write_model(@player);
    }

    fn set_player_injured(mut self: Store, injured: bool) {
        let mut player = self.read_player();
        player.set_injured(injured);
        self.world.write_model(@player);
    }

    // --------- Non-Match Event management functions ---------
    fn execute_non_match_event(ref self: Store, event_id: u32) -> (u32, felt252, felt252) {
        let player = get_caller_address();
        
        // Read player
        let mut player_model: Player = self.world.read_model(player);
        
        // Use block timestamp for pseudo-randomness
        let timestamp = get_block_timestamp();
        let outcome_id = (timestamp % 4) + 1; // outcome IDs are 1-4
        let outcome_id_u32: u32 = outcome_id.try_into().unwrap();
        
        // Read the specific outcome for this event
        let outcome: NonMatchEventOutcome = self.world.read_model((event_id, outcome_id_u32));
        
        // Apply all stat changes
        player_model.charisma = self.apply_delta_u32(player_model.charisma, outcome.charisma_delta);
        player_model.fame = self.apply_delta_u32(player_model.fame, outcome.fame_delta);
        player_model.energy = self.apply_delta_u32(player_model.energy, outcome.energy_delta);
        player_model.dribble = self.apply_delta_u32(player_model.dribble, outcome.dribble_delta);
        player_model.shoot = self.apply_delta_u32(player_model.shoot, outcome.shoot_delta);
        player_model.passing = self.apply_delta_u32(player_model.passing, outcome.passing_delta);
        player_model.free_kick = self.apply_delta_u32(player_model.free_kick, outcome.free_kick_delta);
        player_model.intelligence = self.apply_delta_u32(player_model.intelligence, outcome.intelligence_delta);
        player_model.team_relationship = self.apply_delta_u32(player_model.team_relationship, outcome.team_relationship_delta);
        player_model.stamina = self.apply_delta_u32(player_model.stamina, outcome.stamina_delta);
        player_model.coins = self.apply_delta_u32(player_model.coins, outcome.coins_delta);
        
        // Handle injury
        if outcome.sets_injured {
            player_model.set_injured(true);
        }
        
        // Write back the updated player
        self.world.write_model(@player_model);
        
        // ✅ ADD: Create/Update PlayerEventHistory
        let mut event_history = PlayerEventHistoryTrait::new(
            player,
            event_id,
            outcome_id_u32,
            timestamp,
        );
        self.world.write_model(@event_history);
        
        // Return outcome data for the frontend
        (outcome_id_u32, outcome.name, outcome.description)
    }

    fn create_non_match_event(mut self: Store, event_id: u32, name: felt252, description: felt252) {
        let new_event = NonMatchEventTrait::new(event_id, name, description, true);
        self.world.write_model(@new_event);
    }

    fn create_non_match_event_outcome(
        mut self: Store, 
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
    ) {
        let new_outcome = NonMatchEventOutcomeTrait::new(
            event_id,
            outcome_id,
            outcome_type,
            name,
            description,
            coins_delta,
            shoot_delta,
            dribble_delta,
            energy_delta,
            stamina_delta,
            charisma_delta,
            fame_delta,
            passing_delta,
            free_kick_delta,
            team_relationship_delta,
            intelligence_delta,
            sets_injured,
        );
        self.world.write_model(@new_outcome);
    }

    fn trigger_non_match_event(mut self: Store, event_id: u32, outcome_id: u32) {
        let _caller = get_caller_address();
        let _current_timestamp = get_block_timestamp();
        let _current_day = Timestamp::unix_timestamp_to_day(_current_timestamp);
        
        // Read the outcome
        let outcome = self.read_non_match_event_outcome(event_id, outcome_id);
        
        // Apply stat changes to player
        let mut player = self.read_player();
        
        // Apply all stat deltas (clamping to 0-100 range except coins)
        if outcome.coins_delta != 0 {
            if outcome.coins_delta > 0 {
                player.add_coins(outcome.coins_delta.try_into().unwrap());
            } else {
                // Handle negative coins (subtract)
                let abs_delta: u32 = (-outcome.coins_delta).try_into().unwrap();
                if player.coins >= abs_delta {
                    player.coins -= abs_delta;
                } else {
                    player.coins = 0;
                }
            }
        }

        // Apply stat changes with clamping (0-100 range)
        if outcome.shoot_delta != 0 {
            player.shoot = self.apply_stat_delta(player.shoot, outcome.shoot_delta);
        }
        if outcome.dribble_delta != 0 {
            player.dribble = self.apply_stat_delta(player.dribble, outcome.dribble_delta);
        }
        if outcome.energy_delta != 0 {
            player.energy = self.apply_stat_delta(player.energy, outcome.energy_delta);
        }
        if outcome.stamina_delta != 0 {
            player.stamina = self.apply_stat_delta(player.stamina, outcome.stamina_delta);
        }
        if outcome.charisma_delta != 0 {
            player.charisma = self.apply_stat_delta(player.charisma, outcome.charisma_delta);
        }
        if outcome.fame_delta != 0 {
            player.fame = self.apply_stat_delta(player.fame, outcome.fame_delta);
        }
        if outcome.passing_delta != 0 {
            player.passing = self.apply_stat_delta(player.passing, outcome.passing_delta);
        }
        if outcome.free_kick_delta != 0 {
            player.free_kick = self.apply_stat_delta(player.free_kick, outcome.free_kick_delta);
        }
        if outcome.team_relationship_delta != 0 {
            player.team_relationship = self.apply_stat_delta(player.team_relationship, outcome.team_relationship_delta);
        }
        if outcome.intelligence_delta != 0 {
            player.intelligence = self.apply_stat_delta(player.intelligence, outcome.intelligence_delta);
        }

        // Handle injury
        if outcome.sets_injured {
            player.set_injured(true);
        }

        // Update player
        self.world.write_model(@player);
    }

    // Helper function to apply stat delta with clamping (0-100)
    fn apply_stat_delta(self: Store, current_stat: u32, delta: i32) -> u32 {
        if delta > 0 {
            let new_value = current_stat + delta.try_into().unwrap();
            if new_value > 100 {
                100
            } else {
                new_value
            }
        } else {
            let abs_delta: u32 = (-delta).try_into().unwrap();
            if current_stat >= abs_delta {
                current_stat - abs_delta
            } else {
                0
            }
        }
    }

    // --------- Internal helper functions ---------
    fn apply_delta_u32(self: Store, current_value: u32, delta: i32) -> u32 {
        if delta >= 0 {
            current_value + delta.try_into().unwrap()
        } else {
            let subtrahend: u32 = (-delta).try_into().unwrap();
            if current_value >= subtrahend {
                current_value - subtrahend
            } else {
                0
            }
        }
    }

    // --------- GameMatch management functions ---------
    fn create_gamematch(mut self: Store, match_id: u32, my_team_id: u32, opponent_team_id: u32) {
        // Create new GameMatch with initial state
        let new_gamematch = GameMatchTrait::new(match_id, my_team_id, opponent_team_id);
        self.world.write_model(@new_gamematch);
    }

    fn start_gamematch(mut self: Store, match_id: u32) {
        let mut gamematch = self.read_gamematch(match_id);
        gamematch.match_status = MatchStatus::InProgress;
        gamematch.current_time = 0;

        // Generate the first batch of events
        self.generate_events_until_input_required(ref gamematch);
        
        self.world.write_model(@gamematch);
    }

    fn process_match_decision(mut self: Store, ref gamematch:GameMatch, ref player:Player, match_decision: MatchDecision) -> bool{
        //1) encontrar match_action
        let match_action = gamematch.next_match_action;
        let opponent_team = self.read_team(gamematch.opponent_team_id);
        let my_team = self.read_team(gamematch.my_team_id);
        let mut need_more_actions = true;
        gamematch.event_counter += 1;

        //2 segun match_action, llamar a process_action correspondiente
        if(match_action == MatchAction::OpenPlay) {
            need_more_actions = self.process_open_play(ref gamematch, ref player, match_decision, opponent_team, my_team);
        } 
        else if(match_action == MatchAction::Penalty){
            need_more_actions = self.process_penalty(ref gamematch, ref player, match_decision, opponent_team, my_team);
        }
        else if (match_action == MatchAction::FreeKick){
            need_more_actions = self.process_free_kick(ref gamematch, ref player, match_decision, opponent_team, my_team);
        }
        // 🎯 FIX: Handle HalfTime and MatchEnd actions properly - DON'T ADD GOALS!
        else if (match_action == MatchAction::HalfTime) {
            // HalfTime - just continue, no goals added
            need_more_actions = true;
        }
        else if (match_action == MatchAction::MatchEnd) {
            // MatchEnd - finish the match, no goals added
            need_more_actions = false;
        }
        else{
            // 🎯 FIX: Only add goals for actual scoring actions, not for HalfTime/MatchEnd
            // This else block should only handle unexpected/unimplemented actions
            gamematch.my_team_score += 1;
            gamematch.event_counter += 1;
            let timeline_event = MatchTimelineEvent {
                match_id: gamematch.match_id,
                event_id: gamematch.event_counter,
                action: match_action,
                minute: gamematch.current_time,
                team: ActionTeam::MyTeam,
                description: 'GOOOAL!',
                team_score: gamematch.my_team_score,
                opponent_team_score: gamematch.opponent_team_score,
                team_scored: true,
                opponent_team_scored: false,
                player_participates: false,
                half_time: false,
                match_end: false,
            };
            self.world.write_model(@timeline_event);
        }
       // match match_action {
        //    MatchAction::OpenPlay => self.process_open_play(ref gamematch, ref player, match_decision, opponent_team, my_team),
        //    MatchAction::Jumper => self.process_jumper(ref gamematch, ref player, match_decision, opponent_team, my_team),
        //    MatchAction::Brawl => self.process_brawl(ref gamematch, ref player, match_decision, opponent_team, my_team),
        //    MatchAction::FreeKick => self.process_free_kick(ref gamematch, ref player, match_decision, opponent_team, my_team),
        //    MatchAction::Penalty => self.process_penalty(ref gamematch, ref player, match_decision, opponent_team, my_team),
        //    MatchAction::OpenDefense => self.process_open_defense(ref gamematch, ref player, match_decision, opponent_team, my_team),
        //    MatchAction::HalfTime => self.process_half_time(ref gamematch, ref player, match_decision, opponent_team, my_team),
        //    MatchAction::MatchEnd => self.process_match_end(ref gamematch, ref player, match_decision, opponent_team, my_team),
        //    MatchAction::Substitute => self.process_substitute(ref gamematch, ref player, match_decision, opponent_team, my_team),
        //}
        return need_more_actions;
        

    }
    //Free Kick
    fn process_free_kick(mut self: Store, ref gamematch:GameMatch, ref player:Player, match_decision: MatchDecision, opponent_team: Team, my_team: Team) -> bool {
        let mut need_more_actions = true;
        match match_decision {
            MatchDecision::FreekickCross => need_more_actions = self.process_free_kick_cross(ref gamematch, ref player, opponent_team, my_team),
            MatchDecision::FreekickShoot => need_more_actions = self.process_free_kick_shoot(ref gamematch, ref player, opponent_team, my_team),
            _ => {

            }
        }
        return need_more_actions;
    }
    fn process_free_kick_cross(mut self: Store, ref gamematch:GameMatch, ref player:Player, opponent_team: Team, my_team: Team) -> bool {
        // ✅ Implement free kick cross algorithm from free_kick.md with FIXED calculation
        let mut need_more_actions = true;
        
        // 🎯 FREE KICK CROSS ALGORITHM from free_kick.md - using constants
        // 1. Calculate baseProbabilityFK (same as shoot)
        let my_offense_i32: i32 = my_team.offense.try_into().unwrap();
        let opponent_defense_i32: i32 = opponent_team.defense.try_into().unwrap();
        let attack_vs_def_raw: i32 = my_offense_i32 - opponent_defense_i32;
        let attack_vs_def: i32 = if attack_vs_def_raw < -40 { -40 } else if attack_vs_def_raw > 40 { 40 } else { attack_vs_def_raw };
        let wall_pressure: u32 = opponent_team.intensity.into() * 30 / 100; // defendingTeam.intensity * 0.3
        
        let mut base_probability_fk: i32 = FREE_KICK_BASE_PROBABILITY.try_into().unwrap() + attack_vs_def * 5 / 100 - wall_pressure.try_into().unwrap() * 2 / 100;
        
        // Clamp baseProbabilityFK using constants
        if base_probability_fk < FREE_KICK_MIN_CLAMP.try_into().unwrap() { base_probability_fk = FREE_KICK_MIN_CLAMP.try_into().unwrap(); }
        if base_probability_fk > FREE_KICK_MAX_CLAMP.try_into().unwrap() { base_probability_fk = FREE_KICK_MAX_CLAMP.try_into().unwrap(); }
        
        // 2. Calculate goalProb from free_kick.md cross spec:
        // goalProb = baseProbabilityFK * (player.freeKick * 0.35 + player.passing * 0.30 + player.intelligence * 0.10 + attackingTeam.offense * 0.20 - defendingTeam.defense * 0.05) / 100
        let freekick_factor: u32 = player.free_kick.into() * 35 / 100; // player.freeKick * 0.35
        let passing_factor: u32 = player.passing.into() * 30 / 100; // player.passing * 0.30
        let intelligence_factor: u32 = player.intelligence.into() * 10 / 100; // player.intelligence * 0.10
        let offense_factor: u32 = my_team.offense.into() * 20 / 100; // attackingTeam.offense * 0.20
        let defense_penalty: u32 = opponent_team.defense.into() * 5 / 100; // defendingTeam.defense * 0.05
        
        let combined_factor: u32 = freekick_factor + passing_factor + intelligence_factor + offense_factor - defense_penalty;
        // 🎯 FIX: Multiply base by 10 to work in 0.1% units, avoiding the division by 100 problem
        let mut goal_prob: u32 = base_probability_fk.try_into().unwrap() * 10 * combined_factor / 100;
        
        // 3. Clamp goalProb using constants
        if goal_prob < FREE_KICK_CROSS_MIN_GOAL_PROB { goal_prob = FREE_KICK_CROSS_MIN_GOAL_PROB; }
        if goal_prob > FREE_KICK_CROSS_MAX_GOAL_PROB { goal_prob = FREE_KICK_CROSS_MAX_GOAL_PROB; }
        
        // 4. Generate random roll (0-9999) and check if success
        let random_roll = self.generate_random(10000, gamematch.event_counter.into());
        let is_success = random_roll < goal_prob;
        
        // 🎯 FIX: Correct conditional structure
        if is_success {
            need_more_actions = false;
            gamematch.next_match_action = MatchAction::OpenPlay;
            
            // 🎯 FIX: Create RESULT event first (player_participates: false)
            gamematch.event_counter += 1;
            let result_event = MatchTimelineEvent {
                match_id: gamematch.match_id,
                event_id: gamematch.event_counter,
                action: MatchAction::FreeKick,
                minute: gamematch.current_time,
                team: ActionTeam::MyTeam,
                description: 'Cross successful!',
                team_score: gamematch.my_team_score,
                opponent_team_score: gamematch.opponent_team_score,
                team_scored: false,
                opponent_team_scored: false,
                player_participates: false, // 🎯 RESULT - no participation needed
                half_time: false,
                match_end: false,
            };
            self.world.write_model(@result_event);
            
            // 🎯 FIX: Create NEW ACTION event (player_participates: true)
            gamematch.event_counter += 1;
            let action_event = MatchTimelineEvent {
                match_id: gamematch.match_id,
                event_id: gamematch.event_counter,
                action: MatchAction::OpenPlay,
                minute: gamematch.current_time,
                team: ActionTeam::MyTeam,
                description: 'New attack opportunity',
                team_score: gamematch.my_team_score,
                opponent_team_score: gamematch.opponent_team_score,
                team_scored: false,
                opponent_team_scored: false,
                player_participates: true, // 🎯 NEW ACTION - participation required
                half_time: false,
                match_end: false,
            };
            self.world.write_model(@action_event);
        } else {
            // Failed cross - final result, no chaining
            gamematch.event_counter += 1;
            let timeline_event = MatchTimelineEvent {
                match_id: gamematch.match_id,
                event_id: gamematch.event_counter,
                action: MatchAction::FreeKick,
                minute: gamematch.current_time,
                team: ActionTeam::MyTeam,
                description: 'Cross intercepted! Ball lost!',
                team_score: gamematch.my_team_score,
                opponent_team_score: gamematch.opponent_team_score,
                team_scored: false,
                opponent_team_scored: false,
                player_participates: false, // 🎯 FINAL RESULT - no participation
                half_time: false,
                match_end: false,
            };
            self.world.write_model(@timeline_event);
        }
        return need_more_actions;
    }


    fn process_free_kick_shoot(mut self: Store, ref gamematch:GameMatch, ref player:Player, opponent_team: Team, my_team: Team) -> bool {
        // ✅ Implement free kick shoot algorithm from free_kick.md with FIXED calculation
        let mut need_more_actions = true;
        
        // 🎯 FREE KICK ALGORITHM from free_kick.md - using constants
        // 1. Calculate baseProbabilityFK
        let my_offense_i32: i32 = my_team.offense.try_into().unwrap();
        let opponent_defense_i32: i32 = opponent_team.defense.try_into().unwrap();
        let attack_vs_def_raw: i32 = my_offense_i32 - opponent_defense_i32;
        let attack_vs_def: i32 = if attack_vs_def_raw < -40 { -40 } else if attack_vs_def_raw > 40 { 40 } else { attack_vs_def_raw };
        let wall_pressure: u32 = opponent_team.intensity.into() * 30 / 100; // defendingTeam.intensity * 0.3
        
        let mut base_probability_fk: i32 = FREE_KICK_BASE_PROBABILITY.try_into().unwrap() + attack_vs_def * 5 / 100 - wall_pressure.try_into().unwrap() * 2 / 100;
        
        // Clamp baseProbabilityFK using constants
        if base_probability_fk < FREE_KICK_MIN_CLAMP.try_into().unwrap() { base_probability_fk = FREE_KICK_MIN_CLAMP.try_into().unwrap(); }
        if base_probability_fk > FREE_KICK_MAX_CLAMP.try_into().unwrap() { base_probability_fk = FREE_KICK_MAX_CLAMP.try_into().unwrap(); }
        
        // 2. Calculate goalProb from free_kick.md spec:
        // goalProb = baseProbabilityFK * (player.freeKick * 0.5 + player.shoot * 0.25 + player.intelligence * 0.15 + attackingTeam.offense * 0.10) / 100
        let freekick_factor: u32 = player.free_kick.into() * 50 / 100; // player.freeKick * 0.5
        let shoot_factor: u32 = player.shoot.into() * 25 / 100; // player.shoot * 0.25
        let intelligence_factor: u32 = player.intelligence.into() * 15 / 100; // player.intelligence * 0.15
        let offense_factor: u32 = my_team.offense.into() * 10 / 100; // attackingTeam.offense * 0.10
        
        let combined_factor: u32 = freekick_factor + shoot_factor + intelligence_factor + offense_factor;
        // 🎯 FIX: Multiply base by 10 to work in 0.1% units, avoiding the division by 100 problem
        let mut goal_prob: u32 = base_probability_fk.try_into().unwrap() * 10 * combined_factor / 100;
        
        // 3. Clamp goalProb using constants
        if goal_prob < FREE_KICK_SHOOT_MIN_GOAL_PROB { goal_prob = FREE_KICK_SHOOT_MIN_GOAL_PROB; }
        if goal_prob > FREE_KICK_SHOOT_MAX_GOAL_PROB { goal_prob = FREE_KICK_SHOOT_MAX_GOAL_PROB; }
        
        // 4. Generate random roll (0-9999) and check if goal
        let random_roll = self.generate_random(10000, gamematch.event_counter.into());
        let is_goal = random_roll < goal_prob;
        
        // Update score if goal scored
        if is_goal {
            gamematch.my_team_score += 1;
        }
        gamematch.event_counter += 1;
        let timeline_event = MatchTimelineEvent {
            match_id: gamematch.match_id,
            event_id: gamematch.event_counter,
            action: MatchAction::FreeKick,
            minute: gamematch.current_time,
            team: ActionTeam::MyTeam,
            description: if is_goal { 'GOOOAL!' } else { 'Free kick missed!' },
            team_score: gamematch.my_team_score,
            opponent_team_score: gamematch.opponent_team_score,
            team_scored: is_goal,
            opponent_team_scored: false,
            player_participates: false,
            half_time: false,
            match_end: false,
        };
        self.world.write_model(@timeline_event);
        return need_more_actions;
    }





    //PENALTY
    fn process_penalty(mut self: Store, ref gamematch:GameMatch, ref player:Player, match_decision: MatchDecision, opponent_team: Team, my_team: Team) -> bool {
        let mut need_more_actions = true;
        match match_decision {
            MatchDecision::CenterPenalty => need_more_actions = self.process_penalty_center(ref gamematch, ref player, opponent_team, my_team),
            MatchDecision::CornerPenalty => need_more_actions = self.process_penalty_corner(ref gamematch, ref player, opponent_team, my_team),
            MatchDecision::PanenkaPenalty => need_more_actions = self.process_penalty_panenka(ref gamematch, ref player, opponent_team, my_team),
            _ => {

            }
        }
        return need_more_actions;
    }
    fn process_penalty_center(mut self: Store, ref gamematch:GameMatch, ref player:Player, opponent_team: Team, my_team: Team) -> bool {
        // ✅ Implement penalty center algorithm from penalty.md with constants
        let mut need_more_actions = true;
        
        // 🎯 PENALTY ALGORITHM from penalty.md - using constants
        // 1. Base probability from constant
        
        // 2. Skill edge: player.shoot - defendingTeam.defense, clamped to -40 to 40
        let player_shoot_i32: i32 = player.shoot.try_into().unwrap();
        let opponent_defense_i32: i32 = opponent_team.defense.try_into().unwrap();
        let skill_edge_raw: i32 = player_shoot_i32 - opponent_defense_i32;
        let skill_edge: i32 = if skill_edge_raw < -40 { -40 } else if skill_edge_raw > 40 { 40 } else { skill_edge_raw };
        
        // 3. Calculate baseProbabilityPK
        // baseProbabilityPK = pk_base + skill_edge * 0.25 + player.intelligence * 0.10
        let skill_bonus: i32 = skill_edge * 25 / 100; // skill_edge * 0.25
        let intelligence_bonus: u32 = player.intelligence.into() * 10 / 100; // player.intelligence * 0.10
        let mut base_probability_pk: i32 = PENALTY_BASE_PROBABILITY.try_into().unwrap() + skill_bonus + intelligence_bonus.try_into().unwrap();
        
        // 4. Clamp baseProbabilityPK between 40.0 and 90.0
        if base_probability_pk < 40 { base_probability_pk = 40; }
        if base_probability_pk > 90 { base_probability_pk = 90; }
        
        // 5. Apply Center Penalty modifier: baseProbabilityPK * modifier (-10%)
        let mut goal_prob: u32 = (base_probability_pk * PENALTY_CENTER_MODIFIER.try_into().unwrap() / 100).try_into().unwrap();
        
        // 6. Clamp for center penalty: 35.0 to 80.0
        if goal_prob < 35 { goal_prob = 35; }
        if goal_prob > 80 { goal_prob = 80; }
        
        // 7. Generate random roll (0-99) and check if goal
        let random_roll = self.generate_random(100, gamematch.event_counter.into());
        let is_goal = random_roll < goal_prob;
        
        // Update score if goal scored
        if is_goal {
            gamematch.my_team_score += 1;
        }
        gamematch.event_counter += 1;
        let timeline_event = MatchTimelineEvent {
            match_id: gamematch.match_id,
            event_id: gamematch.event_counter,
            action: MatchAction::Penalty,
            minute: gamematch.current_time,
            team: ActionTeam::MyTeam,
            description: if is_goal { 'GOOOAL!' } else { 'Penalty missed!' },
            team_score: gamematch.my_team_score,
            opponent_team_score: gamematch.opponent_team_score,
            team_scored: is_goal,
            opponent_team_scored: false,
            player_participates: false,
            half_time: false,
            match_end: false,
        };
        self.world.write_model(@timeline_event);
        return need_more_actions;
    }

    fn process_penalty_corner(mut self: Store, ref gamematch:GameMatch, ref player:Player, opponent_team: Team, my_team: Team) -> bool {
        // ✅ Implement penalty corner algorithm from penalty.md with constants
        let mut need_more_actions = true;
        
        // 🎯 PENALTY ALGORITHM from penalty.md - using constants
        // 1. Base probability from constant
        
        // 2. Skill edge: player.shoot - defendingTeam.defense, clamped to -40 to 40
        let player_shoot_i32: i32 = player.shoot.try_into().unwrap();
        let opponent_defense_i32: i32 = opponent_team.defense.try_into().unwrap();
        let skill_edge_raw: i32 = player_shoot_i32 - opponent_defense_i32;
        let skill_edge: i32 = if skill_edge_raw < -40 { -40 } else if skill_edge_raw > 40 { 40 } else { skill_edge_raw };
        
        // 3. Calculate baseProbabilityPK
        // baseProbabilityPK = pk_base + skill_edge * 0.25 + player.intelligence * 0.10
        let skill_bonus: i32 = skill_edge * 25 / 100; // skill_edge * 0.25
        let intelligence_bonus: u32 = player.intelligence.into() * 10 / 100; // player.intelligence * 0.10
        let mut base_probability_pk: i32 = PENALTY_BASE_PROBABILITY.try_into().unwrap() + skill_bonus + intelligence_bonus.try_into().unwrap();
        
        // 4. Clamp baseProbabilityPK between 40.0 and 90.0
        if base_probability_pk < 40 { base_probability_pk = 40; }
        if base_probability_pk > 90 { base_probability_pk = 90; }
        
        // 5. Apply Corner Penalty modifiers from penalty.md:
        // aim_bonus = (player.shoot - 50) * 0.30    // −15→+15 %
        // goalProb = baseProbabilityPK * baseline_boost       // +5 % baseline
        // goalProb += aim_bonus
        let player_shoot_i32_2: i32 = player.shoot.try_into().unwrap();
        let aim_bonus: i32 = (player_shoot_i32_2 - 50) * 30 / 100; // (player.shoot - 50) * 0.30
        let mut goal_prob: i32 = base_probability_pk * PENALTY_CORNER_BASELINE_BOOST.try_into().unwrap() / 100; // +5% baseline boost
        goal_prob += aim_bonus;
        
        // 6. Clamp for corner penalty: 40.0 to 90.0
        if goal_prob < 40 { goal_prob = 40; }
        if goal_prob > 90 { goal_prob = 90; }
        
        // 7. Generate random roll (0-99) and check if goal
        let random_roll = self.generate_random(100, gamematch.event_counter.into());
        let goal_prob_u32: u32 = goal_prob.try_into().unwrap();
        let is_goal = random_roll < goal_prob_u32;
        
        // Update score if goal scored
        if is_goal {
            gamematch.my_team_score += 1;
        }
        gamematch.event_counter += 1;
        let timeline_event = MatchTimelineEvent {
            match_id: gamematch.match_id,
            event_id: gamematch.event_counter,
            action: MatchAction::Penalty,
            minute: gamematch.current_time,
            team: ActionTeam::MyTeam,
            description: if is_goal { 'GOOOAL!' } else { 'Penalty missed!' },
            team_score: gamematch.my_team_score,
            opponent_team_score: gamematch.opponent_team_score,
            team_scored: is_goal,
            opponent_team_scored: false,
            player_participates: false,
            half_time: false,
            match_end: false,
        };
        self.world.write_model(@timeline_event);
        return need_more_actions;
    }

    fn process_penalty_panenka(mut self: Store, ref gamematch:GameMatch, ref player:Player, opponent_team: Team, my_team: Team) -> bool {
        // ✅ Implement penalty panenka algorithm from penalty.md with constants
        let mut need_more_actions = true;
        
        // 🎯 PENALTY ALGORITHM from penalty.md - using constants
        // 1. Base probability from constant
        
        // 2. Skill edge: player.shoot - defendingTeam.defense, clamped to -40 to 40
        let player_shoot_i32: i32 = player.shoot.try_into().unwrap();
        let opponent_defense_i32: i32 = opponent_team.defense.try_into().unwrap();
        let skill_edge_raw: i32 = player_shoot_i32 - opponent_defense_i32;
        let skill_edge: i32 = if skill_edge_raw < -40 { -40 } else if skill_edge_raw > 40 { 40 } else { skill_edge_raw };
        
        // 3. Calculate baseProbabilityPK
        // baseProbabilityPK = pk_base + skill_edge * 0.25 + player.intelligence * 0.10
        let skill_bonus: i32 = skill_edge * 25 / 100; // skill_edge * 0.25
        let intelligence_bonus: u32 = player.intelligence.into() * 10 / 100; // player.intelligence * 0.10
        let mut base_probability_pk: i32 = PENALTY_BASE_PROBABILITY.try_into().unwrap() + skill_bonus + intelligence_bonus.try_into().unwrap();
        
        // 4. Clamp baseProbabilityPK between 40.0 and 90.0
        if base_probability_pk < 40 { base_probability_pk = 40; }
        if base_probability_pk > 90 { base_probability_pk = 90; }
        
        // 5. Apply Panenka Penalty modifiers from penalty.md:
        // iq_factor = player.intelligence * 0.40    // 0-40 %
        // goalProb = baseProbabilityPK * baseline_penalty       // −30 %
        // goalProb += iq_factor - defendingTeam.intensity * 0.20
        let iq_factor: u32 = player.intelligence.into() * 40 / 100; // player.intelligence * 0.40
        let intensity_penalty: u32 = opponent_team.intensity.into() * 20 / 100; // defendingTeam.intensity * 0.20
        let mut goal_prob: i32 = base_probability_pk * PENALTY_PANENKA_BASELINE_PENALTY.try_into().unwrap() / 100; // -30% baseline penalty
        goal_prob += iq_factor.try_into().unwrap();
        goal_prob -= intensity_penalty.try_into().unwrap();
        
        // 6. Clamp for panenka penalty: 20.0 to 80.0
        if goal_prob < 20 { goal_prob = 20; }
        if goal_prob > 80 { goal_prob = 80; }
        
        // 7. Generate random roll (0-99) and check if goal
        let random_roll = self.generate_random(100, gamematch.event_counter.into());
        let goal_prob_u32: u32 = goal_prob.try_into().unwrap();
        let is_goal = random_roll < goal_prob_u32;
        
        // Update score if goal scored
        if is_goal {
            gamematch.my_team_score += 1;
        }
        gamematch.event_counter += 1;
        let timeline_event = MatchTimelineEvent {
            match_id: gamematch.match_id,
            event_id: gamematch.event_counter,
            action: MatchAction::Penalty,
            minute: gamematch.current_time,
            team: ActionTeam::MyTeam,
            description: if is_goal { 'GOOOAL!' } else { 'Penalty missed!' },
            team_score: gamematch.my_team_score,
            opponent_team_score: gamematch.opponent_team_score,
            team_scored: is_goal,
            opponent_team_scored: false,
            player_participates: false,
            half_time: false,
            match_end: false,
        };
        self.world.write_model(@timeline_event);
        return need_more_actions;
    }






    //OPEN PLAY
    fn process_open_play(mut self: Store, ref gamematch:GameMatch, ref player:Player, match_decision: MatchDecision, opponent_team: Team, my_team: Team) -> bool {
        let mut need_more_actions = true;
        match match_decision {
            MatchDecision::Pass => need_more_actions = self.process_open_play_pass(ref gamematch, ref player, opponent_team, my_team),
            MatchDecision::Dribble => need_more_actions = self.process_open_play_dribble(ref gamematch, ref player, opponent_team, my_team),
            MatchDecision::Shoot => need_more_actions = self.process_open_play_shoot(ref gamematch, ref player, opponent_team, my_team),
            MatchDecision::Simulate => need_more_actions = self.process_open_play_simulate_foul(ref gamematch, ref player, opponent_team, my_team),
            _ => {
            }
        }
        return need_more_actions;
    }
    fn process_open_play_pass(mut self: Store, ref gamematch:GameMatch, ref player:Player, opponent_team: Team, my_team: Team) -> bool {
        // ✅ Implement open_play.md passing algorithm with configurable constants
        // successProb = (player.passing * weight1 + player.intelligence * weight2 + attackingTeam.offense * weight3) / 100
        let mut need_more_actions = true;
        let passing_factor = player.passing * OPEN_PLAY_PASS_PLAYER_PASSING_WEIGHT / 100;
        let intelligence_factor = player.intelligence * OPEN_PLAY_PASS_PLAYER_INTELLIGENCE_WEIGHT / 100;
        let offense_factor = my_team.offense.into() * OPEN_PLAY_PASS_TEAM_OFFENSE_WEIGHT / 100;
        
        let combined_factor = passing_factor + intelligence_factor + offense_factor;
        
        // 🎯 FIX: Apply min/max clamps using constants
        let mut success_prob = combined_factor;
        if success_prob < OPEN_PLAY_PASS_MIN_SUCCESS_PROB {
            success_prob = OPEN_PLAY_PASS_MIN_SUCCESS_PROB;
        }
        if success_prob > OPEN_PLAY_PASS_MAX_SUCCESS_PROB {
            success_prob = OPEN_PLAY_PASS_MAX_SUCCESS_PROB;
        }
        
        // Generate random roll (0-99) and check if pass succeeds
        let random_roll = self.generate_random(100, gamematch.event_counter.into());
        let is_success = random_roll < success_prob;
        need_more_actions = !is_success;
        if(!need_more_actions){
            gamematch.next_match_action=MatchAction::OpenPlay;
        }
        if is_success {
            // 🎯 FIX: Create RESULT event first (player_participates: false)
            gamematch.event_counter += 1;
            let result_event = MatchTimelineEvent {
                match_id: gamematch.match_id,
                event_id: gamematch.event_counter,
                action: MatchAction::OpenPlay,
                minute: gamematch.current_time,
                team: ActionTeam::MyTeam,
                description: 'Pass successful!',
                team_score: gamematch.my_team_score,
                opponent_team_score: gamematch.opponent_team_score,
                team_scored: false,
                opponent_team_scored: false,
                player_participates: false, // 🎯 RESULT - no participation needed
                half_time: false,
                match_end: false,
            };
            self.world.write_model(@result_event);
            
            // 🎯 FIX: Create NEW ACTION event (player_participates: true)
            gamematch.event_counter += 1;
            let action_event = MatchTimelineEvent {
                match_id: gamematch.match_id,
                event_id: gamematch.event_counter,
                action: MatchAction::OpenPlay,
                minute: gamematch.current_time,
                team: ActionTeam::MyTeam,
                description: 'New attack opportunity',
                team_score: gamematch.my_team_score,
                opponent_team_score: gamematch.opponent_team_score,
                team_scored: false,
                opponent_team_scored: false,
                player_participates: true, // 🎯 NEW ACTION - participation required
                half_time: false,
                match_end: false,
            };
            self.world.write_model(@action_event);
        } else {
            // Failed pass - final result, no chaining
            gamematch.event_counter += 1;
            let timeline_event = MatchTimelineEvent {
                match_id: gamematch.match_id,
                event_id: gamematch.event_counter,
                action: MatchAction::OpenPlay,
                minute: gamematch.current_time,
                team: ActionTeam::MyTeam,
                description: 'Pass intercepted! Ball lost!',
                team_score: gamematch.my_team_score,
                opponent_team_score: gamematch.opponent_team_score,
                team_scored: false,
                opponent_team_scored: false,
                player_participates: false, // 🎯 FINAL RESULT - no participation
                half_time: false,
                match_end: false,
            };
            self.world.write_model(@timeline_event);
        }
        return need_more_actions;
    }
    fn process_open_play_dribble(mut self: Store, ref gamematch:GameMatch, ref player:Player, opponent_team: Team, my_team: Team)-> bool {
        // ✅ Implement open_play.md dribbling algorithm with configurable constants
        // successProb = (player.dribble * weight1 + player.intelligence * weight2 + attackingTeam.offense * weight3) / 100
        let mut need_more_actions = true;
        let dribble_factor = player.dribble * OPEN_PLAY_DRIBBLE_PLAYER_DRIBBLE_WEIGHT / 100;
        let intelligence_factor = player.intelligence * OPEN_PLAY_DRIBBLE_PLAYER_INTELLIGENCE_WEIGHT / 100;
        let offense_factor = my_team.offense.into() * OPEN_PLAY_DRIBBLE_TEAM_OFFENSE_WEIGHT / 100;
        
        let combined_factor = dribble_factor + intelligence_factor + offense_factor;
        
        // 🎯 FIX: Apply min/max clamps using constants
        let mut success_prob = combined_factor;
        if success_prob < OPEN_PLAY_DRIBBLE_MIN_SUCCESS_PROB {
            success_prob = OPEN_PLAY_DRIBBLE_MIN_SUCCESS_PROB;
        }
        if success_prob > OPEN_PLAY_DRIBBLE_MAX_SUCCESS_PROB {
            success_prob = OPEN_PLAY_DRIBBLE_MAX_SUCCESS_PROB;
        }
        
        // Generate random roll (0-99) and check if dribble succeeds
        let random_roll = self.generate_random(100, gamematch.event_counter.into());
        let is_success = random_roll < success_prob;
        need_more_actions = !is_success;
        if(!need_more_actions){
            gamematch.next_match_action=MatchAction::OpenPlay;
        }
        if is_success {
            // 🎯 FIX: Create RESULT event first (player_participates: false)
            gamematch.event_counter += 1;
            let result_event = MatchTimelineEvent {
                match_id: gamematch.match_id,
                event_id: gamematch.event_counter,
                action: MatchAction::OpenPlay,
                minute: gamematch.current_time,
                team: ActionTeam::MyTeam,
                description: 'Dribble successful!',
                team_score: gamematch.my_team_score,
                opponent_team_score: gamematch.opponent_team_score,
                team_scored: false,
                opponent_team_scored: false,
                player_participates: false, // 🎯 RESULT - no participation needed
                half_time: false,
                match_end: false,
            };
            self.world.write_model(@result_event);
            
            // 🎯 FIX: Create NEW ACTION event (player_participates: true)
            gamematch.event_counter += 1;
            let action_event = MatchTimelineEvent {
                match_id: gamematch.match_id,
                event_id: gamematch.event_counter,
                action: MatchAction::OpenPlay,
                minute: gamematch.current_time,
                team: ActionTeam::MyTeam,
                description: 'Advanced with the ball',
                team_score: gamematch.my_team_score,
                opponent_team_score: gamematch.opponent_team_score,
                team_scored: false,
                opponent_team_scored: false,
                player_participates: true, // 🎯 NEW ACTION - participation required
                half_time: false,
                match_end: false,
            };
            self.world.write_model(@action_event);
        } else {
            // Failed dribble - final result, no chaining
            gamematch.event_counter += 1;
            let timeline_event = MatchTimelineEvent {
                match_id: gamematch.match_id,
                event_id: gamematch.event_counter,
                action: MatchAction::OpenPlay,
                minute: gamematch.current_time,
                team: ActionTeam::MyTeam,
                description: 'Dribble failed! Ball lost!',
                team_score: gamematch.my_team_score,
                opponent_team_score: gamematch.opponent_team_score,
                team_scored: false,
                opponent_team_scored: false,
                player_participates: false, // 🎯 FINAL RESULT - no participation
                half_time: false,
                match_end: false,
            };
            self.world.write_model(@timeline_event);
        }
        return need_more_actions;
    }
    fn process_open_play_shoot(mut self: Store, ref gamematch:GameMatch, ref player:Player, opponent_team: Team, my_team: Team) -> bool {
        // ✅ Implement open_play.md shooting algorithm with FIXED calculation
        let mut need_more_actions = true;
        
        // 🎯 FIX: Use constant and correct formula without problematic division
        // Calculate goalProb = baseProbability * (player.shoot * 0.7 + player.intelligence * 0.1 + attackingTeam.offense * 0.2) / 100
        let shoot_factor = player.shoot * 70 / 100; // 0.7 * player.shoot
        let intelligence_factor = player.intelligence * 10 / 100; // 0.1 * player.intelligence  
        let offense_factor = my_team.offense.into() * 20 / 100; // 0.2 * team.offense (convert u8 to u32)
        
        let combined_factor = shoot_factor + intelligence_factor + offense_factor;
        // 🎯 FIX: Use base probability from constant and correct scaling
        let mut goal_prob = OPEN_PLAY_SHOOT_BASE_PROBABILITY * combined_factor / 100; // 500 * factor / 100 gives proper percentage
        
        // Clamp goalProb using constants
        if goal_prob < OPEN_PLAY_SHOOT_MIN_GOAL_PROB {
            goal_prob = OPEN_PLAY_SHOOT_MIN_GOAL_PROB;
        }
        if goal_prob > OPEN_PLAY_SHOOT_MAX_GOAL_PROB {
            goal_prob = OPEN_PLAY_SHOOT_MAX_GOAL_PROB;
        }
        
        // Generate random roll (0-9999 for precision) and check if goal
        let random_roll = self.generate_random(10000, gamematch.event_counter.into());
        let is_goal = random_roll < goal_prob;
        
        // Update score if goal scored
        if is_goal {
            gamematch.my_team_score += 1;
        }
        gamematch.event_counter += 1;
        let timeline_event = MatchTimelineEvent {
            match_id: gamematch.match_id,
            event_id: gamematch.event_counter,
            action: MatchAction::OpenPlay,
            minute: gamematch.current_time,
            team: ActionTeam::MyTeam,
            description: if is_goal { 'GOOOAL!' } else { 'Shot missed!' },
            team_score: gamematch.my_team_score,
            opponent_team_score: gamematch.opponent_team_score,
            team_scored: is_goal,
            opponent_team_scored: false,
            player_participates: false,
            half_time: false,
            match_end: false,
        };
        self.world.write_model(@timeline_event);
        return need_more_actions;
    }
    fn process_open_play_simulate_foul(mut self: Store, ref gamematch:GameMatch, ref player:Player, opponent_team: Team, my_team: Team) -> bool {
        // ✅ Implement open_play.md simulate (dive) algorithm with configurable constants
        // successProb = (player.intelligence * weight1 + player.dribble * weight2 + attackingTeam.intensity * weight3) / 100
        let mut need_more_actions = true;
        let intelligence_factor = player.intelligence * OPEN_PLAY_SIMULATE_PLAYER_INTELLIGENCE_WEIGHT / 100;
        let dribble_factor = player.dribble * OPEN_PLAY_SIMULATE_PLAYER_DRIBBLE_WEIGHT / 100;
        let intensity_factor = my_team.intensity.into() * OPEN_PLAY_SIMULATE_TEAM_INTENSITY_WEIGHT / 100;
        
        let combined_factor = intelligence_factor + dribble_factor + intensity_factor;
        
        // 🎯 FIX: Apply min/max clamps using constants
        let mut success_prob = combined_factor;
        if success_prob < OPEN_PLAY_SIMULATE_MIN_SUCCESS_PROB {
            success_prob = OPEN_PLAY_SIMULATE_MIN_SUCCESS_PROB;
        }
        if success_prob > OPEN_PLAY_SIMULATE_MAX_SUCCESS_PROB {
            success_prob = OPEN_PLAY_SIMULATE_MAX_SUCCESS_PROB;
        }
        
        // Generate random roll (0-99) and check if simulate succeeds
        let random_roll = self.generate_random(100, gamematch.event_counter.into());
        let is_success = random_roll < success_prob;
        
        if is_success {
            // 🎯 FIX: Set need_more_actions = false when chaining to another action
            need_more_actions = false;
            // On success: chance of Penalty from constant, otherwise free kick
            let penalty_roll = self.generate_random(100, (gamematch.event_counter + 1).into());
            let gets_penalty = penalty_roll < SIMULATE_FOUL_PENALTY_CHANCE; // Chance from constant
            let new_action = if gets_penalty { MatchAction::Penalty } else { MatchAction::FreeKick };
            gamematch.next_match_action = new_action;

            // 🎯 FIX: Create RESULT event first (player_participates: false)
            gamematch.event_counter += 1;
            let result_event = MatchTimelineEvent {
                match_id: gamematch.match_id,
                event_id: gamematch.event_counter,
                action: MatchAction::OpenPlay, // This is still the open play result
                minute: gamematch.current_time,
                team: ActionTeam::MyTeam,
                description: if gets_penalty { 'Penalty awarded!' } else { 'Free kick awarded!' },
                team_score: gamematch.my_team_score,
                opponent_team_score: gamematch.opponent_team_score,
                team_scored: false,
                opponent_team_scored: false,
                player_participates: false, // 🎯 RESULT - no participation needed
                half_time: false,
                match_end: false,
            };
            self.world.write_model(@result_event);
            
            // 🎯 FIX: Create NEW ACTION event (player_participates: true)
            gamematch.event_counter += 1;
            let action_event = MatchTimelineEvent {
                match_id: gamematch.match_id,
                event_id: gamematch.event_counter,
                action: new_action, // Penalty or FreeKick
                minute: gamematch.current_time,
                team: ActionTeam::MyTeam,
                description: if gets_penalty { 'Penalty situation' } else { 'Free kick situation' },
                team_score: gamematch.my_team_score,
                opponent_team_score: gamematch.opponent_team_score,
                team_scored: false,
                opponent_team_scored: false,
                player_participates: true, // 🎯 NEW ACTION - participation required
                half_time: false,
                match_end: false,
            };
            self.world.write_model(@action_event);
        } else {
            // On failure: yellow card + ball lost
            gamematch.event_counter += 1;
            let timeline_event = MatchTimelineEvent {
                match_id: gamematch.match_id,
                event_id: gamematch.event_counter,
                action: MatchAction::OpenPlay,
                minute: gamematch.current_time,
                team: ActionTeam::MyTeam,
                description: 'Yellow card! Ball lost!',
                team_score: gamematch.my_team_score,
                opponent_team_score: gamematch.opponent_team_score,
                team_scored: false,
                opponent_team_scored: false,
                player_participates: false,
                half_time: false,
                match_end: false,
            };
            self.world.write_model(@timeline_event);
        }
        return need_more_actions;
    }
    




    //MATCH ACTIONS
    fn process_match_action(mut self: Store, match_id: u32, match_decision: MatchDecision) {
        // ✅ STEP 1: Process player's decision and simulate the outcome
        let mut gamematch = self.read_gamematch(match_id);
        let mut player = self.read_player();
        let need_more_actions = self.process_match_decision(ref gamematch, ref player, match_decision);

        // ✅ STEP 2: IMPORTANT FIX - Only generate events until input required if the action didn't chain to another action
        // This prevents generic "Your team attacks!" events from overriding specific action results
        if need_more_actions {
            self.generate_events_until_input_required(ref gamematch);
        }
        
        // ✅ STEP 3: Save the updated match state
        self.world.write_model(@gamematch);
    }

    fn finish_gamematch(mut self: Store, match_id: u32) {
        let mut gamematch = self.read_gamematch(match_id);
        gamematch.finish_match();
        
        // 🎯 FIX: Award team points based on match result
        // 3 points for win, 1 point for tie, 0 points for loss
        let points_to_award = if gamematch.my_team_score > gamematch.opponent_team_score {
            3  // Win
        } else if gamematch.my_team_score == gamematch.opponent_team_score {
            1  // Tie  
        } else {
            0  // Loss
        };
        
        // Award the points to my team
        if points_to_award > 0 {
            self.add_team_points(gamematch.my_team_id, points_to_award);
        }
        
        self.world.write_model(@gamematch);
    }

    fn simulate_gamematch(mut self: Store, match_id: u32) {
        let mut gamematch = self.read_gamematch(match_id);
        
        // Simulate the match (my team always wins)
        gamematch.simulate_match();
        self.world.write_model(@gamematch);
        
        // Add +3 points to my team for the win
        self.add_team_points(gamematch.my_team_id, 3);
    }

    fn add_my_team_goal(mut self: Store, match_id: u32) {
        let mut gamematch = self.read_gamematch(match_id);
        gamematch.add_my_team_goal();
        self.world.write_model(@gamematch);
    }

    fn add_opponent_team_goal(mut self: Store, match_id: u32) {
        let mut gamematch = self.read_gamematch(match_id);
        gamematch.add_opponent_team_goal();
        self.world.write_model(@gamematch);
    }

    // --------- Core Match Logic Functions ---------
    
    fn generate_events_until_input_required(mut self: Store, ref gamematch: GameMatch) {
    
        let my_team = self.read_team(gamematch.my_team_id);
        let opponent_team = self.read_team(gamematch.opponent_team_id);
        let player = self.read_player();
        
        // ✅ FIX: Store the STARTING time for frontend timer reference
        // This is where the timer should start from (where we left off)
        let starting_time = gamematch.current_time;
        let mut can_be_substituted = player.stamina > 0;
        let mut random_counter = 0;

        loop {
            // ✅ STEP 1: Increase timer FIRST
            gamematch.current_time += 1;
            random_counter += 1;

            // ✅ STEP 2: Check if match is finished or timer == 90 - set next action and break
            if gamematch.current_time >= 90 {
                gamematch.match_status = MatchStatus::Finished;
                gamematch.event_counter += 1;
                let timeline_event = MatchTimelineEvent {
                    match_id: gamematch.match_id,
                    event_id: gamematch.event_counter,
                    action: MatchAction::MatchEnd,
                    minute: 90,
                    team: ActionTeam::Neutral,
                    description: 'Match Finished!',
                    team_score: gamematch.my_team_score,
                    opponent_team_score: gamematch.opponent_team_score,
                    team_scored: false,
                    opponent_team_scored: false,
                    player_participates: false,
                    half_time: false,
                    match_end: true,
                };
                self.world.write_model(@timeline_event);
                gamematch.next_match_action=MatchAction::MatchEnd;
                //gamematch.set_next_action(MatchAction::MatchEnd, 90, ActionTeam::Neutral, PlayerParticipation::Observing);
                break;
            }

            // ✅ STEP 3: Check if halftime or timer == 45 - set next action and break
            if  gamematch.current_time == 45 && gamematch.match_status == MatchStatus::InProgress {
                gamematch.match_status = MatchStatus::HalfTime;
                gamematch.next_match_action=MatchAction::HalfTime;
                //gamematch.set_next_action(MatchAction::HalfTime, 45, ActionTeam::Neutral, PlayerParticipation::Observing);
                gamematch.event_counter += 1;
                let timeline_event = MatchTimelineEvent {
                    match_id: gamematch.match_id,
                    event_id: gamematch.event_counter,
                    action: MatchAction::HalfTime,
                    minute: 45,
                    team: ActionTeam::Neutral,
                    description: 'Half Time!',
                    team_score: gamematch.my_team_score,
                    opponent_team_score: gamematch.opponent_team_score,
                    team_scored: false,
                    opponent_team_scored: false,
                    player_participates: false,
                    half_time: true,
                    match_end: false,
                };
                self.world.write_model(@timeline_event);
                break;
            }

            //step 3.1 back from halftime
            if gamematch.current_time == 46 && gamematch.match_status == MatchStatus::HalfTime {
                gamematch.match_status = MatchStatus::InProgress;
                gamematch.event_counter += 1;
                let timeline_event = MatchTimelineEvent {
                    match_id: gamematch.match_id,
                    event_id: gamematch.event_counter,
                    action: MatchAction::ResumeMatch,
                    minute: 46,
                    team: ActionTeam::Neutral,
                    description: 'Half time over! Match resumed!',
                    team_score: gamematch.my_team_score,
                    opponent_team_score: gamematch.opponent_team_score,
                    team_scored: false,
                    opponent_team_scored: false,
                    player_participates: false,
                    half_time: false,
                    match_end: false,
                };
                self.world.write_model(@timeline_event);
                continue;
            }

            // ✅ STEP 4: Check if player.stamina == 0 - set next match action and break
            if player.stamina <= 0 && can_be_substituted{
                can_be_substituted = false;
                gamematch.event_counter += 1;
                let timeline_event = MatchTimelineEvent {
                    match_id: gamematch.match_id,
                    event_id: gamematch.event_counter,
                    action: MatchAction::Substitute,
                    minute: gamematch.current_time,
                    team: ActionTeam::MyTeam,
                    description: 'You were substituted!',
                    team_score: gamematch.my_team_score,
                    opponent_team_score: gamematch.opponent_team_score,
                    team_scored: false,
                    opponent_team_scored: false,
                    player_participates: false,
                    half_time: false,
                    match_end: false,
                };
                self.world.write_model(@timeline_event);
                continue;
            }

            // ✅ STEP 5: Check for MY TEAM attack event FIRST
            let my_attack_result = self.check_my_team_attack_event(gamematch.current_time, my_team, opponent_team, player, gamematch.match_id, random_counter);
            if my_attack_result.has_event {
                // ✅ STEP 5.1: If I participate, break
                if my_attack_result.player_participates {
                    gamematch.next_match_action=my_attack_result.action_type;
                    //gamematch.set_next_action(my_attack_result.action_type, gamematch.current_time, ActionTeam::MyTeam, PlayerParticipation::Participating);
                    gamematch.event_counter += 1;
                    let timeline_event = MatchTimelineEvent {
                        match_id: gamematch.match_id,
                        event_id: gamematch.event_counter,
                        action: my_attack_result.action_type,
                        minute: gamematch.current_time,
                        team: ActionTeam::MyTeam,
                        description: 'Your team attacks!',
                        team_score: gamematch.my_team_score,
                        opponent_team_score: gamematch.opponent_team_score,
                        team_scored: false,
                        opponent_team_scored: false,
                        player_participates: true,
                        half_time: false,
                        match_end: false,
                    };
                    self.world.write_model(@timeline_event);
                    break; // Exit loop, wait for user input
                } else {
                    // ✅ STEP 5.2: If I don't participate, add timeline event
                    gamematch.event_counter += 1;
                    let _goal_scored = self.simulate_ai_attack_outcome(gamematch.match_id, my_team, my_attack_result.action_type, true, gamematch.current_time, random_counter);
                    if(_goal_scored){
                        gamematch.my_team_score += 1;
                    }
                    let timeline_event = MatchTimelineEvent {
                        match_id: gamematch.match_id,
                        event_id: gamematch.event_counter,
                        action: my_attack_result.action_type,
                        minute: gamematch.current_time,
                        team: ActionTeam::MyTeam,
                        description: 'Your team attacks!',
                        team_score: gamematch.my_team_score,
                        opponent_team_score: gamematch.opponent_team_score,
                        team_scored: _goal_scored,
                        opponent_team_scored: false,
                        player_participates: false,
                        half_time: false,
                        match_end: false,
                    };
                    self.world.write_model(@timeline_event);
                    continue; // Continue to next minute
                }
            }
            else {
                // ✅ STEP 6: If no my team event, check for OPPONENT TEAM attack event
                let opponent_attack_result = self.check_opponent_team_attack_event(gamematch.current_time, my_team, opponent_team, player, gamematch.match_id, random_counter);
                if opponent_attack_result.has_event {
                    // ✅ STEP 6.1: If I participate, break
                    if opponent_attack_result.player_participates {
                        gamematch.next_match_action=opponent_attack_result.action_type;
                       // gamematch.set_next_action(opponent_attack_result.action_type, gamematch.current_time, ActionTeam::OpponentTeam, PlayerParticipation::Participating);
                       gamematch.event_counter += 1;
                       let timeline_event = MatchTimelineEvent {
                           match_id: gamematch.match_id,
                           event_id: gamematch.event_counter,
                           action: opponent_attack_result.action_type,
                           minute: gamematch.current_time,
                           team: ActionTeam::OpponentTeam,
                           description: 'Opponent team attacks!',
                           team_score: gamematch.my_team_score,
                           opponent_team_score: gamematch.opponent_team_score,
                           team_scored: false,
                           opponent_team_scored: false,
                           player_participates: true,
                           half_time: false,
                           match_end: false,
                       };
                       self.world.write_model(@timeline_event);
                        break; // Exit loop, wait for user input
                    } else {
                        // ✅ STEP 6.2: If I don't participate, add timeline event
                        gamematch.event_counter += 1;
                        let _goal_scored = self.simulate_ai_attack_outcome(gamematch.match_id, opponent_team, opponent_attack_result.action_type, false, gamematch.current_time, random_counter);
                        if(_goal_scored){
                            gamematch.opponent_team_score += 1;
                        }
                        let timeline_event = MatchTimelineEvent {
                            match_id: gamematch.match_id,
                            event_id: gamematch.event_counter,
                            action: opponent_attack_result.action_type,
                            minute: gamematch.current_time,
                            team: ActionTeam::OpponentTeam,
                            description: 'Opponent attacks!',
                            team_score: gamematch.my_team_score,
                            opponent_team_score: gamematch.opponent_team_score,
                            team_scored: false,
                            opponent_team_scored: _goal_scored,
                            player_participates: false,
                            half_time: false,
                            match_end: false,
                        };
                        self.world.write_model(@timeline_event);
                        continue; // Continue to next minute
                    }
                }
                else{
                    let random_event = self.check_random_event(gamematch.current_time, my_team, opponent_team, player, gamematch.match_id, random_counter);
                    if random_event.has_event {
                        gamematch.next_match_action=random_event.action_type;
                        //gamematch.set_next_action(random_event.action_type, gamematch.current_time, ActionTeam::Neutral, PlayerParticipation::Participating);
                        gamematch.event_counter += 1;
                        let timeline_event = MatchTimelineEvent {
                            match_id: gamematch.match_id,
                            event_id: gamematch.event_counter,
                            action: random_event.action_type,
                            minute: gamematch.current_time,
                            team: ActionTeam::Neutral,
                            description: 'Random event!',
                            team_score: gamematch.my_team_score,
                            opponent_team_score: gamematch.opponent_team_score,
                            team_scored: false,
                            opponent_team_scored: false,
                            player_participates: true,
                            half_time: false,
                            match_end: false,
                        };
                        self.world.write_model(@timeline_event);
                        break;
                    }
                    else{
                        continue;
                    }
                }
            }
            
            
            // No events this minute, continue to next minute
        };

        // ✅ SENSEI MCP CRITICAL FIX: Set prev_time to the STARTING time, not the ending time
        // This tells the frontend where to start the timer from (where we left off)
        gamematch.prev_time = starting_time;
        // ✅ SENSEI MCP: Write model ONLY ONCE at the end to ensure state persistence
        self.world.write_model(@gamematch);
    }

    fn check_my_team_attack_event(
        self: Store,
        current_time: u8,
        my_team: Team,
        opponent_team: Team,
        player: Player,
        match_id: u32,
        mut random_counter: u32
    ) -> AttackEventResult {
        // 1. Calculate attack event probability using constant
        let base_probability = MY_TEAM_ATTACK_BASE_PROBABILITY; // Base chance from constant
        let normalized_my_offense = self.normalize_team_stat(my_team.offense.into(), false); // returns value 80 to 100
        let normalized_my_intensity = self.normalize_team_stat(my_team.intensity.into(), false);
        
        let attack_probability = base_probability * normalized_my_offense * normalized_my_intensity / 10000;
        
        // 2. Random check for event occurrence
        let random_value = self.generate_random(100, random_counter.into()); // 0-99
        random_counter += 1;
        if random_value >= attack_probability {
            return AttackEventResult { 
                has_event: false, 
                event_minute: current_time, 
                action_type: MatchAction::OpenPlay, 
                player_participates: false 
            };
        }
        
        // 3. Determine action type
        let action_type = self.determine_attack_action_type(my_team, player, match_id, current_time, random_counter);
        
        // 4. Check player participation
        let player_participates = self.check_player_attack_participation(player, current_time, random_counter);
        
        AttackEventResult {
            has_event: true,
            event_minute: current_time,
            action_type: action_type,
            player_participates: player_participates,
        }
    }

    fn check_opponent_team_attack_event(
        self: Store,
        current_time: u8,
        my_team: Team,
        opponent_team: Team,
        player: Player,
        match_id: u32, 
        mut random_counter: u32
    ) -> AttackEventResult {
        // Opponent attack adjusted by my team's defense
        let base_probability = OPPONENT_TEAM_ATTACK_BASE_PROBABILITY; // Base chance from constant
        let normalized_my_defense = self.normalize_team_stat(my_team.defense.into(), true); // defense range 0.8-1.2
        let normalized_my_intensity = self.normalize_team_stat(my_team.intensity.into(), true);
        let normalized_opp_offense = self.normalize_team_stat(opponent_team.offense.into(), false);
        let normalized_opp_intensity = self.normalize_team_stat(opponent_team.intensity.into(), false);
        
        let attack_probability = base_probability * normalized_my_defense * normalized_my_intensity 
                               * normalized_opp_offense * normalized_opp_intensity / 100000000;
        
        let random_value = self.generate_random(100, random_counter.into());
        random_counter += 1;
        if random_value >= attack_probability {
            return AttackEventResult { 
                has_event: false, 
                event_minute: current_time, 
                action_type: MatchAction::OpenPlay, 
                player_participates: false 
            };
        }
        
        // Determine action type using opponent team stats
        let action_type = self.determine_attack_action_type(opponent_team, player, match_id, current_time, random_counter);
        let mut player_participates = false;
        if (action_type == MatchAction::OpenPlay) {
            player_participates = self.check_player_defense_participation(player, current_time, random_counter);
        }
         
        
        AttackEventResult {
            has_event: true,
            event_minute: current_time,
            action_type: action_type,
            player_participates: player_participates,
        }
    }

    fn check_random_event(
        self: Store,
        current_time: u8,
        my_team: Team,
        opponent_team: Team,
        player: Player,
        match_id: u32,
        mut random_counter: u32
    ) -> AttackEventResult {
        // Random event probability
        let base_probability = RANDOM_EVENT_BASE_PROBABILITY; // Base chance from constant
        
        
        let random_value = self.generate_random(100, random_counter.into());
        random_counter += 1;
        if random_value > base_probability {
            return AttackEventResult { 
                has_event: false, 
                event_minute: current_time, 
                action_type: MatchAction::OpenPlay, 
                player_participates: false 
            };
        }
        
        // Determine action type using opponent team stats
        let action_type = self.determine_random_action_type(opponent_team, player, match_id, current_time, random_counter);
        let player_participates = true;
      
        
        AttackEventResult {
            has_event: true,
            event_minute: current_time,
            action_type: action_type,
            player_participates: player_participates,
        }
    }

    fn determine_attack_action_type(self: Store, team: Team, player: Player, match_id: u32, current_time: u8, mut random_counter: u32) -> MatchAction {
        let normalized_offense = self.normalize_team_stat(team.offense.into(), false);
        
        // ✅ FIX: Use team-appropriate skill stats
        // For MyTeam: use player's skills
        // For OpponentTeam: use team's skills (converted to equivalent values)
        let gamematch = self.read_gamematch(match_id);
        let skill_factor = if team.team_id == gamematch.my_team_id {
            // This is my team - use player dribble
            self.normalize_player_stat(player.dribble)
        } else {
            // This is opponent team - use team offense as skill factor
            self.normalize_team_stat(team.offense.into(), false)
        };
        
        // 1. Check for penalty using constant
        let penalty_probability = PENALTY_ACTION_BASE_PROBABILITY * normalized_offense * skill_factor / 10000;

        random_counter += 1;
        if self.generate_random(100, random_counter.into()) < penalty_probability {
            return MatchAction::Penalty;
        }
        
        // 2. Check for free kick using constant
        let freekick_probability = FREE_KICK_ACTION_BASE_PROBABILITY * skill_factor / 100;
        random_counter += 1;
        if self.generate_random(100, random_counter.into()) < freekick_probability {
            return MatchAction::FreeKick;
        }
        
        // 5. Default to open play
        return MatchAction::OpenPlay;
    }


    fn determine_random_action_type(self: Store, team: Team, player: Player, match_id: u32, current_time: u8, mut random_counter: u32) -> MatchAction {
        //we already know there is a random action type. we need to check if it is a brawl or a jumper
        // 3. Check for brawl using constant
        let normalized_intensity = self.normalize_team_stat(team.intensity.into(), false);
        let brawl_probability = BRAWL_ACTION_BASE_PROBABILITY * normalized_intensity / 100;
        random_counter += 1;
        if self.generate_random(100, random_counter.into()) < brawl_probability {
            return MatchAction::Brawl;
        }
        return MatchAction::Jumper;

    }

    fn check_player_attack_participation(self: Store, player: Player, current_time: u8, mut random_counter: u32) -> bool {
        // Can't participate if injured or no stamina
      //  if player.is_injured || player.stamina <= 0 {
      //      return false;
      //  }
        
        let normalized_stamina = self.normalize_player_stat(player.stamina);
        let normalized_intelligence = self.normalize_player_stat(player.intelligence);
        let normalized_relationship = self.normalize_player_stat(player.team_relationship);
        
        let participation_probability = ATTACK_PARTICIPATION_BASE_PROBABILITY * normalized_stamina * normalized_intelligence * normalized_relationship / 1000000;
        random_counter += 1;
       return self.generate_random(100, random_counter.into()) < participation_probability;
    }

    fn check_player_defense_participation(self: Store, player: Player, current_time: u8, mut random_counter: u32) -> bool {
        if player.is_injured || player.stamina <= 0 {
            return false;
        }
        
        let normalized_stamina = self.normalize_player_stat(player.stamina);
        let normalized_intelligence = self.normalize_player_stat(player.intelligence);
        
        let participation_probability = DEFENSE_PARTICIPATION_BASE_PROBABILITY * normalized_stamina * normalized_intelligence / 10000;
        random_counter += 1;
        self.generate_random(100, random_counter.into()) < participation_probability
    }

    fn simulate_ai_attack_outcome(
        mut self: Store,
        match_id: u32,
        attacking_team: Team,
        action_type: MatchAction,
        is_my_team: bool,
        current_time: u8,
        mut random_counter: u32
    ) -> bool {
        let normalized_attack = self.normalize_team_stat(attacking_team.offense.into(), true); // 0.8-1.2 range
        
        // 🎯 FIX: Use constants and actually calculate probabilities
        let goal_probability = match action_type {
            MatchAction::Penalty => AI_PENALTY_SUCCESS_RATE * normalized_attack / 100,      // 80% base * team factor
            MatchAction::FreeKick => AI_FREE_KICK_SUCCESS_RATE * normalized_attack / 100,   // 10% base * team factor
            MatchAction::OpenPlay => AI_OPEN_PLAY_SUCCESS_RATE * normalized_attack / 100,   // 1% base * team factor
            _ => AI_OPEN_PLAY_SUCCESS_RATE * normalized_attack / 100,                       // Default 1% * team factor
        };
        random_counter += 1;
        // 🎯 FIX: Actually use the calculated probability instead of always returning true
        return self.generate_random(100, random_counter.into()) < goal_probability;
    }

    // --------- Utility Functions ---------
    
    fn normalize_team_stat(self: Store, value: u32, is_defense: bool) -> u32 {
        if is_defense {
            // Defense range: 0.8 to 1.2
            80 + (value * 40 / 100)
        } else {
            // Attack range: 0.7 to 1.3
            70 + (value * 60 / 100)
        }
    }

    fn normalize_player_stat(self: Store, value: u32) -> u32 {
        // Player range: 0.7 to 1.3
        70 + (value * 60 / 100)
    }

    fn generate_random(self: Store, max: u32, seed: felt252) -> u32 {
        // Implementation using block timestamp and seed for entropy
        let timestamp = get_block_timestamp();
        let combined_seed = timestamp.into() + seed;
        let random_felt = poseidon_hash_span(array![combined_seed].span());
        let random_u256: u256 = random_felt.into();
        let result = random_u256 % max.into();
        result.try_into().unwrap()
    }
}