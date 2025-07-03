Penalty → Resolution Algorithm
Add this file to cursor context next to Open-Play and Free-Kick.
All maths use 0-100 integers and clamp helpers; multiply first, divide last for gas-friendliness.

1. Inputs
Symbol	Description
player	intelligence, teamRelationship, freeKick, passing, stamina, dribble, shoot
defendingTeam	defense, intensity
(defense ≈ goalkeeper quality)
pkPressure	true if shoot-out (higher nerves); optional flag

2. Initialise baseProbabilityPK
text
Copy
Edit
pk_base    = 60.0                          // 60 %
skill_edge = player.shoot - defendingTeam.defense
nerve_tax  = pkPressure ? 5.0 : 0.0        // -5 % in shoot-outs

skill_edge = clamp(skill_edge, -40, 40)    // keep sane

baseProbabilityPK = pk_base
                   + skill_edge * 0.25      // ±10 %
                   + player.intelligence * 0.10   // 0-10 %
                   - nerve_tax

baseProbabilityPK = clamp(baseProbabilityPK, 40.0, 90.0)
3. Kicker’s Choice (exactly one)
scss
Copy
Edit
center · corner · panenka
Each option is terminal — roll once → Goal / No Goal.

3.1 Shoot Center
Stable aim but keeper often stays home.

text
Copy
Edit
goalProb = baseProbabilityPK * 0.90       // −10 %
goalProb = clamp(goalProb, 35.0, 80.0)
3.2 Shoot Corner
Higher payoff if placed; relies heavily on shoot skill.

text
Copy
Edit
aim_bonus  = (player.shoot - 50) * 0.30    // −15→+15 %
goalProb   = baseProbabilityPK * 1.05      // +5 % baseline
goalProb  += aim_bonus

goalProb   = clamp(goalProb, 40.0, 90.0)
3.3 Panenka
Risky chip; success hangs on IQ & keeper dive timing.

text
Copy
Edit
iq_factor  = player.intelligence * 0.40    // 0-40 %
goalProb   = baseProbabilityPK * 0.70      // −30 %
goalProb  += iq_factor - defendingTeam.intensity * 0.20

goalProb   = clamp(goalProb, 20.0, 80.0)
Rationale – smarter players read the keeper; high-intensity opponents less likely to bite.

Resolution (for any option)
text
Copy
Edit
roll = rand(0-99)
Goal   if roll ≤ goalProb
NoGoal otherwise
Sequence ends.

4. Pseudocode Reference
rust
Copy
Edit
fn resolve_penalty(ctx) -> bool {      // returns true if Goal
    let base_pk = init_base_pk(ctx);
    let goal_prob = match choose_penalty_type(ctx) {
        Center  => calc_center_prob(base_pk, ctx),
        Corner  => calc_corner_prob(base_pk, ctx),
        Panenka => calc_panenka_prob(base_pk, ctx),
    };
    return roll(goal_prob);
}
5. Tuning Notes
Skill edge multiplier (0.25) roughly mirrors real-world 75-80 % conversion.
Adjust to fit league scoring targets.

Keep clamps wide enough to reward elite players but avoid 100 % certainties.

Consider later adding goalkeeper “guess” logic; current spec uses aggregate defense.

Emit events: PenaltyTaken, PenaltyType, PenaltyGoal.