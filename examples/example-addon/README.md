# Example add-on: Surfing Pikachu

A complete add-on for Cobblemon Bedrock with a new species,
**Surfing Pikachu** (`ejemplo:pikachu_surf`). Use it to see how each step of
the [guide](../../docs/README.md) is done, and copy it as a starting point.

Its namespace is `ejemplo` ("example" in Spanish); in your add-on, use your
own.

## What it shows

| Where | What |
| --- | --- |
| `BP/scripts/main.js` | Registration with `registerAddon`: species, night form, spawns, sprites, drops, battle animations and a new evolution for Cobblemon Bedrock's Pikachu. Plus events with `onCobblemonEvent`. |
| `BP/scripts/cobblemon-bedrock-api.js` | The library, copied from `api/dist/`. |
| `BP/entities/` | The entities (`pikachu_surf`, its form `pikachu_surf_night` and its mega `pikachu_surf_mega`). |
| `BP/items/`, `RP/textures/item_texture.json` | The mega stone (`ejemplo:surfite`), a generic Key Stone for testing (`ejemplo:key_stone`), and two items used on a party Pokémon (`ejemplo:surf_soda`, `ejemplo:surf_charm`). |
| `BP/blocks/npc_marker.json` | The NPC marker block: in a structure, it turns into the NPC its state says (`npcMarker`). |
| `RP/entity/`, `RP/textures/` | Client entities (with Cobblemon Bedrock's Pikachu model and animations) and their textures. |
| `RP/font/glyph_F0.png` | The party panel portraits. |
| `RP/texts/` | Name, description and the event texts. |
| `BP/manifest.json`, `RP/manifest.json` | Dependencies on Cobblemon Bedrock, and `pbr` (Vibrant Visuals). |

## Trying it

1. Zip `BP` and `RP` into a `.mcaddon` (or copy them to the game's
   development folders).
2. Enable it in a world with Cobblemon Bedrock, **above** Cobblemon Bedrock.
3. In the content log: `[ejemplo] registered in Cobblemon Bedrock (API 1)`.
4. `/scriptevent cooblemon:debug.registry` to see the state.

What should happen:

- It spawns on beaches: the normal one by day, the night form by night.
- A Pikachu given a **Water Stone** evolves into Surfing Pikachu.
- It shows up in the Pokédex (number 2001), the PC, the summary and the party
  panel.
- When you catch, level up, evolve or battle, the chat reports it prefixed
  with `[Example]` (those are the events).
- Surfing Pikachu learns **Surf Shock** at level 20, the add-on's own move
  (`ejemplo:surf_shock`): Surf turned Electric, 75 power, 20% paralysis,
  with Surf's animation. The one from `/scriptevent ejemplo:mega` already
  knows it.

## Test commands (actions and queries)

| Command | What it asks Cobblemon Bedrock |
| --- | --- |
| `/scriptevent ejemplo:altar` | A shiny level 50 Articuno with perfect IVs and fixed moves, tagged `altar`, and a battle with you right away. |
| `/scriptevent ejemplo:boss` | A Surfing Pikachu that can't be caught, tagged `boss`. |
| `/scriptevent ejemplo:gift` | A shiny Surfing Pikachu in an Ultra Ball, nicknamed "Wave", tagged `gift`. |
| `/scriptevent ejemplo:heal` | Heals your party. |
| `/scriptevent ejemplo:info` | Your party, your Pokédex totals and the wild Pokémon within 32 blocks. |
| `/scriptevent ejemplo:items` | Gives you Surf Sodas (heal 40 HP, only if hurt) and Surf Charms (+1 level, only Surfing Pikachu). Use one looking at your Pokémon, or anywhere to choose from your party. |
| `/scriptevent ejemplo:mega` | Gives you the test Key Stone and a Surfite, and a Surfing Pikachu already holding one. Put the Key Stone in your offhand and battle: the Mega button turns it into Mega Surfing Pikachu (green, Electric/Water, Drizzle). |
| `/scriptevent ejemplo:npcs` | Three NPCs in front of you: Kai, a trainer with a greeting window and a team with its own levels; Marina, a nurse; and Nico, a shopkeeper who opens his shop straight away. Hit Kai or Marina and talk to them again: they won't. To try the marker, `/setblock ~2 ~ ~ ejemplo:npc_marker ["ejemplo:npc"=1]` turns into Marina. Needs Cobblemon Bedrock 1.8.13. |

A Pokémon with a tag shows it in the event messages: catch the Articuno and
the chat says `(tag: altar)`.

## Buttons in screens

Open your party summary, or the PC with a Pokémon picked: an **Add-ons**
button shows up. **Rest** (summary only) heals that Pokémon fully; **Wave**
(both screens, only Pikachu and Surfing Pikachu) says where it is, party or
box. Needs Cobblemon Bedrock 1.8.13.

It uses Cobblemon models and textures (CC BY-NC): see
[`LICENSE.md`](../../LICENSE.md).
