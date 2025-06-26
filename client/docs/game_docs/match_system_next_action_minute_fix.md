# 🐛 Fix: next_match_action_minute Always Returns 1

## Problem Summary

The `next_match_action_minute` field in GameMatch was always returning `1` regardless of the Cairo contract logic, which appeared correct from a mathematical perspective.

## Root Cause Analysis

### 🔍 **Issue #1: Missing Data Fetching in Frontend**

The primary issue was that **the frontend was never actually fetching GameMatch data from the blockchain**. Instead, it was only using optimistic updates with hardcoded values:

```typescript
// ❌ PROBLEM: Optimistic update with hardcoded value
const newGameMatch = {
    match_id: matchId,
    my_team_id: myTeamId,
    opponent_team_id: opponentTeamId,
    my_team_score: 0,
    opponent_team_score: 0,
    next_match_action: 0, // OpenPlay
    next_match_action_minute: 1, // ❌ ALWAYS 1 - HARDCODED!
    current_time: 0,
    match_status: 0, // NotStarted
    player_participation: 0, // NotParticipating
    action_team: 0, // MyTeam
};
```

**Frontend Flow Problem:**
1. **Create Match**: Uses optimistic update with `next_match_action_minute: 1` 
2. **Start Match**: Uses optimistic update, never fetches real data from contract
3. **Display**: Shows the hardcoded value of 1

### 🔍 **Issue #2: Cairo Logic Bug**

Additionally, there was a **critical bug in the Cairo loop logic** in `get_next_match_action()`:

```cairo
// ❌ PROBLEM: Old logic only returned events where player participated
if my_attack_result.has_event {
    gamematch.current_time = my_attack_result.event_minute;
    if my_attack_result.player_participates {
        // ✅ Return event - ONLY if player participates
        break (action, minute, Participating, MyTeam);
    } else {
        // ❌ Simulate and continue loop - NEVER returned to frontend
        self.simulate_ai_attack_outcome(match_id, my_team, action_type, true);
        // Continue loop for next event
        gamematch = self.read_gamematch(match_id);
    }
}
```

**The Cairo Logic Problem:**
- Function would loop through minutes until it found an event where player participates
- AI-only events were simulated but never returned to frontend
- This meant the function could advance to minute 5, 10, 15, etc., but would always return that same minute as `next_match_action_minute`
- The loop was designed to find the NEXT event where player participates, not the next scheduled action time

## 🛠️ Solution Implementation

### ✅ **Fix #1: Proper Data Fetching from Torii**

**Added GameMatch data fetching function:**

```typescript
// ✅ NEW: Function to fetch GameMatch data from GraphQL
export const fetchGameMatch = async (matchId: number): Promise<any | null> => {
  try {
    console.log("🏟️ [FETCH_GAMEMATCH] Fetching GameMatch with ID:", matchId);

    const GAMEMATCH_QUERY = `
      query GetGameMatch($matchId: u32!) {
        fullStarterReactGameMatchModels(where: { match_id: $matchId }) {
          edges {
            node {
              match_id
              my_team_id
              opponent_team_id
              my_team_score
              opponent_team_score
              next_match_action
              next_match_action_minute
              current_time
              match_status
              player_participation
              action_team
            }
          }
        }
      }
    `;

    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: GAMEMATCH_QUERY,
        variables: { matchId }
      }),
    });

    const result = await response.json();
    
    if (!result.data?.fullStarterReactGameMatchModels?.edges?.length) {
      return null;
    }

    const rawGameMatchData = result.data.fullStarterReactGameMatchModels.edges[0].node;

    // ✅ CRITICAL: Convert hex values to numbers (like other models)
    const gameMatchData = {
      match_id: hexToNumber(rawGameMatchData.match_id),
      my_team_id: hexToNumber(rawGameMatchData.my_team_id),
      opponent_team_id: hexToNumber(rawGameMatchData.opponent_team_id),
      my_team_score: hexToNumber(rawGameMatchData.my_team_score),
      opponent_team_score: hexToNumber(rawGameMatchData.opponent_team_score),
      next_match_action: hexToNumber(rawGameMatchData.next_match_action),
      next_match_action_minute: hexToNumber(rawGameMatchData.next_match_action_minute), // ✅ NOW GETS REAL VALUE
      current_time: hexToNumber(rawGameMatchData.current_time),
      match_status: hexToNumber(rawGameMatchData.match_status),
      player_participation: hexToNumber(rawGameMatchData.player_participation),
      action_team: hexToNumber(rawGameMatchData.action_team),
    };

    return gameMatchData;
  } catch (error) {
    console.error("❌ [FETCH_GAMEMATCH] Error fetching GameMatch:", error);
    throw error;
  }
};
```

**Updated hooks to fetch real data:**

```typescript
// ✅ FIXED: useStartGameMatchAction now fetches real data
const execute = useCallback(async (matchId: number) => {
  // 1️⃣ Execute transaction
  const tx = await client!.game.startGamematch(account, matchId);
  
  if (tx && tx.code === "SUCCESS") {
    // 2️⃣ Wait for indexing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3️⃣ FETCH REAL DATA FROM TORII
    const realGameMatchData = await fetchGameMatch(matchId);
    
    if (realGameMatchData) {
      // 4️⃣ UPDATE STORE WITH REAL DATA
      updateGameMatch(matchId, realGameMatchData);
      setCurrentMatch(realGameMatchData);
      console.log("🎯 Real next_match_action_minute:", realGameMatchData.next_match_action_minute);
    }
    
    // 5️⃣ Navigate to match
    navigate(`/match/${matchId}`);
  }
}, [account, client, navigate, updateGameMatch, setCurrentMatch]);
```

### ✅ **Fix #2: Fixed Cairo Loop Logic**

**Fixed the loop to return ALL events, not just player participation events:**

```cairo
// ✅ FIXED: New logic returns any event found
fn get_next_match_action(mut self: Store, match_id: u32) -> (MatchAction, u8, PlayerParticipation, ActionTeam) {
    let mut gamematch = self.read_gamematch(match_id);
    let my_team = self.read_team(gamematch.my_team_id);
    let opponent_team = self.read_team(gamematch.opponent_team_id);
    let player = self.read_player();
    
    loop {
        // Check for half-time/full-time...
        
        // 1. CHECK MY TEAM ATTACK EVENT
        let my_attack_result = self.check_my_team_attack_event(
            gamematch.current_time, my_team, opponent_team, player
        );
        
        if my_attack_result.has_event {
            // ✅ Found an event - ALWAYS return it (whether player participates or not)
            break (
                my_attack_result.action_type, 
                my_attack_result.event_minute,
                if my_attack_result.player_participates { PlayerParticipation::Participating } else { PlayerParticipation::NotParticipating },
                ActionTeam::MyTeam
            );
        }
        
        // 2. CHECK OPPONENT TEAM ATTACK EVENT
        let opponent_attack_result = self.check_opponent_team_attack_event(
            gamematch.current_time, my_team, opponent_team, player
        );
        
        if opponent_attack_result.has_event {
            // ✅ Found an event - ALWAYS return it (whether player participates or not)
            break (
                opponent_attack_result.action_type,
                opponent_attack_result.event_minute,
                if opponent_attack_result.player_participates { PlayerParticipation::Participating } else { PlayerParticipation::NotParticipating },
                ActionTeam::OpponentTeam
            );
        }
        
        // ✅ No events this minute - advance time and continue
        gamematch.current_time += 1;
        self.world.write_model(@gamematch);
    }
}
```

**Key Changes:**
1. **Always return the first event found** (whether player participates or not)
2. **Removed AI simulation from this function** - that should happen during action processing
3. **Simplified logic** - find next event, return it immediately
4. **Proper minute advancement** - will return varying minute values (3, 7, 12, etc.)

## 🎯 Expected Behavior After Fix

### **Before Fix:**
- `next_match_action_minute` always showed `1`
- Frontend never fetched real blockchain data
- Cairo logic only returned player-participation events

### **After Fix:**
- `next_match_action_minute` shows realistic values like `3`, `7`, `12`, `18`, etc.
- Frontend fetches real data from Torii after transactions
- Cairo logic returns the next scheduled event regardless of player participation
- Proper hex-to-number conversion ensures data integrity

## 🧪 Testing

**To verify the fix:**

1. **Create a new match** - should still work as before
2. **Start the match** - observe console logs for real data fetching
3. **Check `next_match_action_minute`** - should now show varying values
4. **Process actions** - should advance to different minute values

**Console Log Indicators:**
```
🏟️ [FETCH_GAMEMATCH] Fetching GameMatch with ID: 123
📊 [START_MATCH] Real GameMatch data fetched: {...}
🎯 [START_MATCH] Real next_match_action_minute: 7  // ✅ NOT always 1!
```

## 📋 Files Modified

### **Frontend:**
- `client/src/dojo/hooks/usePlayer.tsx` - Added `fetchGameMatch()` function
- `client/src/dojo/hooks/useStartGameMatchAction.tsx` - Added real data fetching
- `client/src/dojo/hooks/useProcessMatchAction.tsx` - Added real data fetching

### **Backend:**
- `contract/src/store.cairo` - Fixed `get_next_match_action()` loop logic

## 🔗 Related Pattern

This fix follows the **same pattern used successfully in the non-match events system** (documented in `sendDataFromDojo.md`):

1. ✅ Execute transaction
2. ✅ Wait for indexing  
3. ✅ Fetch real data from Torii
4. ✅ Convert hex values to numbers
5. ✅ Update global state
6. ✅ Navigate/display results

The match system now follows this proven pattern for reliable data flow. 