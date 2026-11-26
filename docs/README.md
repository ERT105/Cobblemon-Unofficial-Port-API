# Your first add-on for Cobblemon Bedrock

Cobblemon Bedrock is an unofficial port of [Cobblemon](https://cobblemon.com/)
to Minecraft Bedrock. This guide explains how to make an add-on that **adds
Pokémon to Cobblemon Bedrock without modifying it**: new species, their forms,
where they spawn, what they drop, how they battle, whether they can be
ridden… and how to react to what happens in the game (captures, battles,
evolutions).

> API **1** · Cobblemon Bedrock **1.8.12** or later.

## How it works

Your add-on is two packs, like any Bedrock add-on:

- **BP** (behavior): your Pokémon's entities and a script.
- **RP** (resources): models, animations, textures, sprites and texts.

When the world loads, your script **sends your species' data to Cobblemon
Bedrock** with the `cobblemon-bedrock-api` library. Cobblemon Bedrock
validates it, merges it with its own and replies with any errors and warnings
it finds. From then on your Pokémon spawn, get caught, battle, level up and
show up in the Pokédex and the PC like any other.

Players only install Cobblemon Bedrock and your add-on, with yours **above**
it in the world's pack list.

## What you need

1. **Cobblemon Bedrock** installed in the world.
2. **`cobblemon-bedrock-api.js`**, from this repository's `api/dist/` folder:
   copy it as is into your BP's `scripts/`.
3. For each species, an **entity** in your BP and its **client entity**,
   model, animations and textures in your RP.

Already have your Pokémon made for Cobblemon Java (species, model, poser,
resolver)? The **creator kit** converts all of it in one go; see
[The kit](#the-kit).

Starting from scratch? `kit init` writes an empty add-on that already
works, with everything in this guide in place:

```
npm run kit -- init --ns myaddon --name mymon
```

It registers one species that spawns in plains with Pikachu's model, and its
`README.md` tells you what to change to make it yours.

## Step 1: the manifests

Your BP depends on Cobblemon Bedrock and on your RP; your RP depends on
Cobblemon Bedrock's RP **and on your BP**. With both dependencies, enabling
either pack enables the other: players can't end up with the models but
without the Pokémon, or the other way round.

```json
{
  "format_version": 2,
  "header": { "name": "My add-on", "uuid": "<yours>", "version": [1, 0, 0], "min_engine_version": [1, 26, 50] },
  "modules": [
    { "type": "data", "uuid": "<yours>", "version": [1, 0, 0] },
    { "type": "script", "language": "javascript", "uuid": "<yours>", "version": [1, 0, 0], "entry": "scripts/main.js" }
  ],
  "dependencies": [
    { "uuid": "a1b2c3d4-e5f6-4789-a012-3456789abcde", "version": [1, 8, 12] },
    { "uuid": "<your RP's uuid>", "version": [1, 0, 0] },
    { "module_name": "@minecraft/server", "version": "2.10.0" }
  ]
}
```

In the RP manifest, add **`"capabilities": ["pbr"]`**, the dependency on
Cobblemon Bedrock's RP (`d4e5f6a7-b8c9-4012-d345-6789abcdef01`) and the one
on your BP. Without
`pbr`, enabling your add-on **turns off Vibrant Visuals** in the world: the
game only allows them if every resource pack declares it.

## Step 2: the entity

**Your species id is its entity id.** If your Pokémon is `myaddon:voltrix`,
its entity is called `myaddon:voltrix`.

- `myaddon` is your **namespace**: lowercase letters, digits and `_`.
  `cooblemon` and `minecraft` are reserved.
- The entity must have the **properties** Cobblemon Bedrock uses
  (`cooblemon:level`, `cooblemon:shiny`, `cooblemon:is_wild`,
  `cooblemon:in_battle`, `cooblemon:sleeping`…) and the component groups and
  events of its Pokémon. The easiest way is to start from a Cobblemon Bedrock
  entity and change its `identifier`, scale and collision box: that's what the
  example and the kit do.
- A **form with its own model** is another entity: `myaddon:voltrix_<form>`.

Your client entity can use Cobblemon Bedrock's models and animations (the
example uses Pikachu's) or your own.

> Technical ids keep the `cooblemon` spelling (`cooblemon:level`,
> `cooblemon:event.captured`…). Saved worlds and existing add-ons depend on
> them, so they won't change.

## Step 3: the script

```js
import { registerAddon } from "./cobblemon-bedrock-api.js";

registerAddon({
  addon: "myaddon",
  version: "1.0.0",
  species: [
    {
      id: "myaddon:voltrix",
      name: "Voltrix",
      nationalPokedexNumber: 2001,
      primaryType: "electric",
      baseStats: { hp: 45, attack: 55, defence: 45, specialAttack: 70, specialDefence: 60, speed: 95 },
      catchRate: 150,
      baseExperienceYield: 120,
      experienceGroup: "medium_fast",
      abilities: ["static"],
      moves: { levelUp: [{ level: 1, move: "thundershock" }, { level: 8, move: "watergun" }] },
    },
  ],
  spawn: {
    entries: [{ species: "myaddon:voltrix", biome: "beach", light: "day", bucket: "common", entryWeight: 10 }],
    levels: { "myaddon:voltrix": { min: 5, max: 30 } },
  },
});
```

That's enough for it to spawn on beaches, be caught and battle. The rest
(sprites, forms, drops, battle animations, riding, shoulder, evolutions from
Cobblemon Bedrock species) is in the [reference](REFERENCE.md).

**Moves and abilities must be ones Cobblemon Bedrock knows** (the mod's, by
their Showdown id: `thundershock`, `watergun`). An unknown one is skipped with
a warning.

## Step 4: the texts

In your RP's `texts/<language>.lang`:

```
entity.myaddon:voltrix.name=Voltrix
item.spawn_egg.entity.myaddon:voltrix.name=Spawn Voltrix
cooblemon.species.myaddon:voltrix.desc=The Pokédex description.
```

**Include every variant of each language** you want to cover: the game looks
for the exact file and falls back to English if it's missing. With only
`es_ES.lang`, a player using Mexican Spanish sees English; copy it to
`es_MX.lang` too.

## Step 5: testing

1. Enable Cobblemon Bedrock and your add-on in a world, yours on top.
2. The **content log** should show
   `[myaddon] registered in Cobblemon Bedrock (API 3): 1 species`, followed by
   any errors and warnings.
3. `/scriptevent cooblemon:debug.registry` shows in chat what was registered
   and what failed.
4. `/summon myaddon:voltrix` to see it without searching.

If you remove your add-on, the player's Pokémon from it **are not lost**:
they stay in the party and the PC, can't be sent out, and come back when the
add-on is reinstalled.

## Events

For quests, achievements, economy or gyms, listen to what happens:

```js
import { onCobblemonEvent } from "./cobblemon-bedrock-api.js";

onCobblemonEvent("captured", (e) => {
  console.warn(`${e.player.name} caught ${e.pokemon.species} (level ${e.pokemon.level})`);
});
```

Events: `captured`, `battle_start`, `battle_end`, `level_up`, `evolved`,
`released`, `starter_chosen`, `pokedex_registered`. Their data is in the
[reference](REFERENCE.md#events).

## Asking Cobblemon Bedrock to do things

`registerAddon` returns a client. With it, your add-on can spawn or give
Pokémon, start battles, heal, and read a player's party, Pokédex or the wild
Pokémon around them. For example, an altar that summons a shiny Articuno and
reacts when it's caught:

```js
import { registerAddon, onCobblemonEvent } from "./cobblemon-bedrock-api.js";

const cobblemon = registerAddon({ addon: "myaddon", version: "1.0.0" });

// When a player uses your altar (detected by your own script):
async function summon(player) {
  await cobblemon.spawn({
    pokemon: { species: "articuno", level: 50, shiny: true, tag: "altar" },
    nearPlayer: player,
    battle: player,
  });
}

onCobblemonEvent("captured", (e) => {
  if (e.pokemon.tag === "altar") console.warn(`${e.player.name} caught the altar's Articuno!`);
});
```

The structure, the altar block and the offering item are plain Bedrock: they
go in your own packs. Every action and query is in the
[reference](REFERENCE.md#actions-and-queries).

## The kit

If your Pokémon already exists as a **Cobblemon Java** addon, the creator kit
converts all of it: species, spawns, drops, languages, model, animations,
poses (idle, walk, fly, swim, battle, sleep), sprites, forms, female variants,
riding and shoulder, with the same rules Cobblemon Bedrock applies to the
mod's Pokémon. It also converts flat items (icon and name) and their
recipes; see [the kit's guide](../kit/README.md#items-and-recipes).

It's in this repository's [`kit/`](../kit/README.md) folder. It needs
Node.js and the extracted Cobblemon `.jar`:

```
cd kit
npm install
npm run kit -- --in <your addon> --cobblemon <extracted jar>
```

## Licenses

- `cobblemon-bedrock-api` is **MPL-2.0**.
- Cobblemon's models, textures and animations are **CC BY-NC**: if your
  add-on uses or derives from them (like the example), it must be
  **non-commercial** and give attribution.
- Cobblemon Bedrock is **not official** and is not endorsed by Cobblemon, The
  Pokémon Company, Nintendo, Game Freak or Creatures Inc. Your add-on can't
  present itself as official either.

## Versions

The API has its own version (`3`), separate from Cobblemon Bedrock's
(`1.8.14`). If your add-on requires a newer API than the installed Cobblemon
Bedrock provides, Cobblemon Bedrock rejects it with a clear error.

- API 2 added NPCs (`npcs`, `spawnNpc`, `npcMarker`).
- API 3 adds spawn tables (`spawnTable`, for a spot or the area around a
  player) with Cobblemon's own conditions (`spawnDetail`), the fishing table
  and events (`fishingTable`, `fishing`), sprite paths
  (`sprites`), the list of every spawn entry (`spawnEntries`), item and block icons and names (`itemInfo`), a HUD channel
  that shares the title with the party panel (`hud`), the `wild_spawned` and `pokemon_encountered` events, where each
  wild Pokémon came from in `nearby`, the Pokédex per form, species `labels`
  and `evYield`, and [chest screens](CHEST_SCREENS.md).

An add-on built with an older library keeps working; one built with this
library needs Cobblemon Bedrock 1.8.14 or later, even if it doesn't use the
new calls. Breaking changes bump the major version and are announced one
version in advance.
