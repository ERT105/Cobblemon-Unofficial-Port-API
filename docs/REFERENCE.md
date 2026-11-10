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

## Reply (`ack`)

`{ addon, api, ok, errors[], warnings[] }`. An **error** leaves that part out
(a species, a spawn entry); a **warning** lets it in without the failing
detail (an unknown move).

The error and warning texts are currently in Spanish.

## Events

With `onCobblemonEvent(name, (data) => …)`. All of them carry `api` and,
except battle events, `player` (`{ id, name }`). `pokemon` is a summary:
`{ uuid, species, form, level, shiny, gender, nickname, ball }`.

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

## Debugging

- Content log: `[myaddon] registered…`, `[myaddon] error: …`,
  `[myaddon] warning: …`, and Cobblemon Bedrock's own with `[cooblemon/api]`.
- `/scriptevent cooblemon:debug.registry`: the registry state, each add-on
  with its species, errors and warnings, and the maximum message size.
