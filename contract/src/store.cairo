// Starknet imports
use starknet::{get_caller_address, get_block_timestamp};


// Dojo imports
use dojo::world::WorldStorage;
use dojo::model::ModelStorage;

// Models imports
use full_starter_react::models::player::{Player, PlayerTrait, PlayerEventHistory, PlayerEventHistoryTrait};
use full_starter_react::models::team::{Team, TeamTrait, TeamImpl};
use full_starter_react::models::gamematch::{
    GameMatch, GameMatchTrait, GameMatchImpl, MatchAction, MatchDecision, MatchStatus, PlayerParticipation, ActionTeam,
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

    fn process_match_action(mut self: Store, match_id: u32, match_decision: MatchDecision) {
        // ✅ STEP 1: Process player's decision and simulate the outcome
        // TODO: Process player's decision here (e.g., if they chose to shoot, calculate outcome)
        // For now, we just simulate a basic outcome
        let mut gamematch = self.read_gamematch(match_id);
        // ✅ STEP 2: Decrement stamina for participation
        let mut player = self.read_player();
        //player.remove_stamina(5); // Example stamina cost
        self.world.write_model(@player);

        //mati: falta chequear si termino el partido

        // ✅ STEP 3: Generate all events until the next time user input is needed
        // This function will update the match state internally (current_time, next_action, etc.)
        self.generate_events_until_input_required(ref gamematch);
        
        // ✅ STEP 4: IMPORTANT - Save the updated match state AFTER generation
        // The generate_events_until_input_required function has already updated:
        // - current_time (progressed through minutes)
        // - next_match_action (set to the action that needs user input)
        // - next_match_action_minute (set to when user input is needed)
        // - match_status (potentially changed to HalfTime/Finished)
        // - player_participation (set based on the next action)
        // - action_team (set based on the next action)
        // - event_counter (incremented for each timeline event created)
        
        // We need to read the updated match and save it to persist all these changes
        
        self.world.write_model(@gamematch);
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
                gamematch.set_next_action(MatchAction::MatchEnd, 90, ActionTeam::Neutral, PlayerParticipation::Observing);
                break;
            }

            // ✅ STEP 3: Check if halftime or timer == 45 - set next action and break
            if  gamematch.current_time == 45 && gamematch.match_status == MatchStatus::InProgress {
                gamematch.match_status = MatchStatus::HalfTime;
                gamematch.set_next_action(MatchAction::HalfTime, 45, ActionTeam::Neutral, PlayerParticipation::Observing);
                break;
            }

            //step 3.1 back from halftime
            if gamematch.current_time == 46 && gamematch.match_status == MatchStatus::HalfTime {
                gamematch.match_status = MatchStatus::InProgress;
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
                };
                self.world.write_model(@timeline_event);
                continue;
            }

            // ✅ STEP 5: Check for MY TEAM attack event FIRST
            let my_attack_result = self.check_my_team_attack_event(gamematch.current_time, my_team, opponent_team, player, gamematch.match_id, random_counter);
            if my_attack_result.has_event {
                // ✅ STEP 5.1: If I participate, break
                if my_attack_result.player_participates {
                    gamematch.set_next_action(my_attack_result.action_type, gamematch.current_time, ActionTeam::MyTeam, PlayerParticipation::Participating);
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
                        gamematch.set_next_action(opponent_attack_result.action_type, gamematch.current_time, ActionTeam::OpponentTeam, PlayerParticipation::Participating);
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
                        };
                        self.world.write_model(@timeline_event);
                        continue; // Continue to next minute
                    }
                }
                else{
                    let random_event = self.check_random_event(gamematch.current_time, my_team, opponent_team, player, gamematch.match_id, random_counter);
                    if random_event.has_event {
                        gamematch.set_next_action(random_event.action_type, gamematch.current_time, ActionTeam::Neutral, PlayerParticipation::Participating);
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
        // 1. Calculate attack event probability
        let base_probability = 7; // 7/90 base chance
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
        let base_probability = 7; // 7/90 base chance
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
        // Opponent attack adjusted by my team's defense
        let base_probability = 1; // 0.1/90 base chance
        
        
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
        
        // 1. Check for penalty (4% base * team_offense * skill_factor)
        let penalty_probability = 4 * normalized_offense * skill_factor / 10000;

        random_counter += 1;
        if self.generate_random(100, random_counter.into()) < penalty_probability {
            return MatchAction::Penalty;
        }
        
        // 2. Check for free kick (18% base * skill_factor)
        let freekick_probability = 18 * skill_factor / 100;
        random_counter += 1;
        if self.generate_random(100, random_counter.into()) < freekick_probability {
            return MatchAction::FreeKick;
        }
        
        // 5. Default to open play
        return MatchAction::OpenPlay;
    }


    fn determine_random_action_type(self: Store, team: Team, player: Player, match_id: u32, current_time: u8, mut random_counter: u32) -> MatchAction {
        //we already know there is a random action type. we need to check if it is a brawl or a jumper
        // 3. Check for brawl (5% base * intensity)
        let normalized_intensity = self.normalize_team_stat(team.intensity.into(), false);
        let brawl_probability = 60 * normalized_intensity / 100;
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
        
        let participation_probability = 100 * normalized_stamina * normalized_intelligence * normalized_relationship / 1000000;
        random_counter += 1;
       return self.generate_random(100, random_counter.into()) < participation_probability;
    }

    fn check_player_defense_participation(self: Store, player: Player, current_time: u8, mut random_counter: u32) -> bool {
        if player.is_injured || player.stamina <= 0 {
            return false;
        }
        
        let normalized_stamina = self.normalize_player_stat(player.stamina);
        let normalized_intelligence = self.normalize_player_stat(player.intelligence);
        
        let participation_probability = 15 * normalized_stamina * normalized_intelligence / 10000;
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
        
        let goal_probability = match action_type {
            MatchAction::Penalty => 80 * normalized_attack / 100,      // 80% base
            MatchAction::FreeKick => 10 * normalized_attack / 100,     // 10% base
            MatchAction::OpenPlay => 1 * normalized_attack / 100,      // 1% base
            _ => 1 * normalized_attack / 100,                          // Default 1%
        };
        random_counter += 1;
       // if self.generate_random(100, random_counter.into()) < goal_probability {
        if true {
            if is_my_team {
              //  self.add_my_team_goal(match_id);
            } else {
               // self.add_opponent_team_goal(match_id);
            }
            return true; // Goal scored
        }
        return false; // No goal
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