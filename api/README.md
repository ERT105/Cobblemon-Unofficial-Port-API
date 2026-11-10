# cobblemon-bedrock-api

Registration and events of [Cobblemon Bedrock](../docs/README.md) for
Minecraft Bedrock add-ons. API **1**.

## Usage

Copy `dist/cobblemon-bedrock-api.js` into your BP's `scripts/`:

```js
import { registerAddon, onCobblemonEvent } from "./cobblemon-bedrock-api.js";

registerAddon({ addon: "myaddon", version: "1.0.0", species: [/* … */], spawn: { entries: [/* … */] } });

onCobblemonEvent("captured", (e) => console.warn(`${e.player.name} caught ${e.pokemon.species}`));
```

For TypeScript, the types are in `dist/index.d.ts`.

- [Guide: your first add-on](../docs/README.md)
- [Format and event reference](../docs/REFERENCE.md)

Its only dependency is `@minecraft/server` (2.10.0 or later).

License: MPL-2.0.
