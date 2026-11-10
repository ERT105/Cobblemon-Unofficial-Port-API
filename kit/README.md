# Kit de creador de Cobblemon Bedrock

Convierte un addon de **Cobblemon Java** en un add-on para **Cobblemon
Bedrock**, con las mismas reglas que Cobblemon Bedrock usa con los Pokémon del
mod: especie, apariciones, botín, idiomas, modelo, animaciones, estados
(reposo, andar, correr, volar, nadar, combate, dormir), sprites, formas,
hembra, montura y hombro.

## Lo que necesitas

- [Node.js](https://nodejs.org/) 20 o posterior.
- **El `.jar` de Cobblemon 1.8 extraído** (es un `.zip`): la carpeta que
  tiene dentro `assets/` y `data/`. El kit lee de ahí lo que necesita del mod
  (presets de aparición, etiquetas de bloques…); no viene incluido.
- Para los sprites, un navegador basado en Chromium: **Microsoft Edge** en
  Windows sirve tal cual. En otro sistema, indica uno con la variable
  `SPRITE_BROWSER` (la ruta del ejecutable de Chrome o Chromium).

## Instalación

```
cd kit
npm install
```

## Uso

```
npm run kit -- --in <tu addon> --cobblemon <jar extraído>
```

`<tu addon>` es la carpeta de tu addon de Java, con su estructura de siempre:

```
data/<ns>/species/**/*.json
data/<ns>/spawn_pool_world/*.json
assets/<ns>/bedrock/pokemon/{models,animations,posers,resolvers}/…
assets/<ns>/textures/pokemon/…
assets/<ns>/lang/*.json
```

Sale en `dist/kit/<ns>/`: `BP/`, `RP/` y `<ns>.mcaddon`, listo para
instalar encima de Cobblemon Bedrock.

| Opción | Qué hace |
| --- | --- |
| `--ns <espacio>` | El espacio de nombres, si no se deduce de `data/`. |
| `--out <carpeta>` | Dónde dejar el resultado. |
| `--version 1.0.0` | La versión de tu add-on. **Súbela en cada entrega**: el juego guarda la anterior si coincide. |
| `--glyph-page F0` | La página de glifos para los retratos del panel del equipo (`F0` a `F8`). Si usas varios add-ons, que no coincidan. |
| `--no-sprites` | No renderiza los sprites (más rápido; la interfaz enseña una Poké Ball). |

## Después

- Mira el registro de contenido al cargar el mundo: `[<ns>] registrado en
  Cobblemon Bedrock`, y los errores o avisos si los hay.
- `/scriptevent cooblemon:debug.registry` lo enseña en el chat.
- Lo que el kit no puede hacer: arreglos que un modelo concreto necesite
  (Cobblemon Bedrock los hace especie a especie con los suyos). Si algo se ve
  mal, el `BP/` y el `RP/` generados se pueden retocar a mano.

Más en la [guía](../docs/README.md) y la [referencia](../docs/REFERENCIA.md).
