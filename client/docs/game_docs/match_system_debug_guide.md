# 🐛 Match System Debug Guide

## Overview
This guide helps debug issues with the match system implementation, with structured logging and common troubleshooting steps.

## 🏷️ Logging Prefixes

### Component Flow
- `[NEW_MATCH]` - NewMatch component flow
- `[MATCH_COMPONENT]` - MatchComponent initialization
- `[MATCH_FLOW]` - Match progression logic
- `[HANDLE_ACTION]` - Action processing

### Hook Operations
- `[START_MATCH]` - Start match hook
- `[PROCESS_ACTION]` - Process action hook
- `[FETCH_GAMEMATCH]` - GameMatch data fetching

### UI State
- `[MATCH_UI]` - UI state changes

## 🔧 Common Issues & Solutions

### Issue: next_match_action_minute Always Returns 1

**Symptoms:**
- `next_match_action_minute` shows `1` regardless of match progression
- No variation in action timing

**Root Causes:**
1. **Missing Data Fetching**: Frontend only using optimistic updates
2. **Cairo Logic Bug**: Loop only returning player-participation events

**Solution:** 
- Implemented proper data fetching from Torii
- Fixed Cairo loop logic in `get_next_match_action()`

**Verification:**
```
🎯 [START_MATCH] Real next_match_action_minute: 7  // ✅ NOT always 1!
```

---

### Issue: Enum Fields Showing NaN Values

**Symptoms:**
```javascript
{
  action_team: NaN,
  match_status: NaN, 
  next_match_action: NaN,
  player_participation: NaN,
  next_match_action_minute: 35  // ✅ This works
}
```

**Root Causes:**
1. **GraphQL Enum Serialization**: Torii may return enum values in unexpected format
2. **Hex Conversion Issues**: `hexToNumber` function can't handle certain data types
3. **Null/Undefined Values**: Missing or corrupted data from blockchain

**Debug Steps:**

1. **Check Raw GraphQL Data:**
```javascript
// Look for this log in console:
📄 [FETCH_GAMEMATCH] Raw GameMatch data: {
  match_status: "0x1",     // ✅ Good - hex string
  match_status: 1,         // ✅ Good - number  
  match_status: null,      // ❌ Problem - null
  match_status: undefined, // ❌ Problem - undefined
  match_status: "",        // ❌ Problem - empty string
}
```

2. **Check Conversion Process:**
```javascript
// Look for detailed conversion logs:
🔍 [FETCH_GAMEMATCH] Converting match_status: "0x1" string
✅ [FETCH_GAMEMATCH] match_status converted: 1

// Or error cases:
🔍 [FETCH_GAMEMATCH] Converting match_status: null object
⚠️ [FETCH_GAMEMATCH] match_status is null/undefined, defaulting to 0
❌ [FETCH_GAMEMATCH] CRITICAL: match_status is NaN after conversion!
```

**Solutions:**

1. **Improved hexToNumber Function:**
```typescript
const hexToNumber = (hexValue: string | number): number => {
  // Handle null/undefined
  if (hexValue === null || hexValue === undefined) {
    return 0;
  }

  // If already a number, validate it
  if (typeof hexValue === 'number') {
    return isNaN(hexValue) ? 0 : hexValue;
  }

  // Handle different string formats
  if (typeof hexValue === 'string') {
    if (hexValue === '') return 0;
    
    if (hexValue.startsWith('0x')) {
      const result = parseInt(hexValue, 16);
      return isNaN(result) ? 0 : result;
    }
    
    const result = parseInt(hexValue, 10);
    return isNaN(result) ? 0 : result;
  }

  // Handle boolean (sometimes enums come as boolean)
  if (typeof hexValue === 'boolean') {
    return hexValue ? 1 : 0;
  }

  return 0; // Safe fallback
};
```

2. **Safe Conversion with Logging:**
```typescript
const safeHexToNumber = (value: any, fieldName: string): number => {
  console.log(`🔍 [FETCH_GAMEMATCH] Converting ${fieldName}:`, value, typeof value);
  
  const result = hexToNumber(value);
  
  if (isNaN(result)) {
    console.error(`❌ [FETCH_GAMEMATCH] ${fieldName} conversion resulted in NaN, original value:`, value);
    return 0; // Default fallback
  }
  
  return result;
};
```

**Verification:**
```javascript
// After fix, should see:
{
  action_team: 0,           // ✅ Valid enum value
  match_status: 1,          // ✅ Valid enum value  
  next_match_action: 0,     // ✅ Valid enum value
  player_participation: 0,  // ✅ Valid enum value
  next_match_action_minute: 35
}
```

---

### Issue: Enum Fields Showing 0 Instead of Expected Values

**Symptoms:**
```javascript
{
  action_team: 0,           // Should be 0, 1, or 2 based on ActionTeam enum
  match_status: 0,          // Should be 1 (InProgress) after starting match  
  next_match_action: 0,     // Should vary based on match events
  player_participation: 0,  // Should be 0 or 1 based on participation
  next_match_action_minute: 14  // ✅ This works correctly
}
```

**Root Causes:**
1. **Torii Not Indexing Enum Fields**: Torii might not be properly indexing enum values from the contract
2. **Contract Not Setting Enum Values**: The Cairo contract might not be properly writing enum values to storage
3. **GraphQL Schema Issues**: The GraphQL query might not be requesting the right fields

**Debug Steps:**

1. **Check Raw GraphQL Response:**
```javascript
// Look for this detailed log in console:
📡 [FETCH_GAMEMATCH] Full GraphQL response: {
  "data": {
    "fullStarterReactGameMatchModels": {
      "edges": [
        {
          "node": {
            "match_id": "0x7f2c5",
            "match_status": null,        // ❌ Problem - should be "0x1" 
            "next_match_action": null,   // ❌ Problem - should be "0x0" or similar
            "action_team": null,         // ❌ Problem - should be "0x0" or similar
            "player_participation": null // ❌ Problem - should be "0x0" or similar
          }
        }
      ]
    }
  }
}
```

2. **Check Individual Field Analysis:**
```javascript
🔍 [FETCH_GAMEMATCH] Individual field analysis:
  match_id: 0x7f2c5 (type: string)           // ✅ Good
  my_team_id: 0x3 (type: string)             // ✅ Good  
  next_match_action_minute: 0xe (type: string) // ✅ Good
  match_status: null (type: object)           // ❌ Problem!
  next_match_action: null (type: object)      // ❌ Problem!
  action_team: null (type: object)            // ❌ Problem!
  player_participation: null (type: object)   // ❌ Problem!
```

**Solutions:**

**Option 1: Contract Redeployment Issue**
If the enum fields are `null` in GraphQL, the issue is likely that:
- The contract needs to be redeployed with the latest GameMatch model
- Torii needs to be restarted to re-index the new model structure

```bash
# Redeploy contract
sozo migrate --name full_starter_react

# Restart Torii (if running locally)
# Kill existing Torii process and restart
```

**Option 2: Torii Indexing Issue**
If Torii is not properly indexing enum fields:

```typescript
// Alternative: Query the contract directly instead of GraphQL
// This bypasses Torii and reads directly from the blockchain

const contractReader = await provider.getStorageAt(
  worldAddress,
  getModelStorageKey(matchId, "GameMatch")
);
```

**Option 3: Cairo Storage Issue**  
If the contract is not properly setting enum values, check:

```cairo
// In store.cairo start_gamematch function:
fn start_gamematch(mut self: Store, match_id: u32) -> (...) {
    let mut gamematch = self.read_gamematch(match_id);
    
    // ✅ Make sure these are explicitly set
    gamematch.match_status = MatchStatus::InProgress;  // Should be 1
    gamematch.current_time = 1;
    
    let (next_action, next_minute, participation, team) = self.get_next_match_action(match_id);
    
    // ✅ Make sure set_next_action properly assigns enum values
    gamematch.set_next_action(next_action, next_minute, team, participation);
    self.world.write_model(@gamematch);  // ✅ Critical: Write to storage
    
    (next_action, next_minute, participation, team)
}
```

**Verification Steps:**

1. **Check Contract Deployment:**
```bash
# Check if latest contract is deployed
sozo build
sozo migrate --name full_starter_react
```

2. **Check Torii Logs:**
```bash
# Look for indexing errors in Torii logs
# Should see model updates being processed
```

3. **Manual Contract Call:**
```typescript
// Test contract function directly (bypass GraphQL)
const result = await client.game.startGamematch(account, matchId);
console.log("Direct contract response:", result);
```

4. **Check World State:**
```bash
# Query world state directly using sozo
sozo model get GameMatch --world <world_address> --key <match_id>
```

**Expected Fix Results:**
```javascript
// After fixing, should see:
{
  action_team: 0,           // ✅ MyTeam (valid enum value)
  match_status: 1,          // ✅ InProgress (valid enum value)
  next_match_action: 3,     // ✅ FreeKick (valid enum value)  
  player_participation: 1,  // ✅ Participating (valid enum value)
  next_match_action_minute: 14
}
```

---

## 🎯 Enum Value Reference

### MatchStatus
- `0` = NotStarted
- `1` = InProgress  
- `2` = HalfTime
- `3` = Finished

### MatchAction
- `0` = OpenPlay
- `1` = Jumper
- `2` = Brawl
- `3` = FreeKick
- `4` = Penalty
- `5` = OpenDefense

### PlayerParticipation
- `0` = NotParticipating
- `1` = Participating
- `2` = Observing

### ActionTeam
- `0` = MyTeam
- `1` = OpponentTeam
- `2` = Neutral

## 🧪 Testing Checklist

### Data Fetching Verification
- [ ] Transaction executes successfully
- [ ] 2-second indexing wait occurs
- [ ] GraphQL query returns data
- [ ] Raw data contains expected fields
- [ ] Hex conversion works for all fields
- [ ] No NaN values in final result
- [ ] Enum values are within valid ranges

### Match Flow Verification  
- [ ] `next_match_action_minute` varies (not always 1)
- [ ] `current_time` advances properly
- [ ] `match_status` changes appropriately
- [ ] Player participation flags work correctly

### UI Integration
- [ ] Match component shows real data
- [ ] Countdown timer works with real minutes
- [ ] Action buttons appear at correct times
- [ ] Navigation works properly

## 🔍 Logging Structure

The match system now includes comprehensive logging to help debug issues. All logs use prefixed emojis and tags for easy filtering.

### 📱 **NewMatch Component Logs**

**Prefix: `[NEW_MATCH]`**
- `🆕 Component initialized` - Shows initial state when component loads
- `🔍 Setting up match data` - Match and team resolution process
- `❌ Match not found` / `❌ Teams not found` - Error states
- `✅ Match found` - Successful match resolution
- `🏆 Teams resolved` - Team assignment success
- `🎮 Play button clicked` - User action tracking
- `⏳ Starting match...` - Match start process
- `📊 State changed` - Hook state updates

### 🏟️ **MatchComponent Logs**

**Prefix: `[MATCH_COMPONENT]` / `[MATCH_FLOW]` / `[HANDLE_ACTION]` / `[MATCH_UI]`**
- `🏟️ Component initialized` - Initial component state
- `⚽ Effect triggered` - Match flow effect runs
- `⏰ Starting countdown` - Countdown timer setup
- `⏳ Countdown tick` - Each countdown second
- `🔔 Countdown finished` - Action ready state
- `⚡ Time for next action!` - Action trigger
- `🎯 Action button clicked` - User clicks next action
- `📝 Adding new event` - Match event creation
- `📋 Updated events list` - Event list changes
- `🎨 UI state update` - Button visibility and UI state
- `🧹 Cleaning up` - Effect cleanup

### 🔗 **Hook Logs**

**Start Match Hook - Prefix: `[START_MATCH]`**
- `🎮 Starting match execution` - Hook called
- `⏳ Calling contract function` - Contract call start
- `📡 Transaction response` - Contract response
- `✅ Transaction successful` - Success state
- `🔄 Updating match status` - Local state update
- `🎯 Setting current match` - Match assignment
- `🧭 Navigating to match screen` - Navigation

**Process Action Hook - Prefix: `[PROCESS_ACTION]`**
- `⚡ Starting action processing` - Hook called
- `⏳ Calling startGamematch` - Contract call
- `📡 Transaction response` - Contract response
- `✅ Action processed successfully` - Success

## 🛠️ **How to Debug**

### 1. **Filter Console Logs**
```javascript
// In browser console, filter by component:
console.log = ((originalLog) => (...args) => {
  if (args[0]?.includes('[MATCH_')) originalLog(...args);
})(console.log);

// Or filter by specific component:
// [NEW_MATCH], [MATCH_COMPONENT], [START_MATCH], [PROCESS_ACTION]
```

### 2. **Common Issues & What to Look For**

**Match Not Starting:**
- Check `🆕 [NEW_MATCH] Component initialized` - Are teams/matches loaded?
- Look for `❌ [NEW_MATCH] Match not found` - Match ID issues
- Verify `🎮 [START_MATCH] Starting match execution` appears

**Match Screen Not Loading:**
- Check `🏟️ [MATCH_COMPONENT] Component initialized` - Is match data present?
- Look for `⚠️ [MATCH_FLOW] No match data available`
- Verify `hasFoundMatch: true` in logs

**Actions Not Processing:**
- Check `🎯 [HANDLE_ACTION] Action button clicked` - Is button working?
- Look for `⚠️ [HANDLE_ACTION] Cannot process action` - State issues
- Verify `📡 [PROCESS_ACTION] Transaction response` shows success

**UI Not Updating:**
- Check `🎨 [MATCH_UI] UI state update` - Are states correct?
- Look for countdown and button visibility flags
- Verify event counts are incrementing

### 3. **Key Data Points to Monitor**

**Match Data:**
```javascript
{
  matchId: number,
  current_time: number,
  next_match_action_minute: number,
  match_status: number,
  player_participation: number,
  action_team: number
}
```

**Hook States:**
- `startGameMatchState`: 'idle' | 'executing' | 'success' | 'error'
- `processState`: 'idle' | 'executing' | 'success' | 'error'

**UI States:**
- `isWaitingForAction`: boolean
- `countdown`: number
- `matchEvents.length`: number

## 🚨 **Error Patterns**

1. **Transaction Failures**: Look for `code !== "SUCCESS"` in transaction responses
2. **Missing Data**: Check for `null` or `undefined` in match/team data
3. **State Mismatches**: Verify hook states align with UI states
4. **Navigation Issues**: Check if navigation calls complete

## 🧪 **Testing Checklist**

1. ✅ NewMatch loads with correct teams
2. ✅ Start match button works and navigates
3. ✅ MatchComponent shows correct initial state
4. ✅ Countdown appears and counts down
5. ✅ Action button appears when countdown finishes
6. ✅ Action button processes and adds events
7. ✅ Match progresses through multiple actions
8. ✅ Match ends at 90 minutes

---

**Pro Tip:** Open browser dev tools and filter console by `[MATCH` to see all match-related logs in sequence. 