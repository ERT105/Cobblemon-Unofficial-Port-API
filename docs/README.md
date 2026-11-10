# Tu primer add-on para Cooblemon

Cooblemon es un port no oficial de [Cobblemon](https://cobblemon.com/) a
Minecraft Bedrock. Esta guía explica cómo hacer un add-on que **añada
Pokémon a Cooblemon sin tocarlo**: especies nuevas, sus formas, dónde
aparecen, qué sueltan, cómo combaten, si se montan… y cómo reaccionar a lo que
pasa en la partida (capturas, combates, evoluciones).

> API **1** · Cooblemon **1.8.12** o posterior.

## Cómo funciona

Tu add-on son dos paquetes, como cualquier add-on de Bedrock:

- **BP** (comportamiento): las entidades de tus Pokémon y un script.
- **RP** (recursos): modelos, animaciones, texturas, sprites y textos.

Al cargar el mundo, tu script **le envía a Cooblemon los datos** de tus
especies con la librería `cooblemon-api`. Cooblemon los comprueba, los añade a
los suyos y te contesta con los errores y avisos que encuentre. A partir de
ahí tus Pokémon aparecen, se capturan, combaten, suben de nivel, salen en la
Pokédex y en el PC como cualquiera de Cooblemon.

El jugador solo instala Cooblemon y tu add-on, con el tuyo **por encima** en
la lista de paquetes del mundo.

## Lo que necesitas

1. **Cooblemon** instalado en el mundo.
2. **`cooblemon-api.js`**, de la carpeta `api/dist/` de este repositorio: se
   copia tal cual en `scripts/` de tu BP.
3. Para cada especie, una **entidad** en tu BP y su **entidad de cliente**,
   modelo, animaciones y texturas en tu RP.

¿Tienes ya tu Pokémon hecho para Cobblemon Java (especie, modelo, poser,
resolver)? El **kit de creador** lo convierte todo de una vez; ver
[El kit](#el-kit).

## Paso 1: los manifiestos

Tu BP depende de Cooblemon y de tu RP; tu RP depende del de Cooblemon.

```json
{
  "format_version": 2,
  "header": { "name": "Mi add-on", "uuid": "<tuyo>", "version": [1, 0, 0], "min_engine_version": [1, 26, 50] },
  "modules": [
    { "type": "data", "uuid": "<tuyo>", "version": [1, 0, 0] },
    { "type": "script", "language": "javascript", "uuid": "<tuyo>", "version": [1, 0, 0], "entry": "scripts/main.js" }
  ],
  "dependencies": [
    { "uuid": "a1b2c3d4-e5f6-4789-a012-3456789abcde", "version": [1, 8, 12] },
    { "uuid": "<uuid de tu RP>", "version": [1, 0, 0] },
    { "module_name": "@minecraft/server", "version": "2.10.0" }
  ]
}
```

En el del RP, **`"capabilities": ["pbr"]`** y la dependencia del RP de
Cooblemon (`d4e5f6a7-b8c9-4012-d345-6789abcdef01`). Sin `pbr`, activar tu
add-on **apaga Vibrant Visuals** en el mundo: el juego solo los permite si
todos los paquetes de recursos los declaran.

## Paso 2: la entidad

**El id de tu especie es el de su entidad.** Si tu Pokémon es
`miaddon:voltrix`, su entidad se llama `miaddon:voltrix`.

- `miaddon` es tu **espacio de nombres**: minúsculas, cifras y `_`.
  `cooblemon` y `minecraft` están reservados.
- La entidad tiene que llevar las **propiedades** que usa Cooblemon
  (`cooblemon:level`, `cooblemon:shiny`, `cooblemon:is_wild`,
  `cooblemon:in_battle`, `cooblemon:sleeping`…) y los grupos y eventos de
  comportamiento de sus Pokémon. Lo más sencillo es partir de una entidad de
  Cooblemon y cambiarle el `identifier`, la escala y la caja: es lo que hacen el
  ejemplo y el kit.
- Una **forma con modelo propio** es otra entidad: `miaddon:voltrix_<forma>`.

Tu entidad de cliente puede usar modelos y animaciones de Cooblemon (el
ejemplo usa los de Pikachu) o los tuyos.

## Paso 3: el script

```js
import { registerAddon } from "./cooblemon-api.js";

registerAddon({
  addon: "miaddon",
  version: "1.0.0",
  species: [
    {
      id: "miaddon:voltrix",
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
    entries: [{ species: "miaddon:voltrix", biome: "beach", light: "day", bucket: "common", entryWeight: 10 }],
    levels: { "miaddon:voltrix": { min: 5, max: 30 } },
  },
});
```

Con esto basta para que aparezca en las playas, se capture y combata. Lo
demás —sprites, formas, botín, animaciones de combate, montura, hombro,
evoluciones desde especies de Cooblemon— está en la
[referencia](REFERENCIA.md).

**Los movimientos y habilidades tienen que ser de los que Cooblemon conoce**
(los del mod, por su id de Showdown: `thundershock`, `watergun`). Uno
desconocido se omite con un aviso.

## Paso 4: los textos

En `texts/<idioma>.lang` de tu RP:

```
entity.miaddon:voltrix.name=Voltrix
item.spawn_egg.entity.miaddon:voltrix.name=Generar Voltrix
cooblemon.species.miaddon:voltrix.desc=La descripción de la Pokédex.
```

**Pon todas las variantes de cada idioma** que quieras cubrir: el juego busca
el archivo exacto y, si falta, cae al inglés. Con `es_ES.lang` solo, un jugador
en español de México lo verá en inglés; copia también `es_MX.lang`.

## Paso 5: probarlo

1. Activa Cooblemon y tu add-on en un mundo, el tuyo encima.
2. En el **registro de contenido** debe salir
   `[miaddon] registrado en Cooblemon (API 1): 1 especies`, y debajo los
   errores y avisos si los hay.
3. `/scriptevent cooblemon:debug.registry` enseña en el chat lo registrado y
   lo que falló.
4. `/summon miaddon:voltrix` para verlo sin buscarlo.

Si quitas tu add-on, los Pokémon suyos que tenga el jugador **no se pierden**:
se quedan en el equipo y el PC, sin poder sacarse, y vuelven al reinstalarlo.

## Eventos

Para misiones, logros, economía o gimnasios, escucha lo que pasa:

```js
import { onCooblemonEvent } from "./cooblemon-api.js";

onCooblemonEvent("captured", (e) => {
  console.warn(`${e.player.name} capturó ${e.pokemon.species} (nivel ${e.pokemon.level})`);
});
```

Eventos: `captured`, `battle_start`, `battle_end`, `level_up`, `evolved`,
`released`, `starter_chosen`, `pokedex_registered`. Sus datos, en la
[referencia](REFERENCIA.md#eventos).

## El kit

Si tu Pokémon ya existe como addon de **Cobblemon Java**, el kit de creador lo
convierte entero: especie, apariciones, botín, idiomas, modelo, animaciones,
estados (reposo, andar, volar, nadar, combate, dormir), sprites, formas,
hembra, montura y hombro, con las mismas reglas que usa Cooblemon con los
Pokémon del mod.

> El kit todavía no se distribuye por separado: se publicará en este
> repositorio en una próxima versión.

## Licencias

- `cooblemon-api` es **MPL-2.0**.
- Los modelos, texturas y animaciones de Cobblemon son **CC BY-NC**: si tu
  add-on usa o deriva de ellos (como el ejemplo), es **sin fines comerciales**
  y con atribución.
- Cooblemon **no es oficial** ni está respaldado por Cobblemon, The Pokémon
  Company, Nintendo, Game Freak ni Creatures Inc. Tu add-on tampoco puede
  presentarse como oficial.

## Versiones

La API lleva su propia versión (`1`), aparte de la de Cooblemon (`1.8.12`).
Si tu add-on pide una API más nueva que la del Cooblemon instalado, Cooblemon
lo rechaza con un error claro. Los cambios que rompan los add-ons suben la
versión mayor y se anuncian con una versión de antelación.
