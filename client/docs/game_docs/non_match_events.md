# Non‑Match Events Outcomes

*All stat deltas are tuned for a 0 – 100 scale (except **coins**, which can exceed 100). Clamp values in‑game so nothing drops below 0 or rises above 100. Handle `is_injured` recovery elsewhere.*

---

## Data Model Classes

```ts
class NonMatchEvent {
  name: string;          // e.g. "Look for Sponsor Deals"
  description: string;   // short summary shown in UI
  outcomes: Outcome[];   // exactly 4 (2 positive, 2 negative)
}

class Outcome {
  type: 'positive' | 'negative';
  name: string;          // e.g. "Sneaker Cinderella"
  description: string;   // flavour text for the branch
  consequences: Consequence[];
}

class Consequence {
  name: string;          // one stat key: coins, shoot, dribble, ...
  value: int;            // delta applied (±); clamp result 0‑100 except coins
}
```

*These definitions mirror the markdown sections below, so generating JSON or TypeScript from this doc is trivial.*

---

---

Generate a script to populate all non match events with the outcomes and consequenses

## 🔍 Look for Sponsor Deals

* **Positive — Sneaker Cinderella**: A hip shoe start‑up loves your vibe.
  *Stat changes*: +fame 8, +coins 15, +charisma 4
* **Positive — Eco‑Water Hero**: You land a bottled‑water deal and donate some proceeds.
  *Stat changes*: +fame 6, +coins 12, +team\_relationship 3
* **Negative — Crypto Clown**: You shill a sketchy token; fans clown you.
  *Stat changes*: +coins 18, −fame 10
* **Negative — Smelly Socks Saga**: Sign with a deodorant brand everyone hates.
  *Stat changes*: +coins 12, −fame 8

---

## 🎯 Free‑Kick Practice

* **Positive — Top‑Corner Machine**: Every ball bends in like magic.
  *Stat changes*: +free\_kick 7, +shoot 4, −energy 6
* **Positive — Technique Tutorials**: Coaches film you for the academy channel.
  *Stat changes*: +free\_kick 5, +fame 3, −energy 5
* **Negative — Wet‑Grass Wipe‑out**: Slip, tweak your hamstring.
  *Stat changes*: is\_injured = true, −energy 10
* **Negative — Leg‑Day Overload**: Too many reps fry your quads.
  *Stat changes*: −stamina 6, −energy 8

---

## 🏋️ Go to the Gym

* **Positive — PR Parade**: Smash a personal bench‑press record.
  *Stat changes*: +stamina 6, +charisma 2, −energy 5, −coins 4
* **Positive — Core Crusher**: Killer core workout boosts endurance.
  *Stat changes*: +stamina 4, +energy 3, −coins 3
* **Negative — Over‑Train Pain**: Push too hard; body rebels.
  *Stat changes*: −energy 8, −stamina 4, −coins 2
* **Negative — Gym‑Floor Sprain**: Awkward landing, ankle says “nope.”
  *Stat changes*: is\_injured = true, −energy 10

---

## 🧘 Meditate

* **Positive — Zen Master**: Breathing drills clear the mind.
  *Stat changes*: +intelligence 5, +energy 4
* **Positive — Chill Aura**: Teammates feed off your calm.
  *Stat changes*: +team\_relationship 6, +charisma 3
* **Negative — Meeting Snoozer**: Doze off mid‑team talk.
  *Stat changes*: −team\_relationship 5, −fame 3
* **Negative — Viral Chant Fail**: Weird chanting clip goes viral.
  *Stat changes*: −fame 6, −charisma 2

---

## 🎉 Party

* **Positive — Dance‑Floor Legend**: Crowd chants your name.
  *Stat changes*: +charisma 6, +fame 5, −energy 8, −coins 10
* **Positive — VIP Networking**: Mingle with celebs, snag side deal.
  *Stat changes*: +coins 8, +fame 4, −energy 6
* **Negative — Tabloid Trouble**: Paparazzi catch you at 4 a.m.
  *Stat changes*: −fame 7, −charisma 5, −energy 9
* **Negative — Dance‑Floor Tackle**: Club brawl; you limp home.
  *Stat changes*: is\_injured = true, −stamina 6, −energy 10

---

## 🥅 Penalty Practice

* **Positive — Ten‑for‑Ten**: Drill every shot; coach fist‑bumps you.
  *Stat changes*: +shoot 5, +free\_kick 3, −energy 6
* **Positive — Viral Stutter‑Step**: Cheeky run‑up delights fans.
  *Stat changes*: +fame 4, +charisma 3, +shoot 2, −energy 4
* **Negative — Confidence Crash**: Miss five straight; self‑doubt skyrockets.
  *Stat changes*: −charisma 4, −shoot 3, −energy 5
* **Negative — Ball‑to‑Ankle**: Mis‑hit rebounds into your ankle.
  *Stat changes*: is\_injured = true, −energy 8

---

## 🎙️ Go to a Podcast

* **Positive — Story‑Time Star**: Listeners love your locker‑room tales.
  *Stat changes*: +fame 6, +charisma 5, +coins 5
* **Positive — Clip Goes Viral**: TikTok explodes; teammates proud.
  *Stat changes*: +fame 8, +team\_relationship 3, +charisma 2
* **Negative — Coach‑Shade Slip**: Accidentally roast the coach.
  *Stat changes*: −team\_relationship 8, −fame 4
* **Negative — Hot‑Take Backlash**: Fans cancel you over wild opinion.
  *Stat changes*: −fame 6, −charisma 3

---

## 📱 Work on Social Media

* **Positive — Trick‑Shot King**: Reel hits a million views.
  *Stat changes*: +fame 7, +charisma 4, +coins 5
* **Positive — Brand Collab**: Sponsored post pays off.
  *Stat changes*: +coins 10, +fame 5
* **Negative — Cringe Challenge**: Dance fails, comments savage.
  *Stat changes*: −fame 6, −charisma 4
* **Negative — Doom‑Scroll Drain**: Hours lost to scrolling.
  *Stat changes*: −energy 6, −intelligence 3

---

## 🏡 Visit Parents’ Home

* **Positive — Mom’s Cooking**: Comfort food = batteries recharged.
  *Stat changes*: +energy 8, +stamina 4, −coins 4
* **Positive — Family Grounding**: Heart‑to‑heart resets your focus.
  *Stat changes*: +intelligence 3, +team\_relationship 6, −coins 2
* **Negative — Missed Flight**: Return late; coach fuming.
  *Stat changes*: −team\_relationship 5, −coins 6, −energy 4
* **Negative — Awkward Paparazzi**: Small‑town tabloid snaps you.
  *Stat changes*: −fame 4, −energy 3

---

## 🏃 Go for a Run

* **Positive — Sunrise Stride**: Endorphins pump you up.
  *Stat changes*: +stamina 6, −energy 5
* **Positive — Fan Selfies**: Bump into supporters mid‑jog.
  *Stat changes*: +charisma 3, +fame 2, +stamina 3, −energy 4
* **Negative — Curb Twist**: Bad step, ankle rolls.
  *Stat changes*: is\_injured = true, −energy 8
* **Negative — Overheat**: Mid‑run meltdown.
  *Stat changes*: −energy 7, −stamina 4

---

## 🎮 Play Videogames

* **Positive — Stream Comeback**: Epic win on stream; chat showers subs.
  *Stat changes*: +fame 5, +coins 3, +charisma 4, −energy 3
* **Positive — Strategy Savant**: Tactics game sharpens decision‑making.
  *Stat changes*: +intelligence 5, +passing 3, +energy 2
* **Negative — All‑Nighter**: Lose track of time; zombie mode.
  *Stat changes*: −energy 8, −stamina 4
* **Negative — Rage‑Quit Meme**: Clip of your meltdown goes viral.
  *Stat changes*: −fame 6, −charisma 3

---

*End of file*
