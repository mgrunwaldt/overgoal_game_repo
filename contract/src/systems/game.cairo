// Interface definition
#[starknet::interface]
pub trait IGame<T> {
    // --------- Core gameplay methods ---------
    fn mark_player_as_created(ref self: T);
    fn mine(ref self: T);
    fn rest(ref self: T);
    fn train_shooting(ref self: T);
    fn train_energy(ref self: T);
    fn train_dribbling(ref self: T);
    fn restore_stamina(ref self: T);
    fn improve_charisma(ref self: T);
    fn improve_fame(ref self: T);
    // ✅ ADD NEW METHODS
    fn train_passing(ref self: T);
    fn train_free_kick(ref self: T);
    fn improve_team_relationship(ref self: T);
    fn improve_intelligence(ref self: T);
    fn set_player_injured(ref self: T, injured: bool);
    // --------- Archetype creation methods ---------
    fn spawn_striker(ref self: T);
    fn spawn_dribbler(ref self: T);
    fn spawn_playmaker(ref self: T);
    // --------- Team management methods ---------
    fn create_team(ref self: T, team_id: u32, name: felt252, offense: u8, defense: u8, intensity: u8);
    fn add_team_points(ref self: T, team_id: u32, points: u8);
    fn remove_team_points(ref self: T, team_id: u32, points: u8);
    fn update_team_points(ref self: T, team_id: u32, points_delta: i8);
    fn select_team(ref self: T, team_id: u32);
    fn seed_initial_teams(ref self: T);
    // --------- GameMatch management methods ---------
    fn create_gamematch(ref self: T, match_id: u32, my_team_id: u32, opponent_team_id: u32);
    fn start_gamematch(ref self: T, match_id: u32);
    fn process_match_action(ref self: T, match_id: u32, match_decision: u8);
    fn finish_gamematch(ref self: T, match_id: u32);
    fn simulate_gamematch(ref self: T, match_id: u32);
    fn add_my_team_goal(ref self: T, match_id: u32);
    fn add_opponent_team_goal(ref self: T, match_id: u32);
    // --------- Non-Match Event methods ---------
    fn seed_non_match_events(ref self: T);
    fn trigger_non_match_event(ref self: T, event_id: u32, outcome_id: u32);
    // Individual event methods
    fn look_for_sponsor_deals(ref self: T, outcome_id: u32);
    fn free_kick_practice(ref self: T, outcome_id: u32);
    fn go_to_gym(ref self: T, outcome_id: u32);
    fn meditate(ref self: T, outcome_id: u32);
    fn party(ref self: T, outcome_id: u32);
    fn penalty_practice(ref self: T, outcome_id: u32);
    fn go_to_podcast(ref self: T, outcome_id: u32);
    fn work_on_social_media(ref self: T, outcome_id: u32);
    fn visit_parents_home(ref self: T, outcome_id: u32);
    fn go_for_run(ref self: T, outcome_id: u32);
    fn play_videogames(ref self: T, outcome_id: u32);
}

#[dojo::contract]
pub mod game {
    // Local import
    use super::{IGame};

    // Achievement import
    use full_starter_react::achievements::achievement::{Achievement, AchievementTrait};

    // Store import
    use full_starter_react::store::{StoreTrait};

    // Constant import
    use full_starter_react::constants;

    // Models import
    use full_starter_react::models::player::{PlayerAssert};
    use full_starter_react::models::gamematch::{MatchDecision};

    // Dojo achievements imports
    use achievement::components::achievable::AchievableComponent;
    use achievement::store::{StoreTrait as AchievementStoreTrait};
    component!(path: AchievableComponent, storage: achievable, event: AchievableEvent);
    impl AchievableInternalImpl = AchievableComponent::InternalImpl<ContractState>;

    // Dojo Imports
    #[allow(unused_imports)]
    use dojo::model::{ModelStorage};
    #[allow(unused_imports)]
    use dojo::world::{WorldStorage, WorldStorageTrait};
    #[allow(unused_imports)]
    use dojo::event::EventStorage;

    use starknet::{get_block_timestamp};

    #[storage]
    struct Storage {
        #[substorage(v0)]
        achievable: AchievableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AchievableEvent: AchievableComponent::Event,
    }

    // Constructor
    fn dojo_init(ref self: ContractState) {
        let mut world = self.world(@"full_starter_react");

        let mut achievement_id: u8 = 1;
        while achievement_id <= constants::ACHIEVEMENTS_COUNT {
            let achievement: Achievement = achievement_id.into();
            self
                .achievable
                .create(
                    world,
                    id: achievement.identifier(),
                    hidden: achievement.hidden(),
                    index: achievement.index(),
                    points: achievement.points(),
                    start: achievement.start(),
                    end: achievement.end(),
                    group: achievement.group(),
                    icon: achievement.icon(),
                    title: achievement.title(),
                    description: achievement.description(),
                    tasks: achievement.tasks(),
                    data: achievement.data(),
                );
            achievement_id += 1;
        }
    }

    // Implementation of the interface methods
    #[abi(embed_v0)]
    impl GameImpl of IGame<ContractState> {
        
        // Method to mark player as fully created (after character selection)
        fn mark_player_as_created(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Mark player as created
            store.mark_player_as_created();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        // Method to mine coins (+5 coins, -5 health)
        fn mine(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();
           
            // Mine coins
         //   store.mine_coins();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        // Method to rest player (+20 health)
        fn rest(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Rest player
            store.rest();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        // Method to train shooting skills (+5 shoot, +5 experience)
        fn train_shooting(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Train shooting
            store.train_shooting();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn train_energy(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Train energy
            store.train_energy();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        // Method to train dribbling skills (+5 dribble, +5 experience)
        fn train_dribbling(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Train dribbling
            store.train_dribbling();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        // Method to restore stamina (+20 stamina)
        fn restore_stamina(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Restore stamina
            store.restore_stamina();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn improve_charisma(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Improve charisma
            store.improve_charisma();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn improve_fame(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Improve fame
            store.improve_fame();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        // ✅ IMPLEMENT NEW METHODS FOLLOWING EXACT SAME PATTERN
        fn train_passing(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Train passing
            store.train_passing();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn train_free_kick(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Train free kick
            store.train_free_kick();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn improve_team_relationship(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Improve team relationship
            store.improve_team_relationship();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn improve_intelligence(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Improve intelligence
            store.improve_intelligence();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn set_player_injured(ref self: ContractState, injured: bool) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Set player injured status
            store.set_player_injured(injured);

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        // --------- Archetype-specific player creation methods ---------
        fn spawn_striker(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            // Create new striker player
            store.create_striker();

            let player = store.read_player();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn spawn_dribbler(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            // Create new dribbler player
            store.create_dribbler();

            let player = store.read_player();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn spawn_playmaker(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            // Create new playmaker player
            store.create_playmaker();

            let player = store.read_player();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        // --------- Team management methods ---------
        fn create_team(ref self: ContractState, team_id: u32, name: felt252, offense: u8, defense: u8, intensity: u8) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            // Create team
            store.create_team(team_id, name, offense, defense, intensity);

            let player = store.read_player();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn add_team_points(ref self: ContractState, team_id: u32, points: u8) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Add team points
            store.add_team_points(team_id, points);

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn remove_team_points(ref self: ContractState, team_id: u32, points: u8) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Remove team points
            store.remove_team_points(team_id, points);

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn update_team_points(ref self: ContractState, team_id: u32, points_delta: i8) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Update team points
            store.update_team_points(team_id, points_delta);

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn select_team(ref self: ContractState, team_id: u32) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Select team
            store.select_team(team_id);

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn seed_initial_teams(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);

            // Check if teams already exist to avoid duplicates
            // Check both team_id and offense to ensure teams are properly seeded
            let existing_team = store.read_team(1);
            if existing_team.team_id != 0 && existing_team.offense != 0 {
                // Teams already seeded with data, return early
                return;
            }

            // Create the 3 default teams with predefined stats
            
            // Team 1: Nacional (good in everything)
            store.create_team(
                team_id: 1,
                name: 'Nacional',
                offense: 80,
                defense: 80,
                intensity: 80
            );

            // Team 2: Lanus (good in offense, medium in rest)  
            store.create_team(
                team_id: 2,
                name: 'Lanus',
                offense: 85,
                defense: 65,
                intensity: 65
            );

            // Team 3: Peñarol (bad in everything)
            store.create_team(
                team_id: 3,
                name: 'Penarol',
                offense: 40,
                defense: 40,
                intensity: 40
            );
        }

        // --------- GameMatch management methods ---------
        fn create_gamematch(ref self: ContractState, match_id: u32, my_team_id: u32, opponent_team_id: u32) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            // Create gamematch
            store.create_gamematch(match_id, my_team_id, opponent_team_id);

            let player = store.read_player();

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn start_gamematch(ref self: ContractState, match_id: u32) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Start gamematch
            store.start_gamematch(match_id);

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn process_match_action(ref self: ContractState, match_id: u32, match_decision: u8) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Convert u8 to MatchDecision enum
            let decision = match match_decision {
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
            };

            // Process match action
            store.process_match_action(match_id, decision);

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn finish_gamematch(ref self: ContractState, match_id: u32) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Finish gamematch
            store.finish_gamematch(match_id);

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn simulate_gamematch(ref self: ContractState, match_id: u32) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Simulate gamematch
            store.simulate_gamematch(match_id);

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn add_my_team_goal(ref self: ContractState, match_id: u32) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Add goal to my team
            store.add_my_team_goal(match_id);

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        fn add_opponent_team_goal(ref self: ContractState, match_id: u32) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Add goal to opponent team
            store.add_opponent_team_goal(match_id);

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        // --------- Non-Match Event methods ---------
        fn seed_non_match_events(ref self: ContractState) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);

            // Create all 11 non-match events with their outcomes
            
            // Event 1: Look for Sponsor Deals
            store.create_non_match_event(1, 'Look for Sponsor Deals', 'Find sponsorship opportunities');
            store.create_non_match_event_outcome(1, 1, 1, 'Sneaker Cinderella', 'Hip shoe startup loves you', 15, 0, 0, 0, 0, 4, 8, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(1, 2, 1, 'Eco-Water Hero', 'Water deal with donation', 12, 0, 0, 0, 0, 0, 6, 0, 0, 3, 0, false);
            store.create_non_match_event_outcome(1, 3, 0, 'Crypto Clown', 'Sketchy token, fans clown you', 18, 0, 0, 0, 0, 0, -10, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(1, 4, 0, 'Smelly Socks Saga', 'Deodorant brand everyone hates', 12, 0, 0, 0, 0, 0, -8, 0, 0, 0, 0, false);

            // Event 2: Free-Kick Practice  
            store.create_non_match_event(2, 'Free-Kick Practice', 'Practice free kick techniques');
            store.create_non_match_event_outcome(2, 1, 1, 'Top-Corner Machine', 'Every ball bends in like magic', 0, 4, 0, -6, 0, 0, 0, 0, 7, 0, 0, false);
            store.create_non_match_event_outcome(2, 2, 1, 'Technique Tutorials', 'Coaches film for academy', 0, 0, 0, -5, 0, 0, 3, 0, 5, 0, 0, false);
            store.create_non_match_event_outcome(2, 3, 0, 'Wet-Grass Wipe-out', 'Slip, tweak your hamstring', 0, 0, 0, -10, 0, 0, 0, 0, 0, 0, 0, true);
            store.create_non_match_event_outcome(2, 4, 0, 'Leg-Day Overload', 'Too many reps fry your quads', 0, 0, 0, -8, -6, 0, 0, 0, 0, 0, 0, false);

            // Event 3: Go to the Gym
            store.create_non_match_event(3, 'Go to the Gym', 'Hit gym for training');
            store.create_non_match_event_outcome(3, 1, 1, 'PR Parade', 'Smash bench-press record', -4, 0, 0, -5, 6, 2, 0, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(3, 2, 1, 'Core Crusher', 'Core workout boosts endurance', -3, 0, 0, 3, 4, 0, 0, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(3, 3, 0, 'Over-Train Pain', 'Push too hard; body rebels', -2, 0, 0, -8, -4, 0, 0, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(3, 4, 0, 'Gym-Floor Sprain', 'Awkward landing, ankle nope', 0, 0, 0, -10, 0, 0, 0, 0, 0, 0, 0, true);

            // Event 4: Meditate
            store.create_non_match_event(4, 'Meditate', 'Practice mindfulness');
            store.create_non_match_event_outcome(4, 1, 1, 'Zen Master', 'Breathing drills clear the mind', 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 5, false);
            store.create_non_match_event_outcome(4, 2, 1, 'Chill Aura', 'Teammates feed off your calm', 0, 0, 0, 0, 0, 3, 0, 0, 0, 6, 0, false);
            store.create_non_match_event_outcome(4, 3, 0, 'Meeting Snoozer', 'Doze off mid-team talk', 0, 0, 0, 0, 0, 0, -3, 0, 0, -5, 0, false);
            store.create_non_match_event_outcome(4, 4, 0, 'Viral Chant Fail', 'Weird chanting clip goes viral', 0, 0, 0, 0, 0, -2, -6, 0, 0, 0, 0, false);

            // Event 5: Party
            store.create_non_match_event(5, 'Party', 'Go out and party with friends');
            store.create_non_match_event_outcome(5, 1, 1, 'Dance-Floor Legend', 'Crowd chants your name', -10, 0, 0, -8, 0, 6, 5, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(5, 2, 1, 'VIP Networking', 'Mingle with celebs', 8, 0, 0, -6, 0, 0, 4, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(5, 3, 0, 'Tabloid Trouble', 'Paparazzi catch you at 4 a.m.', 0, 0, 0, -9, 0, -5, -7, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(5, 4, 0, 'Dance-Floor Tackle', 'Club brawl; you limp home', 0, 0, 0, -10, -6, 0, 0, 0, 0, 0, 0, true);

            // Event 6: Penalty Practice
            store.create_non_match_event(6, 'Penalty Practice', 'Practice penalty shooting');
            store.create_non_match_event_outcome(6, 1, 1, 'Ten-for-Ten', 'Drill every shot; coach happy', 0, 5, 0, -6, 0, 0, 0, 0, 3, 0, 0, false);
            store.create_non_match_event_outcome(6, 2, 1, 'Viral Stutter-Step', 'Cheeky run-up delights fans', 0, 2, 0, -4, 0, 3, 4, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(6, 3, 0, 'Confidence Crash', 'Miss five straight; self-doubt', 0, -3, 0, -5, 0, -4, 0, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(6, 4, 0, 'Ball-to-Ankle', 'Mis-hit rebounds into ankle', 0, 0, 0, -8, 0, 0, 0, 0, 0, 0, 0, true);

            // Event 7: Go to a Podcast
            store.create_non_match_event(7, 'Go to a Podcast', 'Appear on a sports podcast');
            store.create_non_match_event_outcome(7, 1, 1, 'Story-Time Star', 'Listeners love locker tales', 5, 0, 0, 0, 0, 5, 6, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(7, 2, 1, 'Clip Goes Viral', 'TikTok explodes; teammates', 0, 0, 0, 0, 0, 2, 8, 0, 0, 3, 0, false);
            store.create_non_match_event_outcome(7, 3, 0, 'Coach-Shade Slip', 'Accidentally roast the coach', 0, 0, 0, 0, 0, 0, -4, 0, 0, -8, 0, false);
            store.create_non_match_event_outcome(7, 4, 0, 'Hot-Take Backlash', 'Fans cancel you over opinion', 0, 0, 0, 0, 0, -3, -6, 0, 0, 0, 0, false);

            // Event 8: Work on Social Media
            store.create_non_match_event(8, 'Work on Social Media', 'Create content for socials');
            store.create_non_match_event_outcome(8, 1, 1, 'Trick-Shot King', 'Reel hits a million views', 5, 0, 0, 0, 0, 4, 7, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(8, 2, 1, 'Brand Collab', 'Sponsored post pays off', 10, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(8, 3, 0, 'Cringe Challenge', 'Dance fails, comments savage', 0, 0, 0, 0, 0, -4, -6, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(8, 4, 0, 'Doom-Scroll Drain', 'Hours lost to scrolling', 0, 0, 0, -6, 0, 0, 0, 0, 0, 0, -3, false);

            // Event 9: Visit Parents' Home
            store.create_non_match_event(9, 'Visit Parents Home', 'Go home to visit family');
            store.create_non_match_event_outcome(9, 1, 1, 'Mom\'s Cooking', 'Comfort food recharges', -4, 0, 0, 8, 4, 0, 0, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(9, 2, 1, 'Family Grounding', 'Heart-to-heart resets focus', -2, 0, 0, 0, 0, 0, 0, 0, 0, 6, 3, false);
            store.create_non_match_event_outcome(9, 3, 0, 'Missed Flight', 'Return late; coach fuming', -6, 0, 0, -4, 0, 0, 0, 0, 0, -5, 0, false);
            store.create_non_match_event_outcome(9, 4, 0, 'Awkward Paparazzi', 'Small-town tabloid snaps you', 0, 0, 0, -3, 0, 0, -4, 0, 0, 0, 0, false);

            // Event 10: Go for a Run
            store.create_non_match_event(10, 'Go for a Run', 'Go jogging for cardio exercise');
            store.create_non_match_event_outcome(10, 1, 1, 'Sunrise Stride', 'Endorphins pump you up', 0, 0, 0, -5, 6, 0, 0, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(10, 2, 1, 'Fan Selfies', 'Bump into supporters mid-jog', 0, 0, 0, -4, 3, 3, 2, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(10, 3, 0, 'Curb Twist', 'Bad step, ankle rolls', 0, 0, 0, -8, 0, 0, 0, 0, 0, 0, 0, true);
            store.create_non_match_event_outcome(10, 4, 0, 'Overheat', 'Mid-run meltdown', 0, 0, 0, -7, -4, 0, 0, 0, 0, 0, 0, false);

            // Event 11: Play Videogames
            store.create_non_match_event(11, 'Play Videogames', 'Gaming session for fun');
            store.create_non_match_event_outcome(11, 1, 1, 'Stream Comeback', 'Epic win on stream; chat subs', 3, 0, 0, -3, 0, 4, 5, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(11, 2, 1, 'Strategy Savant', 'Tactics game sharpens decisions', 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 5, false);
            store.create_non_match_event_outcome(11, 3, 0, 'All-Nighter', 'Lose track of time; zombie mode', 0, 0, 0, -8, -4, 0, 0, 0, 0, 0, 0, false);
            store.create_non_match_event_outcome(11, 4, 0, 'Rage-Quit Meme', 'Clip of meltdown goes viral', 0, 0, 0, 0, 0, -3, -6, 0, 0, 0, 0, false);
        }

        fn trigger_non_match_event(ref self: ContractState, event_id: u32, outcome_id: u32) {
            let mut world = self.world(@"full_starter_react");
            let store = StoreTrait::new(world);
            let achievement_store = AchievementStoreTrait::new(world);

            let player = store.read_player();

            // Trigger the non-match event
            store.trigger_non_match_event(event_id, outcome_id);

            // Emit events for achievements progression
            let mut achievement_id = constants::ACHIEVEMENTS_INITIAL_ID; // 1
            let stop = constants::ACHIEVEMENTS_COUNT; // 5
            
            while achievement_id <= stop {
                let task: Achievement = achievement_id.into(); // u8 to Achievement
                let task_identifier = task.identifier(); // Achievement identifier is the task to complete
                achievement_store.progress(player.owner.into(), task_identifier, 1, get_block_timestamp());
                achievement_id += 1;
            };
        }

        // Individual event methods (1-4 outcomes each)
        fn look_for_sponsor_deals(ref self: ContractState, outcome_id: u32) {
            self.trigger_non_match_event(1, outcome_id);
        }

        fn free_kick_practice(ref self: ContractState, outcome_id: u32) {
            self.trigger_non_match_event(2, outcome_id);
        }

        fn go_to_gym(ref self: ContractState, outcome_id: u32) {
            self.trigger_non_match_event(3, outcome_id);
        }

        fn meditate(ref self: ContractState, outcome_id: u32) {
            self.trigger_non_match_event(4, outcome_id);
        }

        fn party(ref self: ContractState, outcome_id: u32) {
            self.trigger_non_match_event(5, outcome_id);
        }

        fn penalty_practice(ref self: ContractState, outcome_id: u32) {
            self.trigger_non_match_event(6, outcome_id);
        }

        fn go_to_podcast(ref self: ContractState, outcome_id: u32) {
            self.trigger_non_match_event(7, outcome_id);
        }

        fn work_on_social_media(ref self: ContractState, outcome_id: u32) {
            self.trigger_non_match_event(8, outcome_id);
        }

        fn visit_parents_home(ref self: ContractState, outcome_id: u32) {
            self.trigger_non_match_event(9, outcome_id);
        }

        fn go_for_run(ref self: ContractState, outcome_id: u32) {
            self.trigger_non_match_event(10, outcome_id);
        }

        fn play_videogames(ref self: ContractState, outcome_id: u32) {
            self.trigger_non_match_event(11, outcome_id);
        }
    }
}