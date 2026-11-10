# Add-on de ejemplo: Pikachu Surfista

Un add-on completo para Cobblemon Bedrock con una especie nueva,
**Pikachu Surfista** (`ejemplo:pikachu_surf`). Sirve para ver cómo se hace
cada cosa de la [guía](../../docs/README.md) y para copiarlo como punto de
partida.

## Qué enseña

| Dónde | Qué |
| --- | --- |
| `BP/scripts/main.js` | El registro con `registerAddon`: especie, forma nocturna, aparición, sprites, botín, animaciones de combate y una evolución nueva para el Pikachu de Cobblemon Bedrock. Y los eventos con `onCobblemonEvent`. |
| `BP/scripts/cobblemon-bedrock-api.js` | La librería, copiada de `api/dist/`. |
| `BP/entities/` | Las entidades (`pikachu_surf` y su forma `pikachu_surf_night`). |
| `RP/entity/`, `RP/textures/` | Entidades de cliente (con el modelo y las animaciones de Pikachu de Cobblemon Bedrock) y sus texturas. |
| `RP/font/glyph_F0.png` | Los retratos del panel del equipo. |
| `RP/texts/` | Nombre y descripción, y los textos de los eventos. |
| `BP/manifest.json`, `RP/manifest.json` | Dependencias de Cobblemon Bedrock y `pbr` (Vibrant Visuals). |

## Probarlo

1. Comprime `BP` y `RP` en un `.mcaddon` (o cópialos a las carpetas de
   desarrollo del juego).
2. Actívalo en un mundo con Cobblemon Bedrock, **encima** de Cobblemon Bedrock.
3. En el registro de contenido: `[ejemplo] registrado en Cobblemon Bedrock (API 1)`.
4. `/scriptevent cooblemon:debug.registry` para ver el estado.

Lo que tiene que pasar:

- Aparece en las playas: de día, el normal; de noche, la forma nocturna.
- Un Pikachu con **Piedra Agua** evoluciona a Pikachu Surfista.
- Sale en la Pokédex (número 2001), el PC, la ficha y el panel del equipo.
- Al capturar, subir de nivel, evolucionar o combatir, el chat lo cuenta con
  `[Ejemplo]` delante (son los eventos).

Usa modelos y texturas de Cobblemon (CC BY-NC): ver
[`LICENSE.md`](../../LICENSE.md).
