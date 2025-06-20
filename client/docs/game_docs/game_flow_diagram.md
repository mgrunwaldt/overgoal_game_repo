
# 🕹️ Overgoal - Game Flow Diagram

```mermaid
graph TD

A[Initial Menu: Cartridge Login] --> B{Is First Login?}

B -- Yes --> C[Character Selector: Cyborg Sand]
C --> D[Draft Screen: Assigned to CyborgLamas FC]
D --> E[Game Menu]

B -- No --> E

E --> F[Play Season]

F --> G[Season Flow]
G --> G1[Event]
G --> G2[Event]
G --> G3[Match]
G --> G4[Event]
G --> G5[Match]
G --> G6[Event]
G --> G7[Match]
G --> G8[Event]
G --> G9[Event]

G --> H[Season End Screen: New Badge + Stats]

H --> I[Transfer Screen: Club 1 <--> Club 2]

%% Game Menu Options
E --> J[Clubs]
E --> K[Market]
E --> L[Leaderboard]
E --> M[All Your Badges]

```

---

## 📝 Description of Flow

1. **Login Flow**
   - Players enter via Cartridge.
   - First-time players go through character selection and team draft.
   - Returning players go straight to game menu.

2. **Game Menu**
   - Core options: Play Season, View Clubs, Market, Leaderboard, Badge Collection.

3. **Season Structure**
   - Interleaves **Non-Match Events** and **Matches**.
   - Mix of choices, stats, narrative and missions.

4. **Season End**
   - Player receives visual feedback: stat growth + badges.
   - Option to **Transfer** to a different club.
