# 🎮 Dojo Game Starter

> **The fastest way to build onchain games on Starknet**
> From zero to deployed in 5 minutes ⚡

<div align="center">
  <img src="./client/src/assets/Dojo-Logo-Stylized-Red.svg" alt="Dojo Engine" height="60"/>
  &nbsp;&nbsp;&nbsp;
  <img src="./client/src/assets/DojoByExample_logo.svg" alt="Dojo by Example" height="60"/>
  &nbsp;&nbsp;&nbsp;
  <img src="./client/src/assets/SN-Linear-Gradient.svg" alt="Starknet" height="60"/>
</div>

## ✨ What's Included

**🎨 Frontend Ready**
- React + Vite + TypeScript with complete Dojo integration
- Cartridge Controller wallet integration with session policies
- Real-time game UI with optimistic updates
- Comprehensive hooks for blockchain operations

**⚙️ Backend Complete**
- Cairo smart contracts with Dojo Engine architecture
- Player progression system with experience, health, and coins
- Integrated achievement system with 5+ achievements
- Production-ready deployment configuration

## 🛠️ Tech Stack

```
Frontend: React + Vite + TypeScript + TailwindCSS + Zustand
Backend:  Cairo + Dojo Engine + Torii GraphQL Indexer
Network:  Starknet (Local/Sepolia/Mainnet)
Wallet:   Cartridge Controller
```

## 📦 Project Structure

```
dojo-game-starter/
├── 📱 client/                    # Complete React + Dojo integration
│   ├── src/dojo/                 # Core Dojo integration files
│   │   ├── bindings.ts           # TypeScript interfaces from Cairo
│   │   ├── dojoConfig.ts         # Network and connection configuration
│   │   ├── contracts.gen.ts      # Auto-generated contract functions
│   │   └── hooks/                # Custom React hooks for blockchain
│   ├── docs/                     # 📚 Complete integration documentation
│   └── README.md                 # Frontend-specific documentation
├── ⚙️ contract/                 # Cairo smart contracts
│   ├── src/
│   │   ├── models/               # Data entities (Player model)
│   │   ├── systems/              # Game logic (train, mine, rest)
│   │   ├── achievements/         # Achievement system implementation
│   │   └── store/                # Data layer abstraction
│   └── README.md                 # Backend development and deployment guide

```

## 📚 Documentation

### **🎨 Frontend Integration**
The `client/` directory contains a complete React + Dojo integration with comprehensive documentation:

📖 **[Client Documentation](./client/README.md)** - Start here for frontend development

**Complete Integration Guide Series:**
- **[01. Overview](./client/docs/01-overview.md)** - Architecture and concepts
- **[02. Architecture](./client/docs/02-architecture.md)** - System design patterns
- **[03. Core Files](./client/docs/03-core-files.md)** - Essential integration files
- **[04. Zustand State Management](./client/docs/04-zustand-state-management.md)** - Optimistic updates
- **[05. Cartridge Controller](./client/docs/05-cartridge-controller.md)** - Gaming wallet UX
- **[06. React Hooks Pattern](./client/docs/06-react-hooks-pattern.md)** - Blockchain hooks
- **[07. Data Flow](./client/docs/07-data-flow.md)** - Request/response cycles
- **[08. Extending the System](./client/docs/08-extending-system.md)** - Building your game

### **⚙️ Backend Development**
The `contract/` directory contains Cairo smart contracts with Dojo Engine:

📖 **[Contracts Documentation](./contract/README.md)** - Backend development guide

**Key Topics Covered:**
- **Project Structure** - Models, Systems, Store architecture
- **Game Mechanics** - Player actions (spawn, train, mine, rest)
- **Achievement System** - Complete trophy/task implementation
- **Local Development** - Katana, Sozo, Torii setup
- **Sepolia Deployment** - Production deployment process
- **Development Best Practices** - Code organization and patterns

## 🎮 Game Mechanics

The starter demonstrates essential onchain game patterns:

| Action | Effect | Demonstrates |
|--------|--------|--------------|
| 🏋️ **Train** | +10 Experience | Pure advancement mechanics |
| ⛏️ **Mine** | +5 Coins, -5 Health | Risk/reward decision making |
| 💤 **Rest** | +20 Health | Resource management systems |

**🏆 Achievement System:**
- **MiniGamer** (1 action) → **SenseiGamer** (50 actions)
- Complete integration with frontend achievement display
- Automatic progress tracking for all game actions

## 🎯 Perfect For

- 🏆 **Hackathon teams** needing rapid onchain game setup
- 🎮 **Game developers** entering Web3 with production patterns
- 🏢 **Studios** prototyping blockchain games with real UX
- 📚 **Developers** learning Starknet + Dojo with comprehensive examples

## 🚀 Key Features

**⚡ Gaming-First UX**
- Cartridge Controller integration eliminates wallet friction
- Session policies enable uninterrupted gameplay
- Optimistic updates provide instant feedback
- Background blockchain confirmation

**🔧 Developer Experience**
- Complete TypeScript integration end-to-end
- Hot reload with contract changes
- Comprehensive error handling patterns
- Production deployment configurations

**🏗️ Scalable Architecture**
- Modular component design for easy extension
- Reusable hooks for blockchain operations
- Clean separation between UI and blockchain logic
- Performance optimizations built-in

## 🌟 Getting Started

1. **For Frontend Development:** Start with [Client README](./client/README.md)
2. **For Backend Development:** Check [Contracts README](./contract/README.md)
3. **For Complete Understanding:** Follow the [Integration Guide Series](./client/docs/)

## 🔗 Links

- **[Starknet](https://starknet.io)**
- **[Dojo Engine](https://dojoengine.org)**
- **[Cairo](https://cairo-lang.org)**
- **[Cartridge](https://cartridge.gg)**

---

**Built with ❤️ for the Starknet gaming community**

# Overgoal Game - Non-Match Event Feature Implementation

## Overview

This document provides a comprehensive guide to the implementation of the Non-Match Event feature in the Overgoal Dojo game. This feature allows players to select events that trigger on-chain actions with random outcomes, affecting player statistics.

## Architecture

### Game Flow
1. **Event Selection**: Players choose from available non-match events via `NonMatchEventSelector.tsx`
2. **Contract Execution**: Cairo contract function `execute_non_match_event` is called
3. **Random Outcome**: Contract randomly selects one of four possible outcomes using block timestamp
4. **Stat Application**: Player statistics are updated based on outcome deltas
5. **Result Display**: Results are shown on a dedicated screen with visual feedback

## Backend Implementation (Cairo/Dojo)

### Contract Structure

#### Store Layer (`contract/src/store.cairo`)
```cairo
// Core execution function
fn execute_non_match_event(ref self: Store, player: Player, event_id: u8) -> (u8, felt252, felt252) {
    // Generate random outcome (1-4) using block timestamp
    let block_info = get_block_info().unbox();
    let random_seed = block_info.block_timestamp;
    let outcome_id = (random_seed % 4) + 1;
    
    // Read outcome data and apply deltas
    let outcome = self.read_non_match_event_outcome(event_id, outcome_id);
    // ... stat application logic
}
```

#### Player Event History Model
```cairo
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerEventHistory {
    #[key]
    pub player: ContractAddress,
    pub last_event_id: u8,
    pub last_outcome_id: u8,
    pub last_execution_timestamp: u64,
}
```

### Common Issues Resolved

1. **Visibility Errors**: Removed `pub` modifiers from trait implementation functions
2. **Type Casting**: Implemented safe `apply_delta_u32` helper for stat modifications
3. **Import Dependencies**: Added missing trait and model imports
4. **Variable Lifecycle**: Fixed unused variable warnings with `_` prefix
5. **Field Naming**: Corrected model field names to match schema
6. **Debug Printing**: Removed unsupported `ContractAddress` from debug output

## Frontend Implementation (React/TypeScript)

### State Management (Zustand)

```typescript
interface GameState {
  last_non_match_outcome: {
    outcome_id: u8;
    outcome_name: string;
    outcome_description: string;
    event_id: u8;
    event_name: string;
    event_description: string;
  } | null;
  // ... other state
}
```

### Contract Bindings

Updated `contracts.gen.ts` with proper Dojo patterns:
```typescript
export const build_game_execute_non_match_event_calldata = (eventId: number) => {
  return [eventId];
};

export const game_execute_non_match_event = async (
  sdk: SDK<SchemaType>,
  props: {
    account: Account;
    eventId: number;
  }
) => {
  return sdk.execute(
    props.account,
    "game",
    "execute_non_match_event",
    build_game_execute_non_match_event_calldata(props.eventId)
  );
};
```

### Transaction Handling

#### ❌ Incorrect Pattern (Causes Hanging)
```typescript
const tx = await executeNonMatchEvent(account, eventId);
await account.waitForTransaction(tx.transaction_hash); // HANGS
```

#### ✅ Correct Dojo Pattern
```typescript
const tx = await client!.game.executeNonMatchEvent(account, eventId);
if (tx && tx.code === "SUCCESS") {
  // Success logic
} else {
  throw new Error(`Transaction failed: ${tx?.code}`);
}
```

## Critical Debugging Process

### Transaction Hanging Issue

**Problem**: Transactions would hang at `account.waitForTransaction()` call.

**Root Cause**: Using low-level Starknet transaction patterns instead of Dojo SDK patterns.

**Solution**: Consulted Dojo Sensei (MCP) and adopted standard Dojo transaction handling patterns used throughout the codebase.

### Data Persistence and Navigation

**Issues Encountered**:
1. **Route Mismatch**: URL parameters not matching navigation calls
2. **State Persistence**: Zustand state not persisting across navigation
3. **Race Conditions**: UI checking for data before it's fully loaded

**Solutions Applied**:
```typescript
// Fixed persistence configuration
partialize: (state) => ({
  // ... other fields
  last_non_match_outcome: state.last_non_match_outcome,
}),

// Added timing controls
setTimeout(() => navigate('/non-match-result'), 100);

// Added loading states in components
if (!outcome) {
  return <div>Loading outcome...</div>;
}
```

### Data Format Handling

**Discovery**: Contract returns hex-encoded strings for event/outcome names and descriptions.

**Examples**:
- `0x5061727479` = "Party"
- `0x476f20746f20612050656f6461737` = "Go to a Podcast"

**Solution**: GraphQL automatically decodes hex strings, so removed redundant hex decoding in UI components.

## UI/UX Enhancements

### NonMatchResult Screen Features

1. **Filtered Stats Display**: Only shows statistics that changed (delta ≠ 0)
2. **Color-Coded Changes**:
   - 🟢 Green: Positive changes
   - 🔴 Red: Negative changes  
   - ⚪ White: No change
3. **Delta Indicators**: Shows change amounts like "50 (+5)" or "30 (-3)"
4. **Special Cases**: Injury status shows "YES"/"NO" without delta text

```typescript
const getDeltaColor = (delta: number): string => {
  if (delta > 0) return 'text-green-400';
  if (delta < 0) return 'text-red-400';
  return 'text-white';
};
```

## Match Creation System

### Location: `MainScreen.tsx`
- **UI Element**: "Play Match" button
- **Handler**: `handleNewMatch()` function (lines 89-119)
- **Logic Flow**:
  1. Validates player requirements (stamina, team membership)
  2. Finds opponent team
  3. Generates unique match ID
  4. Calls `executeCreateGameMatch`
  5. Navigates to match preparation screen

### Known Issues
- **Opponent Selection**: Currently always selects team ID 1 as opponent
- **Randomization**: Needs improvement for varied gameplay experience

## Development Best Practices Learned

### 1. Transaction Patterns
- Always use Dojo SDK patterns instead of low-level Starknet calls
- Check transaction codes instead of waiting for transaction hashes
- Handle errors gracefully with proper error messages

### 2. State Management
- Include all persistent data in Zustand partialize configuration
- Use loading states to handle async data fetching
- Add timing controls for navigation to prevent race conditions

### 3. Cairo Development
- Use helper functions for type-safe operations
- Prefix unused variables with `_` to suppress warnings
- Import only necessary dependencies to avoid compilation errors
- Test contract functions thoroughly before frontend integration

### 4. Data Handling
- Understand data encoding formats (hex strings in this case)
- Leverage GraphQL automatic decoding when available
- Implement proper error handling for data fetching operations

## Future Improvements

1. **Enhanced Randomization**: Implement more sophisticated random number generation
2. **Event Balancing**: Add cooldowns and restrictions to prevent exploitation
3. **Visual Effects**: Add animations for stat changes and outcome reveals
4. **Event Categories**: Organize events by type (training, social, business, etc.)
5. **Opponent Variety**: Improve match opponent selection algorithm
6. **Achievement System**: Track player progress and milestones

## Useful Commands

```bash
# Contract development
cd contract
sozo build
sozo migrate apply

# Frontend development  
cd client
npm run dev

# Testing
cd contract
sozo test
```

## Resources

- [Dojo Documentation](https://book.dojoengine.org/)
- [Cairo Language Reference](https://book.cairo-lang.org/)
- [Starknet Developer Docs](https://docs.starknet.io/)

---

*This implementation guide documents the complete development process, including all challenges faced and solutions implemented during the Non-Match Event feature development.*
