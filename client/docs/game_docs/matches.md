# GameMatch Entity – Context Guide

> **Purpose**  
> Wherever you see **TODO**, leave it exactly as-is; logic will be wired up elsewhere.

---

## Properties

| Property                | Type      | Description                                              |
|-------------------------|-----------|----------------------------------------------------------|
| `myTeam`                | `Team`    | Controlled squad.                                        |
| `opponentTeam`          | `Team`    | Rival squad.                                             |
| `myTeamScore`           | `number`  | Goals for `myTeam`.                                      |
| `opponentTeamScore`     | `number`  | Goals for `opponentTeam`.                                |
| `nextMatchAction`       | `MatchAction` | Next in-game event to resolve.                       |
| `nextMatchActionMinute` | `number`  | In-game minute when the next action triggers.            |
| `currentTime`           | `number`  | Current minute on the match clock.                       |
| `matchStatus`           | `MatchStatus` | Lifecycle flag.                                    |

---

## Enums

### `MatchStatus`
`notStarted`, `inProgress`, `halfTime`, `finished`

### `MatchAction`
`openPlay`, `jumper`, `brawl`, `freeKick`, `penalty`, `openDefense`

### `MatchDecision`
`dribble`, `pass`, `simulate`, `shoot`, `standingTackle`, `sweepingTackle`, `acceptHug`, `tackleFan`, `joinBrawl`, `stayOut`

---

## Public API

### `createGameMatch(teamA: Team, teamB: Team) → GameMatch`
Factory that returns a fresh `Match` with `matchStatus = notStarted`.

---

### `startGameMatch() → { nextMatchAction: MatchAction, nextMatchActionMinute: number, nextMatchActionDecisionTime: number }`
Transitions `matchStatus` → `inProgress` and schedules the first action.

---

### `processMatchAction(matchDecision: MatchDecision) → { nextMatchAction: MatchAction, nextMatchActionMinute: number, nextMatchActionDecisionTime: number }`
**TODO — keep signature; implementation to be added later.**

---

### `finishGameMatch() → GameMatch`
**TODO — keep signature; implementation to be added later.**  
Should set `matchStatus` → `finished` and finalize scores.

---

### `simulate() → GameMatch`
Instantly sets `matchStatus` → `finished` and returns the completed `GameMatch`.


