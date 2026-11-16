# Spam the Meats: Design Document

This document describes the game as implemented in [game.js](game.js), [index.html](index.html), and [styles.css](styles.css). If it disagrees with the code, the code is correct and this document should be updated. The source of truth for all balance values is `MEAT_CATALOG` in [game.js](game.js).

## 1. Overview

Spam the Meats is a single-player browser clicker game. The player runs the packaging division of the fictional Amalgamated Meatworks Co., starting with canned Spam and working up to A5 Wagyu.

- **Core loop:** press the hydraulic press to earn cash, spend the cash on new recipes, quality upgrades, and container tiers, and earn more per press.
- **Tone:** deadpan industrial. The UI is styled as factory equipment, with telemetry readouts, hazard trim, a conveyor belt, and a spec sheet.
- **Scope:** there is one currency, no prestige, and no win state. The packing bot is the only idle income, and it runs only while the page is open. Upgrade levels are unlimited, so play continues for as long as the player wants.

## 2. Core Mechanics

### Press cycle

One press (a click on the press button, the Space key, or a press by the packing bot) packages **one unit of every unlocked meat** and sells the batch immediately. There is no inventory.

- Cash gained per press is the sum of the current sale prices of all unlocked meats.
- Press Cycles increases by 1.
- Packages Sold increases by the number of unlocked meats.

### Spending

Each meat's action buttons depend on its state:

| Meat state | Action | Effect |
| --- | --- | --- |
| Locked | Unlock Recipe | Pays the recipe cost and adds the meat to every future batch at Level 1. |
| Unlocked | Upgrade Quality | Pays the upgrade cost and raises the meat's level by 1. |
| Unlocked | Buy Container | Pays the next container tier's cost and raises the meat's container tier by 1. See Container Tiers. |

The packing bot has its own Upgrade Bot button. See Packing Bot.

A purchase requires the full cost in cash. Purchases cannot be refunded.

## Meat Catalog

| # | Meat | Subtitle | Accent | Recipe unlock | Base sale price | Price increase per level | Base upgrade cost | Clicks equivalent (N) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Spam | Canned Spiced Luncheon Loaf | `#3B82F6` | Free (starter) | $1 | +$5 | $100 | 100 |
| 2 | Hotdogs | Vacuum-Sealed Smokehouse Franks | `#F97316` | $1,000 | $10 | +$20 | $10,000 | 100 |
| 3 | Sausage | Butcher-Twine Smoked Kielbasa | `#EA580C` | $10,000 | $100 | +$300 | $100,000 | 100 |
| 4 | Salami | Dry-Cured Marbled Genoa Chubs | `#E11D48` | $100,000 | $1,000 | +$4,000 | $1,000,000 | 1,000 |
| 5 | Ground Beef | Freshly Milled Prime Chuck Ribbons | `#DC2626` | $1,000,000 | $10,000 | +$50,000 | $10,000,000 | 1,000 |
| 6 | Wagyu | A5 Miyazaki Snowflake-Marbled Cut | `#EAB308` | $100,000,000 | $1,000,000 | +$10,000,000 | $10,000,000,000 | 10,000 |

Patterns in these values:

- Every recipe costs exactly 100 times the meat's base sale price, so every recipe pays for itself in 100 presses.
- Tiers 1 to 5 scale by a factor of 10 in base sale price. Wagyu is a factor of 100 above Ground Beef.
- Base upgrade cost is 100 times base sale price for Spam, 1,000 times for tiers 2 to 5, and 10,000 times for Wagyu.

## Economy Formulas

In these formulas, `L` is the current level, `B` is the base sale price, `D` is the price increase per level, `C` is the base upgrade cost, `N` is the clicks equivalent, and `M` is the multiplier of the meat's current container tier. Meats start at Level 1, which represents zero upgrades, and in the Basic container (`M` = 1).

### Sale price

```
price(L)     = B + (L - 1) × D
salePrice(L) = price(L) × M
```

`price(L)` is the quality price and grows linearly with level. The sale price, which is what a press earns, is the quality price times the container multiplier. With a multiplier, each level adds `D × M`.

### Upgrade cost

Upgrade costs use the quality price `price(L)`, not the sale price, so buying containers never makes quality upgrades more expensive.

The first upgrade (Level 1 to 2) always costs `C`. Later upgrades depend on the cost mode, which the player selects in the Specs & Rules modal. The setting is global, is saved, and defaults to Direct.

| Mode | Cost from Level L to L+1, where L ≥ 2 | Growth |
| --- | --- | --- |
| Direct (default) | `N × price(L)` | Linear |
| Additive | `C + N × price(L)` | Linear |
| Cumulative | `C + N × (price(2) + price(3) + … + price(L))` | Quadratic |

Changing the mode affects only future purchases.

## Level Increments and Costs

Each cost below is the price of upgrading **from** that level to the next one. Levels are unlimited, so these tables are samples.

### Spam

| Level | Sale price | Direct | Additive | Cumulative |
| --- | --- | --- | --- | --- |
| 1 | $1 | $100 | $100 | $100 |
| 2 | $6 | $600 | $700 | $700 |
| 3 | $11 | $1,100 | $1,200 | $1,800 |
| 4 | $16 | $1,600 | $1,700 | $3,400 |
| 5 | $21 | $2,100 | $2,200 | $5,500 |
| 10 | $46 | $4,600 | $4,700 | $23,500 |
| 25 | $121 | $12,100 | $12,200 | $152,500 |

### Hotdogs

| Level | Sale price | Direct | Additive | Cumulative |
| --- | --- | --- | --- | --- |
| 1 | $10 | $10,000 | $10,000 | $10,000 |
| 2 | $30 | $3,000 | $13,000 | $13,000 |
| 3 | $50 | $5,000 | $15,000 | $18,000 |
| 4 | $70 | $7,000 | $17,000 | $25,000 |
| 5 | $90 | $9,000 | $19,000 | $34,000 |
| 10 | $190 | $19,000 | $29,000 | $109,000 |
| 25 | $490 | $49,000 | $59,000 | $634,000 |

### Sausage

| Level | Sale price | Direct | Additive | Cumulative |
| --- | --- | --- | --- | --- |
| 1 | $100 | $100,000 | $100,000 | $100,000 |
| 2 | $400 | $40,000 | $140,000 | $140,000 |
| 3 | $700 | $70,000 | $170,000 | $210,000 |
| 4 | $1,000 | $100,000 | $200,000 | $310,000 |
| 5 | $1,300 | $130,000 | $230,000 | $440,000 |
| 10 | $2,800 | $280,000 | $380,000 | $1,540,000 |
| 25 | $7,300 | $730,000 | $830,000 | $9,340,000 |

### Salami

| Level | Sale price | Direct | Additive | Cumulative |
| --- | --- | --- | --- | --- |
| 1 | $1,000 | $1,000,000 | $1,000,000 | $1,000,000 |
| 2 | $5,000 | $5,000,000 | $6,000,000 | $6,000,000 |
| 3 | $9,000 | $9,000,000 | $10,000,000 | $15,000,000 |
| 4 | $13,000 | $13,000,000 | $14,000,000 | $28,000,000 |
| 5 | $17,000 | $17,000,000 | $18,000,000 | $45,000,000 |
| 10 | $37,000 | $37,000,000 | $38,000,000 | $190,000,000 |
| 25 | $97,000 | $97,000,000 | $98,000,000 | $1,225,000,000 |

### Ground Beef

| Level | Sale price | Direct | Additive | Cumulative |
| --- | --- | --- | --- | --- |
| 1 | $10,000 | $10,000,000 | $10,000,000 | $10,000,000 |
| 2 | $60,000 | $60,000,000 | $70,000,000 | $70,000,000 |
| 3 | $110,000 | $110,000,000 | $120,000,000 | $180,000,000 |
| 4 | $160,000 | $160,000,000 | $170,000,000 | $340,000,000 |
| 5 | $210,000 | $210,000,000 | $220,000,000 | $550,000,000 |
| 10 | $460,000 | $460,000,000 | $470,000,000 | $2,350,000,000 |
| 25 | $1,210,000 | $1,210,000,000 | $1,220,000,000 | $15,250,000,000 |

### Wagyu

| Level | Sale price | Direct | Additive | Cumulative |
| --- | --- | --- | --- | --- |
| 1 | $1,000,000 | $10,000,000,000 | $10,000,000,000 | $10,000,000,000 |
| 2 | $11,000,000 | $110,000,000,000 | $120,000,000,000 | $120,000,000,000 |
| 3 | $21,000,000 | $210,000,000,000 | $220,000,000,000 | $330,000,000,000 |
| 4 | $31,000,000 | $310,000,000,000 | $320,000,000,000 | $640,000,000,000 |
| 5 | $41,000,000 | $410,000,000,000 | $420,000,000,000 | $1,050,000,000,000 |
| 10 | $91,000,000 | $910,000,000,000 | $920,000,000,000 | $4,600,000,000,000 |
| 25 | $241,000,000 | $2,410,000,000,000 | $2,420,000,000,000 | $30,250,000,000,000 |

### Total cost from Level 1 to Level 10

| Meat | Direct | Additive | Cumulative |
| --- | --- | --- | --- |
| Spam | $18,900 | $19,700 | $64,500 |
| Hotdogs | $90,000 | $170,000 | $366,000 |
| Sausage | $1,260,000 | $2,060,000 | $4,860,000 |
| Salami | $153,000,000 | $161,000,000 | $525,000,000 |
| Ground Beef | $1,890,000,000 | $1,970,000,000 | $6,450,000,000 |
| Wagyu | $3,690,000,000,000 | $3,770,000,000,000 | $12,450,000,000,000 |

## Quality Grades

A meat's grade is cosmetic. It changes every two levels and stops at Grade VI, even though levels continue.

| Grade | Levels | Spam | Hotdogs | Sausage |
| --- | --- | --- | --- | --- |
| I | 1–2 | Standard Tin | Ballpark Frank | Country Link |
| II | 3–4 | Honey-Glazed Loaf | Natural Casing | Cracked Peppercorn |
| III | 5–6 | Hickory Smoked | Applewood Smoked | Roasted Garlic Herb |
| IV | 7–8 | Brass-Key Reserve | All-Beef Kosher | Oak-Barrel Kielbasa |
| V | 9–10 | Heritage Cured | Butcher Prime Link | Old-World Guild |
| VI | 11+ | Imperial Gold Tin | Grand Pitmaster | Master Charcutier |

| Grade | Levels | Salami | Ground Beef | Wagyu |
| --- | --- | --- | --- | --- |
| I | 1–2 | Cellar Dry-Cured | 80/20 Chuck Grind | Tajima Select |
| II | 3–4 | Black Truffle Studded | Prime Sirloin Blend | BMS-10 Shimofuri |
| III | 5–6 | Chianti Aged Chub | Dry-Aged Brisket Cut | A5 Miyazaki Reserve |
| IV | 7–8 | Riserva Antica | Grass-Fed Reserve | Olive-Fed Sanuki |
| V | 9–10 | Artisanal Soppressata | Butcher Gold Label | Imperial Snow-Marbled |
| VI | 11+ | Sovereign Vintage | Supreme Marbled Mince | 24K Gold-Leaf Crown |

## Container Tiers

All meats have special tiers of containers: Basic (starter), Copper, Bronze, Silver, Gold, Diamond, and Platinum. Each meat has a separate tier (the tier must be bought separately for each meat). These container tiers multiply the value of the meat by a fixed multiplier, which is different for each meat.

Rules, as implemented:

- A meat's recipe must be unlocked before it can buy containers.
- Tiers are bought one at a time, in the order listed. Platinum is the top tier.
- Each tier replaces the previous one. Multipliers do not stack, so Platinum Spam is worth 30 times its quality price, not 5 × 10 × … × 30.
- Each tier costs twice the previous tier, starting from the meat's Copper cost. Container costs are fixed. They do not depend on the cost mode or the meat's level.
- Each meat's tiers are defined in its `containerTiers` entry in `MEAT_CATALOG`. All six meats currently use the same multipliers, but each can be changed independently.

### Spam

| Container Tier | Multiplier | Cost |
| --- | --- | --- |
| Basic | 1x | Free (starter) |
| Copper | 5x | $8,000 |
| Bronze | 10x | $16,000 |
| Silver | 15x | $32,000 |
| Gold | 20x | $64,000 |
| Diamond | 25x | $128,000 |
| Platinum | 30x | $256,000 |

### Hotdogs

| Container Tier | Multiplier | Cost |
| --- | --- | --- |
| Basic | 1x | Free (starter) |
| Copper | 5x | $30,000 |
| Bronze | 10x | $60,000 |
| Silver | 15x | $120,000 |
| Gold | 20x | $240,000 |
| Diamond | 25x | $480,000 |
| Platinum | 30x | $960,000 |

### Sausage

| Container Tier | Multiplier | Cost |
| --- | --- | --- |
| Basic | 1x | Free (starter) |
| Copper | 5x | $400,000 |
| Bronze | 10x | $800,000 |
| Silver | 15x | $1,600,000 |
| Gold | 20x | $3,200,000 |
| Diamond | 25x | $6,400,000 |
| Platinum | 30x | $12,800,000 |

### Salami

| Container Tier | Multiplier | Cost |
| --- | --- | --- |
| Basic | 1x | Free (starter) |
| Copper | 5x | $51,000,000 |
| Bronze | 10x | $102,000,000 |
| Silver | 15x | $204,000,000 |
| Gold | 20x | $408,000,000 |
| Diamond | 25x | $816,000,000 |
| Platinum | 30x | $1,632,000,000 |

### Ground Beef

| Container Tier | Multiplier | Cost |
| --- | --- | --- |
| Basic | 1x | Free (starter) |
| Copper | 5x | $600,000,000 |
| Bronze | 10x | $1,200,000,000 |
| Silver | 15x | $2,400,000,000 |
| Gold | 20x | $4,800,000,000 |
| Diamond | 25x | $9,600,000,000 |
| Platinum | 30x | $19,200,000,000 |

### Wagyu

| Container Tier | Multiplier | Cost |
| --- | --- | --- |
| Basic | 1x | Free (starter) |
| Copper | 5x | $1,200,000,000,000 |
| Bronze | 10x | $2,400,000,000,000 |
| Silver | 15x | $4,800,000,000,000 |
| Gold | 20x | $9,600,000,000,000 |
| Diamond | 25x | $19,200,000,000,000 |
| Platinum | 30x | $38,400,000,000,000 |

## Packing Bot

Every factory starts with a packing bot at Level 1. The bot is an autoclicker that presses the lever on a timer, and the player can buy faster levels up to Level 20.

### Formulas

```
R(L) = round(0.7 × L^1.5 + L)    presses per minute at Level L
C(L) = 1000 × R(L)^2             cost to upgrade to Level L
```

Costs use the rounded `R(L)`. Level 1 is free, and the bot cannot be removed.

| Level | Clicks per minute R(L) | Seconds per click | Cost to reach level C(L) |
| --- | --- | --- | --- |
| 1 | 2 | 30 | Free (starter) |
| 2 | 4 | 15 | $16,000 |
| 3 | 7 | 8.57 | $49,000 |
| 4 | 10 | 6 | $100,000 |
| 5 | 13 | 4.62 | $169,000 |
| 6 | 16 | 3.75 | $256,000 |
| 7 | 20 | 3 | $400,000 |
| 8 | 24 | 2.5 | $576,000 |
| 9 | 28 | 2.14 | $784,000 |
| 10 | 32 | 1.88 | $1,024,000 |
| 11 | 37 | 1.62 | $1,369,000 |
| 12 | 41 | 1.46 | $1,681,000 |
| 13 | 46 | 1.3 | $2,116,000 |
| 14 | 51 | 1.18 | $2,601,000 |
| 15 | 56 | 1.07 | $3,136,000 |
| 16 | 61 | 0.98 | $3,721,000 |
| 17 | 66 | 0.91 | $4,356,000 |
| 18 | 71 | 0.85 | $5,041,000 |
| 19 | 77 | 0.78 | $5,929,000 |
| 20 | 83 | 0.72 | $6,889,000 |

Upgrading from Level 1 to Level 20 costs $40,213,000 in total.

### Bot presses

- A bot press is a normal press cycle. It sells one package of every unlocked meat and counts toward Press Cycles and Packages Sold.
- **Eating:** on each bot press, there is a 1% chance that the bot eats one package, chosen at random from the unlocked meats. The eaten package earns nothing and is not counted as sold. The rest of the batch sells normally. Player presses are never eaten.
- **Timing:** progress toward the next press builds from real elapsed time and is checked every 200 ms. An upgrade takes effect straight away, and progress already made toward the next press carries over.
- **Background tabs:** browsers slow timers in background tabs. When the timer next runs, the bot makes every press it owed, so a hidden tab earns the same as a visible one. The bot does not run while the page is closed, and progress toward the next press is not saved.

## Progression and Balance

These figures are derived from the formulas. They are not values in the code.

> **Out of date:** the path and observations below were worked out before container tiers and the packing bot existed, and do not account for them.

### Fastest observed path

A simulation that always bought the option with the shortest payback (cost divided by the increase in cash per press) produced this path. It is one strategy, not a proven optimum.

| Purchase | Press count | Cash per press afterward |
| --- | --- | --- |
| Spam Level 2 | 100 | $6 |
| Hotdogs recipe | 267 | $16 |
| Sausage recipe | 892 | $116 |
| Salami recipe | 1,755 | $1,116 |
| Ground Beef recipe | 2,651 | $11,116 |
| Wagyu recipe | 11,648 | $1,011,116 |

The path is the same in all three cost modes, because it buys only the first Spam upgrade, which costs the same in each mode.

### Balance observations

- **Recipes dominate upgrades early.** Each recipe pays back in 100 presses. The only upgrade that beats this is Spam's first, at 20 presses. Every other upgrade takes at least 120 presses, so the shortest-payback path skips them until Wagyu is unlocked.
- **Direct is always the cheapest mode.** The mode can be changed at any time for free, so Additive and Cumulative only act as optional difficulty settings.
- **Direct mode has a cost dip for Hotdogs and Sausage.** Their second upgrade is cheaper than their first ($3,000 against $10,000, and $40,000 against $100,000). Hotdogs does not reach its base cost again until Level 6, and Sausage until Level 4. The other four meats rise steadily.
- **Upgrades have diminishing returns.** Each level adds a fixed amount of cash per press, while cost rises with level.
- **"N clicks" is measured against one meat.** The real number of presses needed is lower when other meats also contribute to the batch.

## Interface

### Layout

- **Telemetry bar:** brand, Factory Treasury, Revenue / Click, Packages Sold, Press Cycles, the Upgrades toggle, the SFX toggle, and the Specs & Rules button.
- **Operator station (left):** a worker at a lever, with the press button and status readout below. Under the readout, the bot strip shows the bot's level, its presses per minute, and a bar that fills toward its next press.
- **Belt hall (center):** the packing machine on the left, the conveyor belts, and the brick shipping wall on the right.
- **Upgrades sidebar (right):** the packing bot card, then six meat cards, plus counters for recipes unlocked and quality upgrades purchased. It can be minimized with the Upgrades toggle or its Minimize button, and the setting is saved. Minimized, it shows a rail of icons, starting with the bot and then each meat, each with a bubble showing its level. Locked meats are dimmed and have no bubble. An icon gets a bold green border when the player can afford that meat's upgrade, next container, or recipe. Clicking an icon expands the sidebar to that meat.
- **Specs & Rules modal:** the pricing table, the container tier table, the cost mode selector, and factory reset button. It closes with Escape, the Close button, or a click on the backdrop.

The page fills the window, with a minimum height of 690px so all six belts fit. The layout has responsive breakpoints at 1520px, 1280px, 900px, and 720px. At 900px and below, the page stacks vertically and scrolls. The expanded sidebar covers the game, and the minimized sidebar becomes a strip of icons above the factory floor. It starts minimized there.

### Worker and lever

Each press plays one pull: the lever moves toward the worker in 70 ms and returns in 200 ms, while the worker leans back. The pose is calculated each frame, so the worker's hands stay on the grip. A press during a pull restarts the pull from the lever's current position.

### Conveyor belts

Each unlocked meat has its own belt. The first belt is at the top, and each new recipe adds a belt below the existing ones, so the order follows the order the player unlocked the recipes. Each belt shows the meat's name, level, and sale price, and ends in its own hole in the wall, marked "To Shipping."

Packages leave the machine as the lever reaches the end of its pull, then travel at 320 px per second and fade into the hole. Cash is awarded at the press, not on arrival.

### Meat cards

Each card shows the meat's image, level, sale price, price increase per level (including the container multiplier), packages sold, and a bar showing progress toward the next quality upgrade or recipe.

- **Locked:** the card shows a LOCKED overlay, the subtitle, the recipe cost, and the cash per press the recipe would add. The container button is hidden.
- **Unlocked:** the card shows the current grade name, the upgrade cost, and the next sale price. The container button sits to the right of Upgrade Quality and shows the next tier's name, multiplier, and cost. Once Platinum is owned, it shows Platinum and MAX and is disabled. While the container button is visible, Upgrade Quality shows its cost below its label.

The card gets the green "can afford" highlight when the player can afford either the quality upgrade or the next container.

### Bot card

The bot card uses the meat card layout, with a steel accent (`#94A3B8`) and a robot icon. It shows the bot's level, presses per minute, total bot presses, and packages eaten. Its button shows the next level, the change in presses per minute, and the cost. At Level 20 it reads "Bot Fully Upgraded" and MAX, and is disabled.

### Number formatting

| Context | Full digits below | Compact above |
| --- | --- | --- |
| Treasury, Revenue / Click | $1 trillion | K, M, B, T, Qa, Qi |
| Cards, buttons, popups, belt labels | $10 million | K, M, B, T, Qa, Qi |
| Package price tags | $100,000 | K, M, B, T, Qa, Qi |

### Feedback

| Event | Feedback |
| --- | --- |
| Press | Lever pull, machine flash, floating payout popup (900 ms), treasury pulse (130 ms), and one package on each belt, with the belts moving until the last package reaches the end |
| Unlock | Card flash, a status message on the readout, and a new belt that slides in below the others |
| Upgrade | Card flash and a status message on the readout |
| Container | Card flash and a status message on the readout naming the new tier, multiplier, and sale price |
| Bot press | Lever pull, a "BOT +$X" popup, a status message on the readout, and one package on each belt. There is no sound or treasury pulse. |
| Bot eats a package | A red "BOT ATE 1 <MEAT>" popup below the payout popup, a status message on the readout, and no package on that meat's belt |
| Bot upgrade | Card flash and a status message on the readout |

To keep rapid clicking smooth, each belt holds at most 24 packages. The oldest is removed when another arrives.

### Audio

All sound is synthesized with the Web Audio API, so there are no audio files.

| Event | Sound |
| --- | --- |
| Press | Low triangle-wave thud (135 Hz falling to 42 Hz) with a sine-wave metallic ping |
| Upgrade, container, bot upgrade | Rising A major triad (triangle wave) |

Bot presses make no sound.
| Recipe unlock | Rising C major arpeggio, C5 to C6 (sine wave) |

### Visual style

The game uses a dark, warm palette of charcoal and off-white, with press red, brass gold, and emerald accents. Emerald marks items that are ready to buy. Headings use Space Grotesk, body text uses DM Sans, and numbers and labels use JetBrains Mono, all loaded from Google Fonts. Each meat has a package illustration in [assets/](assets/) and an accent color from section 3.

## 9. Technical Design

- **Stack:** plain HTML, CSS, and JavaScript, with no framework, dependencies, or build step. The [CNAME](CNAME) file maps the site to `spamthemeats.com`.
- **Structure:** all logic lives in a single IIFE in [game.js](game.js). Meat cards are built once, then `renderUI()` refreshes the whole interface after each state change.
- **Persistence:** state is saved as JSON to `localStorage` under `spam_the_meats_save_v1` after every press, purchase, or settings change.
- **Loading:** saved values are validated field by field, and invalid values fall back to defaults. If a save can't be parsed, the game starts fresh.

### Saved state

| Field | Default | Purpose |
| --- | --- | --- |
| `cash` | 0 | Current balance |
| `totalEarned` | 0 | Lifetime earnings |
| `totalClicks` | 0 | Press count |
| `totalPackages` | 0 | Packages sold across all meats |
| `costMode` | `direct` | `direct`, `additive`, or `cumulative` |
| `soundEnabled` | `true` | SFX setting |
| `sidebarOpen` | `true` | Whether the upgrades sidebar is expanded |
| `beltOrder` | `["spam"]` | Unlocked meats in belt order, top to bottom |
| `bot.level` | 1 | Packing bot level, 1 to 20 |
| `bot.clicks` | 0 | Presses made by the bot |
| `bot.packagesEaten` | 0 | Packages the bot has eaten |
| `meats[id].unlocked` | Spam only | Whether the recipe is owned |
| `meats[id].level` | 1 | Quality level |
| `meats[id].containerTier` | 0 | Index of the owned container tier, 0 (Basic) to 6 (Platinum). Older saves without it load as Basic, and out-of-range values are clamped. |
| `meats[id].packagesSold` | 0 | Packages sold for this meat |
| `meats[id].totalRevenue` | 0 | Revenue from this meat |

Factory reset asks for confirmation, then restores all of these defaults, including the settings.

## 10. Known Issues

- **Reset can desynchronize sound.** If SFX is off when the player resets, the button shows `SFX: ON` but the game stays muted until it is toggled. Reset restores `state.soundEnabled` without updating `audio.enabled`.
- **Holding Space auto-clicks.** The keydown handler does not check `e.repeat`, so holding Space triggers repeated presses unless the press button has focus. With the button focused, the browser handles Space and each hold counts once. If this auto-click is unintended, it should be blocked. If it is intended, it should work the same in both cases.
- **Enter has no global binding.** A comment in `bindEvents()` mentions Spacebar and Enter support, but only Space is implemented.
- **Some tracked values are never shown.** `totalEarned` and each meat's `totalRevenue` are saved but do not appear in the UI.
- **Very large values lose precision.** Cash is stored as a JavaScript number, so amounts above about $9 quadrillion are no longer exact. At $1,000 Qi and above, the display also runs out of suffixes.
