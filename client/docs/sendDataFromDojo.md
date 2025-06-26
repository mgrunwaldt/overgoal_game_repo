# 📡 Sending Data from Dojo Contracts to Frontend: Complete Implementation Template

> **Senior Prompt Engineering Analysis:** This document templates the complete workflow implemented for the PlayerEventHistory feature, providing a reusable pattern for sending complex data from Cairo contracts to React frontend components.

## 🎯 Problem Statement Solved

**Original Challenge:** User needed to get the most current non-match event outcome for display in `NonMatchResult.tsx` component.

**Solution Architecture:** Implemented a PlayerEventHistory model that tracks the last executed event and outcome, eliminating the need for complex polling or temporary state management.

---

## 🏗️ Architecture Overview

```
User Clicks Event → Frontend Hook Calls Contract → Contract Executes Random Logic 
    ↓
Contract Updates Player Stats → Contract Creates/Updates PlayerEventHistory → Contract Emits Custom Event
    ↓
Frontend Waits for Transaction → Frontend Queries PlayerEventHistory → Frontend Gets Last Outcome ID
    ↓
Frontend Fetches Specific Outcome Data → Frontend Displays Results
```

**Key Design Decisions:**
1. **Single Source of Truth**: PlayerEventHistory model stores the exact outcome ID that was randomly selected
2. **No Polling Loops**: Direct GraphQL query to get the latest data
3. **Hex Data Handling**: Automatic conversion from hex to readable strings/numbers
4. **Optimistic Updates**: Frontend immediately shows feedback while blockchain confirms

---

## 🔧 Implementation Pattern

### 📦 Step 1: Contract-Side Model Creation

#### A) Create Tracking Model
```cairo
// File: contract/src/models/player.cairo
#[derive(Copy, Drop, Serde, Introspect, Debug)]
#[dojo::model]
pub struct PlayerEventHistory {
    #[key]
    pub player: ContractAddress,
    pub last_event_id: u32,
    pub last_outcome_id: u32,
    pub last_execution_timestamp: u64,
}

#[generate_trait]
pub impl PlayerEventHistoryImpl of PlayerEventHistoryTrait {
    fn new(
        player: ContractAddress,
        last_event_id: u32,
        last_outcome_id: u32,
        last_execution_timestamp: u64,
    ) -> PlayerEventHistory {
        PlayerEventHistory {
            player: player,
            last_event_id: last_event_id,
            last_outcome_id: last_outcome_id,
            last_execution_timestamp: last_execution_timestamp,
        }
    }

    fn update_last_event(
        ref self: PlayerEventHistory,
        event_id: u32,
        outcome_id: u32,
        timestamp: u64,
    ) {
        self.last_event_id = event_id;
        self.last_outcome_id = outcome_id;
        self.last_execution_timestamp = timestamp;
    }
}
```

#### B) Add Store Layer Support
```cairo
// File: contract/src/store.cairo
fn read_player_event_history(self: Store, player: starknet::ContractAddress) -> PlayerEventHistory {
    self.world.read_model(player)
}

// In your main action function:
fn execute_non_match_event(ref self: Store, event_id: u32) -> (u32, felt252, felt252) {
    // ... existing logic ...
    
    // ✅ CREATE/UPDATE TRACKING MODEL
    let mut event_history = PlayerEventHistoryTrait::new(
        player,
        event_id,
        outcome_id_u32,
        timestamp,
    );
    self.world.write_model(@event_history);
    
    // Return outcome data for immediate use
    (outcome_id_u32, outcome.name, outcome.description)
}
```

#### C) Add System Layer Event Emission
```cairo
// File: contract/src/systems/game.cairo
#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct PlayerEventHistoryUpdated {
    #[key]
    pub player: ContractAddress,
    pub last_event_id: u32,
    pub last_outcome_id: u32,
    pub last_execution_timestamp: u64,
}

// In your system function:
fn execute_non_match_event(ref self: ContractState, event_id: u32) -> (u32, felt252, felt252) {
    let mut world = self.world(@"full_starter_react");
    let mut store = StoreTrait::new(world);
    
    let player = store.read_player();
    
    // Execute the logic and get outcome data
    let (outcome_id, outcome_name, outcome_description) = store.execute_non_match_event(event_id);
    
    // ✅ EMIT CUSTOM EVENT FOR INDEXING
    world.emit_event(@PlayerEventHistoryUpdated { 
        player: player.owner, 
        last_event_id: event_id,
        last_outcome_id: outcome_id,
        last_execution_timestamp: get_block_timestamp(),
    });
    
    // Return outcome data
    (outcome_id, outcome_name, outcome_description)
}
```

---

### 📡 Step 2: Frontend Data Fetching

#### A) Update TypeScript Bindings
```typescript
// File: client/src/dojo/bindings.ts
export interface PlayerEventHistory {
    player: string;
    last_event_id: number;
    last_outcome_id: number;
    last_execution_timestamp: number;
}

export const schema: SchemaType = {
    full_starter_react: {
        // ... existing models ...
        PlayerEventHistory: {
            player: "",
            last_event_id: 0,
            last_outcome_id: 0,
            last_execution_timestamp: 0,
        },
    },
};
```

#### B) Create GraphQL Query Hook
```typescript
// File: client/src/dojo/hooks/usePlayer.tsx
const PLAYER_EVENT_HISTORY_QUERY = `
    query GetPlayerEventHistory($playerOwner: ContractAddress!) {
        fullStarterReactPlayerEventHistoryModels(where: { player: $playerOwner }) {
            edges {
                node {
                    player
                    last_event_id
                    last_outcome_id
                    last_execution_timestamp
                }
            }
        }
    }
`;

export const fetchPlayerEventHistory = async (playerOwner: string): Promise<{ last_event_id: number; last_outcome_id: number; last_execution_timestamp: number } | null> => {
    try {
        const response = await fetch(TORII_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: PLAYER_EVENT_HISTORY_QUERY,
                variables: { playerOwner }
            }),
        });

        const result = await response.json();

        if (!result.data?.fullStarterReactPlayerEventHistoryModels?.edges?.length) {
            return null;
        }

        const rawHistoryData = result.data.fullStarterReactPlayerEventHistoryModels.edges[0].node;

        // ✅ CRITICAL: Convert hex values to numbers
        return {
            last_event_id: hexToNumber(rawHistoryData.last_event_id),
            last_outcome_id: hexToNumber(rawHistoryData.last_outcome_id),
            last_execution_timestamp: hexToNumber(rawHistoryData.last_execution_timestamp),
        };

    } catch (error) {
        console.error("❌ Error fetching player event history:", error);
        throw error;
    }
};
```

#### C) Implement Action Hook with Data Flow
```typescript
// File: client/src/dojo/hooks/useExecuteNonMatchEventAction.tsx
export const useExecuteNonMatchEventAction = () => {
    const { account } = useAccount();
    const { client } = useDojoSDK();
    const navigate = useNavigate();
    const { setLastNonMatchOutcome } = useAppStore();
    const { refetch: refetchPlayer } = usePlayer();

    const execute = useCallback(async (eventId: number) => {
        if (!account || !client) {
            throw new Error("No account connected");
        }

        try {
            // 1️⃣ EXECUTE CONTRACT TRANSACTION
            const tx = await client!.game.executeNonMatchEvent(account, eventId);

            if (tx && tx.code === "SUCCESS") {
                // 2️⃣ WAIT FOR INDEXING
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 3️⃣ REFETCH PLAYER DATA (for updated stats)
                await refetchPlayer();

                // 4️⃣ FETCH TRACKING MODEL
                const eventHistory = await fetchPlayerEventHistory(account.address);
                if (!eventHistory) {
                    throw new Error("No event history found for player");
                }

                // 5️⃣ FETCH SPECIFIC OUTCOME USING TRACKED IDs
                const outcomes = await fetchNonMatchEventOutcomes(eventHistory.last_event_id);
                const specificOutcome = outcomes.find(outcome => 
                    outcome.outcome_id === eventHistory.last_outcome_id
                );

                if (!specificOutcome) {
                    throw new Error(`No outcome found for event_id: ${eventHistory.last_event_id}, outcome_id: ${eventHistory.last_outcome_id}`);
                }

                // 6️⃣ UPDATE GLOBAL STATE
                setLastNonMatchOutcome(specificOutcome);

                // 7️⃣ NAVIGATE TO RESULTS
                await new Promise(resolve => setTimeout(resolve, 500));
                navigate('/non-match-result');

            } else {
                throw new Error(`Transaction failed: ${tx?.code}`);
            }
        } catch (error) {
            console.error("Transaction execution failed:", error);
            throw error;
        }
    }, [account, client, navigate, setLastNonMatchOutcome, refetchPlayer]);

    return { execute };
};
```

---

### 🖥️ Step 3: Frontend Display Component

#### A) Component with Dynamic Data Display
```tsx
// File: client/src/components/pages/NonMatchResult.tsx
const NonMatchResult = () => {
    const { player, last_non_match_outcome } = useAppStore();
    const navigate = useNavigate();

    // ✅ HELPER FUNCTION FOR COLOR CODING
    const getDeltaColor = (delta: number): string => {
        if (delta > 0) return "text-green-400";
        if (delta < 0) return "text-red-400";
        return "text-white";
    };

    // ✅ DYNAMIC STATS FILTERING
    const allStats = player && last_non_match_outcome ? [
        {
            name: "CHARISMA",
            value: player.charisma,
            delta: last_non_match_outcome.charisma_delta,
            color: getDeltaColor(last_non_match_outcome.charisma_delta),
        },
        {
            name: "MONEY",
            value: player.coins,
            delta: last_non_match_outcome.coins_delta,
            color: getDeltaColor(last_non_match_outcome.coins_delta),
        },
        // ... more stats
    ] : [];

    // ✅ ONLY SHOW STATS WITH CHANGES
    const statsWithChanges = allStats.filter(stat => 
        stat.isInjury ? last_non_match_outcome?.sets_injured : stat.delta !== 0
    );

    const outcomeType = last_non_match_outcome?.outcome_type === 1 ? "Positive" : "Negative";
    const outcomeColor = outcomeType === "Positive" ? "text-green-400" : "text-red-400";

    return (
        <div className="min-h-screen bg-cover bg-center" 
             style={{ backgroundImage: "url('/nonMatchResult/BackGround.png')" }}>
            
            {/* ✅ OUTCOME DESCRIPTION */}
            <div className="rounded-xl bg-black/80 p-10">
                <h3 className={`text-xl font-bold ${outcomeColor}`}>
                    {outcomeType} Outcome!
                </h3>
                <p className="text-white text-lg">
                    {last_non_match_outcome?.description || "No outcome description available."}
                </p>
            </div>

            {/* ✅ DYNAMIC STATS DISPLAY */}
            <div className="stats-container">
                <ul className="space-y-2">
                    {statsWithChanges.map((stat) => (
                        <li key={stat.name} className="flex justify-between">
                            <span className="text-cyan-300">{stat.name}</span>
                            <span className={`font-bold ${stat.color}`}>
                                {stat.value} {stat.isInjury ? "" : `(${stat.delta > 0 ? "+" : ""}${stat.delta})`}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <button onClick={() => navigate("/main")}>
                Continue
            </button>
        </div>
    );
};
```

---

## 🔍 Critical Success Factors

### 🛠️ **Hex Data Conversion**
**Problem Solved:** GraphQL returns data in hex format, requiring conversion.

```typescript
// ✅ UNIVERSAL HEX CONVERTER
const hexToNumber = (hexValue: string | number): number => {
    if (typeof hexValue === 'number') return hexValue;
    if (typeof hexValue === 'string' && hexValue.startsWith('0x')) {
        return parseInt(hexValue, 16);
    }
    if (typeof hexValue === 'string') {
        return parseInt(hexValue, 10);
    }
    return 0;
};

// ✅ STRING CONVERSION (if needed)
const hexToString = (hexValue: string): string => {
    if (!hexValue || typeof hexValue !== 'string') return '';
    
    const cleanHex = hexValue.startsWith('0x') ? hexValue.slice(2) : hexValue;
    
    // NOTE: For Overgoal, GraphQL was already returning decoded strings,
    // so hex conversion was unnecessary and caused corruption
    if (!/^[0-9a-fA-F]*$/.test(cleanHex)) return hexValue;
    
    try {
        let result = '';
        for (let i = 0; i < cleanHex.length; i += 2) {
            const hexPair = cleanHex.substr(i, 2);
            const charCode = parseInt(hexPair, 16);
            if (charCode !== 0) result += String.fromCharCode(charCode);
        }
        return result || hexValue;
    } catch (error) {
        return hexValue;
    }
};
```

### ⏱️ **Transaction Timing & Indexing**
**Problem Solved:** Need to wait for transaction indexing before querying.

```typescript
// ✅ PROPER TIMING SEQUENCE
const execute = async (eventId: number) => {
    // 1. Execute transaction
    const tx = await client.game.executeNonMatchEvent(account, eventId);
    
    if (tx && tx.code === "SUCCESS") {
        // 2. ⚠️ CRITICAL: Wait for indexing (Torii needs time to process)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Now safe to query GraphQL
        const eventHistory = await fetchPlayerEventHistory(account.address);
        
        // 4. Additional delay before navigation (UI state propagation)
        await new Promise(resolve => setTimeout(resolve, 500));
        navigate('/results');
    }
};
```

### 🗄️ **State Management Pattern**
**Problem Solved:** Need persistent state that survives navigation and reloads.

```typescript
// File: client/src/zustand/store.ts
interface AppState {
    player: Player | null;
    last_non_match_outcome: NonMatchEventOutcome | null;
}

interface AppActions {
    setLastNonMatchOutcome: (outcome: NonMatchEventOutcome | null) => void;
}

export const useAppStore = create<AppState & AppActions>()(
    persist(
        (set) => ({
            player: null,
            last_non_match_outcome: null,
            
            setLastNonMatchOutcome: (outcome) => set({ last_non_match_outcome: outcome }),
        }),
        {
            name: "app-storage",
            partialize: (state) => ({
                player: state.player,
                last_non_match_outcome: state.last_non_match_outcome, // ✅ CRITICAL: Include in persistence
            }),
        }
    )
);
```

---

## 🚫 Common Pitfalls Avoided

### ❌ **Infinite Polling Loop**
**Original Problem:** Trying to poll for PlayerEventHistory updates in components.
**Solution:** Single query after confirmed transaction success.

### ❌ **Hex Conversion Errors**
**Original Problem:** GraphQL returning "0x5061727479" instead of "Party".
**Solution:** Universal hex conversion with fallback to original value.

### ❌ **Premature Navigation**
**Original Problem:** Navigating before data is available, causing blank screens.
**Solution:** Explicit timing delays and state checks.

### ❌ **Missing Persistence**
**Original Problem:** State lost on page reload.
**Solution:** Include all necessary data in Zustand persistence config.

---

## 🔄 Reusable Pattern Template

### For Any New Tracking Model:

1. **Contract Side:**
   ```cairo
   // 1. Create tracking model in models/
   // 2. Add getter/setter in store.cairo
   // 3. Update action function to write tracking model
   // 4. Emit custom event in systems/game.cairo
   ```

2. **Frontend Side:**
   ```typescript
   // 1. Update bindings.ts with interface
   // 2. Create GraphQL query in hooks/
   // 3. Implement action hook with proper timing
   // 4. Update Zustand store for persistence
   // 5. Create/update display component
   ```

3. **Critical Success Factors:**
   ```typescript
   // ✅ Always convert hex values
   // ✅ Wait for transaction indexing (2+ seconds)
   // ✅ Include data in persistence config
   // ✅ Handle loading states in components
   // ✅ Provide fallbacks for missing data
   ```

---

## 📊 Performance Optimizations

1. **Single Query Strategy**: Instead of polling, query once after transaction confirmation
2. **Selective Data Fetching**: Only fetch what's needed for display
3. **State Persistence**: Avoid re-fetching on navigation
4. **Error Boundaries**: Graceful handling of missing or corrupted data
5. **Optimistic Updates**: Immediate UI feedback before blockchain confirmation

---

## 🧪 Testing Strategy

```typescript
// Test transaction execution
const mockTx = { code: "SUCCESS" };
expect(await execute(eventId)).toResolve();

// Test data conversion
expect(hexToNumber("0x5")).toBe(5);
expect(hexToNumber(10)).toBe(10);

// Test timing
const startTime = Date.now();
await execute(eventId);
expect(Date.now() - startTime).toBeGreaterThan(2000);

// Test state persistence
localStorage.clear();
setLastNonMatchOutcome(mockOutcome);
expect(useAppStore.getState().last_non_match_outcome).toBeTruthy();
```

---

## 🔮 Future Enhancements

1. **Real-time Updates**: WebSocket connection for instant data updates
2. **Caching Strategy**: Cache frequently accessed outcomes
3. **Batch Operations**: Handle multiple events in single transaction
4. **Offline Support**: Queue transactions when network is unavailable
5. **Analytics**: Track user behavior patterns

---

**💡 Key Insight:** This pattern eliminates the need for complex polling mechanisms by using the blockchain itself as the source of truth for what happened, then fetching the exact result data based on that truth. The PlayerEventHistory model acts as a "pointer" to the specific outcome that was randomly selected by the contract. 