# 🎯 Plan: Refactoring the Match System for Batched Events

This document provides a complete, step-by-step guide to refactor the game's match engine.

**Current Problem:** The match progresses one action at a time, regardless of whether the player is involved. This forces the user to click "Next Action" for events they are not even part of, creating a slow and disjointed experience.

**Target Solution:** We will refactor the system to simulate all non-interactive events (AI vs. AI) in a single transaction. These events will be stored as individual models and displayed sequentially on the frontend with a timer. The game will only pause and require user input when the player is directly involved in an action, or at half-time/full-time.

**Architecture:**
```
User clicks "Process Action" → Frontend calls `process_match_action`
    ↓
Contract simulates match minute-by-minute until an interactive event is found
    ↓
For each non-interactive event found, a `MatchTimelineEvent` model is created and saved
    ↓
The final interactive event is saved in the main `GameMatch` model
    ↓
Frontend queries for `GameMatch` AND all new `MatchTimelineEvent` models
    ↓
`MatchComponent` timer starts, displaying each `MatchTimelineEvent` as its minute arrives
    ↓
Timer pauses at the interactive event minute, awaiting user decision
```

---

## 🔧 Step 1: Cairo Contract Refactor

> **Note for developer:** Use Sensei MCP for all Cairo and GraphQL code. Do not deviate from the patterns shown.

### 1.1. Create `MatchTimelineEvent` Model

First, we need a new model to store each non-interactive event that occurs during the simulation. This replaces the old approach of saving one event at a time.

In `contract/src/models/gamematch.cairo`, we will convert the `MatchActionEvent` struct into a full-fledged model named `MatchTimelineEvent`.

```cairo
// ... existing code in contract/src/models/gamematch.cairo

// ❌ REMOVE the old struct
// #[derive(Drop, Serde, Debug, Introspect)]
// pub struct MatchActionEvent { ... }

// ✅ ADD the new model
#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct MatchTimelineEvent {
    #[key]
    pub match_id: u32,
    #[key] 
    pub event_id: u32,                  // A unique, incrementing ID for each event in a match
    pub action: MatchAction,
    pub minute: u8,
    pub team: ActionTeam,
    pub description: felt252,           // e.g., "Team A scores a goal!"
}

// ... rest of the file
```

### 1.2. Update `GameMatch` Model

The `GameMatch` model needs a counter to generate unique `event_id`s for our new `MatchTimelineEvent` model.

In `contract/src/models/gamematch.cairo`, add the `event_counter` field.

```cairo
// In contract/src/models/gamematch.cairo

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct GameMatch {
    #[key]
    pub match_id: u32,                    
    pub my_team_id: u32,                  
    pub opponent_team_id: u32,            
    pub my_team_score: u8,                
    pub opponent_team_score: u8,          
    pub next_match_action: MatchAction,   
    pub next_match_action_minute: u8,
    pub current_time: u8,                 
    pub prev_time: u8,                    
    pub match_status: MatchStatus,        
    pub player_participation: PlayerParticipation,
    pub action_team: ActionTeam,
    // ✅ ADD THIS FIELD
    pub event_counter: u32,               // Counter for MatchTimelineEvent IDs
}

// ... update GameMatchTrait::new
fn new(
    match_id: u32,
    my_team_id: u32,
    opponent_team_id: u32,
) -> GameMatch {
    GameMatch {
        // ... existing initializations
        player_participation: PlayerParticipation::NotParticipating,
        action_team: ActionTeam::MyTeam,
        // ✅ INITIALIZE THE COUNTER
        event_counter: 0,
    }
}
```

### 1.3. Refactor Core Logic in `store.cairo`

This is the most critical step. We will change the logic to generate a "batch" of events at once.

In `contract/src/store.cairo`, replace `get_next_match_action` with `generate_events_until_input_required`.

```cairo
// In contract/src/store.cairo

// ❌ REMOVE the old get_next_match_action function.

// ✅ ADD this new function
fn generate_events_until_input_required(mut self: Store, match_id: u32) {
    let mut gamematch = self.read_gamematch(match_id);
    let my_team = self.read_team(gamematch.my_team_id);
    let opponent_team = self.read_team(gamematch.opponent_team_id);
    let player = self.read_player();
    
    let prev_time = gamematch.current_time;

    loop {
        // Stop if match is finished
        if gamematch.match_status == MatchStatus::Finished {
            break;
        }

        // Advance time
        gamematch.current_time += 1;

        // Check for Halftime/Endgame (these are interactive events)
        if gamematch.current_time == 45 && gamematch.match_status == MatchStatus::InProgress {
            gamematch.match_status = MatchStatus::HalfTime;
            gamematch.set_next_action(MatchAction::HalfTime, 45, ActionTeam::Neutral, PlayerParticipation::Observing);
            break; 
        }
        if gamematch.current_time >= 90 {
            gamematch.match_status = MatchStatus::Finished;
            gamematch.set_next_action(MatchAction::MatchEnd, 90, ActionTeam::Neutral, PlayerParticipation::Observing);
            break;
        }

        // Check for an opponent team attack (non-interactive)
        let opponent_attack_result = self.check_opponent_team_attack_event(gamematch.current_time, my_team, opponent_team, player);
        if opponent_attack_result.has_event {
            // It's a non-interactive event. We record it and continue simulating.
            gamematch.event_counter += 1;
            let timeline_event = MatchTimelineEvent {
                match_id: match_id,
                event_id: gamematch.event_counter,
                action: opponent_attack_result.action_type,
                minute: gamematch.current_time,
                team: ActionTeam::OpponentTeam,
                description: "Opponent team is on the attack!", // Placeholder description
            };
            self.world.write_model(@timeline_event);
            
            // We simulate the outcome (e.g., goal or miss)
            self.simulate_ai_attack_outcome(match_id, opponent_team, opponent_attack_result.action_type, false);
            // Continue the loop to the next minute
            continue;
        }

        // Check for my team attack
        let my_attack_result = self.check_my_team_attack_event(gamematch.current_time, my_team, opponent_team, player);
        if my_attack_result.has_event {
            if my_attack_result.player_participates {
                // This is an interactive event. Stop the simulation.
                gamematch.set_next_action(my_attack_result.action_type, gamematch.current_time, ActionTeam::MyTeam, PlayerParticipation::Participating);
                break; // Exit loop, wait for user input
            } else {
                // This is a non-interactive event (AI teammate). Record and continue.
                gamematch.event_counter += 1;
                let timeline_event = MatchTimelineEvent {
                    match_id: match_id,
                    event_id: gamematch.event_counter,
                    action: my_attack_result.action_type,
                    minute: gamematch.current_time,
                    team: ActionTeam::MyTeam,
                    description: "Your team is on the attack!", // Placeholder description
                };
                self.world.write_model(@timeline_event);
                self.simulate_ai_attack_outcome(match_id, my_team, my_attack_result.action_type, true);
                continue; // Continue simulation
            }
        }
        
        // No event this minute, continue loop
    };

    // Save the final state of the GameMatch, which now contains the next *interactive* action
    gamematch.prev_time = prev_time;
    self.world.write_model(@gamematch);
}

// ✅ UPDATE `process_match_action` to use the new logic
fn process_match_action(mut self: Store, match_id: u32, match_decision: MatchDecision) {
    let mut gamematch = self.read_gamematch(match_id);

    // TODO: Process player's decision here (e.g., if they chose to shoot, calculate outcome)

    // Decrement stamina for participation
    let mut player = self.read_player();
    player.remove_stamina(5); // Example cost
    self.world.write_model(@player);

    // Generate all events until the next time user input is needed
    self.generate_events_until_input_required(match_id);
}

// ✅ UPDATE `start_gamematch` similarly
fn start_gamematch(mut self: Store, match_id: u32) {
    let mut gamematch = self.read_gamematch(match_id);
    gamematch.match_status = MatchStatus::InProgress;
    gamematch.current_time = 0;
    self.world.write_model(@gamematch);

    // Generate the first batch of events
    self.generate_events_until_input_required(match_id);
}

```

### 1.4. Update `systems/game.cairo`

The system functions become much simpler as they no longer need to return complex data.

```cairo
// In contract/src/systems/game.cairo

// No more return values needed for these functions
fn start_gamematch(ref self: ContractState, match_id: u32) {
    let mut world = self.world(@"full_starter_react");
    let mut store = StoreTrait::new(world);
    store.start_gamematch(match_id);
}

fn process_match_action(ref self: ContractState, match_id: u32, match_decision: u8) {
    let mut world = self.world(@"full_starter_react");
    let mut store = StoreTrait::new(world);
    store.process_match_action(match_id, match_decision.into());
}
```

---

## 📦 Step 2: Build, Deploy, and Update Bindings

1.  **Build Contracts:** Open a terminal in the `contract/` directory and run:
    ```bash
    sozo build
    ```
2.  **Deploy & Initialize:** Run the migration to apply changes to your local devnet.
    ```bash
    sozo migrate
    ```
    *This will restart Katana and Torii, making the new `MatchTimelineEvent` model available to the GraphQL API.*
3.  **Update Bindings:** The `sozo` command should automatically update the TypeScript bindings. Verify that:
    *   `client/src/dojo/bindings.ts` contains an interface for `MatchTimelineEvent`.
    *   `client/src/dojo/contracts.gen.ts` reflects the updated, simpler signatures for `start_gamematch` and `process_match_action`.

---

## 📡 Step 3: Frontend GraphQL and Data Hooks

> **Note for developer:** Use `useNonMatchEvents.tsx` as a reference for creating a new GraphQL query.

### 3.1. Create a GraphQL Query for Timeline Events

In `client/src/dojo/hooks/useGameMatch.tsx`, we need to add a new query to fetch the `MatchTimelineEvent` models.

```typescript
// In client/src/dojo/hooks/useGameMatch.tsx

const MATCH_TIMELINE_EVENTS_QUERY = `
    query GetMatchTimelineEvents($matchId: u32!) {
        fullStarterReactMatchTimelineEventModels(where: { match_id: $matchId }, order: { direction: ASC, field: EVENT_ID }) {
            edges {
                node {
                    match_id
                    event_id
                    action
                    minute
                    team
                    description
                }
            }
        }
    }
`;
```

### 3.2. Update `useGameMatch.tsx` Hook

Modify the `fetchGameMatch` function to also fetch these new timeline events and store them.

```typescript
// In client/src/dojo/hooks/useGameMatch.tsx

// ... (add new interface)
export interface MatchTimelineEvent {
    match_id: number;
    event_id: number;
    action: number;
    minute: number;
    team: number;
    description: string;
}

// ... (update fetchGameMatch function)
const fetchGameMatch = async (matchId: number) => {
    // ... (existing code to fetch GameMatch)

    // ✅ FETCH TIMELINE EVENTS
    try {
        const eventsResponse = await fetch(TORII_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: MATCH_TIMELINE_EVENTS_QUERY,
                variables: { matchId }
            }),
        });
        const eventsResult = await eventsResponse.json();
        if (eventsResult.data?.fullStarterReactMatchTimelineEventModels?.edges) {
            const timelineEvents: MatchTimelineEvent[] = eventsResult.data.fullStarterReactMatchTimelineEventModels.edges.map((edge: any) => {
                const node = edge.node;
                return {
                    match_id: hexToNumber(node.match_id),
                    event_id: hexToNumber(node.event_id),
                    action: hexToNumber(node.action),
                    minute: hexToNumber(node.minute),
                    team: hexToNumber(node.team),
                    description: hexToString(node.description),
                };
            });
            // ✅ UPDATE ZUSTAND STORE
            useAppStore.getState().setMatchTimelineEvents(timelineEvents);
        }
    } catch (error) {
        console.error("❌ Error fetching match timeline events:", error);
    }
};
```

---

## 🗄️ Step 4: Update Zustand Store

Add a new piece of state to hold our timeline events.

In `client/src/zustand/store.ts`:

```typescript
// In client/src/zustand/store.ts

// ... (import new MatchTimelineEvent type)

interface AppState {
  // ... existing state
  matchTimelineEvents: MatchTimelineEvent[];
}

interface AppActions {
  // ... existing actions
  setMatchTimelineEvents: (events: MatchTimelineEvent[]) => void;
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      // ... existing implementation
      matchTimelineEvents: [],
      setMatchTimelineEvents: (events) => set({ matchTimelineEvents: events }),
    }),
    {
      name: "app-storage",
      // ... partialize config
    }
  )
);
```

---

## 🖥️ Step 5: Refactor `MatchComponent.tsx` UI

This is where the user sees the new, smoother flow. We will replace the old event logic with one driven by our new `MatchTimelineEvent` models.

In `client/src/components/pages/MatchComponent.tsx`:

```tsx
// In client/src/components/pages/MatchComponent.tsx

const MatchComponent = () => {
    // 1. GET NEW STATE FROM ZUSTAND
    const { matchTimelineEvents } = useAppStore();
    const [displayedEvents, setDisplayedEvents] = useState<MatchEvent[]>([]);

    // ... (other existing hooks and state)
    
    // 2. REFINE THE MAIN useEffect
    useEffect(() => {
        if (!match) return;

        const startTime = match.prev_time || match.current_time || 1;
        const targetTime = match.next_match_action_minute;
        
        setDisplayTime(startTime);
        
        // Filter for events that haven't been shown yet
        const upcomingTimelineEvents = matchTimelineEvents.filter(
            event => event.minute >= startTime && event.minute < targetTime
        );

        // Clear previously displayed events for this turn
        setDisplayedEvents([]);

        if (startTime >= targetTime) {
            setIsWaitingForAction(true);
            return;
        }

        const countUpInterval = setInterval(() => {
            setDisplayTime(prevDisplayTime => {
                const nextTime = prevDisplayTime + 1;

                // Check if any timeline event happens at this minute
                const eventsThisMinute = upcomingTimelineEvents.filter(e => e.minute === nextTime);
                if (eventsThisMinute.length > 0) {
                    const newDisplayedEvents = eventsThisMinute.map(evt => ({
                        text: `${evt.minute}' - ${evt.description}`,
                        playable: false, // Timeline events are never playable
                        team: evt.team === 0 ? "player" : "enemy"
                    }));
                    setDisplayedEvents(prev => [...prev, ...newDisplayedEvents]);
                }

                // When we reach the interactive action time, stop
                if (nextTime >= targetTime) {
                    clearInterval(countUpInterval);
                    setIsWaitingForAction(true);
                }

                return nextTime;
            });
        }, 1000); // Count up every 1 second

        return () => clearInterval(countUpInterval);
    }, [match, matchTimelineEvents, navigate]);
    
    // ...

    // 3. UPDATE RENDER LOGIC
    return (
        // ...
        <div /* eventContainerRef */>
            <ul className="text-white space-y-1 ...">
                {/* ✅ RENDER THE DYNAMICALLY DISPLAYED EVENTS */}
                {displayedEvents.map((event, index) => (
                    <MatchEventIten
                        key={index}
                        text={event.text}
                        playable={event.playable}
                        team={event.team}
                    />
                ))}
            </ul>
        </div>
        // ...
    );
};
```

---

## ✅ Step 6: Verification Checklist

- [ ] **Contract:** Does the `MatchTimelineEvent` model exist in `gamematch.cairo`?
- [ ] **Contract:** Does `GameMatch` have the `event_counter`?
- [ ] **Contract:** Is the logic in `store.cairo` updated to generate events in a loop?
- [ ] **Build:** Did `sozo build` and `sozo migrate` run successfully?
- [ ] **Bindings:** Are the new model and function signatures present in the auto-generated TypeScript files?
- [ ] **GraphQL:** Does the new `MATCH_TIMELINE_EVENTS_QUERY` work in a GraphQL client (like Torii's web UI)?
- [ ] **State:** Does the `matchTimelineEvents` array in the Zustand store get populated?
- [ ] **UI:** Does the match timer correctly display the non-interactive events from the backend as it counts up?
- [ ] **UI:** Does the match correctly pause and wait for input when an interactive event is reached?
- [ ] **Flow:** After making a decision, does the game correctly simulate the next batch of non-interactive events?

# 🔄 Match System Refactoring Plan: Batch Actions for Fluid Match Flow

## 🎯 Current State Analysis

### Current MatchAction Enum
```cairo
#[derive(Copy, Drop, Serde, Introspect, PartialEq, Debug)]
pub enum MatchAction {
    OpenPlay,      // 0
    Jumper,        // 1 
    Brawl,         // 2
    FreeKick,      // 3
    Penalty,       // 4
    OpenDefense,   // 5
}
```

### Current Flow Issues
1. **Single Action Returns**: `get_next_match_action()` returns only one action at a time
2. **Manual Timer Advancement**: Frontend manually counts up between actions
3. **Stop-Start Gameplay**: Every action requires user interaction, even AI-only events
4. **Limited Communication**: No clear signals for Half Time or Match End events

---

## 🚀 Proposed Refactoring Solution

### 🎯 **Goal**: Create fluid match experience where:
- Multiple actions are returned in batch
- AI events auto-advance without user input
- User only interacts for: **Player Participating**, **Half Time**, **Match End**
- Timer flows smoothly from action to action

---

## 📋 Step 1: Expand MatchAction Enum

### Add Special Match Events
```cairo
#[derive(Copy, Drop, Serde, Introspect, PartialEq, Debug)]
pub enum MatchAction {
    // ✅ Existing Actions
    OpenPlay,      // 0
    Jumper,        // 1 
    Brawl,         // 2
    FreeKick,      // 3
    Penalty,       // 4
    OpenDefense,   // 5
    
    // 🆕 NEW: Special Match Events
    HalfTime,      // 6 - Signals halftime break
    MatchEnd,      // 7 - Signals match finished
}
```

### Update Felt252 Conversion
```cairo
impl MatchActionIntoFelt252 of Into<MatchAction, felt252> {
    fn into(self: MatchAction) -> felt252 {
        match self {
            MatchAction::OpenPlay => 0,
            MatchAction::Jumper => 1,
            MatchAction::Brawl => 2,
            MatchAction::FreeKick => 3,
            MatchAction::Penalty => 4,
            MatchAction::OpenDefense => 5,
            MatchAction::HalfTime => 6,        // 🆕 NEW
            MatchAction::MatchEnd => 7,        // 🆕 NEW
        }
    }
}
```

---

## 📋 Step 2: Create Batch Action Structure

### New Model: MatchActionBatch
```cairo
// File: contract/src/models/gamematch.cairo

#[derive(Drop, Serde, Debug)]
pub struct MatchActionEvent {
    pub action: MatchAction,
    pub minute: u8,
    pub team: ActionTeam,
    pub player_participation: PlayerParticipation,
}

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct MatchActionBatch {
    #[key]
    pub match_id: u32,
    #[key] 
    pub batch_id: u32,                    // Incremental batch identifier
    pub actions: Array<MatchActionEvent>, // List of actions in this batch
    pub actions_count: u8,                // Number of actions (for efficient reading)
    pub final_current_time: u8,           // Time after all actions processed
    pub final_prev_time: u8,              // Starting time for this batch
    pub requires_user_input: bool,        // True if last action needs user input
    pub created_timestamp: u64,           // When batch was created
}

#[generate_trait]
pub impl MatchActionBatchImpl of MatchActionBatchTrait {
    fn new(match_id: u32, batch_id: u32) -> MatchActionBatch {
        MatchActionBatch {
            match_id,
            batch_id,
            actions: ArrayTrait::new(),
            actions_count: 0,
            final_current_time: 0,
            final_prev_time: 0,
            requires_user_input: false,
            created_timestamp: get_block_timestamp(),
        }
    }

    fn add_action(
        ref self: MatchActionBatch, 
        action: MatchAction, 
        minute: u8, 
        team: ActionTeam, 
        participation: PlayerParticipation
    ) {
        let event = MatchActionEvent {
            action,
            minute,
            team,
            player_participation: participation,
        };
        self.actions.append(event);
        self.actions_count += 1;
    }

    fn set_final_state(
        ref self: MatchActionBatch, 
        current_time: u8, 
        prev_time: u8, 
        requires_input: bool
    ) {
        self.final_current_time = current_time;
        self.final_prev_time = prev_time;
        self.requires_user_input = requires_input;
    }
}
```

---

## 📋 Step 3: Refactor Core Match Logic

### Updated get_next_match_action Function
```cairo
// File: contract/src/store.cairo

fn get_next_match_action(mut self: Store, match_id: u32) -> MatchActionBatch {
    let mut gamematch = self.read_gamematch(match_id);
    let my_team = self.read_team(gamematch.my_team_id);
    let opponent_team = self.read_team(gamematch.opponent_team_id);
    let player = self.read_player();
    
    // Create new batch
    let batch_id = self.get_next_batch_id(match_id);
    let mut batch = MatchActionBatchTrait::new(match_id, batch_id);
    
    // Save starting time
    let start_time = gamematch.current_time;
    
    loop {
        // 🆕 CHECK FOR HALF TIME
        if gamematch.current_time == 45 && gamematch.match_status == MatchStatus::InProgress {
            batch.add_action(
                MatchAction::HalfTime, 
                45, 
                ActionTeam::Neutral, 
                PlayerParticipation::NotParticipating
            );
            gamematch.match_status = MatchStatus::HalfTime;
            
            // Half time requires user acknowledgment
            batch.set_final_state(gamematch.current_time, start_time, true);
            break;
        }
        
        // 🆕 CHECK FOR MATCH END  
        if gamematch.current_time >= 90 {
            batch.add_action(
                MatchAction::MatchEnd, 
                90, 
                ActionTeam::Neutral, 
                PlayerParticipation::NotParticipating
            );
            gamematch.match_status = MatchStatus::Finished;
            
            // Match end requires user acknowledgment
            batch.set_final_state(gamematch.current_time, start_time, true);
            break;
        }
        
        // Check for regular match events
        let my_attack_result = self.check_my_team_attack_event(
            gamematch.current_time, my_team, opponent_team, player
        );
        
        if my_attack_result.has_event {
            batch.add_action(
                my_attack_result.action_type,
                my_attack_result.event_minute,
                ActionTeam::MyTeam,
                if my_attack_result.player_participates { 
                    PlayerParticipation::Participating 
                } else { 
                    PlayerParticipation::NotParticipating 
                }
            );
            
            // 🔑 KEY LOGIC: Only stop if player participates
            if my_attack_result.player_participates {
                batch.set_final_state(gamematch.current_time, start_time, true);
                break;
            }
            // Otherwise, continue loop to collect more actions
        }
        
        let opponent_attack_result = self.check_opponent_team_attack_event(
            gamematch.current_time, my_team, opponent_team, player
        );
        
        if opponent_attack_result.has_event {
            batch.add_action(
                opponent_attack_result.action_type,
                opponent_attack_result.event_minute, 
                ActionTeam::OpponentTeam,
                if opponent_attack_result.player_participates { 
                    PlayerParticipation::Participating 
                } else { 
                    PlayerParticipation::NotParticipating 
                }
            );
            
            // 🔑 KEY LOGIC: Only stop if player participates
            if opponent_attack_result.player_participates {
                batch.set_final_state(gamematch.current_time, start_time, true);
                break;
            }
            // Otherwise, continue loop to collect more actions
        }
        
        // No events this minute - advance time
        gamematch.current_time += 1;
        
        // 🚫 SAFETY: Prevent infinite loops  
        if batch.actions_count >= 10 || (gamematch.current_time - start_time) >= 20 {
            batch.set_final_state(gamematch.current_time, start_time, false);
            break;
        }
    }
    
    // Save batch to storage
    self.world.write_model(@batch);
    
    // Update gamematch with final state
    gamematch.current_time = batch.final_current_time;
    gamematch.prev_time = batch.final_prev_time;
    self.world.write_model(@gamematch);
    
    batch
}
```

### Updated Store Helper Functions
```cairo
// File: contract/src/store.cairo

fn get_next_batch_id(self: Store, match_id: u32) -> u32 {
    // Simple implementation: use timestamp + match_id for uniqueness
    let timestamp = get_block_timestamp();
    (timestamp % 1000000).try_into().unwrap() + match_id
}

fn read_match_action_batch(self: Store, match_id: u32, batch_id: u32) -> MatchActionBatch {
    self.world.read_model((match_id, batch_id))
}
```

### Updated process_match_action Function  
```cairo
// File: contract/src/store.cairo

fn process_match_action(mut self: Store, match_id: u32, match_decision: MatchDecision) -> MatchActionBatch {
    let mut gamematch = self.read_gamematch(match_id);
    
    // Process the current action (TODO - expanded later with real logic)
    // For now, just advance to next batch
    
    // Get next batch of actions
    let batch = self.get_next_match_action(match_id);
    
    batch
}
```

---

## 📋 Step 4: Update System Layer

### Updated Contract Interface
```cairo
// File: contract/src/systems/game.cairo

#[starknet::interface]
pub trait IGame<T> {
    // ... existing functions ...
    
    // 🆕 UPDATED: Return batch instead of single values
    fn start_gamematch(ref self: T, match_id: u32) -> MatchActionBatch;
    fn process_match_action(ref self: T, match_id: u32, match_decision: u8) -> MatchActionBatch;
    
    // 🆕 NEW: Batch retrieval functions
    fn get_match_action_batch(self: @T, match_id: u32, batch_id: u32) -> MatchActionBatch;
}
```

### Updated System Implementation
```cairo
// File: contract/src/systems/game.cairo

#[abi(embed_v0)]
impl GameImpl of IGame<ContractState> {
    fn start_gamematch(ref self: ContractState, match_id: u32) -> MatchActionBatch {
        let mut world = self.world(@"full_starter_react");
        let store = StoreTrait::new(world);

        // Start match and get first batch of actions
        let batch = store.start_gamematch(match_id);
        
        // 🆕 NEW: Emit batch event for frontend indexing
        world.emit_event(@MatchActionBatchCreated {
            match_id,
            batch_id: batch.batch_id,
            actions_count: batch.actions_count,
            requires_user_input: batch.requires_user_input,
        });
        
        batch
    }

    fn process_match_action(ref self: ContractState, match_id: u32, match_decision: u8) -> MatchActionBatch {
        let mut world = self.world(@"full_starter_react");
        let store = StoreTrait::new(world);

        let decision: MatchDecision = match_decision.into();
        let batch = store.process_match_action(match_id, decision);
        
        // 🆕 NEW: Emit batch event for frontend indexing
        world.emit_event(@MatchActionBatchCreated {
            match_id,
            batch_id: batch.batch_id,
            actions_count: batch.actions_count,
            requires_user_input: batch.requires_user_input,
        });
        
        batch
    }

    fn get_match_action_batch(self: @ContractState, match_id: u32, batch_id: u32) -> MatchActionBatch {
        let world = self.world(@"full_starter_react");
        let store = StoreTrait::new(world);
        store.read_match_action_batch(match_id, batch_id)
    }
}

// 🆕 NEW: Custom Event for Batch Creation
#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct MatchActionBatchCreated {
    #[key]
    pub match_id: u32,
    #[key]
    pub batch_id: u32,
    pub actions_count: u8,
    pub requires_user_input: bool,
}
```

---

## 📋 Step 5: Frontend Data Layer Updates

### Update TypeScript Bindings
```typescript
// File: client/src/dojo/bindings.ts

export enum MatchAction {
  OpenPlay = 0,
  Jumper = 1,
  Brawl = 2,
  FreeKick = 3,
  Penalty = 4,
  OpenDefense = 5,
  HalfTime = 6,      // 🆕 NEW
  MatchEnd = 7,      // 🆕 NEW
}

export interface MatchActionEvent {
  action: number;
  minute: number;
  team: number;
  player_participation: number;
}

export interface MatchActionBatch {
  match_id: number;
  batch_id: number;
  actions: MatchActionEvent[];
  actions_count: number;
  final_current_time: number;
  final_prev_time: number;
  requires_user_input: boolean;
  created_timestamp: number;
}
```

### Update Zustand Store  
```typescript
// File: client/src/zustand/store.ts

interface AppState {
  // ... existing state ...
  
  // 🆕 NEW: Batch management
  currentMatchBatch: MatchActionBatch | null;
  matchActionHistory: MatchActionBatch[];
  processingBatch: boolean;
}

interface AppActions {
  // ... existing actions ...
  
  // 🆕 NEW: Batch actions
  setCurrentMatchBatch: (batch: MatchActionBatch | null) => void;
  addMatchActionBatch: (batch: MatchActionBatch) => void;
  setProcessingBatch: (processing: boolean) => void;
  clearMatchHistory: () => void;
}
```

---

## 📋 Step 6: Frontend Hook Updates

### New Hook: useMatchActionBatch
```typescript
// File: client/src/dojo/hooks/useMatchActionBatch.tsx

export const useMatchActionBatch = () => {
    const { fetchGameMatch } = useGameMatch();
    
    const BATCH_QUERY = `
        query GetMatchActionBatch($matchId: u32!, $batchId: u32!) {
            fullStarterReactMatchActionBatchModels(
                where: { 
                    match_id: $matchId, 
                    batch_id: $batchId 
                }
            ) {
                edges {
                    node {
                        match_id
                        batch_id
                        actions
                        actions_count
                        final_current_time
                        final_prev_time
                        requires_user_input
                        created_timestamp
                    }
                }
            }
        }
    `;

    const fetchMatchActionBatch = async (matchId: number, batchId: number): Promise<MatchActionBatch | null> => {
        try {
            const response = await fetch(TORII_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: BATCH_QUERY,
                    variables: { matchId, batchId }
                }),
            });

            const result = await response.json();

            if (!result.data?.fullStarterReactMatchActionBatchModels?.edges?.length) {
                return null;
            }

            const rawData = result.data.fullStarterReactMatchActionBatchModels.edges[0].node;
            
            // Convert hex values and parse actions array
            return {
                match_id: hexToNumber(rawData.match_id),
                batch_id: hexToNumber(rawData.batch_id),
                actions: parseActionsArray(rawData.actions), // Custom parser for Array<MatchActionEvent>
                actions_count: hexToNumber(rawData.actions_count),
                final_current_time: hexToNumber(rawData.final_current_time),
                final_prev_time: hexToNumber(rawData.final_prev_time), 
                requires_user_input: hexToBoolean(rawData.requires_user_input),
                created_timestamp: hexToNumber(rawData.created_timestamp),
            };

        } catch (error) {
            console.error("❌ Error fetching match action batch:", error);
            throw error;
        }
    };

    return { fetchMatchActionBatch };
};

// Helper function to parse actions array from GraphQL
const parseActionsArray = (rawActions: any): MatchActionEvent[] => {
    if (!rawActions || !Array.isArray(rawActions)) return [];
    
    return rawActions.map(action => ({
        action: hexToNumber(action.action),
        minute: hexToNumber(action.minute),
        team: hexToNumber(action.team),
        player_participation: hexToNumber(action.player_participation),
    }));
};
```

### Updated useStartGameMatchAction Hook
```typescript
// File: client/src/dojo/hooks/useStartGameMatchAction.tsx

export const useStartGameMatchAction = () => {
    const { account } = useAccount();
    const { client } = useDojoSDK();
    const navigate = useNavigate();
    const { fetchGameMatch } = useGameMatch();
    const { fetchMatchActionBatch } = useMatchActionBatch();
    const { setCurrentMatchBatch, setProcessingBatch } = useAppStore();

    const execute = useCallback(async (matchId: number) => {
        if (!account || !client) {
            throw new Error("No account connected");
        }

        try {
            setProcessingBatch(true);
            
            // 1️⃣ EXECUTE CONTRACT TRANSACTION - now returns batch
            console.log("🏁 [START_MATCH] Starting match...", { matchId });
            const tx = await client!.game.startGamematch(account, matchId);

            if (tx && tx.code === "SUCCESS") {
                console.log("✅ [START_MATCH] Transaction successful");
                
                // 2️⃣ WAIT FOR INDEXING  
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 3️⃣ FETCH UPDATED MATCH DATA
                await fetchGameMatch(matchId);

                // 4️⃣ FETCH FIRST ACTION BATCH (batch_id from transaction response)
                const batchId = tx.batch_id; // Assuming contract returns batch_id
                const batch = await fetchMatchActionBatch(matchId, batchId);
                
                if (batch) {
                    setCurrentMatchBatch(batch);
                    console.log("📦 [START_MATCH] First batch received:", {
                        actionsCount: batch.actions_count,
                        requiresInput: batch.requires_user_input,
                        actions: batch.actions
                    });
                }

                // 5️⃣ NAVIGATE TO MATCH SCREEN
                navigate(`/match/${matchId}`);

            } else {
                throw new Error(`Transaction failed: ${tx?.code}`);
            }
        } catch (error) {
            console.error("❌ [START_MATCH] Failed:", error);
            throw error;
        } finally {
            setProcessingBatch(false);
        }
    }, [account, client, navigate, fetchGameMatch, fetchMatchActionBatch, setCurrentMatchBatch, setProcessingBatch]);

    return { execute };
};
```

### Updated useProcessMatchAction Hook
```typescript
// File: client/src/dojo/hooks/useProcessMatchAction.tsx

export const useProcessMatchAction = () => {
    const { account } = useAccount();
    const { client } = useDojoSDK();
    const { fetchGameMatch } = useGameMatch();
    const { fetchMatchActionBatch } = useMatchActionBatch();
    const { setCurrentMatchBatch, addMatchActionBatch, setProcessingBatch } = useAppStore();

    const execute = useCallback(async (matchId: number, decision?: number) => {
        if (!account || !client) {
            throw new Error("No account connected");
        }

        try {
            setProcessingBatch(true);
            
            // 1️⃣ EXECUTE CONTRACT TRANSACTION
            console.log("⚡ [PROCESS_ACTION] Processing action...", { matchId, decision });
            const tx = await client!.game.processMatchAction(account, matchId, decision || 0);

            if (tx && tx.code === "SUCCESS") {
                // 2️⃣ WAIT FOR INDEXING
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 3️⃣ FETCH UPDATED MATCH DATA  
                await fetchGameMatch(matchId);

                // 4️⃣ FETCH NEW ACTION BATCH
                const batchId = tx.batch_id; // From transaction response
                const batch = await fetchMatchActionBatch(matchId, batchId);
                
                if (batch) {
                    setCurrentMatchBatch(batch);
                    addMatchActionBatch(batch); // Add to history
                    
                    console.log("📦 [PROCESS_ACTION] New batch received:", {
                        actionsCount: batch.actions_count,
                        requiresInput: batch.requires_user_input,
                        finalTime: batch.final_current_time
                    });
                }

            } else {
                throw new Error(`Transaction failed: ${tx?.code}`);
            }
        } catch (error) {
            console.error("❌ [PROCESS_ACTION] Failed:", error);
            throw error;
        } finally {
            setProcessingBatch(false);
        }
    }, [account, client, fetchGameMatch, fetchMatchActionBatch, setCurrentMatchBatch, addMatchActionBatch, setProcessingBatch]);

    return { execute };
};
```

---

## 📋 Step 7: Frontend Component Refactor

### Updated MatchComponent Logic
```typescript
// File: client/src/components/pages/MatchComponent.tsx

const MatchComponent = () => {
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [displayTime, setDisplayTime] = useState<number>(1);
  const [isWaitingForAction, setIsWaitingForAction] = useState(false);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  
  const navigate = useNavigate();
  const { matchId } = useParams();
  const { currentMatch, currentMatchBatch, processingBatch } = useAppStore();
  const { execute: processNextAction } = useProcessMatchAction();

  // 🆕 NEW: Batch Processing Logic
  useEffect(() => {
    if (!currentMatchBatch || !currentMatchBatch.actions.length) return;
    
    console.log("📦 [MATCH_FLOW] Processing batch:", {
      actionsCount: currentMatchBatch.actions_count,
      requiresInput: currentMatchBatch.requires_user_input,
      startTime: currentMatchBatch.final_prev_time,
      endTime: currentMatchBatch.final_current_time
    });

    // Start processing actions from the batch
    processBatchActions();
  }, [currentMatchBatch]);

  const processBatchActions = async () => {
    if (!currentMatchBatch) return;
    
    setIsProcessingBatch(true);
    setDisplayTime(currentMatchBatch.final_prev_time);
    
    for (let i = 0; i < currentMatchBatch.actions.length; i++) {
      const action = currentMatchBatch.actions[i];
      
      console.log("🎬 [MATCH_FLOW] Processing action:", {
        index: i,
        action: getActionText(action.action),
        minute: action.minute,
        playerParticipating: action.player_participation === 1
      });

      // Animate timer to action minute
      await animateTimerToMinute(action.minute);
      
      // Add event to match events list
      const newEvent: MatchEvent = {
        text: getActionText(action.action),
        playable: action.player_participation === 1,
        team: action.team === 0 ? "player" : "enemy"
      };
      
      setMatchEvents(prev => [...prev, newEvent]);
      
      // 🔑 KEY DECISION: Stop for user input or continue?
      if (shouldStopForUserInput(action)) {
        console.log("⏸️ [MATCH_FLOW] Stopping for user input");
        setIsWaitingForAction(true);
        setCurrentActionIndex(i);
        break;
      } else {
        // AI action - small delay for visual effect, then continue
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setIsProcessingBatch(false);
    
    // If we processed all actions without stopping, check if we need more
    if (!currentMatchBatch.requires_user_input) {
      // Auto-continue - fetch next batch
      await processNextAction(parseInt(matchId || "0"));
    }
  };

  const shouldStopForUserInput = (action: MatchActionEvent): boolean => {
    // Stop for: Player Participating, Half Time, or Match End
    return action.player_participation === 1 ||  // Participating
           action.action === 6 ||                // HalfTime
           action.action === 7;                  // MatchEnd
  };

  const animateTimerToMinute = (targetMinute: number): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = displayTime;
      const duration = Math.abs(targetMinute - startTime) * 200; // 200ms per minute
      
      let currentTime = startTime;
      const interval = setInterval(() => {
        currentTime += 1;
        setDisplayTime(currentTime);
        
        if (currentTime >= targetMinute) {
          clearInterval(interval);
          resolve();
        }
      }, duration / Math.abs(targetMinute - startTime));
    });
  };

  const handleNextAction = async () => {
    if (!isWaitingForAction) return;
    
    try {
      setIsWaitingForAction(false);
      
      // Continue processing remaining actions in current batch
      const remainingActions = currentMatchBatch!.actions.slice(currentActionIndex + 1);
      
      if (remainingActions.length > 0) {
        // Process remaining actions in current batch
        // (Logic similar to processBatchActions but for remaining items)
        
      } else {
        // Fetch next batch of actions
        await processNextAction(parseInt(matchId || "0"));
      }
      
    } catch (error) {
      console.error("❌ [HANDLE_ACTION] Failed:", error);
    }
  };

  const getActionText = (action: number): string => {
    switch (action) {
      case 0: return "Open Play continues";
      case 1: return "Player jumps for the ball";
      case 2: return "Brawl breaks out";
      case 3: return "Free Kick opportunity";
      case 4: return "Penalty awarded";
      case 5: return "Defensive play";
      case 6: return "🕐 HALF TIME - Take a break"; // 🆕 NEW
      case 7: return "⏱️ FULL TIME - Match finished"; // 🆕 NEW
      default: return "Match action";
    }
  };

  // Handle special actions (Half Time, Match End)
  useEffect(() => {
    if (!currentMatchBatch) return;
    
    const lastAction = currentMatchBatch.actions[currentMatchBatch.actions.length - 1];
    if (!lastAction) return;
    
    // Navigate to appropriate screen for special actions
    if (lastAction.action === 7) { // MatchEnd
      console.log("🏁 [MATCH_FLOW] Match ended, navigating to results");
      setTimeout(() => navigate(`/match-end/${matchId}`), 2000);
    }
  }, [currentMatchBatch, navigate, matchId]);

  // ... rest of component render logic ...
};
```

---

## 📋 Step 8: GraphQL & Data Indexing

### Torii Configuration Updates
```toml
# File: contract/torii_config.toml

# Add new model to indexing
[[models]]
name = "MatchActionBatch"
namespace = "full_starter_react"

[[events]]  
name = "MatchActionBatchCreated"
namespace = "full_starter_react"
```

### Expected GraphQL Schema
```graphql
# Auto-generated by Torii

type MatchActionEvent {
  action: Int!
  minute: Int!
  team: Int!
  player_participation: Int!
}

type MatchActionBatch {
  match_id: String!
  batch_id: String!
  actions: [MatchActionEvent!]!
  actions_count: String!
  final_current_time: String!
  final_prev_time: String!
  requires_user_input: String!
  created_timestamp: String!
}

type Query {
  fullStarterReactMatchActionBatchModels(
    where: MatchActionBatchFilter
  ): MatchActionBatchConnection!
}
```

---

## 📋 Step 9: Implementation Sequence

### Phase 1: Contract Updates
1. ✅ Add `HalfTime` and `MatchEnd` to `MatchAction` enum
2. ✅ Create `MatchActionBatch` model and traits
3. ✅ Refactor `get_next_match_action()` to return batches
4. ✅ Update `process_match_action()` function
5. ✅ Add batch storage and retrieval functions
6. ✅ Update system layer with new signatures
7. ✅ Add custom events for batch creation
8. ✅ Test contract compilation

### Phase 2: Frontend Data Layer
1. ✅ Update TypeScript bindings
2. ✅ Create `useMatchActionBatch` hook
3. ✅ Update Zustand store for batch management
4. ✅ Update existing hooks to handle batches
5. ✅ Test GraphQL queries

### Phase 3: Frontend Components
1. ✅ Refactor `MatchComponent` for batch processing
2. ✅ Implement smooth timer animations
3. ✅ Add logic for selective user interactions
4. ✅ Handle special actions (Half Time, Match End)
5. ✅ Test end-to-end flow

### Phase 4: Testing & Polish
1. ✅ Comprehensive testing of batch processing
2. ✅ Performance optimization for large batches
3. ✅ Error handling and edge cases
4. ✅ UI/UX polish for smooth transitions

---

## 🎯 Expected Benefits

### For Users
- **Fluid Experience**: No more manual timer advancement
- **Engaging Gameplay**: Only interact when meaningful
- **Clear Communication**: Obvious Half Time and Match End signals
- **Natural Flow**: AI events auto-advance, player events pause

### For Developers  
- **Batch Efficiency**: Process multiple actions in single transaction
- **Clear Architecture**: Separation between AI and player actions
- **Extensible Design**: Easy to add new action types
- **Better Data Management**: Structured action history

### Performance Improvements
- **Reduced Transactions**: Batch processing reduces blockchain calls
- **Smoother UI**: Predictable timer animations
- **Better State Management**: Clear action history and batching
- **Optimized Indexing**: Efficient GraphQL queries for batches

---

## 🚨 Considerations & Risks

### Data Structure Complexity
- **Array Handling**: Cairo Arrays require careful memory management
- **GraphQL Parsing**: Complex nested data structures need robust parsing
- **Storage Costs**: Larger model storage due to batch data

### Frontend State Management
- **Batch Processing Logic**: Complex state transitions during batch processing
- **Timer Synchronization**: Ensuring timer accuracy during animations
- **Error Recovery**: Handling partial batch failures

### Migration Strategy
- **Backward Compatibility**: Ensure existing matches continue to work
- **Data Migration**: Convert existing match data if needed
- **Phased Rollout**: Test with limited users first

---

## 📚 Reference Implementation

This refactoring follows the established pattern from:
- **Non-Match Events**: Similar batch-like processing in `useExecuteNonMatchEventAction`
- **Player Event History**: Data persistence and retrieval patterns
- **Zustand Store**: State management patterns for complex data
- **GraphQL Integration**: Hex conversion and data transformation patterns

The implementation maintains consistency with existing codebase patterns while providing the requested fluid match experience. 