3. Decision → Outcome Flow
Valid decisions inside an Open Play chain: dribble, pass, simulate, shoot

For each non-terminal decision:

Compute successProb (chance the action succeeds)

Roll rand(0–99)

If roll ≤ successProb: apply success effect and continue

Else: ball is lost → sequence ends with No Goal

3.1 Dribble
successProb = (player.dribble * 0.6 + player.intelligence * 0.3 + attackingTeam.offense * 0.1) / 100
On success: baseProbability *= 1.5 (cap at 15%)

3.2 Pass
successProb = (player.passing * 0.6 + player.intelligence * 0.25 + attackingTeam.offense * 0.15) / 100
On success: baseProbability *= 1.2 (cap at 8%)

(This blends the previous offensive and defensive pass profiles.)

3.3 Simulate (Dive)
successProb = (player.intelligence * 0.4 + player.dribble * 0.3 + attackingTeam.intensity * 0.3) / 100
On success: 25% chance of Penalty (jump to penalty routine)
Otherwise: referee waves play on → treat as failed Dribble (ball lost)
On failure: yellow card + ball lost

3.4 Shoot (Terminal)
goalProb = baseProbability * (player.shoot * 0.7 + player.intelligence * 0.1 + attackingTeam.offense * 0.2) / 100
goalProb is clamped between 0.5 and 90.0
Roll: if roll ≤ goalProb → Goal
Else → No Goal
Sequence ends here

4. Pseudocode Reference
While not terminal:
get player decision
If Dribble → resolve dribble
If Pass → resolve pass
If Simulate → resolve simulate
If Shoot → resolve shoot (always terminal)
Return true if terminal == Goal

resolve_* functions mutate baseProbability and signal termination on shot resolution or ball loss

5. Tuning Notes
Integer math first (multiply, then divide) for gas efficiency

Caps prevent runaway probabilities in long chains

Expose multipliers and caps via config components for live tuning

Emit on-chain events (BallLost, Goal, etc.) for analytics

