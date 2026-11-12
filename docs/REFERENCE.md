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
              heightMin?, heightMax?, baseBlocks?, nearbyBlocks? }],
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

Your species don't spawn until Cobblemon Bedrock closes registration (once
every add-on has finished sending).

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
| `battle_start` | `kind` (`wild`, `trainer`, `raid`, `pvp`), `players`, `opponent`, `raidTier`, `trainerName` | A battle starts. |
| `battle_end` | The same plus `result` (`win`, `loss`, `run`, `catch`, `aborted`) | A battle ends. |
| `level_up` | `player`, `from`, `pokemon` | Levels up (several levels at once are one event). |
| `evolved` | `player`, `from`, `pokemon` | Evolves. |
| `released` | `player`, `pokemon`, `from` (`pc`, `party`) | Is released. |
| `starter_chosen` | `player`, `pokemon` | The starter is chosen. |
| `pokedex_registered` | `player`, `species`, `status` (`seen`, `caught`) | First time seen or caught. |
| `item_used` | `player`, `item`, `slot`, `pokemon` (with `hp`, `maxHp` and `status`) | One of your `partyItems` was used on a party Pokémon. |

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
| `updatePokemon(player, uuid, changes)` | Changes a Pokémon in the party (not in battle). `changes`: `heal` (HP, or `"full"`; also revives), `cure` (status), `levels` (like a Rare Candy: moves and evolution included), and `nature`, `ivs`, `evs`, `ability`, `moves`, `heldItem`, `friendship`, `nickname`, `tag` as above. HP isn't refilled by the other fields. | `{ pokemon, evolved }` |

### Queries

| Call | Result |
| --- | --- |
| `party(player)` | `{ pokemon: [...] }`: the party, as event summaries (with `tag`). |
| `pokedex(player, species?)` | `{ seen, caught, total, entries: [{ species, status }] }`. `species` narrows the list. |
| `nearby({ player \| at, radius? })` | `{ pokemon: [{ entityId, species, form, level, shiny, alpha, tag, location, distance }] }`: wild Pokémon, nearest first. `radius` 1–64 blocks (default 16), up to 50 results. |
| `species(id)` | Its data: name, number, types, base stats, abilities, catch rate, forms, and which add-on registered it (`null` for Cobblemon Bedrock's own). |

## Debugging

- Content log: `[myaddon] registered…`, `[myaddon] error: …`,
  `[myaddon] warning: …`, and Cobblemon Bedrock's own with `[cooblemon/api]`.
- `/scriptevent cooblemon:debug.registry`: the registry state, each add-on
  with its species, errors and warnings, and the maximum message size.
