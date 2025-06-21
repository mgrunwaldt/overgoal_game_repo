// Starknet imports
use starknet::{get_caller_address, get_block_timestamp};

// Dojo imports
use dojo::world::WorldStorage;
use dojo::model::ModelStorage;

// Models imports
use full_starter_react::models::player::{Player, PlayerTrait};
use full_starter_react::models::team::{Team, TeamTrait};
use full_starter_react::models::gamematch::{GameMatch, GameMatchTrait, MatchDecision, MatchAction};

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
        gamematch.simulate_match();
        self.world.write_model(@gamematch);
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