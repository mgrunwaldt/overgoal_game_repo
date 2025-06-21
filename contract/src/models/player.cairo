// Starknet import
use starknet::ContractAddress;
use core::num::traits::zero::Zero;

// Constants imports
use full_starter_react::constants;

// Helpers import
use full_starter_react::helpers::timestamp::Timestamp;

// Model
#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
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
    pub is_player_created: bool,
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
        is_player_created: bool,
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
            is_player_created: is_player_created,
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
            is_player_created: false,
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
            is_player_created: false,
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
            is_player_created: false,
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
            is_player_created: false,
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

// Tests
#[cfg(test)]
mod tests {
    use super::{Player, ZeroablePlayerTrait, PlayerImpl, PlayerTrait, PlayerAssert};
    use full_starter_react::constants;
    use starknet::{ContractAddress, contract_address_const};

    #[test]
    #[available_gas(1000000)]
    fn test_player_new_constructor() {
        // Use contract_address_const to create a mock address
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        // Test the new constructor
        let player = PlayerTrait::new(
            mock_address,
            50,   // experience
            100,  // health
            25,   // coins
            42,   // creation_day
            30,   // shoot
            35,   // dribble
            100,  // energy
            100,  // stamina
            0,    // charisma
            0,    // fame
            true, // is_player_created
        );

        assert_eq!(
            player.owner, 
            mock_address, 
            "Player owner should match the initialized address"
        );
        assert_eq!(player.experience, 50, "Experience should be initialized to 50");
        assert_eq!(player.health, 100, "Health should be initialized to 100");
        assert_eq!(player.coins, 25, "Coins should be initialized to 25");
        assert_eq!(player.creation_day, 42, "Creation day should be initialized to 42");
        assert_eq!(player.shoot, 30, "Shoot should be initialized to 30");
        assert_eq!(player.dribble, 35, "Dribble should be initialized to 35");
        assert_eq!(player.energy, 100, "Energy should be initialized to 100");
        assert_eq!(player.stamina, 100, "Stamina should be initialized to 100");
        assert_eq!(player.charisma, 0, "Charisma should be initialized to 0");
        assert_eq!(player.fame, 0, "Fame should be initialized to 0");
        assert_eq!(player.is_player_created, true, "Player should be marked as created");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_player_initialization() {
        // Use contract_address_const to create a mock address
        let mock_address: ContractAddress = contract_address_const::<0x123>();

        let player = Player {
            owner: mock_address,
            experience: 0,
            health: 100,
            coins: 0,
            creation_day: 1,
            shoot: 10,
            dribble: 15,
            energy: 100,
            stamina: 100,
            charisma: 0,
            fame: 0,
            is_player_created: false,
        };

        assert_eq!(
            player.owner, 
            mock_address, 
            "Player owner should match the initialized address"
        );
        assert_eq!(
            player.coins, 
            0, 
            "Initial coins should be 0"
        );
        assert_eq!(
            player.health, 
            100, 
            "Initial health should be 100"
        );
        assert_eq!(
            player.experience, 
            0, 
            "Initial experience should be 0"
        );
        assert_eq!(
            player.shoot, 
            10, 
            "Initial shoot should be 10"
        );
        assert_eq!(
            player.dribble, 
            15, 
            "Initial dribble should be 15"
        );
        assert_eq!(
            player.energy, 
            100, 
            "Initial energy should be 100"
        );
        assert_eq!(
            player.stamina, 
            100, 
            "Initial stamina should be 100"
        );
        assert_eq!(
            player.is_player_created, 
            false, 
            "Initial player should not be marked as created"
        );
    }

    #[test]
    #[available_gas(1000000)]
    fn test_player_zero_values() {
        let player: Player = ZeroablePlayerTrait::zero();

        assert_eq!(
            player.owner, 
            constants::ZERO_ADDRESS(), 
            "Player owner should match the zero address"
        );
        assert_eq!(
            player.experience, 
            0, 
            "Zero player experience should be 0"
        );
        assert_eq!(
            player.health, 
            0, 
            "Zero player health should be 0"
        );
        assert_eq!(
            player.coins, 
            0, 
            "Zero player coins should be 0"
        );
        assert_eq!(
            player.shoot, 
            0, 
            "Zero player shoot should be 0"
        );
        assert_eq!(
            player.dribble, 
            0, 
            "Zero player dribble should be 0"
        );
        assert_eq!(
            player.energy, 
            0, 
            "Zero player energy should be 0"
        );
        assert_eq!(
            player.stamina, 
            0, 
            "Zero player stamina should be 0"
        );
        assert_eq!(
            player.is_player_created, 
            false, 
            "Zero player should not be marked as created"
        );
        }

    #[test]
    #[available_gas(1000000)]
    fn test_player_add_coins() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        // Use the constructor instead of direct initialization
        let mut player = PlayerTrait::new(
            mock_address,
            0,    // experience
            100,  // health
            0,    // coins
            1,    // creation_day
            10,   // shoot
            15,   // dribble
            100,  // energy
            100,  // stamina
            0,    // charisma
            0,    // fame
            false, // is_player_created
        );

        player.add_coins(50);
        assert_eq!(
            player.coins, 
            50, 
            "Player should have 50 coins after adding 50"
        );

        player.add_coins(100);
        assert_eq!(
            player.coins, 
            150, 
            "Player should have 150 coins after adding 100 more"
        );
    }

    #[test]
    #[available_gas(1000000)]
    fn test_player_add_experience() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        let mut player = PlayerTrait::new(
            mock_address,
            0,    // experience
            100,  // health
            0,    // coins
            1,    // creation_day
            10,   // shoot
            15,   // dribble
            100,  // energy
            100,  // stamina
            0,    // charisma
            0,    // fame
            false, // is_player_created
        );

        player.add_experience(25);
        assert_eq!(
            player.experience, 
            25, 
            "Player should have 25 experience after adding 25"
        );

        player.add_experience(75);
        assert_eq!(
            player.experience, 
            100, 
            "Player should have 100 experience after adding 75 more"
        );
    }

    #[test]
    #[available_gas(1000000)]
    fn test_player_add_shoot_and_dribble() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        let mut player = PlayerTrait::new(
            mock_address,
            0,    // experience
            100,  // health
            0,    // coins
            1,    // creation_day
            10,   // shoot
            15,   // dribble
            100,  // energy
            100,  // stamina
            0,    // charisma
            0,    // fame
            false, // is_player_created
        );

        // Test adding shoot
        player.add_shoot(20);
        assert_eq!(
            player.shoot, 
            30, 
            "Player should have 30 shoot after adding 20"
        );

        // Test adding dribble
        player.add_dribble(25);
        assert_eq!(
            player.dribble, 
            40, 
            "Player should have 40 dribble after adding 25"
        );

        // Test adding charisma
        player.add_charisma(15);
        assert_eq!(
            player.charisma, 
            15, 
            "Player should have 15 charisma after adding 15"
        );

        // Test adding fame
        player.add_fame(20);
        assert_eq!(
            player.fame, 
            20, 
            "Player should have 20 fame after adding 20"
        );
    }

    #[test]
    #[available_gas(1000000)]
    fn test_player_health_management() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        
        let mut player = PlayerTrait::new(
            mock_address,
            0,    // experience
            100,  // health
            0,    // coins
            1,    // creation_day
            10,   // shoot
            15,   // dribble
            100,  // energy
            100,  // stamina
            0,    // charisma
            0,    // fame
            false, // is_player_created
        );

        // Test adding health
        player.add_health(50);
        assert_eq!(
            player.health, 
            150, 
            "Player should have 150 health after adding 50"
        );

    }

    #[test]
    #[available_gas(1000000)]
    fn test_player_assert_traits() {
        let mock_address: ContractAddress = contract_address_const::<0x456>();
        
        // Test with existing player
        let existing_player = PlayerTrait::new(
            mock_address,
            10,   // experience
            100,  // health
            5,    // coins
            1,    // creation_day
            20,   // shoot
            25,   // dribble
            100,  // energy
            100,  // stamina
            0,    // charisma
            0,    // fame
            true, // is_player_created
        );

        existing_player.assert_exists(); // Should not panic

        // Test with zero player
        let zero_player: Player = ZeroablePlayerTrait::zero();
        zero_player.assert_not_exists(); // Should not panic
        
        assert!(zero_player.is_zero(), "Zero player should be zero");
        assert!(existing_player.is_non_zero(), "Existing player should be non-zero");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_player_mark_as_created() {
        let mock_address: ContractAddress = contract_address_const::<0x789>();
        
        // Initialize player as not created
        let mut player = PlayerTrait::new(
            mock_address,
            0,    // experience
            100,  // health
            0,    // coins
            1,    // creation_day
            10,   // shoot
            15,   // dribble
            100,  // energy
            100,  // stamina
            0,    // charisma
            0,    // fame
            false, // is_player_created
        );
        
        assert_eq!(player.is_player_created, false, "Player should initially not be created");
        
        // Mark as created
        player.mark_as_created();
        
        assert_eq!(player.is_player_created, true, "Player should be marked as created");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_player_complex_scenario() {
        let mock_address: ContractAddress = contract_address_const::<0x789>();
        
        // Initialize player with some starting values
        let mut player = PlayerTrait::new(
            mock_address,
            15,   // experience
            80,   // health
            50,   // coins
            10,   // creation_day
            20,   // shoot
            25,   // dribble
            100,  // energy
            100,  // stamina
            0,    // charisma
            0,    // fame
            false, // is_player_created
        );
        
        // Simulate a game session
        player.add_coins(75);        // Collected coins during gameplay
        player.add_experience(100);  // Gained experience
        player.add_health(10);       // Restored some health
        player.add_shoot(15);        // Improved shooting skills
        player.add_dribble(10);      // Improved dribbling skills
        player.add_energy(10);       // Improved energy
        player.add_stamina(10);      // Improved stamina
        player.add_charisma(25);     // Improved charisma
        player.add_fame(30);         // Improved fame
        player.mark_as_created();    // Mark player as fully created
        
        // Verify final state
        assert_eq!(player.coins, 125, "Player should have 125 coins total");
        assert_eq!(player.experience, 115, "Player should have 115 total experience");
        assert_eq!(player.health, 90, "Player should have 90 health after damage and healing");
        assert_eq!(player.shoot, 35, "Player should have 35 shoot after training");
        assert_eq!(player.dribble, 35, "Player should have 35 dribble after training");
        assert_eq!(player.energy, 110, "Player should have 110 energy after training");
        assert_eq!(player.stamina, 110, "Player should have 110 stamina after training");
        assert_eq!(player.charisma, 25, "Player should have 25 charisma after training");
        assert_eq!(player.fame, 30, "Player should have 30 fame after training");
        assert_eq!(player.creation_day, 10, "Creation day should remain unchanged");
        assert_eq!(player.owner, mock_address, "Owner should remain unchanged");
        assert_eq!(player.is_player_created, true, "Player should be marked as created");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_all_archetype_constructors() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        let creation_day = 1;
        
        // Test all three archetype constructors exist and work
        let striker = PlayerTrait::new_striker(mock_address, creation_day);
        let dribbler = PlayerTrait::new_dribbler(mock_address, creation_day);
        let playmaker = PlayerTrait::new_playmaker(mock_address, creation_day);

        // Verify they all have different stat distributions
        assert!(striker.shoot != dribbler.shoot || striker.dribble != dribbler.dribble, "Striker and Dribbler should have different stats");
        assert!(striker.shoot != playmaker.shoot || striker.charisma != playmaker.charisma, "Striker and Playmaker should have different stats");
        assert!(dribbler.dribble != playmaker.dribble || dribbler.energy != playmaker.energy, "Dribbler and Playmaker should have different stats");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_striker_archetype() {
        let mock_address: ContractAddress = contract_address_const::<0x123>();
        let creation_day = 42;
        
        let striker = PlayerTrait::new_striker(mock_address, creation_day);

        // Verify basic fields
        assert_eq!(striker.owner, mock_address, "Striker owner should match");
        assert_eq!(striker.experience, 0, "Striker should start with 0 experience");
        assert_eq!(striker.health, 100, "Striker should start with 100 health");
        assert_eq!(striker.coins, 0, "Striker should start with 0 coins");
        assert_eq!(striker.creation_day, creation_day, "Striker creation day should match");
        assert_eq!(striker.is_player_created, false, "Striker should not be marked as created initially");

        // Verify archetype-specific stats (Total: 200 points)
        assert_eq!(striker.shoot, 60, "Striker should have high shooting (60)");
        assert_eq!(striker.dribble, 20, "Striker should have low dribbling (20)");
        assert_eq!(striker.charisma, 25, "Striker should have low charisma (25)");
        assert_eq!(striker.energy, 50, "Striker should have moderate energy (50)");
        assert_eq!(striker.stamina, 45, "Striker should have moderate stamina (45)");
        assert_eq!(striker.fame, 0, "Striker should start with 0 fame");

        // Verify total stat points = 200
        let total_stats = striker.shoot + striker.dribble + striker.charisma + striker.energy + striker.stamina;
        assert_eq!(total_stats, 200, "Striker total stats should equal 200");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_dribbler_archetype() {
        let mock_address: ContractAddress = contract_address_const::<0x456>();
        let creation_day = 15;
        
        let dribbler = PlayerTrait::new_dribbler(mock_address, creation_day);

        // Verify basic fields
        assert_eq!(dribbler.owner, mock_address, "Dribbler owner should match");
        assert_eq!(dribbler.experience, 0, "Dribbler should start with 0 experience");
        assert_eq!(dribbler.health, 100, "Dribbler should start with 100 health");
        assert_eq!(dribbler.coins, 0, "Dribbler should start with 0 coins");
        assert_eq!(dribbler.creation_day, creation_day, "Dribbler creation day should match");
        assert_eq!(dribbler.is_player_created, false, "Dribbler should not be marked as created initially");

        // Verify archetype-specific stats (Total: 200 points)
        assert_eq!(dribbler.shoot, 20, "Dribbler should have low shooting (20)");
        assert_eq!(dribbler.dribble, 50, "Dribbler should have high dribbling (50)");
        assert_eq!(dribbler.charisma, 50, "Dribbler should have high charisma (50)");
        assert_eq!(dribbler.energy, 40, "Dribbler should have moderate energy (40)");
        assert_eq!(dribbler.stamina, 40, "Dribbler should have moderate stamina (40)");
        assert_eq!(dribbler.fame, 0, "Dribbler should start with 0 fame");

        // Verify total stat points = 200
        let total_stats = dribbler.shoot + dribbler.dribble + dribbler.charisma + dribbler.energy + dribbler.stamina;
        assert_eq!(total_stats, 200, "Dribbler total stats should equal 200");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_playmaker_archetype() {
        let mock_address: ContractAddress = contract_address_const::<0x789>();
        let creation_day = 7;
        
        let playmaker = PlayerTrait::new_playmaker(mock_address, creation_day);

        // Verify basic fields
        assert_eq!(playmaker.owner, mock_address, "Playmaker owner should match");
        assert_eq!(playmaker.experience, 0, "Playmaker should start with 0 experience");
        assert_eq!(playmaker.health, 100, "Playmaker should start with 100 health");
        assert_eq!(playmaker.coins, 0, "Playmaker should start with 0 coins");
        assert_eq!(playmaker.creation_day, creation_day, "Playmaker creation day should match");
        assert_eq!(playmaker.is_player_created, false, "Playmaker should not be marked as created initially");

        // Verify archetype-specific stats (Total: 200 points)
        assert_eq!(playmaker.shoot, 30, "Playmaker should have balanced shooting (30)");
        assert_eq!(playmaker.dribble, 30, "Playmaker should have balanced dribbling (30)");
        assert_eq!(playmaker.charisma, 40, "Playmaker should have good charisma (40)");
        assert_eq!(playmaker.energy, 50, "Playmaker should have high energy (50)");
        assert_eq!(playmaker.stamina, 50, "Playmaker should have high stamina (50)");
        assert_eq!(playmaker.fame, 0, "Playmaker should start with 0 fame");

        // Verify total stat points = 200
        let total_stats = playmaker.shoot + playmaker.dribble + playmaker.charisma + playmaker.energy + playmaker.stamina;
        assert_eq!(total_stats, 200, "Playmaker total stats should equal 200");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_archetype_differences() {
        let mock_address: ContractAddress = contract_address_const::<0x999>();
        let creation_day = 1;
        
        let striker = PlayerTrait::new_striker(mock_address, creation_day);
        let dribbler = PlayerTrait::new_dribbler(mock_address, creation_day);
        let playmaker = PlayerTrait::new_playmaker(mock_address, creation_day);

        // Verify Striker specialization (highest shooting)
        assert!(striker.shoot > dribbler.shoot, "Striker should have higher shooting than Dribbler");
        assert!(striker.shoot > playmaker.shoot, "Striker should have higher shooting than Playmaker");

        // Verify Dribbler specialization (highest dribbling and charisma)
        assert!(dribbler.dribble > striker.dribble, "Dribbler should have higher dribbling than Striker");
        assert!(dribbler.dribble > playmaker.dribble, "Dribbler should have higher dribbling than Playmaker");
        assert!(dribbler.charisma > striker.charisma, "Dribbler should have higher charisma than Striker");

        // Verify Playmaker specialization (highest energy and stamina, balanced skills)
        assert!(playmaker.energy >= striker.energy, "Playmaker should have equal or higher energy than Striker");
        assert!(playmaker.energy > dribbler.energy, "Playmaker should have higher energy than Dribbler");
        assert!(playmaker.stamina > striker.stamina, "Playmaker should have higher stamina than Striker");
        assert!(playmaker.stamina > dribbler.stamina, "Playmaker should have higher stamina than Dribbler");

        // Verify all have same total stats
        let striker_total = striker.shoot + striker.dribble + striker.charisma + striker.energy + striker.stamina;
        let dribbler_total = dribbler.shoot + dribbler.dribble + dribbler.charisma + dribbler.energy + dribbler.stamina;
        let playmaker_total = playmaker.shoot + playmaker.dribble + playmaker.charisma + playmaker.energy + playmaker.stamina;
        
        assert_eq!(striker_total, 200, "Striker total should be 200");
        assert_eq!(dribbler_total, 200, "Dribbler total should be 200");
        assert_eq!(playmaker_total, 200, "Playmaker total should be 200");
    }
}