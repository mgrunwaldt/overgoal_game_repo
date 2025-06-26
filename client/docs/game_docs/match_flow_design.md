# ⚽ Match Flow Design Document

> **Game Design Overview:** This document describes how football matches work in Overgoal, focusing on the player experience and underlying game mechanics in natural language.

## 🎯 Core Concept

Matches in Overgoal simulate 90-minute football games where players participate in key moments that can change the outcome. The system balances realism with engaging gameplay by using team stats and player attributes to determine when events happen and whether the player gets involved.

---

## 🏗️ Match Structure

### **Match Creation Process**
1. **Player initiates:** User clicks "Play Match" on the main screen
2. **System generates:** Unique match ID and selects random opponent team
3. **Contract creates:** New match record with both teams, starting scores at 0-0
4. **Navigation:** Player moves to pre-match screen to review matchup

### **Match Phases**
- **Pre-Match:** Review teams, player stamina, opponent preview
- **Live Match:** Event-driven gameplay with player decisions
- **Half-Time:** Brief pause at 45 minutes, then continue
- **Full-Time:** Match ends at 90 minutes, show final results

---

## 🎲 Event Generation System

### **The Core Loop**
The match runs on a minute-by-minute simulation that:
1. **Checks for attack opportunities** for your team
2. **Checks for opponent attacks** if your team doesn't attack
3. **Advances time** if no events occur
4. **Stops when player participation is needed** or match ends

### **Attack Event Probability**
**Base Chance:** 7 events happen every 90 minutes on average

**Your Team Attacks:**
- Base probability gets multiplied by your team's offensive strength
- Higher offense stats = more attack opportunities
- Team intensity also increases attack frequency
- Better stats mean more chances to score

**Opponent Attacks:**
- Same base probability but modified by multiple factors
- Your team's defense reduces opponent attack chances
- Your team's intensity helps prevent opponent attacks
- Opponent's offense and intensity increase their attack chances
- Stronger defense = fewer opponent attacks

### **Types of Attack Events**
When an attack happens, the system determines what kind:

1. **Penalty Kick** (rare but high scoring chance)
   - Based on team offense and player dribbling skill
   - About 4% base chance, modified by stats
   - 80% chance to score if no player involvement

2. **Free Kick** (moderate chance)
   - Mainly based on player dribbling ability
   - About 18% base chance, modified by stats
   - 10% chance to score if no player involvement

3. **Open Play** (most common)
   - Default when other events don't trigger
   - 1% chance to score if no player involvement
   - Represents general attacking moves

---

## 👤 Player Participation

### **When Do You Participate?**
The system checks if you get involved in each event based on:

**Your Team Attacks:**
- You must not be injured
- You must have stamina remaining
- Higher stamina = more likely to participate
- Higher intelligence = better decision making
- Better team relationship = more involvement
- Perfect conditions = almost guaranteed participation

**Opponent Attacks (Defense):**
- Same injury and stamina requirements
- Lower base participation rate (15% vs 100%)
- Based on stamina and intelligence only
- Represents helping your team defend

### **What Happens When You Don't Participate?**
If you're not involved in an event, the AI simulates the outcome:
- Penalties have high scoring chance (80% base)
- Free kicks have medium chance (10% base)
- Open play has low chance (1% base)
- Team's offensive strength adjusts these percentages
- Match continues automatically to next event

---

## 🎮 Player Decision Points

### **When You Participate**
The match pauses and presents you with decision options:

**Attacking Situations:**
- Choose how to approach the goal
- Options like dribble, pass, or shoot
- Your choice affects the outcome probability
- Success depends on your stats and decision quality

**Defensive Situations:**
- Choose how to stop the opponent
- Options for different tackling approaches
- Risk vs reward for aggressive vs safe plays
- Your stats determine success likelihood

### **After Your Decision**
1. **Immediate outcome** based on your choice and stats
2. **Visual feedback** showing what happened
3. **Match continues** to find the next event
4. **Stamina cost** for participating in events

---

## ⏱️ Time and Pacing

### **Match Timeline**
- **Minutes 1-45:** First half with normal event generation
- **Minute 45:** Automatic transition to half-time
- **Minutes 46-90:** Second half continues from where first half ended
- **Minute 90:** Match automatically ends

### **Event Timing**
- Events can happen at any minute during play
- More events likely when teams have better stats
- Player sees timer advance between events
- Realistic pacing with periods of action and calm

---

## 📊 Stat Influence System

### **Team Stats Impact**
**Offense (0-100):**
- Higher values = more attack events for that team
- Affects scoring chances when player doesn't participate
- Influences penalty and free kick probabilities

**Defense (0-100):**
- Higher values = fewer opponent attack events
- Helps prevent goals when player doesn't participate
- Makes opponent attacks less likely to succeed

**Intensity (0-100):**
- Increases both attack frequency and defensive resistance
- Represents team energy and pressing style
- Affects how often events happen overall

### **Player Stats Impact**
**Stamina (0-100):**
- Determines if you can participate in events
- Lower stamina = less participation over time
- Decreases as you participate in events

**Dribbling (0-100):**
- Affects penalty and free kick event generation
- Higher skill = more technical events
- Influences your success in attacking decisions

**Intelligence (0-100):**
- Affects participation probability
- Higher intelligence = better event recognition
- Helps in both attacking and defensive situations

**Team Relationship (0-100):**
- Affects how often teammates involve you
- Higher relationship = more participation
- Represents trust and communication

**Injury Status:**
- Injured players cannot participate in any events
- Match continues with AI-only simulation
- Affects long-term strategy and stamina management

---

## 🎯 Game Balance Design

### **Normalization System**
All stats get converted to multipliers between 0.7 and 1.3:
- **0 stat value** = 0.7 multiplier (30% below average)
- **50 stat value** = 1.0 multiplier (average performance)
- **100 stat value** = 1.3 multiplier (30% above average)

This ensures that:
- No stat is completely useless (minimum 70% effectiveness)
- No stat is overwhelmingly powerful (maximum 130% effectiveness)
- Differences matter but don't break game balance

### **Configurable Parameters**
Key values that can be easily adjusted for game balance:
- **Base event frequency:** Currently 7 per 90 minutes
- **Participation rates:** 100% for attacks, 15% for defense
- **Scoring probabilities:** 80% penalties, 10% free kicks, 1% open play
- **Stat normalization ranges:** Can be tightened or expanded

---

## 🏆 Strategic Depth

### **Player Choices**
- **Stamina management:** Participate in key moments vs conserving energy
- **Risk assessment:** Aggressive plays vs safe options
- **Team building:** Choose teams with complementary stats
- **Long-term planning:** Injury recovery and stat development

### **Emergent Gameplay**
- **High-offense teams:** More events but potentially weaker defense
- **Defensive teams:** Fewer opponent chances but less attacking
- **Balanced teams:** Consistent performance across situations
- **Player development:** Stats affect participation and success rates

---

## 🎬 User Experience Flow

### **Typical Match Experience**
1. **Pre-match:** Review opponent, check stamina, plan strategy
2. **Early events:** Get involved in 2-3 key moments in first half
3. **Half-time:** Brief pause, assess performance so far
4. **Late game:** Stamina affects participation, crucial decisions
5. **Full-time:** See final score, review key moments you influenced

### **Emotional Beats**
- **Anticipation:** Will an event happen this minute?
- **Excitement:** You're involved in a crucial moment!
- **Tension:** Make the right decision under pressure
- **Relief/Frustration:** See the outcome of your choice
- **Satisfaction:** Match concludes with your impact visible

---

## 🔧 Technical Considerations

### **Performance**
- Match simulation happens in contract (blockchain)
- Frontend shows visual feedback and collects decisions
- Efficient probability calculations using simple math
- Minimal gas usage through optimized algorithms

### **Randomness**
- Uses blockchain timestamp for pseudo-randomness
- Deterministic but unpredictable outcomes
- Fair probability distribution across all players
- Consistent results for same inputs

### **Scalability**
- Each match is independent simulation
- No complex state dependencies between matches
- Easy to add new event types or decision options
- Modular design allows feature expansion

---

**💡 Design Philosophy:** Create meaningful player agency within realistic football simulation, where stats matter but player decisions can overcome statistical disadvantages through smart play and good timing. 