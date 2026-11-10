# Cobblemon Bedrock API reference

> API **1**. TypeScript types are in `api/dist/types.d.ts`.

## `registerAddon(def)`

| Field | What it is |
| --- | --- |
| `addon` | Your namespace (lowercase letters, digits and `_`). |
| `version` | Your add-on's version, shown in the content log. |
| `species` | List of species (below). |
| `spawn` | `{ entries, levels }`: where and at what level they spawn. |
| `sprites` | UI textures per variant. |
| `evolutions` | New evolutions for species that aren't yours. |
| `megas`, `megaAccessories` | Mega evolutions for your species, and the items that work as a Key Stone. See [Megas](#megas). |
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
| `moves` | `levelUp: [{ level, move }]`, plus `egg`, `tm`, `tutor`. Only moves the engine knows. |
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

## Evolutions into your species

```js
evolutions: {
  pikachu: [{ variant: "item_interact", result: "myaddon:voltrix", requiredContext: "cobblemon:water_stone" }],
}
```

Adds evolutions to species that aren't yours. The result must be one of your
species. Cobblemon Bedrock's evolutions and other add-ons' aren't touched.

## Megas

Mega evolutions for your own species. The mega is a **form** you register in
the species' `forms`, usually with `battleOnly: true`:

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
| `species` | One of your species. Megas for other species aren't supported yet. |
| `form` | The id of the mega form. |
| `stones` | Item ids that trigger it, held by the Pokémon. They become holdable items. |
| `ability` | Ability while mega evolved. Defaults to the form's first ability. |

**Cobblemon Bedrock doesn't provide a Key Stone**, so `megaAccessories` must
list at least one of your items, with `minecraft:allow_off_hand`. The player
needs it **in the offhand**; then the battle shows the Mega button when the
Pokémon holding the stone is out.

Sprites for the mega form use its id like any other form:
`"myaddon:voltrix|mega|0"`.

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
