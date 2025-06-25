# 🏆 Match Flow Implementation Guide

> **Senior Prompt Engineering Analysis:** This document provides the complete specification for implementing the dynamic match simulation system in Overgoal, including probability calculations, event generation, and player participation logic.

## 🎯 Overview

The match system simulates 90-minute football matches through a probability-based event generation system where the player can participate in key moments. The system balances team stats, player attributes, and random events to create engaging gameplay.

---

## 📊 Core Variables & Normalization

### **Normalization Formula**
All team and player stats use a consistent normalization:
- **Range:** 0.7 to 1.3 (corresponding to original values 0 to 100)
- **Formula:** `normalized_value = 0.7 + (original_value / 100) * 0.6`
- **Special cases:**
  - **Attack participation:** 0.8 to 1.2 range
  - **Defense participation:** 0.8 to 1.2 range  
  - **Player participation:** 0.7 to 1.3 range

### **Required Variables from Models**
```cairo
// From GameMatch model
match_id: u32
my_team_id: u32
opponent_team_id: u32
my_team_score: u8
opponent_team_score: u8
next_match_action: MatchAction
next_match_action_minute: u8
current_time: u8
match_status: MatchStatus
player_participation: PlayerParticipation
action_team: ActionTeam

// From Team model
offense: u32        // 0-100
defense: u32        // 0-100  
intensity: u32      // 0-100

// From Player model
stamina: u32        // 0-100
dribble: u32        // 0-100
intelligence: u32   // 0-100
team_relationship: u32  // 0-100
is_injured: bool
```

---

## 🚀 Phase 1: Match Creation

### **Location:** `MainScreen.tsx` → Cairo Contract
### **Trigger:** User clicks "Play Match" button

#### **Frontend (MainScreen.tsx):**
```typescript
const handleNewMatch = async () => {
  // Generate unique match ID
  const matchId = Date.now() % 1000000;
  
  // Find random opponent (not player's team)
  let randomOpponentId;
  do {
    randomOpponentId = Math.floor(Math.random() * 14) + 1;
  } while (randomOpponentId === player.selected_team_id);
  
  // Execute contract call
  await executeCreateGameMatch(matchId, selectedTeam.team_id, opponentTeam.team_id);
  
  // Navigate to NewMatch screen
  navigate(`/new-match/${matchId}`);
};
```

#### **Backend (Contract):**
```cairo
fn create_gamematch(mut self: Store, match_id: u32, my_team_id: u32, opponent_team_id: u32) {
    let new_gamematch = GameMatchTrait::new(match_id, my_team_id, opponent_team_id);
    // Initial state:
    // - match_status: MatchStatus::NotStarted
    // - current_time: 0
    // - my_team_score: 0, opponent_team_score: 0
    // - player_participation: PlayerParticipation::NotParticipating
    // - action_team: ActionTeam::MyTeam
    self.world.write_model(@new_gamematch);
}
```

---

## 🎮 Phase 2: Match Start & Event Generation

### **Location:** `NewMatch.tsx` → Cairo Contract
### **Trigger:** User clicks "Play Match" button in NewMatch screen

#### **Frontend Flow:**
```typescript
const handlePlayMatch = async () => {
  // Call start_gamematch contract function
  await executeStartGameMatch(currentGameMatch.match_id);
  
  // Navigate based on result:
  // - If action requires player participation → MatchDecision screen
  // - If action is AI-only → Auto-simulate and continue
  // - If match ends → MatchEnd screen
};
```

#### **Backend Implementation:**

### **Main Function: `start_gamematch`**
```cairo
fn start_gamematch(mut self: Store, match_id: u32) -> (MatchAction, u8, PlayerParticipation, ActionTeam) {
    let mut gamematch = self.read_gamematch(match_id);
    
    // Set initial match state
    gamematch.match_status = MatchStatus::InProgress;
    gamematch.current_time = 1;
    
    // Call the core event generation loop
    let (next_action, next_minute, participation, team) = self.get_next_match_action(match_id);
    
    // Update match with results
    gamematch.set_next_action(next_action, next_minute, team, participation);
    self.world.write_model(@gamematch);
    
    (next_action, next_minute, participation, team)
}
```

---

## 🎲 Core Algorithm: `get_next_match_action`

### **Main Loop Logic:**
```cairo
fn get_next_match_action(mut self: Store, match_id: u32) -> (MatchAction, u8, PlayerParticipation, ActionTeam) {
    let mut gamematch = self.read_gamematch(match_id);
    let my_team = self.read_team(gamematch.my_team_id);
    let opponent_team = self.read_team(gamematch.opponent_team_id);
    let player = self.read_player();
    
    // Constants
    let BASE_ATTACK_EVENT_PROBABILITY: u32 = 7; // 7 out of 90 minutes
    let BASE_DEFENSE_PARTICIPATION: u32 = 15; // 15% base for defense participation
    
    loop {
        // Check for half-time
        if gamematch.current_time == 45 && gamematch.match_status == MatchStatus::InProgress {
            gamematch.match_status = MatchStatus::HalfTime;
            self.world.write_model(@gamematch);
            break (MatchAction::OpenPlay, 46, PlayerParticipation::NotParticipating, ActionTeam::Neutral);
        }
        
        // Check for full-time
        if gamematch.current_time >= 90 {
            gamematch.match_status = MatchStatus::Finished;
            self.world.write_model(@gamematch);
            break (MatchAction::OpenPlay, 90, PlayerParticipation::NotParticipating, ActionTeam::Neutral);
        }
        
        // 1. CHECK MY TEAM ATTACK EVENT
        let my_attack_result = self.check_my_team_attack_event(
            &gamematch, &my_team, &opponent_team, &player
        );
        
        if my_attack_result.has_event {
            gamematch.current_time = my_attack_result.event_minute;
            if my_attack_result.player_participates {
                // Player participates - stop and wait for decision
                break (
                    my_attack_result.action_type, 
                    my_attack_result.event_minute,
                    PlayerParticipation::Participating,
                    ActionTeam::MyTeam
                );
            } else {
                // AI-only event - simulate outcome
                self.simulate_ai_attack_outcome(&mut gamematch, &my_team, my_attack_result.action_type, true);
                // Continue loop for next event
            }
        } else {
            // 2. CHECK OPPONENT TEAM ATTACK EVENT
            let opponent_attack_result = self.check_opponent_team_attack_event(
                &gamematch, &my_team, &opponent_team, &player
            );
            
            if opponent_attack_result.has_event {
                gamematch.current_time = opponent_attack_result.event_minute;
                if opponent_attack_result.player_participates {
                    // Player participates in defense - stop and wait for decision
                    break (
                        opponent_attack_result.action_type,
                        opponent_attack_result.event_minute,
                        PlayerParticipation::Participating,
                        ActionTeam::OpponentTeam
                    );
                } else {
                    // AI-only event - simulate outcome
                    self.simulate_ai_attack_outcome(&mut gamematch, &opponent_team, opponent_attack_result.action_type, false);
                    // Continue loop for next event
                }
            } else {
                // No events this minute - advance time
                gamematch.current_time += 1;
            }
        }
    }
}
```

---

## ⚽ Attack Event Generation

### **My Team Attack Logic:**
```cairo
struct AttackEventResult {
    has_event: bool,
    event_minute: u8,
    action_type: MatchAction,
    player_participates: bool,
}

fn check_my_team_attack_event(
    self: Store,
    gamematch: &GameMatch,
    my_team: &Team,
    opponent_team: &Team,
    player: &Player
) -> AttackEventResult {
    // 1. Calculate attack event probability
    let base_probability = 7; // 7/90 base chance
    let normalized_my_offense = normalize_team_stat(my_team.offense);
    let normalized_my_intensity = normalize_team_stat(my_team.intensity);
    
    let attack_probability = base_probability * normalized_my_offense * normalized_my_intensity / 100;
    
    // 2. Random check for event occurrence
    let random_value = generate_random(100); // 0-99
    if random_value >= attack_probability {
        return AttackEventResult { has_event: false, event_minute: 0, action_type: MatchAction::OpenPlay, player_participates: false };
    }
    
    // 3. Determine action type
    let action_type = self.determine_attack_action_type(my_team, player);
    
    // 4. Check player participation
    let player_participates = self.check_player_attack_participation(player);
    
    AttackEventResult {
        has_event: true,
        event_minute: gamematch.current_time,
        action_type: action_type,
        player_participates: player_participates,
    }
}

fn determine_attack_action_type(self: Store, team: &Team, player: &Player) -> MatchAction {
    let normalized_offense = normalize_team_stat(team.offense);
    let normalized_dribble = normalize_player_stat(player.dribble);
    
    // 1. Check for penalty (4% base * team_offense * player_dribble)
    let penalty_probability = 4 * normalized_offense * normalized_dribble / 100;
    if generate_random(100) < penalty_probability {
        return MatchAction::Penalty;
    }
    
    // 2. Check for free kick (18% base * player_dribble)
    let freekick_probability = 18 * normalized_dribble / 100;
    if generate_random(100) < freekick_probability {
        return MatchAction::FreeKick;
    }
    
    // 3. Default to open play
    MatchAction::OpenPlay
}

fn check_player_attack_participation(self: Store, player: &Player) -> bool {
    // Can't participate if injured or no stamina
    if player.is_injured || player.stamina == 0 {
        return false;
    }
    
    let normalized_stamina = normalize_player_stat(player.stamina);
    let normalized_intelligence = normalize_player_stat(player.intelligence);
    let normalized_relationship = normalize_player_stat(player.team_relationship);
    
    let participation_probability = 100 * normalized_stamina * normalized_intelligence * normalized_relationship / 100;
    
    generate_random(100) < participation_probability
}
```

### **Opponent Team Attack Logic:**
```cairo
fn check_opponent_team_attack_event(
    self: Store,
    gamematch: &GameMatch,
    my_team: &Team,
    opponent_team: &Team,
    player: &Player
) -> AttackEventResult {
    // Opponent attack adjusted by my team's defense
    let base_probability = 7; // 7/90 base chance
    let normalized_my_defense = normalize_team_stat(my_team.defense, true); // defense range 0.8-1.2
    let normalized_my_intensity = normalize_team_stat(my_team.intensity, true);
    let normalized_opp_offense = normalize_team_stat(opponent_team.offense);
    let normalized_opp_intensity = normalize_team_stat(opponent_team.intensity);
    
    let attack_probability = base_probability * normalized_my_defense * normalized_my_intensity 
                           * normalized_opp_offense * normalized_opp_intensity / 100;
    
    let random_value = generate_random(100);
    if random_value >= attack_probability {
        return AttackEventResult { has_event: false, event_minute: 0, action_type: MatchAction::OpenPlay, player_participates: false };
    }
    
    // Determine action type using opponent team stats
    let action_type = self.determine_attack_action_type(opponent_team, player); // Use opponent stats
    
    // Check defensive participation (15% base)
    let player_participates = self.check_player_defense_participation(player);
    
    AttackEventResult {
        has_event: true,
        event_minute: gamematch.current_time,
        action_type: action_type,
        player_participates: player_participates,
    }
}

fn check_player_defense_participation(self: Store, player: &Player) -> bool {
    if player.is_injured || player.stamina == 0 {
        return false;
    }
    
    let normalized_stamina = normalize_player_stat(player.stamina);
    let normalized_intelligence = normalize_player_stat(player.intelligence);
    
    let participation_probability = 15 * normalized_stamina * normalized_intelligence / 100;
    
    generate_random(100) < participation_probability
}
```

---

## 🎯 AI Event Simulation (No Player Participation)

```cairo
fn simulate_ai_attack_outcome(
    mut self: Store,
    gamematch: &mut GameMatch,
    attacking_team: &Team,
    action_type: MatchAction,
    is_my_team: bool
) {
    let normalized_attack = normalize_team_stat(attacking_team.offense, true); // 0.8-1.2 range
    
    let goal_probability = match action_type {
        MatchAction::Penalty => 80 * normalized_attack / 100,      // 80% base
        MatchAction::FreeKick => 10 * normalized_attack / 100,     // 10% base
        MatchAction::OpenPlay => 1 * normalized_attack / 100,      // 1% base
        _ => 1 * normalized_attack / 100,                          // Default 1%
    };
    
    if generate_random(100) < goal_probability {
        if is_my_team {
            gamematch.add_my_team_goal();
        } else {
            gamematch.add_opponent_team_goal();
        }
    }
}
```

---

## 🔧 Utility Functions

### **Normalization Functions:**
```cairo
fn normalize_team_stat(value: u32, is_defense: bool) -> u32 {
    if is_defense {
        // Defense range: 0.8 to 1.2
        80 + (value * 40 / 100)
    } else {
        // Attack range: 0.7 to 1.3
        70 + (value * 60 / 100)
    }
}

fn normalize_player_stat(value: u32) -> u32 {
    // Player range: 0.7 to 1.3
    70 + (value * 60 / 100)
}

fn generate_random(max: u32) -> u32 {
    // Implementation using block timestamp and other entropy sources
    let timestamp = get_block_timestamp();
    let seed = timestamp % max.into();
    seed.try_into().unwrap()
}
```

---

## 🖥️ Frontend Integration Patterns

### **NewMatch.tsx → Contract Integration:**
```typescript
// 1. Start match
const handlePlayMatch = async () => {
  const result = await executeStartGameMatch(matchId);
  
  // Decode result to determine next action
  const { nextAction, nextMinute, participation, team } = result;
  
  if (participation === PlayerParticipation.Participating) {
    // Navigate to decision screen
    navigate(`/match-decision/${matchId}`, { 
      state: { action: nextAction, minute: nextMinute, team } 
    });
  } else {
    // AI-only action, simulate visual and continue
    simulateActionVisually(nextAction, team);
    setTimeout(() => handlePlayMatch(), 2000); // Continue after animation
  }
};
```

### **Match Decision Flow:**
```typescript
// MatchDecision.tsx
const handlePlayerDecision = async (decision: MatchDecision) => {
  const result = await executeProcessMatchAction(matchId, decision);
  
  // Show outcome animation
  showOutcomeAnimation(result);
  
  // Continue match flow
  setTimeout(() => {
    if (result.matchStatus === MatchStatus.Finished) {
      navigate(`/match-end/${matchId}`);
    } else {
      handlePlayMatch(); // Continue to next event
    }
  }, 3000);
};
```

---

## 📊 Implementation Checklist

### **Contract Side:**
- [ ] Implement `get_next_match_action` main loop
- [ ] Add `check_my_team_attack_event` function
- [ ] Add `check_opponent_team_attack_event` function  
- [ ] Add `determine_attack_action_type` function
- [ ] Add `check_player_attack_participation` function
- [ ] Add `check_player_defense_participation` function
- [ ] Add `simulate_ai_attack_outcome` function
- [ ] Add normalization utility functions
- [ ] Add random number generation
- [ ] Update `start_gamematch` to use new logic

### **Frontend Side:**
- [ ] Update `NewMatch.tsx` to handle new contract response format
- [ ] Create `MatchDecision.tsx` screen for player choices
- [ ] Implement visual action animations
- [ ] Add match timer UI component
- [ ] Update navigation flow between screens
- [ ] Handle half-time and full-time transitions

### **Model Updates:**
- [ ] Ensure `GameMatch` model has all required fields
- [ ] Verify `Team` model has `offense`, `defense`, `intensity`
- [ ] Verify `Player` model has `stamina`, `dribble`, `intelligence`, `team_relationship`, `is_injured`

---

## 🎮 Variable Configuration

### **Easily Adjustable Constants:**
```cairo
// Event generation probabilities
const BASE_ATTACK_EVENT_PROBABILITY: u32 = 7;        // 7 out of 90 minutes
const BASE_DEFENSE_PARTICIPATION: u32 = 15;          // 15% defense participation

// Action type probabilities  
const PENALTY_BASE_PROBABILITY: u32 = 4;             // 4% base for penalties
const FREEKICK_BASE_PROBABILITY: u32 = 18;           // 18% base for free kicks

// Goal scoring probabilities
const PENALTY_GOAL_CHANCE: u32 = 80;                 // 80% penalty conversion
const FREEKICK_GOAL_CHANCE: u32 = 10;                // 10% free kick conversion  
const OPENPLAY_GOAL_CHANCE: u32 = 1;                 // 1% open play conversion

// Normalization ranges
const TEAM_ATTACK_MIN: u32 = 70;  const TEAM_ATTACK_MAX: u32 = 130;
const TEAM_DEFENSE_MIN: u32 = 80; const TEAM_DEFENSE_MAX: u32 = 120;
const PLAYER_STAT_MIN: u32 = 70;  const PLAYER_STAT_MAX: u32 = 130;
```

---

**💡 Implementation Note:** This system creates dynamic, stat-driven matches where player participation feels meaningful while maintaining realistic football flow. The probability-based approach ensures variety while respecting team and player attributes. 