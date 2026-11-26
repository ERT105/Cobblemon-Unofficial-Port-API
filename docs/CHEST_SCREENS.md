# Chest screens

**API 3** (Cobblemon Bedrock 1.8.14 or later).

A chest screen is a menu drawn inside a chest's inventory screen. Cobblemon
Bedrock uses this technique for its PC, Pokédex and battle screens. Unlike a
form (`@minecraft/server-ui`), the screen updates live: tapping a button
doesn't close it and open another one, which is what makes forms feel slow on
phones.

The library has the engine; your resource pack draws the screen. The example
add-on's **Spawn Radar** (`/scriptevent ejemplo:radar`) is a complete one:
`BP/scripts/main.js`, `RP/ui/chest_screen.json`, `RP/ui/ejemplo_radar.json`
and `RP/ui/_ui_defs.json`.

## How it works

- A script can't open a container. Only a player tapping an entity with an
  inventory can. So while the player holds your item (or looks at your block),
  the engine keeps an invisible entity, `cooblemon:addon_screen` (54 slots),
  between them and what they look at. Their tap lands on it and the game opens
  its inventory.
- Each slot is a piece of your screen. The engine fills every slot with a
  `cooblemon:ui_slot` item **named with what to draw**: a texture path
  (`textures/ui/...`, or a Pokémon sprite from the `sprites` query) or a
  translation key. Empty slots get `cooblemon:ui_empty`, named `~v~`.
- Your resource pack's UI reads that name (`#hover_text`) and draws it.
- Tapping a button takes its item out of the slot. Every two ticks the engine
  checks which slot was emptied, calls your `action`, and rewrites only the
  slots that changed.
- There's no close event. With the screen open the player can't walk or turn,
  so if they do, they closed it. An item screen also closes when the item
  leaves the main hand.

## The script

```js
import { CHEST_EMPTY_NAME, registerChestScreen, redrawChestScreen } from "./cobblemon-bedrock-api.js";

registerChestScreen({
  addon: "myaddon",
  // An invisible mark, unique to your add-on and screen. Your
  // `chest_screen.json` recognizes the screen by it.
  title: "§m§y§1",
  items: ["myaddon:my_menu"],         // and/or blocks: ["myaddon:my_block"]
  newState: (player, block) => ({ page: 0 }),
  names(player, state) {
    const names = new Array(54).fill(CHEST_EMPTY_NAME);
    names[0] = "myaddon.menu.title";   // a translation key, drawn as text
    names[9] = "textures/items/apple"; // a texture path, drawn as an image
    return names;
  },
  touchable: (state) => [9],           // the slots that are buttons
  action(player, state, slot) {
    state.page++;                      // change the state; the engine redraws
    // return "close" to close the screen
  },
  onOpen(player, state) { /* load data, then redrawChestScreen(player) */ },
  onClose(player, state) {},
});
```

- `names` is called on every redraw. Keep it cheap: load data in `onOpen` or
  in `action`, keep it in the state, and call `redrawChestScreen(player)` when
  it arrives (requests to Cobblemon Bedrock answer a tick later at the
  earliest).
- `closeChestScreen(player)` closes it from your code.
- The engine leaves the player alone while they're in a Cobblemon battle: the
  battle screen takes the front of the camera.
- Several add-ons can have chest screens at once, and alongside Cobblemon
  Bedrock's own: each engine only handles the entities it tagged.

## The resource pack

Three files. Bedrock **merges** `ui/chest_screen.json` across packs when it
uses `modifications`, so yours only adds a variant for your title and leaves
everyone else's (Cobblemon Bedrock's PC, other add-ons, plain chests) alone.

`RP/ui/chest_screen.json`:

```json
{
  "namespace": "chest",
  "small_chest_screen": {
    "$myaddon_title|default": "$container_title",
    "modifications": [
      {
        "array_name": "variables",
        "operation": "insert_back",
        "value": {
          "requires": "($myaddon_title = '§m§y§1')",
          "$screen_content": "myaddon_menu.root",
          "$screen_bg_content": "myaddon_menu.bg",
          "$default_button_mappings": []
        }
      }
    ]
  }
}
```

- Use your own variable name (`$myaddon_title`), not another pack's.
- **Never** replace the whole `small_chest_screen` or write `chest_screen.json`
  without `modifications`: you'd break every other screen.

`RP/ui/_ui_defs.json`:

```json
{ "ui_defs": ["ui/myaddon_menu.json"] }
```

`RP/ui/myaddon_menu.json` is your screen. The simplest one is a `grid` bound to
`container_items`: one cell template is used for all 54 slots, in order (9
columns × 6 rows). Each cell shows an image when the slot's name contains
`textures/`, text otherwise, and has a button over it. Copy the example's
`ejemplo_radar.json` and change the frame and the cell. For a free layout
(buttons anywhere, of any size), bind each control to one slot with a
`stack_panel` that has `collection_name: "container_items"` and a child with
`collection_index`, as Cobblemon Bedrock's own screens do.

Things to know about the names:

- The game adds formatting codes to a renamed item's name: strip them with
  `(#hover_text - '§o' - '§r' - '§f')` before using it as a texture or key.
- A name that is only digits is read as a number by JSON UI: put `§r` before
  it in your script if you show numbers.
- Labels need `"localize": true` to translate keys in each player's language
  (the server doesn't know it).
- Names are cut at 250 characters.

## Limits

- Up to 54 slots (`cooblemon:addon_screen`). For more, make your own entity
  with a bigger `minecraft:inventory` and pass it in `entity`.
- Item screens open while holding the item; block screens while looking at the
  block, within 5 blocks. Sneaking always reaches the block or item as usual.
- The UI items (`cooblemon:ui_slot`, `cooblemon:ui_empty`) are invisible and
  are taken back if they end up in the player's inventory.
