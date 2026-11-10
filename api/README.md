# cooblemon-api

Registro y eventos de [Cooblemon](../docs/README.md) para add-ons de Minecraft
Bedrock. API **1**.

## Uso

Copia `dist/cooblemon-api.js` en `scripts/` de tu BP:

```js
import { registerAddon, onCooblemonEvent } from "./cooblemon-api.js";

registerAddon({ addon: "miaddon", version: "1.0.0", species: [/* … */], spawn: { entries: [/* … */] } });

onCooblemonEvent("captured", (e) => console.warn(`${e.player.name} capturó ${e.pokemon.species}`));
```

En TypeScript, los tipos están en `dist/index.d.ts`.

- [Guía: tu primer add-on](../docs/README.md)
- [Referencia de formatos y eventos](../docs/REFERENCIA.md)

Solo depende de `@minecraft/server` (2.10.0 o posterior).

Licencia: MPL-2.0.
