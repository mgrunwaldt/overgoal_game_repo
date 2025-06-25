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