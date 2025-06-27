// Starknet imports
use starknet::{get_caller_address, get_block_timestamp, ContractAddress};
use core::num::traits::zero::Zero;

// Dojo imports
use dojo::world::WorldStorage;
use dojo::model::ModelStorage;

// Models imports
use full_starter_react::models::player::{Player, PlayerTrait};
use full_starter_react::models::team::{Team, TeamTrait};
use full_starter_react::models::gamematch::{GameMatch, GameMatchTrait, MatchDecision, MatchAction};
use full_starter_react::models::non_match_event::{
    NonMatchEvent, 
    NonMatchEventOutcome,
    PlayerEventHistory
};

// Helpers import
use full_starter_react::helpers::timestamp::Timestamp;

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

    fn read_player_event_history(self: Store, player: ContractAddress, event_id: u32) -> PlayerEventHistory {
        self.world.read_model((player, event_id))
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

    // // --------- Non-Match Event management functions ---------
    // fn create_non_match_event(mut self: Store, event_id: u32, name: felt252, description: felt252) {
    //     let new_event = NonMatchEventTrait::new(event_id, name, description, true);
    //     self.world.write_model(@new_event);
    // }

    // fn create_non_match_event_outcome(
    //     mut self: Store, 
    //     event_id: u32, 
    //     outcome_id: u32, 
    //     outcome_type: u32,
    //     name: felt252,
    //     description: felt252,
    //     coins_delta: i32,
    //     shoot_delta: i32,
    //     dribble_delta: i32,
    //     energy_delta: i32,
    //     stamina_delta: i32,
    //     charisma_delta: i32,
    //     fame_delta: i32,
    //     passing_delta: i32,
    //     free_kick_delta: i32,
    //     team_relationship_delta: i32,
    //     intelligence_delta: i32,
    //     sets_injured: bool,
    // ) {
    //     let new_outcome = NonMatchEventOutcomeTrait::new(
    //         event_id,
    //         outcome_id,
    //         outcome_type,
    //         name,
    //         description,
    //         coins_delta,
    //         shoot_delta,
    //         dribble_delta,
    //         energy_delta,
    //         stamina_delta,
    //         charisma_delta,
    //         fame_delta,
    //         passing_delta,
    //         free_kick_delta,
    //         team_relationship_delta,
    //         intelligence_delta,
    //         sets_injured,
    //     );
    //     self.world.write_model(@new_outcome);
    // }

    fn trigger_non_match_event(mut self: Store, event_id: u32, outcome_id: u32) {
        let caller = get_caller_address();
        let current_timestamp = get_block_timestamp();
        let current_day = Timestamp::unix_timestamp_to_day(current_timestamp);
        
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

    // --------- GameMatch management functions ---------
    fn create_gamematch(mut self: Store, match_id: u32, my_team_id: u32, opponent_team_id: u32) {
        // Create new GameMatch with initial state
        let new_gamematch = GameMatchTrait::new(match_id, my_team_id, opponent_team_id);
        self.world.write_model(@new_gamematch);
    }

    fn start_gamematch(mut self: Store, match_id: u32) -> (MatchAction, u8) {
        let mut gamematch = self.read_gamematch(match_id);
        let result = gamematch.start_match();
        self.world.write_model(@gamematch);
        result
    }

    fn process_match_action(mut self: Store, match_id: u32, match_decision: MatchDecision) -> (MatchAction, u8) {
        let mut gamematch = self.read_gamematch(match_id);
        let result = gamematch.process_match_action(match_decision);
        self.world.write_model(@gamematch);
        result
    }

    fn finish_gamematch(mut self: Store, match_id: u32) {
        let mut gamematch = self.read_gamematch(match_id);
        gamematch.finish_match();
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
}