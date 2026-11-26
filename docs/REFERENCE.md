# Cobblemon Bedrock API reference

> API **1**. TypeScript types are in `api/dist/types.d.ts`.

## `registerAddon(def)`

| Field | What it is |
| --- | --- |
| `addon` | Your namespace (lowercase letters, digits and `_`). |
| `version` | Your add-on's version, shown in the content log. |
| `moves` | New moves, based on Cobblemon Bedrock's. See [Moves](#moves). |
| `species` | List of species (below). |
| `additions` | Forms and looks for Cobblemon Bedrock species. See [Additions](#additions-to-cobblemon-bedrock-species). |
| `spawn` | `{ entries, levels }`: where and at what level they spawn. |
| `sprites` | UI textures per variant. |
| `evolutions` | New evolutions for species that aren't yours. |
| `megas`, `megaAccessories` | Mega evolutions for your species (or for Cobblemon Bedrock ones, through `additions`), and the items that work as a Key Stone. See [Megas](#megas). |
| `partyItems` | Your items that are used on a party Pokémon. See [Items used on a Pokémon](#items-used-on-a-pokémon). |
| `npcs` | Trainers, merchants, nurses and people who talk. See [NPCs](#npcs). |
| `zones` | Places with their own Pokémon, like your villages. See [Spawn zones](#spawn-zones). |
| `buttons` | Your buttons in the party summary and the PC. See [Buttons in screens](#buttons-in-screens). |
| `onAck` | What to do with the reply. By default, it goes to the content log. |

It's sent when the world loads and whenever Cobblemon Bedrock asks for it,
split into chunks of the message size Cobblemon Bedrock measures. Sending it
again replaces the previous registration.

## Species

Required: `id`, `name`, `nationalPokedexNumber`, `primaryType`, `baseStats`,
`catchRate`, `baseExperienceYield`, `experienceGroup`, `abilities` (at least
one) and `moves.levelUp`.

| Field | Notes |
| --- | --- |
| `id` | `myaddon:species`, the same as its entity. |
| `nationalPokedexNumber` | Outside the official range (2000+) to go at the end of the Pokédex. |
| `primaryType`, `secondaryType` | `normal`, `fire`, `water`… in lowercase. |
| `baseStats`, `evYield` | `hp`, `attack`, `defence`, `specialAttack`, `specialDefence`, `speed`. |
| `experienceGroup` | `fast`, `medium_fast`, `medium_slow`, `slow`, `erratic`, `fluctuating`. |
| `abilities`, `hiddenAbility` | The mod's ids. One with no battle effect gives a warning. |
| `maleRatio` | 0–1, or `null` for genderless. |
| `moves` | `levelUp: [{ level, move }]`, plus `egg`, `tm`, `tutor`. Only moves the engine knows, or [yours](#moves). |
| `evolutions` | Cobblemon format (`variant`, `result`, `requiredContext`, `requirements`). `result` can be yours (`myaddon:x`) or Cobblemon Bedrock's (`raichu`). |
| `preEvolution` | Same as `result`. |
| `forms` | See [Forms](#forms). |
| `baseScale`, `hitbox` | As in Cobblemon. |
| `drops` | `{ amount, entries: [{ item, percentage?, quantityRange?, rarity? }] }`. Cobblemon Bedrock items use `cooblemon:`. |
| `battleClips` | Name → `[animation id, seconds, 1 if it loops]`: `physical`, `special`, `status`, `cry`, `faint`, `recoil`… |
| `locators` | Name → list of `[x, y, z]` in model pixels (`root`, `middle`, `mouth`, `special`…): particles come out of them. |
| `riding` | `{ stats: { LAND\|AIR\|LIQUID: { SPEED: [min, max], … } }, keys }`. The entity must have the `cooblemon:ride_on` component group. |
| `shoulder` | `{ left, right }`: the clip for each shoulder. The entity must have the `cooblemon:shoulder` component group. |

### Forms

`{ name, aspects?, primaryType?, secondaryType?, baseStats?, abilities?,
evolutions?, moves? }`.

- **`name` is the form's id**: its aspect (`alolan`), lowercase and with `_`.
  Not the display name ("Alola").
- `moves` in the mod's format: `"10:confusion"`.
- If your BP has the entity `myaddon:species_<form>`, the form uses it.

## Spawns

```js
spawn: {
  entries: [{ species, form?, biome, biomeTag?, biomeAny?, biomeAll?, biomeNot?,
              habitat?, light?, dimension?, weather?, bucket?, entryWeight?,
              heightMin?, heightMax?, baseBlocks?, nearbyBlocks?, zone? }],
  levels: { "myaddon:species": { min, max } },
}
```

| Field | Values |
| --- | --- |
| `biome` | Biome tag: `forest`, `beach`, `plains`, `taiga`, `jungle`… (Cobblemon's, without `is_`). |
| `habitat` | `land`, `water`, `beach`, `riverbank`, `beach_water`, `seafloor`. |
| `light` | `surface`, `cave`, `day`, `night`. |
| `dimension` | `overworld`, `nether`, `end`. |
| `bucket` | `common`, `uncommon`, `rare`, `ultra-rare`. |
| `form` | A form of the same species, by its id. |
| `zone` | Only inside these zones of yours (a zone id or a list). See [Spawn zones](#spawn-zones). |

Your species don't spawn until Cobblemon Bedrock closes registration (once
every add-on has finished sending).

### Spawn zones

Bedrock can't tell whether a spot is inside a structure, so "only in my
village" can't be said with a biome. A **zone** says it instead: you register
it, mark its center once when the village generates, and your entries with
`zone` only spawn within its radius.

```js
zones: {
  "myaddon:village": { radius: 64 },               // 4 to 128 blocks, default 48
  "myaddon:pond":    { radius: 12, replaceSpawns: true },
},
spawn: {
  entries: [
    { species: "meowth", zone: "myaddon:village", bucket: "common", entryWeight: 9 },
    { species: "myaddon:koi", zone: ["myaddon:pond"], habitat: "water" },
  ],
},
```

- **Any species** works in a zone entry, Cobblemon Bedrock's too: the zone is
  yours, and what spawns in it changes nothing outside. They keep their usual
  levels.
- `biome` is optional in a zone entry. The rest of the conditions (`light`,
  `habitat`, `weather`…) still apply.
- Zone entries **join** the world's spawns there, by weight. With
  `replaceSpawns: true`, only the zone's entries spawn inside it.
- A Habitat block that replaces spawns still wins inside its own radius: the
  player placed it on purpose.
- The world keeps the centers, so a zone works with no block left behind.
  Without your add-on, the centers stay but do nothing; reinstalling it brings
  the zones back.

Mark a center with **`markZone(zone, at)`**, or with a marker block in your
structure: **`zoneMarker(blockId, zones, options?)`** works like
[`npcMarker`](#putting-npcs-in-the-world), with the state `<addon>:zone`, and
marks the zone (or the list of zones) its number says, centered on the block.
Put it in the middle piece of the village. Marking the same zone again within
8 blocks does nothing.

```js
cobblemon.zoneMarker("myaddon:zone_marker", { 0: "myaddon:village", 1: ["myaddon:village", "myaddon:pond"] });
```

`/scriptevent cooblemon:spawn_debug` shows the zones you are standing in, and
which zone each Pokémon came from.

## Sprites

Keyed by `species|form|shiny`: `"myaddon:x||0"` (normal), `"myaddon:x||1"`
(shiny), `"myaddon:x|alolan|0"` (a form).

| Field | Where it shows |
| --- | --- |
| `pc` | PC and party summary. |
| `face` | Battle HP frame. |
| `dex`, `portrait`, `size` | Pokédex: icon, portrait and Size silhouette. Without them, `pc` is used. |
| `glyph` | Party panel: a character from U+F000 to U+F8FF. |

Paths in your add-on's RP, without `.png`. Without a sprite, the UI shows a
Poké Ball.

**The party panel portrait** is a character from a glyph page
`font/glyph_F0.png`…`glyph_F8.png` in your RP: 256×256, 16×16 cells, the face
centered. U+F000 is the first cell of `glyph_F0`. Two add-ons using the same
page overwrite each other: pick one and mention it in your description.

## Moves

New moves are **based on one of Cobblemon Bedrock's**: yours copies all of
its data (target, flags, secondary effects…) and its battle animation, and
changes what you set.

```js
moves: [
  // Surf (the wave, both foes, its animation) turned Electric, with a 20% chance to paralyze.
  { id: "myaddon:surf_shock", basedOn: "surf", name: "Surf Shock", type: "electric", power: 75, effect: "paralyze", effectChance: 20 },
],
```

| Field | Notes |
| --- | --- |
| `id` | Yours: `myaddon:move`. Use it in your species' move lists like any other. |
| `basedOn` | The Cobblemon Bedrock move it copies (`surf`, `swordsdance`…). |
| `name` | Fallback name. Put the real one in your RP: `move.myaddon:move=…` and `move.myaddon:move.desc=…`. |
| `type`, `category`, `power`, `accuracy`, `pp`, `priority` | As in the games. |
| `effect`, `effectChance` | A secondary effect some Cobblemon Bedrock move uses (`paralyze`, `burn`, `poison`, `flinch`, `confusion`…) and its chance; `effect: null` removes the base move's. |
| `boosts`, `selfBoosts` | Stat changes to the target and to the user: `{ atk: -1 }`, with `atk`, `def`, `spa`, `spd`, `spe`, `accuracy`, `evasion` (-6 to 6). `null` removes them. |
| `drainFraction`, `recoilFraction`, `healFraction` | 0–1: share of damage healed, share taken as recoil, share of max HP healed. |
| `critRatio`, `multiHit`, `flags` | Extra crit stages; hits per use (`2` or `[2, 5]`); Showdown flags (`contact`, `sound`…). |

**What isn't copied.** A few moves also have behavior written in code for
their id: Sucker Punch only works if the target is attacking, Counter
returns damage, Protect-like moves… A move based on one of those keeps only
its data part. Base yours on moves whose effect is data (damage, secondary
effects, stat changes, draining, recoil, healing, multi-hit) and it behaves
fully.

Without your add-on, Pokémon that learned your moves keep them saved, but
can't use them until it's installed again.

## Additions to Cobblemon Bedrock species

Like Cobblemon's `species_additions` and resolvers: you can give a
Cobblemon Bedrock species **a new form**, or **a new look for a form it
already has**, without registering a new species.

```js
additions: [
  {
    target: "cyndaquil",
    forms: [
      // An existing form: only its model changes.
      { name: "hisui_bias", entity: "myaddon:cyndaquil_hisui_bias" },
    ],
  },
  {
    target: "pikachu",
    forms: [
      // A new form: its data, its model and the name shown after "Pikachu".
      { name: "surfing", entity: "myaddon:pikachu_surfing", label: "myaddon.form.surfing",
        primaryType: "electric", secondaryType: "water" },
    ],
  },
],
```

| Field | Notes |
| --- | --- |
| `target` | A Cobblemon Bedrock species: `cyndaquil`. Your own species use `forms` instead. |
| `forms[].name` | The form id. If the species already has it (`hisui_bias`, `alolan`…), only its look changes and data fields are ignored with a warning. |
| `forms[].entity` | **Your** entity (`myaddon:…`) with the form's model. From then on that form uses it everywhere: wild spawns, sending it out, evolving, the PC. |
| `forms[].label` | Lang key in your RP for the form's name, for new forms. |
| `forms[].battleClips`, `forms[].locators` | As in a species, for your entity. Clips it doesn't have fall back to the species' (useful when your model keeps the same bones). |
| Other fields | As in [Forms](#forms), for new forms. |

- Only one add-on can change a given form. A second one gets an error.
- Spawns can use a Cobblemon Bedrock species **with a form you added**:
  `{ species: "cyndaquil", form: "hisui_bias", … }`. Levels stay the species'.
- Sprites for those forms go without namespace: `"cyndaquil|hisui_bias|0"`.
- Your entity's behavior file is a full Pokémon entity, like your species'.
  The kit builds it for you from the mod's files.

## Evolutions into your species

```js
evolutions: {
  pikachu: [{ variant: "item_interact", result: "myaddon:voltrix", requiredContext: "cobblemon:water_stone" }],
}
```

Adds evolutions to species that aren't yours. The result must be one of your
species. Cobblemon Bedrock's evolutions and other add-ons' aren't touched.

## Megas

Mega evolutions for your own species, or for Cobblemon Bedrock ones. The
mega is a **form** you register in the species' `forms` (or, for a
Cobblemon Bedrock species, in `additions`), usually with `battleOnly: true`:

- its types, base stats and abilities are used after mega evolving;
- its entity, `myaddon:species_<form>`, is the model shown.

Then say which stone triggers it and which items work as a Key Stone:

```js
registerAddon({
  addon: "myaddon",
  species: [/* …with a form { name: "mega", battleOnly: true, primaryType, baseStats, abilities } */],
  megas: [{ species: "myaddon:voltrix", form: "mega", stones: ["myaddon:voltrite"], ability: "drizzle" }],
  megaAccessories: ["myaddon:key_stone"],
});
```

| Field | Notes |
| --- | --- |
| `species` | One of your species, or a Cobblemon Bedrock one whose mega form you added with `additions`. |
| `form` | The id of the mega form. |
| `stones` | Item ids that trigger it, held by the Pokémon. They become holdable items. |
| `ability` | Ability while mega evolved. Defaults to the form's first ability. |

**Cobblemon Bedrock doesn't provide a Key Stone**, so `megaAccessories` must
list at least one of your items, with `minecraft:allow_off_hand`. The player
needs it **in the offhand**; then the battle shows the Mega button when the
Pokémon holding the stone is out.

Sprites for the mega form use its id like any other form:
`"myaddon:voltrix|mega|0"`.

## Items used on a Pokémon

Potions, vitamins, candies… Cobblemon Bedrock does the hard part, choosing
the Pokémon the same way as with its own items:

- looking at one of your Pokémon that's out: that one;
- anywhere else: the party selector, with those that can't use it greyed out;
- in battle, nothing (items in battle go through the Bag).

Then it spends one and sends you `item_used`; **you apply the effect** with
`updatePokemon`.

```js
const cobblemon = registerAddon({
  addon: "myaddon",
  partyItems: [{ id: "myaddon:super_soda", hurt: true }],
});

onCobblemonEvent("item_used", (e) => {
  if (e.item === "myaddon:super_soda") cobblemon.updatePokemon(e.player.id, e.pokemon.uuid, { heal: 50 });
});
```

| Field | Notes |
| --- | --- |
| `id` | One of your items. Nothing needs to be added to its JSON. |
| `consume` | Spend one when used. Default `true`. With `false` nothing is spent: remove it yourself if your effect applies. |
| `species` | Only these species. |
| `fainted` | `true`: only fainted Pokémon (a revive). `false`: only those that aren't. |
| `hurt` | Only Pokémon missing HP (a potion). |

If the Pokémon you're looking at can't use it, nothing happens, as in
Cobblemon.

## Buttons in screens

Cobblemon Bedrock's screens can't be edited from another pack, so your
buttons go in a list. When at least one of them fits the Pokémon on screen,
the **party summary** and the **PC** (with a Pokémon picked) show an
**Add-ons** button. It closes the screen and opens a list with every add-on's
buttons for that Pokémon; picking one sends you `ui_button`. What it does is
up to you: your own form, an action, a message…

```js
const cobblemon = registerAddon({
  addon: "myaddon",
  buttons: [
    { id: "myaddon:rest", screen: "summary", label: "myaddon.button.rest", icon: "textures/myaddon/ui/rest" },
    { id: "myaddon:inspect", screen: ["summary", "pc"], label: "myaddon.button.inspect", species: ["eevee"] },
  ],
});

onCobblemonEvent("ui_button", (e) => {
  if (e.button === "myaddon:rest") cobblemon.updatePokemon(e.player.id, e.pokemon.uuid, { heal: "full" });
});
```

| Field | Notes |
| --- | --- |
| `id` | `myaddon:<name>`. It comes back in `ui_button`. |
| `screen` | `summary`, `pc`, or a list with both. |
| `label` | A key in your add-on's `.lang`. |
| `icon` | Optional. A texture path in your resource pack (or any loaded pack), without `.png`. |
| `species` | Only for these species. |

- `ui_button` reaches every add-on: check `e.addon` or your button ids.
- In the PC the Pokémon may be in a box (`place.kind` is `"pc"`), and
  `updatePokemon` only works on the party.
- Neither the texture nor the key can be checked from a script: a missing
  texture shows the game's pink square, and a missing key shows the key.
- Battle screens have no buttons: their turns are too delicate.
- Players who use the simple menus (the game's own forms) don't see the
  button.

## NPCs

Trainers, merchants, nurses or people who just talk. **Needs Cobblemon
Bedrock with API 2** (1.8.13 or later). An NPC is a Cobblemon Bedrock
trainer: battles, the shop, healing and the windows are the same as for its
own NPCs. Your add-on only provides the data.

```js
const cobblemon = registerAddon({
  addon: "myaddon",
  npcs: {
    "myaddon:surfer_kai": {
      name: "Kai",
      role: "trainer",
      skin: "ace_trainer_abel_04a5",
      team: [
        { species: "wingull", level: 18 },
        { species: "pikachu", level: 24, moves: ["thunderbolt", "quickattack"] },
      ],
      battle: { cooldown: 120, reward: 900 },
      dialogue: {
        greeting: ["myaddon.npc.kai.greeting"],
        options: ["battle", "close"],
        victory: ["myaddon.npc.kai.victory"],
      },
    },
  },
});
```

| Field | Notes |
| --- | --- |
| `name` | Plain text, up to 32 characters. It's a name, so it isn't translated. |
| `role` | `trainer` (default), `merchant`, `nurse` (heals the party) or `talker`. |
| `skin` | A Cobblemon Bedrock trainer skin, by file name: `nurse-joy`, `shop_keeper`, `shop_keeper_2`, `ace_trainer_abel_04a5`… An unknown one gets one for its role. |
| `team` | Only for trainers. Up to six: `{ species, level?, heldItem?, moves?, ability?, shiny? }`. Unknown species, items or moves are left out with a warning. |
| `level` | For the whole team. Each Pokémon's own `level` wins. With neither, the team adapts to the player's level. |
| `skill` | How well it plays, 0 to 1. Without it, the one for its `battle.kind`. |
| `battle` | `format` (`singles`, `doubles`), `start` (`request`: talk to it; `sight`: it challenges you when it sees you), `rematch` (`false`: never again once beaten), `cooldown` (seconds before a rematch; default five minutes), `reward` (money when beaten), `kind` (`standard`, `gym_leader`, `elite_four`, `champion`), `items` (up to three, used in battle). |
| `shop` | Only for merchants. Categories: `[{ name, offers: [{ item, price, stock? }] }]`, prices in the player's money. `name` is a language key or plain text. With two or more categories, the player picks one first; each shows 12 offers per page. Up to 16 categories and 64 offers. `stock` is units per in-game day for all players together; without it, an offer never runs out. |
| `dialogue` | See below. |
| `movement` | `still` (default) or `free`. |

### Dialogue

Every line is a **language key** from your `.lang`, and one is picked at
random. `%s` in the text is the player's name.

| Field | When |
| --- | --- |
| `greeting` | When the player talks to it. |
| `options` | The buttons: `battle`, `shop`, `heal`, `close`. Default: the one for its role, and "Goodbye". |
| `challenge`, `victory`, `defeat` | Before a battle, when the player wins, when the player loses. |
| `cooldown` | When asked for a rematch too soon. |
| `hurt` | If the player hit it in the last ten minutes: it won't talk. |

With `greeting` or `options`, a window opens. Without them, touching the NPC
does what its role does, with no window: a merchant opens the shop, a nurse
heals, a trainer challenges.

### Putting NPCs in the world

**`spawnNpc({ npc, at, yaw?, tag? })`** puts one where you say. It looks up to
two blocks higher for room to stand. The result is `{ entityId }`.
`despawnNpc(entityId)` removes it.

**`npcMarker(blockId, npcs, options?)`** is for structures. A `.mcstructure`
can't carry an NPC's data, so you place a marker block where it should stand.
When the chunk loads, the marker turns into air and spawns the NPC its state
says.

```js
// When your script loads, not later: block components are registered on startup.
cobblemon.npcMarker("myaddon:npc_marker", { 0: "myaddon:surfer_kai", 1: "myaddon:nurse" });
```

The block needs the component, a tick and the state (`<addon>:npc`, 0–15):

```json
"description": {
  "identifier": "myaddon:npc_marker",
  "menu_category": { "category": "none" },
  "states": { "myaddon:npc": { "values": { "min": 0, "max": 15 } } }
},
"components": {
  "minecraft:custom_components": ["myaddon:npc_marker"],
  "minecraft:tick": { "interval_range": [10, 30] },
  "minecraft:geometry": "geometry.cooblemon_empty",
  "minecraft:material_instances": { "*": { "texture": "cooblemon_empty", "render_method": "blend" } },
  "minecraft:collision_box": false,
  "minecraft:selection_box": false
}
```

For more than 16 NPCs, add a second state and pass it as
`options.groupState`: the number is `group * 16 + npc`. `options.tag` goes to
every NPC the marker spawns.

**`pokemonMarker(blockId, pokemon, options?)`** does the same for Pokémon that
stand in your structures, like a Chansey in a Pokémon Center. Each number is
a `spawn` request (see [The Pokémon](#the-pokémon-spawn-and-give)); the state
is `<addon>:pokemon`.

```js
cobblemon.pokemonMarker("myaddon:pokemon_marker", { 0: { species: "chansey", level: 30 } });
```

A marker inside water (with `minecraft:liquid_detection` allowing water, and
placed waterlogged in your structure) leaves water behind instead of air: a
Magikarp in a pond doesn't leave an air pocket.

The [creator kit](../kit/README.md#structures) writes the marker blocks, their tables and the
markers inside your structures for you, zones included.

### What the NPC keeps

The NPC stores **which definition it comes from**, not a copy. If a new
version of your add-on changes a team or a price, NPCs already in the world
pick it up. Without your add-on, an NPC keeps its name and skin and says it
isn't attending.

Battles against your NPCs come with `npc` (its id) and `npcTag` in
`battle_start` and `battle_end`.

## Reply (`ack`)

`{ addon, api, ok, errors[], warnings[] }`. An **error** leaves that part out
(a species, a spawn entry); a **warning** lets it in without the failing
detail (an unknown move).

## Events

With `onCobblemonEvent(name, (data) => …)`. All of them carry `api` and,
except battle events, `player` (`{ id, name }`). `pokemon` is a summary:
`{ uuid, species, form, level, shiny, gender, nickname, ball, tag }`
(`tag` is set by your add-on with `spawn` or `give`, `null` otherwise).

| Event | Data | When |
| --- | --- | --- |
| `captured` | `player`, `pokemon`, `ball`, `source` (`wild`, `battle`, `raid`), `destination` (`party`, `pc`) | A capture was saved. |
| `battle_start` | `kind` (`wild`, `trainer`, `raid`, `pvp`), `players`, `opponent`, `raidTier`, `trainerName`, and against an add-on NPC `npc` and `npcTag` | A battle starts. |
| `battle_end` | The same plus `result` (`win`, `loss`, `run`, `catch`, `aborted`) | A battle ends. |
| `level_up` | `player`, `from`, `pokemon` | Levels up (several levels at once are one event). |
| `evolved` | `player`, `from`, `pokemon` | Evolves. |
| `released` | `player`, `pokemon`, `from` (`pc`, `party`) | Is released. |
| `starter_chosen` | `player`, `pokemon` | The starter is chosen. |
| `pokedex_registered` | `player`, `species`, `status` (`seen`, `caught`) | First time seen or caught. |
| `item_used` | `player`, `item`, `slot`, `pokemon` (with `hp`, `maxHp` and `status`) | One of your `partyItems` was used on a party Pokémon. |
| `ui_button` | `player`, `addon`, `button`, `screen` (`summary`, `pc`), `place` (`{ kind: "party", slot }` or `{ kind: "pc", box, slot }`), `pokemon` (with `hp`, `maxHp` and `status`) | One of your `buttons` was picked. The screen is already closed. |
| `npc_purchase` | `player`, `npc` (`null` for Cobblemon Bedrock's own merchants), `npcTag`, `merchant` (its name), `item`, `price`, `category`, `wallet` (what the player has left) | Something was bought in a merchant's shop. |
| `wild_spawned` | `player` (the one it spawned around, or the one fishing; `null` for a Poké Snack), `pokemon` (as in `nearby`, without `distance`) | **API 3.** One of Cobblemon Bedrock's spawners put a wild Pokémon in the world. Sent two ticks later, once its level and form are set. |
| `fishing` | `player`, `stage` (`cast`, `approach`, `bite`, `end`), `rod`, `location`; `pokemon` on `bite`; `outcome` (`pokemon`, `item`, `nothing`, `escaped`, `cancelled`) and `item` on `end` | **API 3.** A player's fishing. See [Fishing](#fishing). |
| `pokemon_encountered` | `player`, `via` (`battle`, `capture`, `scan`), `pokemon` (as in `nearby`, without `distance`) | **API 3.** A player came across a wild Pokémon: a battle with it started, a Poké Ball was thrown at it outside battle, or the Pokédex scanner registered it. Sent every time, not only the first; `pokemon.entryId` says which spawn entry it came from. |

**In a chat message**, every parameter of a `rawtext` must be an object: the
level goes as `{ text: "10" }`. A bare number makes `sendMessage` fail with
"Native variant type conversion failed".

## Actions and queries

`registerAddon` returns a client to ask Cobblemon Bedrock to do things or tell
you things. Every call returns a promise:

- it resolves **one tick later at the earliest**, never instantly;
- it rejects with the reason if the request is invalid (an unknown species,
  a player who isn't online…);
- requests made before Cobblemon Bedrock accepts your registration wait for
  it, so you can use the client right away.

```js
const cobblemon = registerAddon({ addon: "myaddon", /* … */ });

const { entityId } = await cobblemon.spawn({
  pokemon: { species: "articuno", level: 50, shiny: true, tag: "altar" },
  nearPlayer: player,
  battle: player,
});
```

Players can be given as the `Player` object, their id or their name. They
must be online.

### The Pokémon (`spawn` and `give`)

Only `species` is required. Anything left out is decided as usual: random IVs
and nature, level-up moves, and a level from the species' spawn rules.

| Field | Notes |
| --- | --- |
| `species` | `articuno` (a Cobblemon Bedrock species) or `myaddon:species`. |
| `form` | A form id (its aspect): `alolan`, `galarian`… |
| `level` | 1–100. |
| `shiny`, `alpha` | `true` / `false`. |
| `gender` | `male`, `female`, `genderless`. |
| `nature` | `modest`, `adamant`… |
| `ivs`, `evs` | Some or all of the six stats. IVs 0–31; EVs 0–252, 510 in total. |
| `ability` | An ability id. |
| `moves` | 1 to 4 move ids (Showdown ids, as in the mod). |
| `heldItem` | An item id. |
| `friendship` | 0–255. |
| `nickname` | Up to 32 characters. |
| `tag` | Up to 64 characters. **It stays with the Pokémon** and appears as `pokemon.tag` in every event about it (`captured`, `level_up`, `evolved`, `released`…). Use it to recognize "the Articuno from my altar". |

There are no limits on what you can ask for: shiny, legendary or perfect-IV
Pokémon are all allowed. What doesn't exist is rejected (an unknown nature,
move or item); it's never silently changed. `/scriptevent
cooblemon:debug.registry` shows how many actions and queries each add-on has
made.

### Actions

| Call | What it does | Result |
| --- | --- | --- |
| `spawn({ pokemon, at \| nearPlayer, battle? })` | Spawns a wild Pokémon. `at: { dimension, x, y, z }` or `nearPlayer` (two blocks next to them). `battle: player` starts a battle with that player right away. `pokemon.catchable: false` makes it impossible to catch (an event boss). | `{ entityId, battle }` |
| `give({ player, pokemon, destination? })` | Gives a Pokémon to a player. `destination`: `party` (default, the PC if the party is full) or `pc`. `pokemon.ball`: the Poké Ball it comes in (`cooblemon:ultra_ball`…). It's registered in their Pokédex as caught. | `{ destination, pokemon }` |
| `startBattle(player, entityId)` | A battle against a wild Pokémon already in the world. | `{ battle }` |
| `heal(player)` | Heals the whole party, like a healing machine. | — |
| `spawnNpc({ npc, at, yaw?, tag? })` | Puts one of your NPCs in the world. See [NPCs](#npcs). | `{ entityId }` |
| `despawnNpc(entityId)` | Removes one of your NPCs. | — |
| `markZone(zone, at)` | Marks the center of one of your zones. See [Spawn zones](#spawn-zones). | `{ added }` |
| `updatePokemon(player, uuid, changes)` | Changes a Pokémon in the party (not in battle). `changes`: `heal` (HP, or `"full"`; also revives), `cure` (status), `levels` (like a Rare Candy: moves and evolution included), and `nature`, `ivs`, `evs`, `ability`, `moves`, `heldItem`, `friendship`, `nickname`, `tag` as above. HP isn't refilled by the other fields. | `{ pokemon, evolved }` |

### Queries

| Call | Result |
| --- | --- |
| `party(player)` | `{ pokemon: [...] }`: the party, as event summaries (with `tag`). |
| `pokedex(player, species?)` | `{ seen, caught, total, entries: [{ species, status, forms }] }`. `species` narrows the list. `forms` (API 3): `[{ form, status, genders, shinies }]`, per form as in Cobblemon's Pokédex (`form: null` is the base form); empty when only the species is known. |
| `nearby({ player \| at, radius? })` | `{ pokemon: [{ entityId, species, form, level, shiny, alpha, tag, source, entryId, bucket, dimension, location, distance }] }`: wild Pokémon, nearest first. `radius` 1–128 blocks (1–64 before API 3; default 16), up to 50 results. `source` (`world`, `snack`, `fishing`), `entryId` and `bucket` say where it came from; see [Spawn tables](#spawn-tables). |
| `species(id)` | Its data: name, number, types, base stats, abilities, catch rate, forms, `labels` (`gen1`, `starter`, `legendary`…), `evYield`, and which add-on registered it (`null` for Cobblemon Bedrock's own). `labels` and `evYield` are API 3. |
| `spawnTable({ player \| at \| snack, bucket?, area? })` | **API 3.** What can spawn there and how likely it is. See [Spawn tables](#spawn-tables). |
| `spawnDetail(ids)` | **API 3.** Cobblemon's own conditions for 1–32 entries. See [Spawn tables](#spawn-tables). |
| `fishingTable(player, bucket?)` | **API 3.** What can bite on the player's rod and how likely it is. See [Fishing](#fishing). |
| `sprites([{ species, form?, shiny? }])` | **API 3.** `{ sprites: [{ species, form, shiny, sprite, face }] }`: texture paths for 1–64 Pokémon, to use as-is in your UI (resource pack textures are shared between packs). `null` when there's none. |
| `itemInfo(ids)` | **API 3.** `{ items: [{ id, kind, nameKey, icon }] }` for 1–64 item or block ids, Cobblemon Bedrock's or Minecraft's. See [Item icons and names](#item-icons-and-names). |

### Item icons and names

Cobblemon Bedrock's items declare their icon by an atlas name, so another
add-on can't tell which texture to draw. `itemInfo(ids)` tells it:

```js
const { items } = await cobblemon.itemInfo(["cooblemon:poke_ball", "minecraft:sand", "cooblemon:oran_berry"]);
// [{ id: "cooblemon:poke_ball", kind: "item", nameKey: "item.cooblemon:poke_ball", icon: "textures/items/poke_ball" },
//  { id: "minecraft:sand", kind: "block", nameKey: "tile.sand.default.name", icon: "textures/blocks/sand" }, …]
```

- `icon` is a texture path to use as-is in your UI. A block without a flat
  item drawing gives one face of the block (the side, or the whole block);
  grass, leaves and water are stored grey and tinted by the game. `null`
  when there's none.
- `nameKey` is the lang key of its name: show it with `{ translate: nameKey }`
  (or `%nameKey` in a label) and the player sees it in their language.
- Cobblemon Bedrock's item icons follow `textures/items/<name>`, but don't
  rely on it: some share a drawing, and blocks don't.
- In a [chest screen](CHEST_SCREENS.md) you can also put the real item in a
  slot; the game then draws it, 3D blocks included.

### Spawn tables

`spawnTable` answers "what can I find here?", worked out the same way
Cobblemon Bedrock's spawner draws: **first the rarity bucket, then an entry
within it**, by weight, among the entries whose conditions hold there.

- `player`: where the player stands. `at`: a point `{ dimension, x, y, z }`.
  `snack`: the position of a Poké Snack placed in the world; then the table
  uses the snack's own buckets and the bias of its seasonings. The placed
  Poké Snack is the block `cooblemon:poke_snack` (the item has the same id),
  so you can find it with `block.typeId` or `dimension.getBlock()`.
- `bucket`: only that bucket. A whole biome can have dozens of entries; one
  bucket at a time keeps the answer small.
- `area` (with `player`): the **area** around the player instead of one
  spot. Cobblemon Bedrock's spawner places wild Pokémon 16 to 64 blocks away
  from each player; `area` samples places there the same way it does (12 by
  default, `{ positions: 1–32 }` to change it) and averages. It takes a few
  ticks. The result adds `area: { positions, biomes }`, and each entry
  `positions` (in how many of those places it can spawn); `weight` is then the
  highest it had, like Cobblemon's.

```js
const table = await cobblemon.spawnTable({ player, bucket: "rare" });
// table.buckets: [{ bucket: "common", chance: 0.938 }, …]
// table.entries: [{ id: "bulbasaur-1", species: "bulbasaur", form: null, bucket: "rare",
//                   weight: 18, chance: 0.12, levels: { min: 5, max: 32 }, alpha: false,
//                   conditions: { biome: "is_jungle", light: "surface", … },
//                   place: { biome: "minecraft:jungle", biomeTags: ["cobblemon:is_jungle", …],
//                            positionType: "grounded", fluid: null } }, …]
```

- `entries[].chance` is the chance **within its bucket**. Multiply it by the
  bucket's `chance` for the overall one. A bucket can have a chance and no
  entries there: that attempt spawns nothing, as in Cobblemon.
- `entries[].id` is the entry's **stable id** (`bulbasaur-1`, Cobblemon's own),
  the same in every world. Several rules of one entry (one per biome, day and
  night…) share it. `wild_spawned` and `nearby` give the `entryId` of each wild
  Pokémon, so you can keep a catalogue of the entries a player has seen.
- `conditions` are Cobblemon Bedrock's, already converted from Cobblemon's:
  `biome` (a biome tag), `light` (`surface`, `cave`, `day`, `night`),
  `dimension`, `habitat`, `weather` (`any`, `clear`, `rain`), and when they
  apply `minY`/`maxY`, `baseBlocks`, `nearbyBlocks`, `zones`, `moonPhases`
  (0 = full moon), `timeRange` (`dusk`, `twilight`…), `thunder`,
  `pokeSnack`, `slimeChunk` and `coords`.
- `weight` includes Cobblemon's weight multipliers that apply there and then
  (night, thunderstorm, moon phase, a Poké Snack, nearby blocks…);
  `baseWeight` is without them, and `weightMultipliers` lists them.
- `place` says where the entry falls: `biome` (the Bedrock biome id of the
  spot; with `area`, of the first sampled place where it fits, like
  Cobblemon's `firstFitting`), `biomeTags` (Cobblemon's tags for that biome:
  `cobblemon:is_arid`, `cobblemon:is_mountain`…), `positionType`
  (`grounded`, `submerged`, `surface`, `seafloor`) and `fluid` (`water`,
  `lava` or `null`). It's what Cobblenav uses to pick the platform under each
  Pokémon: first the fluid and position type (water, lava), then the biome
  tags (sand for `is_arid`, stone for `is_mountain`, grass for `is_plains`…).
- Fishing entries are in `fishingTable`, below.

**Detail.** `spawnDetail(ids)` gives Cobblemon's own conditions for up to 32
entries, merged with their presets as Cobblemon does: what Cobblenav's detail
view shows (light and sky light ranges, open sky, slime chunk, coordinates,
structures, blocks…). The fields and values are Cobblemon's, Java ids and tags
included; `blocks` translates each block or block tag they mention into
Bedrock block ids, and `blockInfo` gives the icon and lang key of each of
those ids (as `itemInfo` does); `partialBlocks` lists the ones that are
incomplete because they use Java vanilla tags that don't ship with Cobblemon
(`#cobblemon:natural`, "any natural ground", is one). Some of these conditions are approximated by
Cobblemon Bedrock's spawner (light becomes day, night or cave) or can't be
checked at all (structures): `spawnTable`'s `conditions` are the ones that
really apply.

```js
const { details, blocks } = await cobblemon.spawnDetail(["gastly-1"]);
// details[0]: { id: "gastly-1", pokemon: "gastly", positionType: "grounded",
//   bucket: "common", weight: 72, level: "6-31", presets: ["natural"],
//   conditions: [{ biomes: ["#cobblemon:is_overworld", …], minSkyLight: 0, maxSkyLight: 0,
//                  maxLight: 0, neededBaseBlocks: ["#cobblemon:natural"] }],
//   anticonditions: [{ biomes: ["#cobblemon:is_deep_dark"] },
//                    { neededBaseBlocks: ["minecraft:farmland"] }],
//   weightMultipliers: [{ multiplier: 1.25, condition: { isPokeSnack: true } }] }
// blocks["minecraft:farmland"]: ["minecraft:farmland"]
// blockInfo["minecraft:farmland"]: { icon: "textures/blocks/dirt", nameKey: "tile.farmland.name" }
// partialBlocks: ["#cobblemon:natural"]
```

### Fishing

`fishingTable(player, bucket?)` is the fishing counterpart of `spawnTable`,
what Cobblenav's Fishingnav shows. It reads what an add-on can't: while the
player is fishing, the cast rod and the bobber; otherwise the rod in hand (or
the first one in the inventory) and the water the player is looking at. The
rod's bait, Lure and Luck of the Sea count as they do when fishing.

```js
const fishing = await cobblemon.fishingTable(player);
// fishing.stage: "idle" | "waiting" | "approach" | "bitten"
// fishing.rod: { id: "cooblemon:love_rod", ball: "cooblemon:love_ball", lineColor: "#…",
//               icon: "textures/items/love_rod", nameKey: "item.cooblemon:love_rod",
//               ballIcon: "textures/items/love_ball", ballNameKey: "item.cooblemon:love_ball" }
// fishing.bait: { item: "cooblemon:love_sweet", count: 3, seasonings: [],
//                 icon: "textures/items/love_sweet", nameKey: "item.cooblemon:love_sweet" }
// fishing.pokemonChance: 0.8416  (a bite is a Pokémon, not an item)
// fishing.buckets: [{ bucket: "common", chance: 0.83 }, …]
// fishing.entries: [{ id: "magikarp-1", species: "magikarp", bucket: "common",
//                     chance: 0.4, conditions: { biome: "ocean", … }, … }, …]
```

- The overall chance of an entry is `pokemonChance × bucket chance × chance`.
- `conditions` adds the fishing ones: `minLureLevel`/`maxLureLevel`,
  `belowLureLevel` (it stops biting from that level up), `slimeChunk`, `rod`
  and `bait` (entries that need a specific rod or bait).
- `entries[].id` works with `spawnDetail`, and `wild_spawned` gives it for
  what is fished up.

The `fishing` event follows a player's fishing: `cast`, `approach` (something
starts swimming to the bobber; Cobblenav closes its Fishingnav here and doesn't
let it open until the fishing ends), `bite` and `end` (with `outcome`).

## HUD

**API 3.** In Bedrock, a custom HUD can only get data from scripts through the
title and subtitle text (`#hud_title_text_string` in `hud_screen.json`).
Cobblemon Bedrock already uses both for its party panel and the Pokédex
scanner, and there's only one title: if your add-on sent titles too, the
party panel would flicker or vanish. So don't send them. Give yours to
`hud(player, content)` and Cobblemon Bedrock adds them to the title it sends:

```js
await cobblemon.hud(player, {
  marks: ["radar", "dot_3_5"],                 // in the title as |myaddon:radar||myaddon:dot_3_5|
  lines: [`${x} ${y} ${z}`, { translate: "myaddon.hud.tracking" }],  // subtitle rows 24, 25…
});
await cobblemon.hud(player, null);             // take it all away
```

- **Marks** go in the title as `|<addon>:<mark>|`. Your JSON UI shows a
  control when the title contains its mark, the way the party panel does.
  Make sure no mark of yours is part of another (`dot_1` is in `dot_12`;
  end them with a letter or pad the numbers: `dot_01`).
- **Lines** go in the subtitle from row 24 on (`firstRow` in the reply).
  Rows 0–23 always belong to the party panel, filled in even when it isn't
  shown, so yours never move. A label can only show the whole subtitle: put
  it in a panel that clips, shifted up `row × line height`, so only your line
  shows. Only one add-on's lines are shown at a time: the last one that
  started sending them.
- The title starts with `§0§0`, which Cobblemon Bedrock's `hud_title_text`
  hides, together with the subtitle. **Don't redefine `hud_title_text`**:
  that would break the hiding for everyone.
- It stays until you change it or the player leaves. Not shown while the
  player scans with the Pokédex, which takes the title.
- Send it when something changes, not every tick: every call sends the
  title again.

In your resource pack, add your control to the HUD with `modifications`, so it
doesn't replace Cobblemon Bedrock's (defining `controls` of an existing element
does):

```json
{
  "namespace": "hud",
  "root_panel": {
    "modifications": [
      { "array_name": "controls", "operation": "insert_back",
        "value": [{ "myaddon_hud@myaddon_hud.root": {} }] }
    ]
  }
}
```

and read the title with a binding:

```json
"bindings": [
  { "binding_name": "#hud_title_text_string", "binding_type": "global" },
  { "binding_type": "view",
    "source_property_name": "(not ((#hud_title_text_string - '|myaddon:radar|') = #hud_title_text_string))",
    "target_property_name": "#visible" }
]
```

The example add-on's `/scriptevent ejemplo:hud` is a working one.

## Chest screens

**API 3.** Menus drawn inside a chest's inventory screen, the technique
Cobblemon Bedrock uses for its PC, Pokédex and battle screens. Unlike a form,
the screen updates live: no closing and reopening on every tap. The library
has the engine; your resource pack draws the screen. See
[Chest screens](CHEST_SCREENS.md) for the whole recipe; the example add-on's
Spawn Radar is a working one.


## Sounds

**API 3.** Cobblemon Bedrock's sounds live in its resource pack, so your
add-on can play them with `player.playSound(id)` or
`dimension.playSound(id, location)`, without shipping copies. The ones below
are part of the API: they won't be renamed or removed without a new API
version. Any other `cooblemon.*` sound may change at any time.

| Sound | When Cobblemon Bedrock plays it |
| --- | --- |
| `cooblemon.pc.on` | A PC or chest screen opens. |
| `cooblemon.pc.off` | It closes. |
| `cooblemon.pc.click` | A button is pressed in a chest screen. |
| `cooblemon.pc.grab` | A Pokémon is picked up in the PC. |
| `cooblemon.pc.drop` | It's put down. |
| `cooblemon.pc.release` | It's released. |
| `cooblemon.gui.trade` | A trade goes through. |
| `cooblemon.pokedex.scan_open` | The Pokédex scanner opens. |
| `cooblemon.pokedex.scan_close` | It closes. |
| `cooblemon.pokedex.scan_detail` | It locks onto a Pokémon. |
| `cooblemon.pokedex.scan_register` | A new Pokémon is registered. |
| `cooblemon.fishing.cast` | A Poké Rod is cast. |
| `cooblemon.fishing.reel_in` | It's reeled in. |
| `cooblemon.fishing.notification` | Something bites. |
| `cooblemon.fishing.splash_small` | A small splash on the water. |
| `cooblemon.fishing.splash_big` | A big one. |
| `cooblemon.poke_ball.throw` | A Poké Ball is thrown. |
| `cooblemon.poke_ball.hit` | It hits the Pokémon. |
| `cooblemon.poke_ball.open` | It opens. |
| `cooblemon.poke_ball.shake` | It shakes while catching. |
| `cooblemon.poke_ball.break` | The Pokémon breaks free. |
| `cooblemon.poke_ball.capture_succeeded` | The catch works. |
| `cooblemon.poke_ball.send_out` | A Pokémon is sent out. |
| `cooblemon.poke_ball.recall` | It's recalled. |
| `cooblemon.evolution.full` | An evolution ends. |
| `cooblemon.healing_machine.active` | The healing machine heals. |
| `cooblemon.particle.shiny_chime` | A shiny Pokémon sparkles. |
| `cooblemon.status.up` | A stat goes up in battle. |
| `cooblemon.status.down` | A stat goes down. |

Cries follow a pattern: `cooblemon.pokemon.cry.<species>`
(`cooblemon.pokemon.cry.pikachu`), for every species that has one.

## Debugging

- Content log: `[myaddon] registered…`, `[myaddon] error: …`,
  `[myaddon] warning: …`, and Cobblemon Bedrock's own with `[cooblemon/api]`.
- `/scriptevent cooblemon:debug.registry`: the registry state, each add-on
  with its species, errors and warnings, and the maximum message size.
