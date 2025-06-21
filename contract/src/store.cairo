// Starknet imports
use starknet::{ContractAddress, get_caller_address, get_block_timestamp};

// Dojo imports
use dojo::world::WorldStorage;
use dojo::model::ModelStorage;

// Models imports
use full_starter_react::models::player::{Player, PlayerTrait};

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
    fn read_player_from_address(self: Store, player_address: ContractAddress) -> Player {
        self.world.read_model(player_address)
    }

    fn read_player(self: Store) -> Player {
        let player_address = get_caller_address();
        self.world.read_model(player_address)
    }

    // --------- Setters ---------
    fn write_player(mut self: Store, player: @Player) {
        self.world.write_model(player)
    }
    
    // --------- New entities ---------
    fn create_player(mut self: Store) {
        let caller = get_caller_address();
        let current_timestamp = get_block_timestamp();

        // Create new player with starting stats
        let new_player = PlayerTrait::new(
            caller,
            0,   // experience
            100, // health
            0,   // coins
            Timestamp::unix_timestamp_to_day(current_timestamp), // creation_day
            10,  // shoot - starting skill level
            10,  // dribble - starting skill level
            40,  // energy - starting energy
            40,  // stamina - starting stamina
            10,  // charisma - starting charisma level
        );

        self.world.write_model(@new_player);
    }

    // --------- Game Actions ---------
    fn train_player(mut self: Store) {
        let mut player = self.read_player();
        
        // Add experience from training
        player.add_experience(10);
        
        self.world.write_model(@player);
    }

    fn mine_coins(mut self: Store) {
        let mut player = self.read_player();
        
        // Add coins and reduce health from mining
        player.add_coins(5);
        
        // Reduce health (ensure it doesn't go below 0)
        if player.health >= 5 {
            player.health -= 5;
        } else {
            player.health = 0;
        }
        
        self.world.write_model(@player);
    }

    fn rest_player(mut self: Store) {
        let mut player = self.read_player();
        
        // Add health from resting
        player.add_health(20);
        
        self.world.write_model(@player);
    }

    fn train_shooting(mut self: Store) {
        let mut player = self.read_player();
        
        // Improve shooting skill (+5) and add some experience (+5)
        player.add_shoot(5);
        player.add_experience(5);
        player.remove_stamina(10);
        
        self.world.write_model(@player);
    }

    fn train_energy(mut self: Store) {
        let mut player = self.read_player();
        
        // Improve energy skill (+5) and remove stamina (-10)
        player.add_energy(5);
        player.remove_stamina(10);
        
        self.world.write_model(@player);
    }

    fn train_dribbling(mut self: Store) {
        let mut player = self.read_player();
        
        // Improve dribbling skill (+5) and add some experience (+5)
        player.add_dribble(5);
        player.add_experience(5);
        
        self.world.write_model(@player);
    }

    fn restore_stamina(mut self: Store) {
        let mut player = self.read_player();
        
        // +20 stamina
        player.add_stamina(20);
        
        self.world.write_model(@player);
    }

    fn improve_charisma(mut self: Store) {
        let mut player = self.read_player();
        
        // +5 charisma, -5 stamina
        player.add_charisma(5);
        player.remove_stamina(5);
        
        self.world.write_model(@player);
    }
}