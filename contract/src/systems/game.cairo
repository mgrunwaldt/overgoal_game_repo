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
    // --------- Archetype creation methods ---------
    fn spawn_striker(ref self: T);
    fn spawn_dribbler(ref self: T);
    fn spawn_playmaker(ref self: T);
    // --------- Team management methods ---------
    fn create_team(ref self: T, team_id: u32, name: felt252, offense: u8, defense: u8, intensity: u8);
    fn add_team_points(ref self: T, team_id: u32, points: u8);
    fn remove_team_points(ref self: T, team_id: u32, points: u8);
    fn update_team_points(ref self: T, team_id: u32, points_delta: i8);
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
    }
}