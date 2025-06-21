<!-- team-context.md -->
# Team Class — Context

## Goal  
Offer a simple, standardized model of a football club for simulations, game logic, or storage. All numeric stats are normalised to **0 – 100** for easy balancing and comparison.

---

## Fields

| Field                   | Range   | Description                                                 |
|-------------------------|---------|-------------------------------------------------------------|
| **name**                | —       | Human-readable club name (e.g., “Juventus”).                |
| **offense**             | 0–100   | Attacking strength; higher values produce better chances.   |
| **defense**             | 0–100   | Ability to prevent opponent chances.                        |
| **intensity**           | 0–100   | Pressing power and physical edge.                           |
| **currentLeaguePoints** | 0–100*  | Points on the league table (win = +3, draw = +1).           |

\*The upper cap keeps things tidy; lift it if a season can exceed 100 points.

---

## Methods

| Method | Purpose | Behaviour |
|--------|---------|-----------|
| **Constructor** | Create a new team. | Receives **name**, **offense**, **defense**, and **intensity**. All numeric inputs are clamped to 0-100. **currentLeaguePoints** starts at **0** automatically. |
| **changeCurrentPoints(pointsDelta)** | Update league points after a fixture or penalty. | Receives a signed integer. Adds it to **currentLeaguePoints** and re-clamps the result to 0-100. Negative values are allowed for point deductions. |


USE CAIRO MCP TO CREATE ANY CAIRO RELATED CODE