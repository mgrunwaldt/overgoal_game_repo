# ⚽ Overgoal: More than a match - Mobile football RPG on Starknet

> **An RPG-style decision-making football game where every choice shapes your legend**
> 
> Set in a near-future where footballers are global icons, build your character through seasons of pivotal matches and meaningful choices. Balance performance, reputation, and life beyond the field.

<div align="center">
  <img src="./client/src/assets/Dojo-Logo-Stylized-Red.svg" alt="Dojo Engine" height="60"/>
  &nbsp;&nbsp;&nbsp;
  <img src="./client/src/assets/SN-Linear-Gradient.svg" alt="Starknet" height="60"/>
</div>

## 🎮 Game Overview

**Overgoal** is more than just a match - it's a comprehensive football RPG where you:

- 🌟 **Build Your Legend**: Start as a rising star and progress through seasons
- ⚽ **Play Strategic Matches**: Engage in football matches with real consequences  
- 🎭 **Make Life Choices**: Navigate fame, scandals, deals, and danger through non-match events
- 🏆 **Progress Your Career**: Balance performance, reputation, and personal relationships
- 📱 **Mobile-First Experience**: Designed specifically for mobile gameplay

### Core Gameplay Loop
1. **Season Structure**: Each year = one season with alternating matches and events
2. **Match Play**: Strategic football matches that affect your stats and reputation
3. **Non-Match Events**: Life choices that shape your character (parties, training, podcasts, etc.)
4. **Career Progression**: End-of-season transfers based on performance and reputation
5. **Character Development**: Multiple stats to manage (stamina, skills, charisma, fame, etc.)

## 🛠️ Tech Stack

```
Frontend: React + Vite + TypeScript + TailwindCSS + Zustand
Backend:  Cairo + Dojo Engine + Torii GraphQL Indexer  
Network:  Starknet (Local/Sepolia/Mainnet)
Wallet:   Cartridge Controller (Gaming-optimized wallet)
Mobile:   Responsive design optimized for mobile devices
```

## 📦 Project Structure

```
overgoal_game_repo/
├── 📱 client/                     # React frontend application
│   ├── src/
│   │   ├── components/pages/      # Game screens (Match, Events, Character Selection)
│   │   ├── dojo/                  # Dojo blockchain integration
│   │   │   ├── bindings.ts        # TypeScript interfaces from Cairo contracts
│   │   │   ├── hooks/             # React hooks for blockchain interactions
│   │   │   └── contracts.gen.ts   # Auto-generated contract functions
│   │   ├── zustand/               # Global state management
│   │   └── config/                # App configuration and wallet setup
│   ├── docs/                      # 📚 Game documentation
│   │   └── game_docs/             # Detailed game mechanics and lore
│   └── public/                    # Game assets and images
├── ⚙️ contract/                   # Cairo smart contracts
│   ├── src/
│   │   ├── models/                # Data models (Player, Team, Match, Events)
│   │   ├── systems/               # Game logic and mechanics
│   │   └── store.cairo            # Data layer abstraction
│   ├── scripts/                   # Deployment and seeding scripts
│   └── bindings/                  # Generated TypeScript bindings
└── README.md                      # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Rust** (latest stable)
- **Cairo** (v2.10.1)
- **Dojo** (v1.5.0)

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd overgoal_game_repo
   ```

2. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   ```

### 🔧 Local Development Setup

Follow these steps **in order** to run the game locally:

#### 1. Build the Contracts
```bash
cd contract
sozo build
```

#### 2. Start Local Blockchain (Katana)
```bash
# In contract directory
katana --config katana.toml
```
*Keep this terminal running - this is your local blockchain*

#### 3. Deploy Contracts
```bash
# In contract directory (new terminal)
sozo migrate
```
*Note the World address from the output*

#### 4. Start the Indexer (Torii)
```bash
# In contract directory
torii --world "WORLD_ADDRESS_FROM_STEP_3" --http.cors_origins "*"
```
*Replace WORLD_ADDRESS_FROM_STEP_3 with the actual address*
*Keep this terminal running - this indexes blockchain data*

#### 5. Seed Game Data
```bash
# In contract directory (new terminal)
./scripts/seed_teams.sh
./scripts/seed_non_match_events.sh
```

#### 6. Start Frontend
```bash
# In client directory
npm run dev:https
```

#### 7. Access the Game
- **IMPORTANT**: You MUST access via HTTPS
- The game is designed for **mobile devices** - use mobile view or mobile emulation
- Connect your Cartridge Controller wallet to start playing

## 🎯 Game Features

### ⚽ Match System
- **Strategic Gameplay**: Matches involve stamina management and tactical decisions
- **Real Consequences**: Match results affect your stats, reputation, and career prospects
- **Dynamic Opponents**: Face different teams with varying difficulty levels
- **Performance Tracking**: Detailed match statistics and player ratings

### 🎭 Non-Match Events
Choose from various life events that shape your character:
- 🎉 **Party**: Social events that can boost charisma but risk injury
- 🏋️ **Training**: Improve specific skills (dribbling, shooting, energy)
- 🎙️ **Media**: Podcast appearances and interviews that affect fame
- 💰 **Business**: Brand deals and sponsorship opportunities
- 🧘 **Wellness**: Rest and recovery activities

### 📊 Character Progression
Manage multiple interconnected stats:
- **Physical**: Stamina, Energy, Injury Status
- **Skills**: Dribbling, Shooting, Passing, Free Kick
- **Mental**: Intelligence, Charisma
- **Social**: Fame, Team Relationship
- **Financial**: Coins/Money

### 🏆 Career Management
- **Seasonal Structure**: Progress through football seasons
- **Team Transfers**: Move between clubs based on performance
- **Reputation System**: Your choices affect how teams and fans perceive you
- **Achievement System**: Unlock badges and milestones


## 🔍 Known Issues & Future Improvements

### Current Limitations
- **Frontend Match Simulation**: Matches are currently simulated in the frontend and need to be moved to backend contracts
- **Limited Team Variety**: Opponent selection algorithm needs improvement for better variety
- **Mobile Optimization**: Some UI elements need further mobile refinement


## 📚 Documentation

- **[Game Overview](./client/docs/game_docs/game_overview.md)** - High-level game concept
- **[Gameplay Flow](./client/docs/game_docs/gameplay_flow.md)** - Detailed game mechanics
- **[Character System](./client/docs/game_docs/characters.md)** - Player progression system
- **[Match Mechanics](./client/docs/game_docs/match_mechanics_calculations.md)** - Combat and match systems
- **[Teams & Universe](./client/docs/game_docs/teams.md)** - Game world and lore

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **[Starknet](https://starknet.io)** - Layer 2 blockchain platform
- **[Dojo Engine](https://dojoengine.org)** - Onchain game development framework
- **[Cairo](https://cairo-lang.org)** - Smart contract programming language
- **[Cartridge](https://cartridge.gg)** - Gaming-focused wallet

---

**Will you become a sporting hero—or fall into the shadows of corruption?**
**Play Overgoal and find out! ⚽🌟**
