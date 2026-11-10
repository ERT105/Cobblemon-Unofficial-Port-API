/**
 * Renderizador de retratos de Pokémon para los menús (se ejecuta en Edge sin
 * ventana, lo controla `tools/render-pokemon-sprites.ts`).
 *
 * Reproduce lo que Cobblemon dibuja en vivo: el modelo Bedrock con su textura,
 * en la pose de retrato del poser, con cámara ortográfica girada como las
 * pantallas del mod. La geometría se interpreta igual que Blockbench (X
 * espejado, rotaciones ZYX, UV de caja) para que coincida con el juego.
 */
import * as THREE from "three";

const DEG = Math.PI / 180;

/**
 * Piezas faciales alternativas: el mod solo muestra el estado neutro.
 *
 * `eye_emote_*` y `eyeshine_*` **no** entran: son la mitad superior y el brillo
 * del ojo abierto (Pikachu). Ocultarlos dejaba solo la franja inferior y el
 * Pokémon parecía dormido. Los párpados sí son el estado cerrado.
 */
const ALTERNATE_RE =
  /^eyelids?$|eyelid|^eye_(sad|angry|happy|hurt|recoil|unamused)_|^mouth_(open|ajar)|^o_mouth$|_mouth_(open|ajar)|^(sad|angry|happy|hurt)_mouth|^tongue|teeth/;

/**
 * Huesos de cara alternativa que se ocultan: los que casan con `ALTERNATE_RE`,
 * salvo tres casos en los que el nombre engaña.
 *
 * - **Contenedores**: en Cyndaquil `eyelid_right` es el hueso que lleva el ojo
 *   entero (`eye_right` cuelga de él); ocultarlo lo dejaba sin ojos.
 * - **Pupilas**: en Froakie `pupil_eyelid_*` es la pupila.
 * - **Lo que mueve la pose**: si la animación de retrato anima un hueso, es que
 *   se ve (las pupilas de Froakie se colocan en `ground_idle`).
 */
function alternateFaceBones(bones, pose) {
  const children = new Map();
  for (const bone of bones) {
    if (!bone.parent) continue;
    children.set(bone.parent, [...(children.get(bone.parent) ?? []), bone.name]);
  }
  const byName = new Map(bones.map((b) => [b.name, b]));
  const matches = (name) => ALTERNATE_RE.test(name.toLowerCase()) && !/^pupil/.test(name.toLowerCase());
  // Algo que se dibuja: con cubos propios o con algo dibujable debajo (los
  // localizadores, sin cubos, no cuentan).
  const draws = (name) =>
    (byName.get(name)?.cubes?.length ?? 0) > 0 || (children.get(name) ?? []).some(draws);
  // Un contenedor se queda si cuelga de él algo dibujable que no es alternativo.
  const keepsSomething = (name) =>
    (children.get(name) ?? []).some((child) => (!matches(child) && draws(child)) || keepsSomething(child));
  // ¿La pose mueve este hueso o algo que cuelga de él?
  const animatedBelow = (name) => Boolean(pose[name]) || (children.get(name) ?? []).some(animatedBelow);
  // La cabeza de la familia alternativa: el antepasado más alto que también casa.
  const familyRoot = (name) => {
    let current = name;
    for (let parent = byName.get(current)?.parent; parent && matches(parent); parent = byName.get(parent)?.parent) {
      current = parent;
    }
    return current;
  };
  const out = new Set();
  for (const bone of bones) {
    if (!matches(bone.name)) continue;
    if (pose[bone.name]) continue;
    if (keepsSomething(bone.name)) continue;
    // **Si la pose mueve una parte de la familia, la familia entera se ve.**
    // La lengua de Greninja es su bufanda: `tongue` no se anima, pero
    // `tongue1…5` sí, y como todo lo de debajo empieza por `tongue`, se
    // escondía la lengua entera. Una lengua que la pose de reposo mueve no es
    // la cara alternativa de un ataque.
    if (animatedBelow(familyRoot(bone.name))) continue;
    out.add(bone.name);
  }
  return out;
}

const MATH = {
  sin: (x) => Math.sin(x * DEG),
  cos: (x) => Math.cos(x * DEG),
  asin: (x) => Math.asin(x) / DEG,
  acos: (x) => Math.acos(x) / DEG,
  atan: (x) => Math.atan(x) / DEG,
  atan2: (y, x) => Math.atan2(y, x) / DEG,
  abs: Math.abs,
  clamp: (x, a, b) => Math.min(Math.max(x, a), b),
  mod: (a, b) => a % b,
  exp: Math.exp,
  sqrt: Math.sqrt,
  pow: Math.pow,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  trunc: Math.trunc,
  min: Math.min,
  max: Math.max,
  lerp: (a, b, t) => a + (b - a) * t,
  hermite_blend: (t) => 3 * t * t - 2 * t * t * t,
  // Un retrato es una imagen fija: lo aleatorio toma su valor medio.
  random: (a = 0, b = 1) => (a + b) / 2,
  random_integer: (a = 0, b = 1) => Math.round((a + b) / 2),
  die_roll: () => 0,
  die_roll_integer: () => 0,
  min_angle: (x) => x,
  pi: Math.PI,
};

/** Consultas y variables Molang: todo vale 0 salvo el tiempo de animación. */
const ZERO = new Proxy({}, { get: () => 0 });

/**
 * Instante que se está dibujando. Los retratos fijos usan t = 0; las hojas
 * animadas recorren el bucle de reposo y solo cambia `q.anim_time`.
 */
let animTime = 0;
const QUERY = new Proxy(
  {},
  { get: (_, key) => (key === "anim_time" || key === "life_time" ? animTime : 0) }
);

const molangCache = new Map();

function molang(expr) {
  if (typeof expr === "number") return expr;
  if (typeof expr === "boolean") return expr ? 1 : 0;
  if (typeof expr !== "string") return 0;
  const src = expr.trim();
  if (!src) return 0;
  let fn = molangCache.get(src);
  if (!fn) {
    const js = src
      .toLowerCase()
      .replace(/\bquery\./g, "q.")
      .replace(/\bvariable\./g, "v.")
      .replace(/\btemp\./g, "t.")
      .replace(/\bcontext\./g, "c.")
      .replace(/^return\s+/, "")
      .replace(/;\s*$/, "");
    try {
      fn = new Function("math", "q", "v", "t", "c", `"use strict"; return (${js});`);
    } catch {
      fn = () => 0;
    }
    molangCache.set(src, fn);
  }
  try {
    const value = Number(fn(MATH, QUERY, ZERO, ZERO, ZERO));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

/** Valor de un canal de animación en t = 0 (vector, escalar o keyframes). */
function sampleVec(value, neutral) {
  if (value == null) return null;
  if (typeof value === "number" || typeof value === "string") {
    const n = molang(value);
    return [n, n, n];
  }
  if (Array.isArray(value)) {
    return [0, 1, 2].map((i) => (value[i] == null ? neutral : molang(value[i])));
  }
  if (typeof value === "object") {
    if ("post" in value) return sampleVec(value.post, neutral);
    if ("pre" in value) return sampleVec(value.pre, neutral);
    if ("vector" in value) return sampleVec(value.vector, neutral);
    const keys = Object.keys(value)
      .map((k) => [parseFloat(k), k])
      .filter(([n]) => Number.isFinite(n))
      .sort((a, b) => a[0] - b[0]);
    if (keys.length === 0) return null;
    return sampleKeyframes(keys.map(([time, k]) => ({ time, value: value[k] })), neutral);
  }
  return null;
}

/** Valor de un fotograma clave al llegar a él (`pre`) o al salir (`post`). */
function keyValue(frame, side, neutral) {
  const v = frame.value;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const chosen = side === "pre" && "pre" in v ? v.pre : "post" in v ? v.post : "pre" in v ? v.pre : v.vector;
    return sampleVec(chosen, neutral);
  }
  return sampleVec(v, neutral);
}

/**
 * Fotogramas clave en el instante actual: lineal entre claves, o Catmull-Rom
 * si alguna de las dos lo pide, como Blockbench. Fuera del rango se mantiene
 * el extremo.
 */
function sampleKeyframes(frames, neutral) {
  const t = animTime;
  if (frames.length === 1 || t <= frames[0].time) return keyValue(frames[0], "post", neutral);
  const last = frames[frames.length - 1];
  if (t >= last.time) return keyValue(last, "pre", neutral);
  let i = 0;
  while (i < frames.length - 2 && t >= frames[i + 1].time) i++;
  const a = frames[i];
  const b = frames[i + 1];
  const u = (t - a.time) / Math.max(b.time - a.time, 1e-6);
  const p1 = keyValue(a, "post", neutral);
  const p2 = keyValue(b, "pre", neutral);
  const smooth = (f) => f.value && typeof f.value === "object" && f.value.lerp_mode === "catmullrom";
  if (!smooth(a) && !smooth(b)) return p1.map((v, k) => v + (p2[k] - v) * u);
  const p0 = i > 0 ? keyValue(frames[i - 1], "post", neutral) : p1;
  const p3 = i + 2 < frames.length ? keyValue(frames[i + 2], "pre", neutral) : p2;
  return p1.map((_, k) => {
    const [x0, x1, x2, x3] = [p0[k], p1[k], p2[k], p3[k]];
    return (
      0.5 *
      (2 * x1 + (-x0 + x2) * u + (2 * x0 - 5 * x1 + 4 * x2 - x3) * u * u + (-x0 + 3 * x1 - 3 * x2 + x3) * u * u * u)
    );
  });
}

/**
 * UV de caja de Bedrock, con los nombres de cara de Blockbench.
 * Devuelve [u1, v1, u2, v2] por cara; u1 > u2 significa volteo horizontal.
 */
function boxUv(uv, size, mirror) {
  const [u, v] = uv;
  const [x, y, z] = size;
  const faces = {
    north: [u + z, v + z, u + z + x, v + z + y],
    east: [u, v + z, u + z, v + z + y],
    south: [u + z * 2 + x, v + z, u + z * 2 + x * 2, v + z + y],
    west: [u + z + x, v + z, u + z * 2 + x, v + z + y],
    up: [u + z + x, v + z, u + z, v],
    down: [u + z + x * 2, v, u + z + x, v + z],
  };
  if (mirror) {
    const east = faces.east;
    faces.east = faces.west;
    faces.west = east;
    for (const key of Object.keys(faces)) {
      const f = faces[key];
      faces[key] = [f[2], f[1], f[0], f[3]];
    }
  }
  return faces;
}

/** Esquinas (arriba-izq, arriba-der, abajo-der, abajo-izq) de cada cara vista desde fuera. */
function faceCorners(f, t) {
  return {
    north: [[t.x, t.y, f.z], [f.x, t.y, f.z], [f.x, f.y, f.z], [t.x, f.y, f.z]],
    south: [[f.x, t.y, t.z], [t.x, t.y, t.z], [t.x, f.y, t.z], [f.x, f.y, t.z]],
    east: [[t.x, t.y, t.z], [t.x, t.y, f.z], [t.x, f.y, f.z], [t.x, f.y, t.z]],
    west: [[f.x, t.y, f.z], [f.x, t.y, t.z], [f.x, f.y, t.z], [f.x, f.y, f.z]],
    up: [[f.x, t.y, f.z], [t.x, t.y, f.z], [t.x, t.y, t.z], [f.x, t.y, t.z]],
    down: [[f.x, f.y, t.z], [t.x, f.y, t.z], [t.x, f.y, f.z], [f.x, f.y, f.z]],
  };
}

function cubeObject(cube, bone, pivotBB, tw, th, material) {
  const o = cube.origin ?? [0, 0, 0];
  const s = cube.size ?? [0, 0, 0];
  const inflate = cube.inflate ?? bone.inflate ?? 0;
  const mirror = cube.mirror ?? bone.mirror ?? false;

  // Espacio Blockbench: X espejado.
  const from = { x: -(o[0] + s[0]) - inflate, y: o[1] - inflate, z: o[2] - inflate };
  const to = { x: -o[0] + inflate, y: o[1] + s[1] + inflate, z: o[2] + s[2] + inflate };
  const uvs = boxUv(Array.isArray(cube.uv) ? cube.uv : [0, 0], s, mirror);
  const corners = faceCorners(from, to);

  const positions = [];
  const uvsOut = [];
  for (const [face, quad] of Object.entries(corners)) {
    const [u1, v1, u2, v2] = uvs[face];
    if (Math.abs(u2 - u1) < 1e-6 || Math.abs(v2 - v1) < 1e-6) continue;
    const a = new THREE.Vector3(...quad[0]);
    const b = new THREE.Vector3(...quad[1]);
    const c = new THREE.Vector3(...quad[2]);
    if (b.clone().sub(a).lengthSq() < 1e-10 || c.clone().sub(b).lengthSq() < 1e-10) continue;
    const quadUv = [[u1, v1], [u2, v1], [u2, v2], [u1, v2]];
    for (const index of [0, 1, 2, 0, 2, 3]) {
      const p = quad[index];
      positions.push(p[0] - pivotBB[0], p[1] - pivotBB[1], p[2] - pivotBB[2]);
      uvsOut.push(quadUv[index][0] / tw, 1 - quadUv[index][1] / th);
    }
  }
  if (positions.length === 0) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvsOut, 2));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);

  if (!cube.rotation) return mesh;
  // Rotación propia del cubo alrededor de su pivote.
  const cp = cube.pivot ?? [o[0] + s[0] / 2, o[1] + s[1] / 2, o[2] + s[2] / 2];
  const holder = new THREE.Group();
  holder.position.set(-cp[0] - pivotBB[0], cp[1] - pivotBB[1], cp[2] - pivotBB[2]);
  const r = cube.rotation;
  holder.rotation.set(-r[0] * DEG, -r[1] * DEG, r[2] * DEG, "ZYX");
  mesh.position.set(-holder.position.x, -holder.position.y, -holder.position.z);
  holder.add(mesh);
  return holder;
}

function buildModel(input, texture) {
  const geometry = input.geo["minecraft:geometry"][0];
  const description = geometry.description ?? {};
  const tw = description.texture_width ?? texture.image.width;
  const th = description.texture_height ?? texture.image.height;
  const bones = geometry.bones ?? [];
  const byName = new Map(bones.map((b) => [b.name, b]));
  const hidden = new Set(input.hidden ?? []);
  const pose = input.poseBones ?? {};

  const material = new THREE.MeshLambertMaterial({
    map: texture,
    alphaTest: 0.1,
    side: THREE.DoubleSide,
  });
  /**
   * Planos sin grosor (un lado del cubo a 0): ojos, bocas y marcas pegados a
   * la superficie. Minecraft los dibuja después del cuerpo con `LEQUAL` y
   * ganan al coincidir en profundidad; aquí el orden no está garantizado y a
   * Cyndaquil le ganaba la cabeza y se quedaba sin ojos. El desplazamiento de
   * polígono los adelanta lo justo.
   */
  const decalMaterial = material.clone();
  decalMaterial.polygonOffset = true;
  decalMaterial.polygonOffsetFactor = -1;
  decalMaterial.polygonOffsetUnits = -4;

  const root = new THREE.Group();
  const groups = new Map();
  for (const bone of bones) groups.set(bone.name, new THREE.Group());

  const alternates = alternateFaceBones(bones, pose);

  /** Lo necesario para volver a posar cada hueso en otro instante. */
  const posed = [];
  for (const bone of bones) {
    const group = groups.get(bone.name);
    const pivot = bone.pivot ?? [0, 0, 0];
    const parentBone = bone.parent ? byName.get(bone.parent) : undefined;
    const parentPivot = parentBone?.pivot ?? [0, 0, 0];
    posed.push({ group, pivot, parentPivot, rot: bone.rotation ?? [0, 0, 0], channels: pose[bone.name] ?? {} });
    if (hidden.has(bone.name) || alternates.has(bone.name)) group.visible = false;

    const pivotBB = [-pivot[0], pivot[1], pivot[2]];
    for (const cube of bone.cubes ?? []) {
      const flat = (cube.size ?? [0, 0, 0]).some((v) => v === 0);
      const object = cubeObject(cube, bone, pivotBB, tw, th, flat ? decalMaterial : material);
      if (object) group.add(object);
    }
    const parentGroup = bone.parent ? groups.get(bone.parent) : undefined;
    (parentGroup ?? root).add(group);
  }
  const applyPose = (time) => {
    animTime = time;
    for (const { group, pivot, parentPivot, rot, channels } of posed) {
      const aPos = sampleVec(channels.position, 0) ?? [0, 0, 0];
      const aRot = sampleVec(channels.rotation, 0) ?? [0, 0, 0];
      const aScale = sampleVec(channels.scale, 1) ?? [1, 1, 1];
      group.position.set(
        -(pivot[0] - parentPivot[0]) - aPos[0],
        pivot[1] - parentPivot[1] + aPos[1],
        pivot[2] - parentPivot[2] + aPos[2]
      );
      group.rotation.set(-(rot[0] + aRot[0]) * DEG, -(rot[1] + aRot[1]) * DEG, (rot[2] + aRot[2]) * DEG, "ZYX");
      group.scale.set(Math.max(aScale[0], 1e-4), Math.max(aScale[1], 1e-4), Math.max(aScale[2], 1e-4));
    }
  };
  applyPose(0);
  return { root, material, decalMaterial, groups, applyPose };
}

const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setClearColor(0x000000, 0);

function visibleBounds(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  root.traverseVisible((object) => {
    if (!object.isMesh) return;
    object.geometry.computeBoundingBox();
    box.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
  });
  return box;
}

/**
 * Huesos de la cabeza.
 *
 * Los modelos de Cobblemon casi siempre traen un hueso `head`, y todo lo que
 * cuelga de él (orejas, ojos, cuernos) viaja dentro. Si no hay ninguno, el
 * encuadre cae al tercio superior del modelo, que para un cuadrúpedo o un pez
 * es donde está la cara.
 */
const HEAD_BONE_RE = /(^|_)(head|face|snout|muzzle)(_|$)/i;

function headObjects(groups) {
  const exact = groups.get("head") ?? groups.get("Head");
  if (exact) return [exact];
  const matches = [];
  for (const [name, group] of groups) {
    if (HEAD_BONE_RE.test(name)) matches.push(group);
  }
  return matches;
}

function boundsOf(objects) {
  const box = new THREE.Box3();
  for (const object of objects) {
    object.updateMatrixWorld(true);
    object.traverseVisible((child) => {
      if (!child.isMesh) return;
      child.geometry.computeBoundingBox();
      box.union(child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld));
    });
  }
  return box;
}

/** Marco cuadrado centrado en la cabeza, con aire alrededor. */
function faceFrame(holder, groups, margin) {
  holder.updateMatrixWorld(true);
  const heads = headObjects(groups);
  let box = heads.length > 0 ? boundsOf(heads) : new THREE.Box3();
  if (box.isEmpty()) {
    // Sin hueso de cabeza: tercio superior del modelo.
    const full = visibleBounds(holder);
    if (full.isEmpty()) return null;
    const size = full.getSize(new THREE.Vector3());
    const center = full.getCenter(new THREE.Vector3());
    box = new THREE.Box3(
      new THREE.Vector3(center.x - size.x / 3, full.max.y - size.y / 3, full.min.z),
      new THREE.Vector3(center.x + size.x / 3, full.max.y, full.max.z)
    );
  }
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const half = (Math.max(size.x, size.y) / 2) * (1 + (margin ?? 0.25));
  return { cx: center.x, cy: center.y, halfH: half };
}

function downsample(source, width, height) {
  let current = source;
  while (current.width / 2 >= width && current.height / 2 >= height) {
    const next = document.createElement("canvas");
    next.width = Math.floor(current.width / 2);
    next.height = Math.floor(current.height / 2);
    const ctx = next.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(current, 0, 0, next.width, next.height);
    current = next;
  }
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = out.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(current, 0, 0, width, height);
  return out;
}

function renderTarget(scene, root, target, supersample, pad, frame) {
  const W = target.width * supersample;
  const H = target.height * supersample;
  renderer.setSize(W, H, false);

  const box = visibleBounds(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  let halfW;
  let halfH;
  let cx = center.x;
  let cy = center.y;
  if (frame) {
    // Marco fijo común a todas las especies: el tamaño relativo lo pone
    // `profileScale`, como en las pantallas del mod.
    halfH = frame.halfH;
    halfW = frame.halfH * (W / H);
    cx = frame.cx;
    cy = frame.cy;
  } else {
    const pixelsPerUnit = Math.min(
      (W * (1 - pad * 2)) / Math.max(size.x, 1e-3),
      (H * (1 - pad * 2)) / Math.max(size.y, 1e-3)
    );
    halfW = W / 2 / pixelsPerUnit;
    halfH = H / 2 / pixelsPerUnit;
  }
  const camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.01, size.z + 400);
  camera.position.set(cx, cy, box.max.z + 200);
  camera.lookAt(cx, cy, box.max.z);

  renderer.render(scene, camera);
  lastFrame = downsample(renderer.domElement, target.width, target.height);
  return lastFrame.toDataURL("image/png");
}

/** Último fotograma reducido, para componer las hojas animadas sin decodificar. */
let lastFrame = null;

async function loadPixelTexture(url) {
  const texture = await new THREE.TextureLoader().loadAsync(url);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Capas del resolver (llama de Charizard, mejillas de Pikachu…): la misma
 * geometría con otra textura encima. Las emisivas no reciben luz.
 */
function addLayers(root, layers) {
  const meshes = [];
  root.traverse((object) => {
    if (object.isMesh) meshes.push(object);
  });
  const materials = layers.map(
    (layer) =>
      new (layer.emissive ? THREE.MeshBasicMaterial : THREE.MeshLambertMaterial)({
        map: layer.texture,
        side: THREE.DoubleSide,
        transparent: Boolean(layer.translucent),
        alphaTest: layer.translucent ? 0.02 : 0.1,
        depthWrite: !layer.translucent,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
  );
  for (const mesh of meshes) {
    for (const material of materials) {
      const overlay = new THREE.Mesh(mesh.geometry, material);
      overlay.position.copy(mesh.position);
      overlay.rotation.copy(mesh.rotation);
      overlay.scale.copy(mesh.scale);
      overlay.renderOrder = 1;
      mesh.parent.add(overlay);
    }
  }
  return materials;
}

window.renderSprite = async (input) => {
  const texture = await loadPixelTexture(input.texture);
  const layers = [];
  for (const layer of input.layers ?? []) {
    layers.push({ ...layer, texture: await loadPixelTexture(layer.texture) });
  }

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, input.ambient ?? 1.15));
  const key = new THREE.DirectionalLight(0xffffff, input.diffuse ?? 1.5);
  key.position.set(-0.45, 1, 0.9);
  scene.add(key);

  const { root, material, decalMaterial, groups, applyPose } = buildModel(input, texture);
  const layerMaterials = addLayers(root, layers);
  const pivot = new THREE.Group();
  // Giro de las pantallas del mod, `fromEulerXYZDegrees(13, 35, 0)`: primero
  // el yaw y luego el pitch.
  pivot.rotation.set((input.pitch ?? 13) * DEG, (input.yaw ?? 215) * DEG, 0, "XYZ");
  pivot.add(root);
  const holder = new THREE.Group();
  holder.add(pivot);
  scene.add(holder);

  if (input.none) {
    // `ProfileTransformType.NONE` con `applyBaseScale`: a tamaño real, sin el
    // ajuste de retrato (la silueta de la pestaña Tamaño de la Pokédex).
    pivot.scale.setScalar((input.none.baseScale ?? 1) / 16);
    holder.position.set(0, 0, 0);
  } else if (input.profile) {
    // `drawProfilePokemon`: translate(tx, ty + 1.5·ps) · scale(ps) · rotación.
    // Unidades en bloques: la geometría viene en píxeles de modelo (1/16).
    const ps = input.profile.scale ?? 1;
    const t = input.profile.translation ?? [0, 0, 0];
    pivot.scale.setScalar(ps / 16);
    holder.position.set(
      t[0],
      (input.profile.ySign ?? 1) * t[1] + (input.profile.baseSign ?? 1) * 1.5 * ps,
      0
    );
  }

  const cleanup = () => {
    root.traverse((object) => object.geometry?.dispose?.());
    material.dispose();
    decalMaterial.dispose();
    texture.dispose();
    for (const layerMaterial of layerMaterials) layerMaterial.dispose();
    for (const layer of layers) layer.texture.dispose();
  };

  if (input.measure) {
    const box = visibleBounds(holder);
    cleanup();
    return { minX: box.min.x, maxX: box.max.x, minY: box.min.y, maxY: box.max.y };
  }

  if (input.sheet) {
    // Hoja animada: el bucle de reposo en `times`, fotograma a fotograma en
    // una rejilla de `cols` columnas, con el encuadre fijo del objetivo.
    const { target, times } = input.sheet;
    // Un solo fotograma (icono fijo) no necesita una fila entera de huecos.
    const cols = Math.min(input.sheet.cols, times.length);
    pivot.rotation.set((target.pitch ?? 13) * DEG, (target.yaw ?? 215) * DEG, 0, "XYZ");
    const rows = Math.ceil(times.length / cols);
    const sheet = document.createElement("canvas");
    sheet.width = target.width * cols;
    sheet.height = target.height * rows;
    const ctx = sheet.getContext("2d");
    const seen = new Set();
    times.forEach((time, k) => {
      applyPose(time);
      const url = renderTarget(scene, holder, target, input.supersample ?? 4, input.pad ?? 0.06, input.frames?.[target.name]);
      seen.add(url);
      const img = lastFrame;
      ctx.drawImage(img, (k % cols) * target.width, Math.floor(k / cols) * target.height);
    });
    if (input.sheet.silhouette) {
      // Silueta negra (el mod la dibuja con r = g = b = 0): solo cuenta la forma.
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, sheet.width, sheet.height);
    }
    cleanup();
    return { sheet: sheet.toDataURL("image/png"), distinct: seen.size };
  }

  const out = {};
  for (const target of input.targets) {
    // Cada pantalla del mod gira el modelo hacia su lado: la Pokédex lo mira a
    // la izquierda; el PC y los iconos de equipo, a la derecha.
    pivot.rotation.set(
      (target.pitch ?? input.pitch ?? 13) * DEG,
      (target.yaw ?? input.yaw ?? 215) * DEG,
      0,
      "XYZ"
    );
    const frame = target.face
      ? faceFrame(holder, groups, target.faceMargin)
      : input.frames?.[target.name];
    out[target.name] = renderTarget(
      scene,
      holder,
      target,
      input.supersample ?? 4,
      input.pad ?? 0.06,
      frame
    );
  }
  cleanup();
  return out;
};

window.rendererReady = true;
