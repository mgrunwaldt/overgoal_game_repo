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

// Tests
#[cfg(test)]
mod tests {
    use super::{Team, TeamTrait, TeamImpl};

    #[test]
    #[available_gas(1000000)]
    fn test_team_creation() {
        let team = TeamTrait::new(1, 'Juventus', 85, 75, 80);
        
        assert_eq!(team.team_id, 1, "Team ID should be 1");
        assert_eq!(team.name, 'Juventus', "Team name should be Juventus");
        assert_eq!(team.offense, 85, "Offense should be 85");
        assert_eq!(team.defense, 75, "Defense should be 75");
        assert_eq!(team.intensity, 80, "Intensity should be 80");
        assert_eq!(team.current_league_points, 0, "Points should start at 0");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_stat_clamping() {
        let team = TeamTrait::new(2, 'TestTeam', 150, 200, 50);
        
        assert_eq!(team.offense, 100, "Offense should be clamped to 100");
        assert_eq!(team.defense, 100, "Defense should be clamped to 100");
        assert_eq!(team.intensity, 50, "Intensity should remain 50");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_points_management() {
        let mut team = TeamTrait::new(3, 'Barcelona', 90, 85, 88);
        
        // Test adding points
        team.add_points(30);
        assert_eq!(team.current_league_points, 30, "Points should be 30 after adding");
        
        // Test removing points
        team.remove_points(10);
        assert_eq!(team.current_league_points, 20, "Points should be 20 after removing");
        
        // Test change_current_points with positive delta
        team.change_current_points(15);
        assert_eq!(team.current_league_points, 35, "Points should be 35 after positive change");
        
        // Test change_current_points with negative delta
        team.change_current_points(-5);
        assert_eq!(team.current_league_points, 30, "Points should be 30 after negative change");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_points_clamping() {
        let mut team = TeamTrait::new(4, 'RealMadrid', 95, 90, 85);
        
        // Test upper bound clamping
        team.add_points(120);
        assert_eq!(team.current_league_points, 100, "Points should be clamped to 100");
        
        // Test lower bound clamping
        team.remove_points(150);
        assert_eq!(team.current_league_points, 0, "Points should be clamped to 0");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_team_strength() {
        let team = TeamTrait::new(5, 'ManCity', 80, 70, 75);
        
        let total = team.total_strength();
        assert_eq!(total, 225, "Total strength should be 225 (80+70+75)");
        
        let is_strong = team.is_strong_team();
        assert!(is_strong, "Team should be considered strong (225 > 200)");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_weak_team() {
        let team = TeamTrait::new(6, 'WeakTeam', 40, 30, 50);
        
        let total = team.total_strength();
        assert_eq!(total, 120, "Total strength should be 120 (40+30+50)");
        
        let is_strong = team.is_strong_team();
        assert!(!is_strong, "Team should not be considered strong (120 <= 200)");
    }

    #[test]
    #[available_gas(1000000)]
    fn test_complex_points_scenario() {
        let mut team = TeamTrait::new(7, 'Chelsea', 85, 80, 75);
        
        // Simulate a season
        team.add_points(3); // Win
        team.add_points(3); // Win
        team.add_points(1); // Draw
        team.add_points(3); // Win
        
        assert_eq!(team.current_league_points, 10, "Should have 10 points after 3 wins and 1 draw");
        
        // Point deduction for violation
        team.remove_points(5);
        assert_eq!(team.current_league_points, 5, "Should have 5 points after deduction");
        
        // Continue season
        team.change_current_points(25); // Multiple wins
        assert_eq!(team.current_league_points, 30, "Should have 30 points total");
    }
} 