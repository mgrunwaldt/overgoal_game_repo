// Starknet imports
//use starknet::ContractAddress;

// Team Model - represents a football club with normalized stats (0-100)
#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct Team {
    #[key]
    pub team_id: u32,              // Unique identifier for the team
    pub name: felt252,             // Team name (e.g., 'Juventus')
    pub offense: u8,               // Attacking strength (0-100)
    pub defense: u8,               // Defensive ability (0-100)
    pub intensity: u8,             // Pressing power and physical edge (0-100)
    pub current_league_points: u8, // Current points in league table (0-100)
}

// Team Trait Implementation
#[generate_trait]
pub impl TeamImpl of TeamTrait {
    /// Create a new team with clamped stats (0-100)
    fn new(
        team_id: u32,
        name: felt252,
        offense: u8,
        defense: u8,
        intensity: u8,
    ) -> Team {
        Team {
            team_id: team_id,
            name: name,
            offense: Self::clamp_stat(offense),
            defense: Self::clamp_stat(defense),
            intensity: Self::clamp_stat(intensity),
            current_league_points: 0, // Always starts at 0
        }
    }

    /// Update league points after a fixture or penalty
    /// Accepts signed delta and clamps result to 0-100
    fn change_current_points(ref self: Team, points_delta: i8) {
        let current_points_i16: i16 = self.current_league_points.into();
        let delta_i16: i16 = points_delta.into();
        let new_points = current_points_i16 + delta_i16;
        
        // Clamp to 0-100 range
        if new_points < 0 {
            self.current_league_points = 0;
        } else if new_points > 100 {
            self.current_league_points = 100;
        } else {
            self.current_league_points = new_points.try_into().unwrap();
        }
    }

    /// Add points (convenience method for positive changes)
    fn add_points(ref self: Team, points: u8) {
        let points_i8: i8 = points.try_into().unwrap();
        self.change_current_points(points_i8);
    }

    /// Remove points (convenience method for negative changes)
    fn remove_points(ref self: Team, points: u8) {
        let points_i8: i8 = points.try_into().unwrap();
        self.change_current_points(-points_i8);
    }

    /// Helper function to clamp stats to 0-100 range
    fn clamp_stat(stat: u8) -> u8 {
        if stat > 100 {
            100
        } else {
            stat
        }
    }

    /// Calculate total team strength (sum of all stats)
    fn total_strength(self: Team) -> u16 {
        let offense_u16: u16 = self.offense.into();
        let defense_u16: u16 = self.defense.into();
        let intensity_u16: u16 = self.intensity.into();
        offense_u16 + defense_u16 + intensity_u16
    }

    /// Check if team is strong (total strength > 200)
    fn is_strong_team(self: Team) -> bool {
        self.total_strength() > 200
    }
}

 