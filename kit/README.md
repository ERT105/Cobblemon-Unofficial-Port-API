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
```

Species and items are both optional: an addon with only items works too.

The output goes to `dist/kit/<ns>/`: `BP/`, `RP/` and `<ns>.mcaddon`, ready
to install on top of Cobblemon Bedrock.

| Option | What it does |
| --- | --- |
| `--ns <namespace>` | The namespace, if it can't be inferred from `data/`. |
| `--out <folder>` | Where to write the output. |
| `--version 1.0.0` | Your add-on's version. **Bump it on every release**: the game keeps the old one if the version matches. |
| `--glyph-page F0` | The glyph page for the party panel portraits (`F0` to `F8`). If you use several add-ons, they must not overlap. |
| `--no-sprites` | Skip sprite rendering (faster; the UI shows a Poké Ball). |

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

## Afterwards

- Check the content log when loading the world: `[<ns>] registered in
  Cobblemon Bedrock`, followed by any errors or warnings.
- `/scriptevent cooblemon:debug.registry` shows it in chat.
- What the kit can't do: fixes a specific model needs (Cobblemon Bedrock
  applies them species by species to its own). If something looks wrong, the
  generated `BP/` and `RP/` can be edited by hand.

More in the [guide](../docs/README.md) and the [reference](../docs/REFERENCE.md).
