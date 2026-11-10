# Referencia de la API de Cooblemon

> API **1**. Los tipos de TypeScript están en `api/dist/types.d.ts`.

## `registerAddon(def)`

| Campo | Qué es |
| --- | --- |
| `addon` | Tu espacio de nombres (minúsculas, cifras y `_`). |
| `version` | La versión de tu add-on, para el registro de contenido. |
| `species` | Lista de especies (abajo). |
| `spawn` | `{ entries, levels }`: dónde y a qué nivel aparecen. |
| `sprites` | Texturas de interfaz por variante. |
| `evolutions` | Evoluciones nuevas para especies que no son tuyas. |
| `onAck` | Qué hacer con la respuesta. Por defecto, al registro de contenido. |

Se envía al cargar el mundo y cada vez que Cooblemon lo pide, troceado al
tamaño de mensaje que Cooblemon mide. Volver a enviarlo sustituye lo anterior.

## Especie

Obligatorios: `id`, `name`, `nationalPokedexNumber`, `primaryType`,
`baseStats`, `catchRate`, `baseExperienceYield`, `experienceGroup`,
`abilities` (al menos una) y `moves.levelUp`.

| Campo | Notas |
| --- | --- |
| `id` | `miaddon:especie`, el mismo que el de su entidad. |
| `nationalPokedexNumber` | Fuera de los oficiales (2000+) para ir al final de la Pokédex. |
| `primaryType`, `secondaryType` | `normal`, `fire`, `water`… en minúsculas. |
| `baseStats`, `evYield` | `hp`, `attack`, `defence`, `specialAttack`, `specialDefence`, `speed`. |
| `experienceGroup` | `fast`, `medium_fast`, `medium_slow`, `slow`, `erratic`, `fluctuating`. |
| `abilities`, `hiddenAbility` | Ids del mod. Una sin efecto en combate da un aviso. |
| `maleRatio` | 0–1, o `null` sin sexo. |
| `moves` | `levelUp: [{ level, move }]`, y `egg`, `tm`, `tutor`. Solo los que conoce el motor. |
| `evolutions` | Formato de Cobblemon (`variant`, `result`, `requiredContext`, `requirements`). `result` puede ser tuyo (`miaddon:x`) o de Cooblemon (`raichu`). |
| `preEvolution` | Igual que `result`. |
| `forms` | Ver [Formas](#formas). |
| `baseScale`, `hitbox` | Como en Cobblemon. |
| `drops` | `{ amount, entries: [{ item, percentage?, quantityRange?, rarity? }] }`. Objetos de Cooblemon con `cooblemon:`. |
| `battleClips` | Nombre → `[id de animación, segundos, 1 si va en bucle]`: `physical`, `special`, `status`, `cry`, `faint`, `recoil`… |
| `locators` | Nombre → lista de `[x, y, z]` en píxeles de modelo (`root`, `middle`, `mouth`, `special`…): de ahí salen las partículas. |
| `riding` | `{ stats: { LAND|AIR|LIQUID: { SPEED: [mín, máx], … } }, keys }`. La entidad tiene que traer el grupo `cooblemon:ride_on`. |
| `shoulder` | `{ left, right }`: el clip de cada hombro. La entidad tiene que traer el grupo `cooblemon:shoulder`. |

### Formas

`{ name, aspects?, primaryType?, secondaryType?, baseStats?, abilities?,
evolutions?, moves? }`.

- **`name` es el id de la forma**: su aspecto (`alolan`), en minúsculas y con
  `_`. No el nombre que se enseña («Alola»).
- `moves` en el formato del mod: `"10:confusion"`.
- Si tu BP trae la entidad `miaddon:especie_<forma>`, la forma sale con ella.

## Apariciones

```js
spawn: {
  entries: [{ species, form?, biome, biomeTag?, biomeAny?, biomeAll?, biomeNot?,
              habitat?, light?, dimension?, weather?, bucket?, entryWeight?,
              heightMin?, heightMax?, baseBlocks?, nearbyBlocks? }],
  levels: { "miaddon:especie": { min, max } },
}
```

| Campo | Valores |
| --- | --- |
| `biome` | Etiqueta de bioma: `forest`, `beach`, `plains`, `taiga`, `jungle`… (las de Cobblemon sin `is_`). |
| `habitat` | `land`, `water`, `beach`, `riverbank`, `beach_water`, `seafloor`. |
| `light` | `surface`, `cave`, `day`, `night`. |
| `dimension` | `overworld`, `nether`, `end`. |
| `bucket` | `common`, `uncommon`, `rare`, `ultra-rare`. |
| `form` | Una forma de la propia especie, por su id. |

Tus especies no aparecen hasta que Cooblemon cierra el registro (cuando todos
los add-ons han terminado de enviar).

## Sprites

Por `especie|forma|shiny`: `"miaddon:x||0"` (normal), `"miaddon:x||1"`
(shiny), `"miaddon:x|alolan|0"` (una forma).

| Campo | Dónde se ve |
| --- | --- |
| `pc` | PC y ficha del equipo. |
| `face` | Marco de PS del combate. |
| `dex`, `portrait`, `size` | Pokédex: icono, retrato y silueta de Tamaño. Sin ellos, el de `pc`. |
| `glyph` | Panel del equipo: un carácter de U+F000 a U+F8FF. |

Rutas del RP de tu add-on, sin `.png`. Sin sprite, la interfaz enseña una
Poké Ball.

**El retrato del panel del equipo** es un carácter de una página de glifos
`font/glyph_F0.png`…`glyph_F8.png` de tu RP: 256×256, celdas de 16×16, la
cara centrada. U+F000 es la primera celda de `glyph_F0`. Dos add-ons con la
misma página se pisan: elige una y dila en tu descripción.

## Evoluciones hacia tus especies

```js
evolutions: {
  pikachu: [{ variant: "item_interact", result: "miaddon:voltrix", requiredContext: "cobblemon:water_stone" }],
}
```

Añade evoluciones a especies que no son tuyas. El resultado tiene que ser una
especie tuya. Las de Cooblemon y las de otros add-ons no se tocan.

## Respuesta (`ack`)

`{ addon, api, ok, errors[], warnings[] }`. Un **error** deja fuera esa parte
(una especie, una entrada de aparición); un **aviso** la deja entrar sin el
detalle que falla (un movimiento desconocido).

## Eventos

Con `onCooblemonEvent(nombre, (datos) => …)`. Todos traen `api` y, salvo los
de combate, `player` (`{ id, name }`). `pokemon` es un resumen:
`{ uuid, species, form, level, shiny, gender, nickname, ball }`.

| Evento | Datos | Cuándo |
| --- | --- | --- |
| `captured` | `player`, `pokemon`, `ball`, `source` (`wild`, `battle`, `raid`), `destination` (`party`, `pc`) | Se guardó una captura. |
| `battle_start` | `kind` (`wild`, `trainer`, `raid`, `pvp`), `players`, `opponent`, `raidTier`, `trainerName` | Empieza un combate. |
| `battle_end` | Lo mismo y `result` (`win`, `loss`, `run`, `catch`, `aborted`) | Termina un combate. |
| `level_up` | `player`, `from`, `pokemon` | Sube de nivel (varios de golpe, un evento). |
| `evolved` | `player`, `from`, `pokemon` | Evoluciona. |
| `released` | `player`, `pokemon`, `from` (`pc`, `party`) | Se libera. |
| `starter_chosen` | `player`, `pokemon` | Se elige el inicial. |
| `pokedex_registered` | `player`, `species`, `status` (`seen`, `caught`) | Primera vez visto o capturado. |

**En un mensaje del chat**, cada parámetro de un `rawtext` tiene que ser un
objeto: el nivel va como `{ text: "10" }`. Un número suelto hace fallar
`sendMessage` con «Native variant type conversion failed».

## Depuración

- Registro de contenido: `[miaddon] registrado…`, `[miaddon] error: …`,
  `[miaddon] aviso: …`, y los de Cooblemon con `[cooblemon/api]`.
- `/scriptevent cooblemon:debug.registry`: el estado del registro, cada
  add-on con sus especies, errores y avisos, y el tamaño máximo de mensaje.
