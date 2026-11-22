# Cobblemon Bedrock creator kit

Converts a **Cobblemon Java** addon into an add-on for **Cobblemon Bedrock**,
using the same rules Cobblemon Bedrock applies to the mod's own Pokémon:
species, spawns, drops, languages, model, animations, poses (idle, walk, run,
fly, swim, battle, sleep), sprites, forms, female variants, riding and
shoulder. It also converts the addon's flat **items** and their **recipes**.

## Requirements

- [Node.js](https://nodejs.org/) 20 or later.
- **The Cobblemon 1.8 `.jar`, extracted** (it is a `.zip`): the folder that
  contains `assets/` and `data/`. The kit reads what it needs from the mod
  there (spawn presets, block tags…); it is not included.
- For sprites, a Chromium-based browser: **Microsoft Edge** on Windows works
  as is. On other systems, point to one with the `SPRITE_BROWSER` environment
  variable (the path to the Chrome or Chromium executable).

## Installation

```
cd kit
npm install
```

## Usage

```
npm run kit -- --in <your addon> --cobblemon <extracted jar>
```

`<your addon>` is your Java addon folder, with its usual layout:

```
data/<ns>/species/**/*.json
data/<ns>/spawn_pool_world/*.json
assets/<ns>/bedrock/pokemon/{models,animations,posers,resolvers}/…
assets/<ns>/textures/pokemon/…
assets/<ns>/lang/*.json
assets/<ns>/models/item/*.json      (items, with their textures)
data/<ns>/recipe/**/*.json          (recipes)
data/<ns>/tags/item/*.json          (item tags used by your recipes)
data/<ns>/structure/**/*.nbt        (structures, see below)
data/<ns>/worldgen/…                (their template pools, structures and sets)
data/cobblemon/{npcs,dialogues}/…   (the NPCs your structures place)
```

Species, items and structures are all optional: an addon with only items, or
only structures, works too.

The output goes to `dist/kit/<ns>/`: `BP/`, `RP/` and `<ns>.mcaddon`, ready
to install on top of Cobblemon Bedrock.

| Option | What it does |
| --- | --- |
| `--ns <namespace>` | The namespace, if it can't be inferred from `data/`. |
| `--out <folder>` | Where to write the output. |
| `--version 1.0.0` | Your add-on's version. **Bump it on every release**: the game keeps the old one if the version matches. |
| `--glyph-page F0` | The glyph page for the party panel portraits (`F0` to `F8`). If you use several add-ons, they must not overlap. |
| `--no-sprites` | Skip sprite rendering (faster; the UI shows a Poké Ball). |
| `--block-map <file>` | Replacements for blocks from other mods in your structures (see below). |

## Starting an add-on from scratch

```
npm run kit -- init --ns <namespace> [--name <species>] [--out <folder>] [--force]
```

Writes an empty add-on that already works (it doesn't need `--cobblemon`):

- both manifests, with new UUIDs, depending on Cobblemon Bedrock **and on
  each other**, so enabling either pack enables both;
- one species, `<namespace>:<species>`, registered and spawning in plains,
  with Pikachu's model, animations and battle clips (by their ids: Cobblemon
  Bedrock's resource pack already has them);
- its server and client entities, render controller, texts and the library;
- a `README.md` with what each file is, what to change to make it yours, and
  a checklist for releases.

By default it goes to `<namespace>-addon/`. It won't overwrite a folder
with files in it unless you pass `--force`.

Packs made by the kit from a Java addon also depend on each other the same way.

## Addons that change Cobblemon species

Some addons don't add species: they give Cobblemon's own species a new look
or new forms (for example, a resource pack whose resolvers change the model
of Cyndaquil's `region-bias-hisui` form). The kit converts both:

- **Resolvers for a Cobblemon species** (`"species": "cobblemon:cyndaquil"`),
  in `assets/<ns>/` or `assets/cobblemon/`. Each aspect they change becomes a
  form with its own entity, `<ns>:cyndaquil_hisui_bias`, built on top of the
  mod's files: the poser and animations usually come from Cobblemon, the
  model and textures from your addon.
- **`data/<ns>/species_additions/*.json`**: their `forms` become new forms of
  that species. Other fields are skipped with a warning.

They are registered with `additions` (see the API reference). Cobblemon
Bedrock then uses your model for that form everywhere.

A resource pack without `data/` has no namespace to infer: pass `--ns`.

```
npm run kit -- --in hisui-starters --ns hisuistarters --cobblemon <extracted jar>
```

Not supported: changing a species' **default** look (only forms can be
changed), and variations that combine several forms.

Many of Cobblemon's posers are written in Kotlin, which the `.jar` only has
compiled. For those, the kit builds the poses from the clip names
(`ground_idle`, `ground_walk`, `battle_idle`, `sleep`…), which follow the
same convention across the mod.

## Items and recipes

In Java an item is registered in code, so the kit can't know what it
**does**. It converts everything else, so the item exists in Bedrock with its
icon, name and recipes; if it should do something, write that in your
add-on's script with the [API](../docs/REFERENCE.md#actions-and-queries).

- **Flat items** (`item/generated`, `item/handheld`…) are converted. Layers
  (`layer0`, `layer1`…) are merged into one icon, and animated textures use
  their first frame. Names come from `item.<ns>.<name>` in your lang files.
- **3D items** (models with `elements`) and **block items** are skipped with a
  warning; they're not supported yet.
- **Max stack size** is in the Java code, so every item gets 64. Edit
  `BP/items/<name>.json` if one should be different.
- **Recipes** use the same rules as Cobblemon Bedrock's own: crafting (shaped
  and shapeless), furnace, blast furnace, smoker, campfire, stonecutter and
  smithing. Common tags are replaced by their item (`#c:ingots/iron` → iron
  ingot), and your own tags in `data/<ns>/tags/item` work too. Ingredients
  must exist in Bedrock: vanilla, Cobblemon Bedrock (`cobblemon:` ids are
  converted) or your addon. A recipe that needs another mod's item is skipped,
  and the warning names the ingredient.
- **One furnace recipe per ingredient.** Bedrock allows only one recipe per
  ingredient in each furnace-type station (furnace, blast furnace, smoker,
  campfire). If Cobblemon Bedrock already smelts that ingredient (for example,
  berries into dyes), or your addon has two such recipes, the extra one is
  skipped with a warning instead of failing when the world loads.

## Structures

The kit converts your `.nbt` structures and their jigsaw generation
(`template_pool`, `structure`, `structure_set`, `processor_list`), the biome
tags they use and your chest loot tables. It writes
`structures-report.json` next to the output with everything it did.

- **Blocks** go through Cobblemon Bedrock's own block map (`cobblemon:` blocks
  become Cobblemon Bedrock's). Blocks from **other mods** are removed, unless
  you give a replacement with `--block-map`:

  ```json
  { "othermod:fancy_lamp": "minecraft:lantern", "gachamod:*": null }
  ```

  A block id or `"mod:*"` for a whole mod; `null` removes it.
- **Entities can't travel in a Bedrock structure.** The ones that matter
  become marker blocks of your add-on that turn into the real thing when the
  chunk loads (see [NPCs](../docs/REFERENCE.md#npcs)):
  - `cobbledollars:cobble_merchant` → a merchant NPC with its shop
    categories, prices 1:1;
  - `cobblemon:npc` → the NPC of its class in `data/cobblemon/npcs`: its team,
    skill (0–5 becomes 0.55–1), rematch and cooldown, and a greeting, options
    and "you hit me" line taken from its dialogue. Only plain lines are
    kept: Molang logic isn't converted, and the lines stay in English;
  - `cobblemon:pokemon` → the same Pokémon (species, level, shiny) standing
    there, or swimming if it was in water.

  Villagers, paintings, item frames and other mods' entities are left out
  and listed in the report.
- **Pokémon that only spawn in your structures.** A spawn entry with
  `condition.structures` naming one of your structures (directly or through
  a `#<ns>:` structure tag), in `data/<ns>/spawn_pool_world` or in
  `data/cobblemon/spawn_pool_world`, becomes a
  [spawn zone](../docs/REFERENCE.md#spawn-zones): one zone per structure, with
  a radius of 60% of its `max_distance_from_center`, and a zone marker in the
  middle of its start piece. Cobblemon Bedrock species are allowed there;
  they keep their usual levels, not the entry's `level`.
- **Vanilla structure sets.** Java mods replace `minecraft:villages` to put
  their villages instead of the vanilla ones. An add-on can't do that, so the
  set becomes `<ns>:villages` and your villages generate **in addition to**
  vanilla villages. Adjust its `spacing` if they come out too often.

## Afterwards

- Check the content log when loading the world: `[<ns>] registered in
  Cobblemon Bedrock`, followed by any errors or warnings.
- `/scriptevent cooblemon:debug.registry` shows it in chat.
- What the kit can't do: fixes a specific model needs (Cobblemon Bedrock
  applies them species by species to its own). If something looks wrong, the
  generated `BP/` and `RP/` can be edited by hand.

More in the [guide](../docs/README.md) and the [reference](../docs/REFERENCE.md).
