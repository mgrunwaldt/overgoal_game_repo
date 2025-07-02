Free-Kick → Resolution Algorithm (v2)
This file replaces the previous free-kick spec so it meshes with the current Open-Play engine.
All numbers are 0-100 integers unless noted. Use integer-first ops for on-chain gas efficiency.

1. Inputs
Symbol	Description
player	intelligence, teamRelationship, freeKick, passing, stamina, dribble, shoot
attackingTeam	offense, defense, intensity
defendingTeam	offense, defense, intensity
fkDistance (m)	Metres to goal (int).
directRange	true when fkDistance ≤ 28 m (configurable).

2. Initialise baseProbabilityFK
text
Copy
Edit
fk_base        = 2.0                       // 2 %
attack_vs_def  = attackingTeam.offense - defendingTeam.defense
wall_pressure  = defendingTeam.intensity * 0.3

attack_vs_def  = clamp(attack_vs_def, -40, 40)

baseProbabilityFK = fk_base
                  + attack_vs_def * 0.05    // ±2 %
                  - wall_pressure * 0.02    // −0-1.2 %

baseProbabilityFK = clamp(baseProbabilityFK, 0.2, 6.0)
3. Decisions from a Free Kick
python
Copy
Edit
shoot · cross · pass
(Dribble / Simulate are illegal.)

3.1 Shoot — Terminal
Allowed only when directRange == true.

text
Copy
Edit
goalProb = baseProbabilityFK
           * (player.freeKick * 0.5
              + player.shoot   * 0.25
              + player.intelligence * 0.15
              + attackingTeam.offense * 0.10) / 100

goalProb = clamp(goalProb, 0.5, 75.0)
Roll once:

roll ≤ goalProb → Goal

else → No Goal

Sequence ends.

3.2 Cross — Terminal
Always allowed; represents a whipped ball for an instant header/volley.

text
Copy
Edit
goalProb = baseProbabilityFK
           * (player.freeKick  * 0.35
              + player.passing * 0.30
              + player.intelligence * 0.10
              + attackingTeam.offense * 0.20
              - defendingTeam.defense * 0.05) / 100

// Distance dampener (harder the farther you are)
distanceFactor = clamp(1.0 - (fkDistance - 18) * 0.015, 0.5, 1.0)
goalProb *= distanceFactor

goalProb = clamp(goalProb, 0.3, 50.0)
Roll once:

roll ≤ goalProb → Goal

else → No Goal

Sequence ends.

3.3 Pass → Open Play
text
Copy
Edit
successProb = (player.freeKick   * 0.35
               + player.passing  * 0.40
               + player.intelligence * 0.15
               + attackingTeam.offense * 0.10
               - defendingTeam.defense * 0.10) / 100
On success – convert to Open Play:

text
Copy
Edit
newBaseProbability = clamp(baseProbabilityFK * 1.20, 0.2, 10.0) // 20 % boost
Jump into the Open-Play chain using newBaseProbability as the starting value (skip the usual open-play init).

On failure – ball lost → No Goal.

4. Pseudocode Reference
rust
Copy
Edit
fn resolve_free_kick(ctx) -> bool {          // true => Goal
    let mut bp_fk = init_base_fk(ctx);
    match choose_fk_decision(ctx) {
        Shoot => return roll_goal(bp_fk, ctx),
        Cross => return roll_goal(cross_goal_prob(bp_fk, ctx), ctx),
        Pass  => {
            if roll_pass_success(bp_fk, ctx) {
                let new_bp = clamp(bp_fk * 1.20, 0.2, 10.0);
                return open_play_chain(ctx, new_bp);
            }
            return false; // ball lost
        }
    }
}
roll_goal rolls once against the supplied probability and returns true on success.

5. Tuning Notes
distanceFactor flattens huge-distance crosses without another extra parameter.

Expose all multipliers, clamps, and distance thresholds in the same on-chain config module as the Open-Play constants.

Typical real-world data: direct-free-kick conversion ≈ 7 %, cross ≈ 3 %. Adjust until simulated leagues align.

Emit analytics events: FreeKickShoot, FreeKickCross, FreeKickPassSuccess, FreeKickGoal.

