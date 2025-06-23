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

# Overgoal Game

### Submission Track
Full Game

### Project Summary
Overgoal is a fully on-chain football management game built with Dojo on Starknet. Players create and manage their football careers, making strategic decisions through matches and non-match events that affect their stats and progression. The game features real-time stat management, team dynamics, and randomized events that create unique player journeys.

Key features:
- **On-chain Player Stats**: All player attributes (stamina, skills, charisma, etc.) stored and managed on Starknet
- **Dynamic Match System**: Engage in football matches with real-time decision making
- **Non-Match Events**: Choose from various activities (training, social events, business deals) with random outcomes
- **Team Management**: Join teams, build relationships, and compete for glory
- **Persistent World**: All game state lives on-chain with Dojo's entity-component system

### GitHub
https://github.com/yourusername/overgoal_game_repo

> Please ensure your github repo is registered with [OnlyDust](https://app.onlydust.com/p/create) to receive awards.

### Play

#### Quick Setup & Play Instructions

**Prerequisites:**
- Node.js (v18+)
- Rust and Cairo development environment
- Git

**1. Clone and Setup:**
```bash
git clone https://github.com/yourusername/overgoal_game_repo
cd overgoal_game_repo
```

**2. Contract Setup:**
```bash
cd contract
# Install Dojo (if not installed)
curl -L https://install.dojoengine.org | bash
dojoup

# Build and deploy contracts
sozo build
sozo migrate apply
```

**3. Frontend Setup:**
```bash
cd ../client
npm install
npm run dev
```

**4. Start Playing:**
1. Open `http://localhost:5173` in your browser
2. Connect your Starknet wallet (Cartridge Controller recommended)
3. Create your player character
4. Select a team to join
5. Start your football career!

#### How to Play

**Main Game Loop:**
1. **Character Creation**: Set up your player with initial stats
2. **Team Selection**: Choose from 14 available teams with different characteristics
3. **Match Play**: 
   - Click "Play Match" to find opponents
   - Make tactical decisions during matches
   - Manage stamina and energy
4. **Non-Match Events**:
   - Choose from activities like training, social events, podcasts
   - Each event has 4 random outcomes affecting your stats
   - Events can improve skills, fame, money, or cause setbacks
5. **Progression**: Build your stats, reputation, and team relationships

**Key Mechanics:**
- **Stamina System**: Matches consume stamina; rest to recover
- **Skill Development**: Train specific abilities (shooting, dribbling, energy)
- **Fame & Charisma**: Affects earning potential and opportunities
- **Team Relationships**: Important for team chemistry and success
- **Injury Risk**: Some events can cause temporary injuries

**Stats Explained:**
- **Core Skills**: Shoot, Dribble, Passing, Free Kick
- **Physical**: Energy, Stamina
- **Mental**: Intelligence
- **Social**: Charisma, Fame, Team Relationship
- **Resources**: Coins (money), Injury status

### Twitter
@OvergoalGame

> Share your submission on socials for more exposure!

### Team members
- **Lead Developer**: [Your Name] - [@yourtwitter](https://twitter.com/yourtwitter) - [GitHub](https://github.com/yourusername)
- **Game Designer**: [Team Member 2] - Discord: username#1234
- **Frontend Developer**: [Team Member 3] - [GitHub](https://github.com/teammember3)

#### Technical Architecture
- **Backend**: Cairo smart contracts on Starknet using Dojo framework
- **Frontend**: React with TypeScript, Zustand state management
- **Wallet Integration**: Cartridge Controller for seamless UX
- **Real-time Updates**: GraphQL subscriptions for live game state

**Key Development Challenges Solved:**
- **Transaction Patterns**: Uses proper Dojo SDK patterns instead of low-level Starknet calls
- **Randomization**: Block timestamp-based pseudo-random outcome generation
- **State Persistence**: Zustand with proper persistence configuration
- **Real-time Updates**: GraphQL subscriptions for live blockchain data

**Game Features:**
- **56 Unique Scenarios**: 14 events × 4 outcomes each with varied stat impacts
- **14 Teams**: Each with unique characteristics and personalities  
- **Complex Stat System**: 11+ different player attributes affecting gameplay
- **Visual Feedback**: Color-coded stat changes and dynamic result displays

### Twitter
@OvergoalGame

> Share your submission on socials for more exposure!

### Team members
- **Lead Developer**: [Your Name] - [@yourtwitter](https://twitter.com/yourtwitter) - [GitHub](https://github.com/yourusername)
- **Game Designer**: [Team Member 2] - Discord: username#1234
- **Frontend Developer**: [Team Member 3] - [GitHub](https://github.com/teammember3)
