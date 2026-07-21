import * as THREE from "three";

const stage = document.querySelector("#plane-stage");
const smokeCanvas = document.querySelector("#smoke-canvas");
const smokeContext = smokeCanvas.getContext("2d");
const instructions = document.querySelector("#flight-instructions");
const clearButton = document.querySelector("#clear-sky");
const fallback = document.querySelector("#webgl-fallback");
const storyCard = document.querySelector("#story-card");
const contactReward = document.querySelector("#contact-reward");
const storyCollapse = document.querySelector("#story-collapse");
const contactCollapse = document.querySelector("#contact-collapse");
const storyToken = document.querySelector("#story-token");
const contactToken = document.querySelector("#contact-token");
const collectibleStatus = document.querySelector("#collectible-status");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coinSounds = Array.from({ length: 4 }, () => {
  const sound = new Audio("sounds/coin sound effect.mp3");
  sound.preload = "auto";
  sound.volume = 0.48;
  return sound;
});
let coinSoundIndex = 0;

const point = (x, y) => ({ x, y });
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const mix = (from, to, amount) => from + (to - from) * amount;

function line(from, to, steps = 9) {
  return Array.from({ length: steps }, (_, index) => {
    const t = index / (steps - 1);
    return point(mix(from.x, to.x, t), mix(from.y, to.y, t));
  });
}

function quadratic(from, control, to, steps = 16) {
  return Array.from({ length: steps }, (_, index) => {
    const t = index / (steps - 1);
    const inverse = 1 - t;
    return point(
      inverse * inverse * from.x + 2 * inverse * t * control.x + t * t * to.x,
      inverse * inverse * from.y + 2 * inverse * t * control.y + t * t * to.y,
    );
  });
}

function cubic(from, controlA, controlB, to, steps = 20) {
  return Array.from({ length: steps }, (_, index) => {
    const t = index / (steps - 1);
    const inverse = 1 - t;
    return point(
      inverse ** 3 * from.x + 3 * inverse * inverse * t * controlA.x + 3 * inverse * t * t * controlB.x + t ** 3 * to.x,
      inverse ** 3 * from.y + 3 * inverse * inverse * t * controlA.y + 3 * inverse * t * t * controlB.y + t ** 3 * to.y,
    );
  });
}

const GLYPHS = {
  S: {
    width: 0.9,
    strokes: [
      cubic(point(0.86, 0.12), point(0.68, -0.05), point(0.12, 0.02), point(0.1, 0.3), 22)
        .concat(cubic(point(0.1, 0.3), point(0.08, 0.52), point(0.85, 0.44), point(0.82, 0.72), 22).slice(1))
        .concat(cubic(point(0.82, 0.72), point(0.78, 1.03), point(0.18, 1.04), point(0.04, 0.82), 22).slice(1)),
    ],
  },
  A: {
    width: 0.95,
    strokes: [
      line(point(0.03, 1), point(0.48, 0), 18).concat(line(point(0.48, 0), point(0.94, 1), 18).slice(1)),
      line(point(0.22, 0.62), point(0.74, 0.62), 12),
    ],
  },
  u: {
    width: 0.78,
    strokes: [
      line(point(0.05, 0.3), point(0.05, 0.76), 12)
        .concat(quadratic(point(0.05, 0.76), point(0.08, 1.05), point(0.38, 0.94), 14).slice(1))
        .concat(quadratic(point(0.38, 0.94), point(0.7, 0.9), point(0.72, 0.63), 14).slice(1))
        .concat(line(point(0.72, 0.63), point(0.72, 0.98), 9).slice(1)),
    ],
  },
  s: {
    width: 0.72,
    strokes: [
      cubic(point(0.68, 0.4), point(0.52, 0.2), point(0.08, 0.28), point(0.08, 0.5), 16)
        .concat(cubic(point(0.08, 0.5), point(0.08, 0.7), point(0.7, 0.6), point(0.66, 0.84), 16).slice(1))
        .concat(cubic(point(0.66, 0.84), point(0.61, 1.06), point(0.14, 1.02), point(0.03, 0.88), 15).slice(1)),
    ],
  },
  h: {
    width: 0.76,
    strokes: [
      line(point(0.05, 0), point(0.05, 1), 22),
      quadratic(point(0.05, 0.58), point(0.35, 0.24), point(0.68, 0.46), 16)
        .concat(line(point(0.68, 0.46), point(0.7, 1), 13).slice(1)),
    ],
  },
  i: {
    width: 0.36,
    strokes: [
      line(point(0.2, 0.35), point(0.2, 1), 15),
      [point(0.2, 0.1), point(0.205, 0.105)],
    ],
  },
  l: {
    width: 0.4,
    strokes: [
      line(point(0.2, 0.02), point(0.2, 0.88), 20)
        .concat(quadratic(point(0.2, 0.88), point(0.21, 1.02), point(0.35, 0.95), 7).slice(1)),
    ],
  },
  t: {
    width: 0.62,
    strokes: [
      line(point(0.33, 0.05), point(0.33, 0.84), 18)
        .concat(quadratic(point(0.33, 0.84), point(0.38, 1.04), point(0.58, 0.91), 8).slice(1)),
      line(point(0.03, 0.38), point(0.62, 0.38), 12),
    ],
  },
  r: {
    width: 0.65,
    strokes: [
      line(point(0.06, 0.34), point(0.06, 1), 15),
      cubic(point(0.06, 0.62), point(0.24, 0.3), point(0.5, 0.28), point(0.62, 0.45), 15),
    ],
  },
  e: {
    width: 0.72,
    strokes: [
      line(point(0.68, 0.64), point(0.08, 0.64), 12)
        .concat(cubic(point(0.08, 0.64), point(0.1, 0.27), point(0.65, 0.22), point(0.68, 0.58), 19).slice(1))
        .concat(cubic(point(0.68, 0.58), point(0.73, 0.98), point(0.23, 1.08), point(0.06, 0.83), 18).slice(1)),
    ],
  },
  y: {
    width: 0.78,
    strokes: [
      line(point(0.04, 0.34), point(0.34, 0.86), 14),
      line(point(0.73, 0.32), point(0.34, 0.86), 14)
        .concat(cubic(point(0.34, 0.86), point(0.27, 1.12), point(0.16, 1.27), point(-0.05, 1.27), 15).slice(1)),
    ],
  },
  a: {
    width: 1.02,
    strokes: [
      cubic(point(0.68, 0.5), point(0.5, 0.21), point(0.08, 0.31), point(0.08, 0.65), 20)
        .concat(cubic(point(0.08, 0.65), point(0.08, 1), point(0.51, 1.07), point(0.68, 0.75), 20).slice(1))
        .concat(line(point(0.68, 0.75), point(0.68, 0.34), 10).slice(1))
        .concat(line(point(0.68, 0.34), point(0.7, 1), 15).slice(1))
        .concat(quadratic(point(0.7, 1), point(0.86, 0.98), point(1.03, 0.82), 10).slice(1)),
    ],
  },
};

let width = window.innerWidth;
let height = window.innerHeight;
let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
let scene;
let camera;
let renderer;
let plane;
let planeVisual;
let propeller;
let raycaster;
let pointer;
let introPath = [];
let introPuffSchedule = [];
let introIndex = 0;
let introStart = 0;
let introComplete = false;
let isFlying = false;
let heading = 0;
const autopilotVelocity = new THREE.Vector2();
let previousTime = performance.now();
let resizeTimer;
let namePuffs = [];
let userPuffs = [];
let puffCounter = 0;
let lastUserPuff = null;
let collectibleGroups = [];
let coinTexture = null;
const tokenPositions = new Map();
const planePosition = new THREE.Vector2();
const targetPosition = new THREE.Vector2();
const puffSprite = createPuffSprite();
const coinFrameCount = 8;

function createPuffSprite() {
  const sprite = document.createElement("canvas");
  sprite.width = 96;
  sprite.height = 96;
  const context = sprite.getContext("2d");
  const gradient = context.createRadialGradient(48, 48, 4, 48, 48, 44);
  gradient.addColorStop(0, "rgba(255,255,250,0.96)");
  gradient.addColorStop(0.44, "rgba(255,255,250,0.83)");
  gradient.addColorStop(0.76, "rgba(255,255,250,0.34)");
  gradient.addColorStop(1, "rgba(255,255,250,0)");
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(48, 48, 46, 0, Math.PI * 2);
  context.fill();
  return sprite;
}

function pseudoRandom(seed) {
  const value = Math.sin(seed * 999.91) * 43758.5453;
  return value - Math.floor(value);
}

function makePuff(x, y, kind) {
  puffCounter += 1;
  const randomA = pseudoRandom(puffCounter);
  const randomB = pseudoRandom(puffCounter + 17);
  const puffScale = kind === "name" ? 0.7 : 1;
  const baseSize = clamp(Math.min(width, height) * 0.021, 12, 22) * puffScale;
  return {
    x: x + (randomA - 0.5) * baseSize * 0.22,
    y: y + (randomB - 0.5) * baseSize * 0.22,
    size: baseSize * (0.72 + randomA * 0.56),
    opacity: 0.58 + randomB * 0.25,
    born: performance.now(),
    kind,
  };
}

function transformPoints(points, originX, originY, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return points.map((sourcePoint) => {
    return point(
      originX + sourcePoint.x * cosine - sourcePoint.y * sine,
      originY + sourcePoint.x * sine + sourcePoint.y * cosine,
    );
  });
}

function sampleTextCells(canvas, comparisonCanvas = null) {
  const spacing = Math.round(clamp(Math.min(width, height) * 0.0045, 2.8, 4.5));
  const context = canvas.getContext("2d");
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const comparisonPixels = comparisonCanvas
    ? comparisonCanvas.getContext("2d").getImageData(0, 0, comparisonCanvas.width, comparisonCanvas.height).data
    : null;
  const sampled = [];

  for (let cellY = 0; cellY < canvas.height; cellY += spacing) {
    for (let cellX = 0; cellX < canvas.width; cellX += spacing) {
      let strongestAlpha = 0;
      let strongestX = 0;
      let strongestY = 0;
      const endY = Math.min(cellY + spacing, canvas.height);
      const endX = Math.min(cellX + spacing, canvas.width);
      for (let y = cellY; y < endY; y += 1) {
        for (let x = cellX; x < endX; x += 1) {
          const pixelIndex = (y * canvas.width + x) * 4 + 3;
          const alpha = comparisonPixels
            ? Math.max(0, pixels[pixelIndex] - comparisonPixels[pixelIndex])
            : pixels[pixelIndex];
          if (alpha > strongestAlpha) {
            strongestAlpha = alpha;
            strongestX = x;
            strongestY = y;
          }
        }
      }
      if (strongestAlpha > 24) sampled.push(point(strongestX, strongestY));
    }
  }
  return sampled;
}

function rasterizeCursiveLine(fullText, visiblePrefix, fontSize, letterSpacing = 0) {
  const measurementCanvas = document.createElement("canvas");
  const measurementContext = measurementCanvas.getContext("2d");
  const font = `${fontSize}px "Sacramento", cursive`;
  measurementContext.font = font;
  measurementContext.letterSpacing = `${letterSpacing}px`;
  const metrics = measurementContext.measureText(fullText);
  const padding = Math.ceil(fontSize * 0.32);
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent || fontSize * 0.76);
  const descent = Math.ceil(metrics.actualBoundingBoxDescent || fontSize * 0.24);
  const canvasWidth = Math.ceil(metrics.width + padding * 2);
  const canvasHeight = Math.ceil(ascent + descent + padding * 2);
  const baseline = padding + ascent;

  const drawText = (text) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const context = canvas.getContext("2d");
    context.font = font;
    context.letterSpacing = `${letterSpacing}px`;
    context.textBaseline = "alphabetic";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "white";
    context.fillStyle = "white";
    context.lineWidth = Math.max(1.6, fontSize * 0.035);
    context.strokeText(text, padding, baseline);
    context.fillText(text, padding, baseline);
    return canvas;
  };

  const fullCanvas = drawText(fullText);
  const prefixCanvas = drawText(visiblePrefix);
  const prefixPoints = sampleTextCells(prefixCanvas).map((sourcePoint) => point(sourcePoint.x - padding, sourcePoint.y - padding));
  const finalPoints = sampleTextCells(fullCanvas, prefixCanvas).map((sourcePoint) => point(sourcePoint.x - padding, sourcePoint.y - padding));
  return { prefixPoints, finalPoints };
}

function addPointPuffs(points, collection) {
  for (const sourcePoint of points) collection.push(makePuff(sourcePoint.x, sourcePoint.y, "name"));
}

function createFlightPath(strokes) {
  const path = [];
  let previous = null;
  for (const stroke of strokes) {
    if (previous) {
      const travelPoints = line(previous, stroke[0], 10);
      for (const travelPoint of travelPoints.slice(1)) path.push({ ...travelPoint, smoke: false });
    }
    for (const strokePoint of stroke) path.push({ ...strokePoint, smoke: true });
    previous = stroke.at(-1);
  }
  return path;
}

function buildSkywritingLayout() {
  namePuffs = [];
  puffCounter = 0;

  const isMobile = width < 700;
  const fontSize = isMobile
    ? Math.min(width * 0.092, height * 0.0736) * 1.05
    : Math.min(width * 0.0592, height * 0.104);
  const letterSpacing = isMobile ? fontSize * 0.025 : 0;
  const angle = isMobile ? -0.06 : -0.085;
  const firstOrigin = point(width * 0.045, height * (isMobile ? 0.085 : 0.052));
  const secondOrigin = point(width * (isMobile ? 0.06 : 0.065), height * (isMobile ? 0.18 : 0.165));
  const firstLine = rasterizeCursiveLine("Sushil", "Sushil", fontSize, letterSpacing);
  const secondLine = rasterizeCursiveLine("Athreya", "Athrey", fontSize, letterSpacing);
  const firstVisible = transformPoints(firstLine.prefixPoints, firstOrigin.x, firstOrigin.y, angle);
  const secondVisible = transformPoints(secondLine.prefixPoints, secondOrigin.x, secondOrigin.y, angle);
  const finalLetterPoints = transformPoints(secondLine.finalPoints, secondOrigin.x, secondOrigin.y, angle);

  addPointPuffs(firstVisible.concat(secondVisible), namePuffs);

  const localBounds = secondLine.finalPoints.reduce((bounds, sourcePoint) => ({
    minX: Math.min(bounds.minX, sourcePoint.x),
    maxX: Math.max(bounds.maxX, sourcePoint.x),
    minY: Math.min(bounds.minY, sourcePoint.y),
    maxY: Math.max(bounds.maxY, sourcePoint.y),
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
  const boundsWidth = Math.max(localBounds.maxX - localBounds.minX, fontSize * 0.28);
  const boundsHeight = Math.max(localBounds.maxY - localBounds.minY, fontSize * 0.3);
  const finalLetterStroke = GLYPHS.a.strokes[0].map((sourcePoint) => point(
    localBounds.minX + ((sourcePoint.x - 0.06) / 0.97) * boundsWidth,
    localBounds.minY + ((sourcePoint.y - 0.3) / 0.7) * boundsHeight,
  ));
  const transformedFinalStroke = transformPoints(finalLetterStroke, secondOrigin.x, secondOrigin.y, angle);
  introPath = createFlightPath([transformedFinalStroke]);
  introPuffSchedule = finalLetterPoints.map((sourcePoint) => {
    let closestIndex = 0;
    let closestDistance = Infinity;
    introPath.forEach((pathPoint, index) => {
      const distance = (pathPoint.x - sourcePoint.x) ** 2 + (pathPoint.y - sourcePoint.y) ** 2;
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    return { ...sourcePoint, pathIndex: closestIndex, emitted: false };
  }).sort((a, b) => a.pathIndex - b.pathIndex);
  introIndex = 0;

  if (introComplete || reduceMotion) {
    addPointPuffs(finalLetterPoints, namePuffs);
    introPuffSchedule.forEach((scheduledPuff) => { scheduledPuff.emitted = true; });
    introComplete = true;
    const finalPoint = introPath.at(-1);
    const priorPoint = introPath.at(-2) || finalPoint;
    heading = Math.atan2(finalPoint.y - priorPoint.y, finalPoint.x - priorPoint.x);
    planePosition.set(finalPoint.x, finalPoint.y);
    targetPosition.copy(planePosition);
    setAutopilotFromHeading();
  } else {
    const firstPoint = introPath[0];
    const nextPoint = introPath[1] || firstPoint;
    heading = Math.atan2(nextPoint.y - firstPoint.y, nextPoint.x - firstPoint.x);
    planePosition.set(firstPoint.x, firstPoint.y);
    targetPosition.copy(planePosition);
    introStart = performance.now() + 650;
  }

  setPlaneScreenPosition(planePosition.x, planePosition.y, heading);
}

function createPlane() {
  const aircraft = new THREE.Group();
  aircraft.name = "Skywriting plane";
  const visual = new THREE.Group();
  aircraft.add(visual);

  const red = new THREE.MeshStandardMaterial({ color: 0xe74424, roughness: 0.58, metalness: 0.04 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xffa31a, roughness: 0.52, metalness: 0.03 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xffedaa, roughness: 0.68 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x193747, roughness: 0.42, metalness: 0.18 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x75d7ea, roughness: 0.18, metalness: 0.05 });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 10, 72, 14), red);
  fuselage.rotation.z = -Math.PI / 2;
  visual.add(fuselage);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(10, 19, 14), orange);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 45;
  visual.add(nose);

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(8.2, 14, 9), glass);
  cockpit.scale.set(1.25, 0.76, 0.66);
  cockpit.position.set(7, 0, 8);
  visual.add(cockpit);

  const upperWing = new THREE.Mesh(new THREE.BoxGeometry(25, 92, 4.5), cream);
  upperWing.position.set(-2, 0, 12);
  visual.add(upperWing);

  const lowerWing = new THREE.Mesh(new THREE.BoxGeometry(22, 78, 4), orange);
  lowerWing.position.set(0, 0, -7);
  visual.add(lowerWing);

  for (const wingY of [-31, 31]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 22), dark);
    strut.position.set(-2, wingY, 2);
    visual.add(strut);
  }

  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(15, 39, 3.5), cream);
  tailWing.position.set(-37, 0, 2);
  visual.add(tailWing);

  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(17, 3.5, 19), red);
  tailFin.position.set(-37, 0, 10);
  visual.add(tailFin);

  const wheelBar = new THREE.Mesh(new THREE.BoxGeometry(3, 33, 3), dark);
  wheelBar.position.set(10, 0, -12);
  visual.add(wheelBar);

  for (const wheelY of [-16, 16]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(5, 2, 8, 16), dark);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(11, wheelY, -13);
    visual.add(wheel);
  }

  const propellerAssembly = new THREE.Group();
  propellerAssembly.position.set(57, 0, 0);
  const propellerBlade = new THREE.Mesh(new THREE.BoxGeometry(3.5, 48, 3.5), dark);
  propellerAssembly.add(propellerBlade);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(5, 10, 8), orange);
  propellerAssembly.add(hub);
  visual.add(propellerAssembly);

  const hitArea = new THREE.Mesh(
    new THREE.SphereGeometry(92, 10, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false }),
  );
  hitArea.name = "Plane hit area";
  aircraft.add(hitArea);

  visual.rotation.x = 0.2;
  visual.rotation.y = -0.08;
  scene.add(aircraft);
  planeVisual = visual;
  propeller = propellerAssembly;
  return aircraft;
}

function getCoinLayout() {
  if (width < 640) {
    return {
      story: [
        point(width * 0.70, height * 0.17),
        point(width * 0.81, height * 0.17),
        point(width * 0.92, height * 0.17),
      ],
      contact: [
        point(width * 0.12, height * 0.64),
        point(width * 0.25, height * 0.68),
        point(width * 0.38, height * 0.72),
      ],
    };
  }

  return {
    story: [
      point(width * 0.855, height * 0.18),
      point(width * 0.895, height * 0.18),
      point(width * 0.935, height * 0.18),
    ],
    contact: [
      point(width * 0.08, height * 0.68),
      point(width * 0.115, height * 0.715),
      point(width * 0.15, height * 0.75),
    ],
  };
}

function getCoinSize() {
  return clamp(Math.min(width, height) * 0.055, 40, 62);
}

function setCoinFrame(coin, frameIndex) {
  if (coin.userData.frame === frameIndex) return;
  const column = frameIndex % 3;
  const row = Math.floor(frameIndex / 3);
  coin.material.map.offset.set(column / 3, 1 - (row + 1) / 3);
  coin.material.map.needsUpdate = true;
  coin.userData.frame = frameIndex;
}

function createCoin(groupId, index) {
  const frameTexture = coinTexture.clone();
  frameTexture.colorSpace = THREE.SRGBColorSpace;
  frameTexture.wrapS = THREE.ClampToEdgeWrapping;
  frameTexture.wrapT = THREE.ClampToEdgeWrapping;
  frameTexture.repeat.set(1 / 3, 1 / 3);
  frameTexture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: frameTexture,
    transparent: true,
    alphaTest: 0.04,
    depthWrite: false,
    toneMapped: false,
  });
  const coin = new THREE.Sprite(material);
  coin.name = `${groupId} coin ${index + 1}`;
  coin.renderOrder = 3;
  coin.userData = {
    groupId,
    index,
    frame: -1,
    phase: index * 2.35 + (groupId === "contact" ? 0.9 : 0),
    collected: false,
    collectedAt: 0,
    baseScreenX: 0,
    baseScreenY: 0,
  };
  setCoinFrame(coin, (index * 2) % coinFrameCount);
  scene.add(coin);
  return coin;
}

function positionCollectibles() {
  if (!collectibleGroups.length) return;
  const layout = getCoinLayout();
  const size = getCoinSize();

  for (const group of collectibleGroups) {
    group.coins.forEach((coin, index) => {
      const screenPosition = layout[group.id][index];
      coin.userData.baseScreenX = screenPosition.x;
      coin.userData.baseScreenY = screenPosition.y;
      if (!coin.userData.collected) coin.scale.set(size, size, 1);
      coin.position.set(screenPosition.x - width / 2, height / 2 - screenPosition.y, 12);
    });
  }
}

function createCollectibles() {
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    "images/game-coins.png",
    (texture) => {
      coinTexture = texture;
      coinTexture.colorSpace = THREE.SRGBColorSpace;
      collectibleGroups = ["story", "contact"].map((id) => ({
        id,
        rewarded: false,
        coins: Array.from({ length: 3 }, (_, index) => createCoin(id, index)),
      }));
      positionCollectibles();
    },
    undefined,
    (error) => console.error("The collectible coins could not load.", error),
  );
}

function revealReward(groupId) {
  if (groupId === "story") {
    resetPanelPosition(storyCard);
    storyCard.style.setProperty("--reveal-origin-x", "100%");
    storyCard.style.setProperty("--reveal-origin-y", "18%");
    animatePanelOpen(storyCard);
    collectibleStatus.textContent = "All three coins collected. Sushil's airmail service record is now open.";
    return;
  }

  resetPanelPosition(contactReward);
  contactReward.style.setProperty("--reveal-origin-x", "0%");
  contactReward.style.setProperty("--reveal-origin-y", "50%");
  animatePanelOpen(contactReward);
  collectibleStatus.textContent = "All three coins collected. The Contact Sushil button is now available.";
}

function captureTokenPosition(token) {
  const nextPosition = {
    x: token.offsetLeft,
    y: token.offsetTop,
    width: token.offsetWidth,
    height: token.offsetHeight,
    moved: false,
  };
  tokenPositions.set(token, nextPosition);
  return nextPosition;
}

function clearTokenInlinePosition(token) {
  token.style.left = "";
  token.style.top = "";
  token.style.right = "";
  token.style.bottom = "";
}

function applyTokenPosition(token) {
  const position = tokenPositions.get(token);
  if (!position) return;
  if (!position.moved) {
    clearTokenInlinePosition(token);
    if (!token.hidden) {
      position.x = token.offsetLeft;
      position.y = token.offsetTop;
      position.width = token.offsetWidth;
      position.height = token.offsetHeight;
    }
    return;
  }
  token.style.left = `${position.x}px`;
  token.style.top = `${position.y}px`;
  token.style.right = "auto";
  token.style.bottom = "auto";
}

function clampTokenPosition(token) {
  const position = tokenPositions.get(token);
  if (!position) return;
  if (!position.moved) {
    applyTokenPosition(token);
    return;
  }
  const margin = 8;
  const tokenWidth = position.width || token.offsetWidth;
  const tokenHeight = position.height || token.offsetHeight;
  position.x = clamp(position.x, margin, Math.max(margin, width - tokenWidth - margin));
  position.y = clamp(position.y, margin, Math.max(margin, height - tokenHeight - margin));
  applyTokenPosition(token);
}

function resetPanelPosition(panel) {
  panel.style.left = "";
  panel.style.top = "";
  panel.style.right = "";
  panel.style.bottom = "";
  panel.dataset.opens = "default";
}

function animatePanelOpen(panel) {
  panel.classList.remove("is-visible");
  void panel.offsetWidth;
  window.requestAnimationFrame(() => panel.classList.add("is-visible"));
}

function positionRewardFromToken(token, panel) {
  const position = tokenPositions.get(token);
  if (!position) return;

  const margin = 12;
  const gap = 2;
  const tokenWidth = position.width || token.offsetWidth;
  const tokenHeight = position.height || token.offsetHeight;
  const panelWidth = panel.offsetWidth;
  const panelHeight = panel.offsetHeight;
  const tokenCenterX = position.x + tokenWidth / 2;
  const tokenCenterY = position.y + tokenHeight / 2;
  let panelLeft;
  let panelTop;

  if (!position.moved) {
    resetPanelPosition(panel);
    panelLeft = panel.offsetLeft;
    panelTop = panel.offsetTop;
    panel.style.setProperty("--reveal-origin-x", `${tokenCenterX - panelLeft}px`);
    panel.style.setProperty("--reveal-origin-y", `${tokenCenterY - panelTop}px`);
    return;
  }

  const opensRight = tokenCenterX < width / 2;
  const opensDown = tokenCenterY < height / 2;
  const preferredLeft = opensRight
    ? position.x + tokenWidth + gap
    : position.x - panelWidth - gap;
  const preferredTop = opensDown
    ? position.y
    : position.y + tokenHeight - panelHeight;

  panelLeft = clamp(preferredLeft, margin, Math.max(margin, width - panelWidth - margin));
  panelTop = clamp(preferredTop, margin, Math.max(margin, height - panelHeight - margin));
  panel.style.left = `${panelLeft}px`;
  panel.style.top = `${panelTop}px`;
  panel.style.right = "auto";
  panel.style.bottom = "auto";
  panel.style.setProperty("--reveal-origin-x", `${tokenCenterX - panelLeft}px`);
  panel.style.setProperty("--reveal-origin-y", `${tokenCenterY - panelTop}px`);
  panel.dataset.opens = `${opensDown ? "down" : "up"}-${opensRight ? "right" : "left"}`;
}

function registerDraggableToken(token, openReward) {
  let dragState = null;
  let suppressClick = false;

  const finishDrag = (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    if (dragState.dragged) suppressClick = true;
    token.classList.remove("is-dragging");
    if (token.hasPointerCapture(event.pointerId)) token.releasePointerCapture(event.pointerId);
    dragState = null;
  };

  token.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!tokenPositions.has(token)) captureTokenPosition(token);
    const position = tokenPositions.get(token);
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      dragged: false,
    };
    token.setPointerCapture(event.pointerId);
  });

  token.addEventListener("pointermove", (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (!dragState.dragged && Math.hypot(deltaX, deltaY) < 5) return;
    dragState.dragged = true;
    token.classList.add("is-dragging");
    const position = tokenPositions.get(token);
    position.moved = true;
    position.x = dragState.originX + deltaX;
    position.y = dragState.originY + deltaY;
    clampTokenPosition(token);
  });

  token.addEventListener("pointerup", finishDrag);
  token.addEventListener("pointercancel", finishDrag);
  token.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    if (!tokenPositions.has(token)) captureTokenPosition(token);
    const position = tokenPositions.get(token);
    position.moved = true;
    const step = event.shiftKey ? 72 : 24;
    if (event.key === "ArrowLeft") position.x -= step;
    if (event.key === "ArrowRight") position.x += step;
    if (event.key === "ArrowUp") position.y -= step;
    if (event.key === "ArrowDown") position.y += step;
    clampTokenPosition(token);
  });
  token.addEventListener("click", (event) => {
    event.stopPropagation();
    if (suppressClick) {
      suppressClick = false;
      event.preventDefault();
      return;
    }
    openReward();
  });
}

function showRewardToken(token) {
  token.hidden = false;
  window.requestAnimationFrame(() => {
    if (!tokenPositions.has(token)) captureTokenPosition(token);
    applyTokenPosition(token);
    token.classList.add("is-visible");
  });
}

function hideRewardToken(token) {
  token.classList.remove("is-visible");
  token.hidden = true;
}

function collapseStoryReward() {
  storyCard.classList.remove("is-visible");
  showRewardToken(storyToken);
  collectibleStatus.textContent = "Sushil's story was collapsed into the airmail icon.";
}

function expandStoryReward() {
  positionRewardFromToken(storyToken, storyCard);
  hideRewardToken(storyToken);
  animatePanelOpen(storyCard);
  collectibleStatus.textContent = "Sushil's airmail service record is open.";
}

function collapseContactReward() {
  contactReward.classList.remove("is-visible");
  showRewardToken(contactToken);
  collectibleStatus.textContent = "The contact button was collapsed into the telephone icon.";
}

function expandContactReward() {
  positionRewardFromToken(contactToken, contactReward);
  hideRewardToken(contactToken);
  animatePanelOpen(contactReward);
  collectibleStatus.textContent = "The Contact Sushil button is open.";
}

function playCoinSound() {
  const sound = coinSounds[coinSoundIndex % coinSounds.length];
  coinSoundIndex += 1;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function collectCoin(group, coin, now) {
  if (coin.userData.collected) return;
  coin.userData.collected = true;
  coin.userData.collectedAt = now;
  playCoinSound();
  const collectedCount = group.coins.filter((groupCoin) => groupCoin.userData.collected).length;
  collectibleStatus.textContent = `${collectedCount} of 3 ${group.id === "story" ? "story" : "contact"} coins collected.`;

  if (collectedCount === group.coins.length && !group.rewarded) {
    group.rewarded = true;
    revealReward(group.id);
  }
}

function updateCollectibles(now) {
  if (!collectibleGroups.length) return;
  const size = getCoinSize();

  for (const group of collectibleGroups) {
    for (const coin of group.coins) {
      if (coin.userData.collected) {
        const progress = clamp((now - coin.userData.collectedAt) / 360, 0, 1);
        const burstScale = 1 + Math.sin(progress * Math.PI) * 0.72;
        coin.scale.setScalar(size * burstScale);
        coin.material.opacity = 1 - progress;
        coin.position.z = 12 + progress * 18;
        if (progress >= 1) coin.visible = false;
        continue;
      }

      const frameIndex = Math.floor(now / 88 + coin.userData.phase) % coinFrameCount;
      setCoinFrame(coin, frameIndex);
      const bob = Math.sin(now * 0.0032 + coin.userData.phase) * 4;
      const pulse = 1 + Math.sin(now * 0.004 + coin.userData.phase) * 0.035;
      coin.scale.set(size * pulse, size * pulse, 1);
      coin.position.set(
        coin.userData.baseScreenX - width / 2,
        height / 2 - (coin.userData.baseScreenY + bob),
        12,
      );

      if (!introComplete || !isFlying) continue;
      const distance = Math.hypot(
        planePosition.x - coin.userData.baseScreenX,
        planePosition.y - (coin.userData.baseScreenY + bob),
      );
      if (distance <= size * 0.82) collectCoin(group, coin, now);
    }
  }
}

function initializeThree() {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 2000);
  camera.position.z = 1000;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  stage.prepend(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xeaf8ff, 0x55702f, 2.3));
  const sunlight = new THREE.DirectionalLight(0xffefcb, 3.8);
  sunlight.position.set(-250, 360, 600);
  scene.add(sunlight);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  plane = createPlane();
  createCollectibles();
  buildSkywritingLayout();
}

function setPlaneScreenPosition(x, y, angle) {
  if (!plane) return;
  plane.position.set(x - width / 2, height / 2 - y, 0);
  plane.rotation.z = -angle;
  const scale = clamp(Math.min(width, height) / 760, 0.62, 1.15) * 0.56;
  plane.scale.setScalar(scale);
}

function updateIntro(now) {
  if (introComplete || !introPath.length || now < introStart) return;
  const duration = reduceMotion ? 1 : 2700;
  const progress = clamp((now - introStart) / duration, 0, 1);
  const easedProgress = progress < 0.5
    ? 2 * progress * progress
    : 1 - ((-2 * progress + 2) ** 2) / 2;
  const nextIndex = Math.min(Math.floor(easedProgress * (introPath.length - 1)), introPath.length - 1);

  for (const scheduledPuff of introPuffSchedule) {
    if (!scheduledPuff.emitted && scheduledPuff.pathIndex <= nextIndex) {
      namePuffs.push(makePuff(scheduledPuff.x, scheduledPuff.y, "name"));
      scheduledPuff.emitted = true;
    }
  }

  introIndex = nextIndex;
  const currentPoint = introPath[nextIndex];
  const lookAhead = introPath[Math.min(nextIndex + 2, introPath.length - 1)];
  const nextHeading = Math.atan2(lookAhead.y - currentPoint.y, lookAhead.x - currentPoint.x);
  heading = nextHeading;
  planePosition.set(currentPoint.x, currentPoint.y);
  targetPosition.copy(planePosition);

  if (progress >= 1) completeIntro();
}

function completeIntro() {
  if (introComplete) return;
  introComplete = true;
  for (const scheduledPuff of introPuffSchedule) {
    if (!scheduledPuff.emitted) {
      namePuffs.push(makePuff(scheduledPuff.x, scheduledPuff.y, "name"));
      scheduledPuff.emitted = true;
    }
  }
  instructions.classList.add("is-visible");
  instructions.querySelector(".eyebrow").textContent = "Your turn";
  setAutopilotFromHeading();
}

function getAutopilotSpeed() {
  return clamp(Math.min(width, height) * 0.16, 92, 142);
}

function setAutopilotFromHeading() {
  const speed = getAutopilotSpeed();
  autopilotVelocity.set(Math.cos(heading) * speed, Math.sin(heading) * speed);
}

function updateAutopilot(delta) {
  const margin = clamp(Math.min(width, height) * 0.065, 34, 58);
  const minX = margin;
  const maxX = width - margin;
  const minY = margin;
  const maxY = height * 0.78;

  planePosition.x += autopilotVelocity.x * delta;
  planePosition.y += autopilotVelocity.y * delta;

  if (planePosition.x <= minX || planePosition.x >= maxX) {
    planePosition.x = clamp(planePosition.x, minX, maxX);
    autopilotVelocity.x *= -1;
  }
  if (planePosition.y <= minY || planePosition.y >= maxY) {
    planePosition.y = clamp(planePosition.y, minY, maxY);
    autopilotVelocity.y *= -1;
  }

  heading = Math.atan2(autopilotVelocity.y, autopilotVelocity.x);
  targetPosition.copy(planePosition);
  planeVisual.rotation.y = mix(planeVisual.rotation.y, -0.04, clamp(delta * 4, 0, 1));
}

function updateFlight(delta) {
  if (!isFlying) {
    if (introComplete) updateAutopilot(delta);
    return;
  }
  const smoothing = 1 - Math.pow(0.0008, delta);
  const oldX = planePosition.x;
  const oldY = planePosition.y;
  planePosition.lerp(targetPosition, smoothing);
  const movementX = planePosition.x - oldX;
  const movementY = planePosition.y - oldY;

  if (Math.hypot(movementX, movementY) > 0.04) {
    const targetHeading = Math.atan2(movementY, movementX);
    let headingDelta = targetHeading - heading;
    while (headingDelta > Math.PI) headingDelta -= Math.PI * 2;
    while (headingDelta < -Math.PI) headingDelta += Math.PI * 2;
    heading += headingDelta * clamp(delta * 7.5, 0, 1);
    planeVisual.rotation.y = mix(planeVisual.rotation.y, clamp(-headingDelta * 1.2, -0.48, 0.48), clamp(delta * 5, 0, 1));
    emitUserSmoke();
  }
}

function emitUserSmoke() {
  const tailDistance = clamp(Math.min(width, height) * 0.055, 28, 47);
  const tailX = planePosition.x - Math.cos(heading) * tailDistance;
  const tailY = planePosition.y - Math.sin(heading) * tailDistance;
  const spacing = clamp(Math.min(width, height) * 0.008, 5, 8);

  if (!lastUserPuff) {
    userPuffs.push(makePuff(tailX, tailY, "user"));
    lastUserPuff = point(tailX, tailY);
    return;
  }

  const distance = Math.hypot(tailX - lastUserPuff.x, tailY - lastUserPuff.y);
  if (distance < spacing) return;
  const steps = Math.max(1, Math.floor(distance / spacing));
  for (let index = 1; index <= steps; index += 1) {
    const amount = index / steps;
    userPuffs.push(makePuff(mix(lastUserPuff.x, tailX, amount), mix(lastUserPuff.y, tailY, amount), "user"));
  }
  lastUserPuff = point(tailX, tailY);
  if (userPuffs.length > 1900) userPuffs.splice(0, userPuffs.length - 1900);
}

function drawPuffs(now) {
  smokeContext.clearRect(0, 0, width, height);
  const draw = (puff, opacity) => {
    smokeContext.globalAlpha = puff.opacity * opacity;
    smokeContext.drawImage(puffSprite, puff.x - puff.size / 2, puff.y - puff.size / 2, puff.size, puff.size);
  };

  for (const puff of namePuffs) draw(puff, 1);

  userPuffs = userPuffs.filter((puff) => now - puff.born < 42000);
  for (const puff of userPuffs) {
    const age = now - puff.born;
    const fade = age < 30000 ? 1 : 1 - (age - 30000) / 12000;
    draw(puff, clamp(fade, 0, 1));
  }
  smokeContext.globalAlpha = 1;
}

function render(now) {
  const delta = Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;
  updateIntro(now);
  updateFlight(delta);
  updateCollectibles(now);

  planeVisual.position.y = 0;

  propeller.rotation.x += delta * 22;
  setPlaneScreenPosition(planePosition.x, planePosition.y, heading);
  drawPuffs(now);
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function updatePointer(event) {
  const rect = stage.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  pointer.set((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1);
  return { x, y };
}

function pointerHitsPlane(event) {
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObject(plane, true).length > 0;
}

function setFlightMode(nextState) {
  if (!introComplete || nextState === isFlying) return;
  isFlying = nextState;
  document.body.classList.toggle("is-flying", isFlying);
  instructions.classList.toggle("is-flying", isFlying);
  clearButton.classList.toggle("is-visible", isFlying || userPuffs.length > 0);
  lastUserPuff = null;

  if (isFlying) {
    targetPosition.copy(planePosition);
    instructions.querySelector(".eyebrow").textContent = "You're flying";
    instructions.querySelector("p").innerHTML = "Guide the plane with <strong>your cursor</strong>";
    stage.setAttribute("aria-label", "You are flying the skywriting plane. Move the pointer or use the arrow keys. Press Escape to release it.");
  } else {
    setAutopilotFromHeading();
    instructions.querySelector(".eyebrow").textContent = "Your turn";
    instructions.querySelector("p").innerHTML = "<strong>Click the plane</strong> and draw in the sky";
    stage.setAttribute("aria-label", "Take control of the skywriting plane. Press Enter or Space to start flying, then use the pointer or arrow keys.");
  }
}

stage.addEventListener("pointerdown", (event) => {
  if (!introComplete) return;
  const hitsPlane = pointerHitsPlane(event);
  if (hitsPlane) {
    event.preventDefault();
    setFlightMode(!isFlying);
    if (event.pointerType !== "mouse") stage.setPointerCapture(event.pointerId);
  }
});

stage.addEventListener("pointermove", (event) => {
  if (!introComplete) return;
  const currentPointer = updatePointer(event);
  if (isFlying) {
    targetPosition.set(
      clamp(currentPointer.x, 34, width - 34),
      clamp(currentPointer.y, 40, height * 0.78),
    );
  } else if (event.pointerType === "mouse") {
    stage.style.cursor = pointerHitsPlane(event) ? "pointer" : "default";
  }
});

stage.addEventListener("pointerleave", () => {
  if (!isFlying) stage.style.cursor = "default";
});

stage.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && introComplete) {
    event.preventDefault();
    setFlightMode(!isFlying);
    return;
  }

  if (!isFlying) return;
  const keyboardStep = event.shiftKey ? 70 : 34;
  if (event.key === "ArrowLeft") targetPosition.x -= keyboardStep;
  else if (event.key === "ArrowRight") targetPosition.x += keyboardStep;
  else if (event.key === "ArrowUp") targetPosition.y -= keyboardStep;
  else if (event.key === "ArrowDown") targetPosition.y += keyboardStep;
  else return;
  event.preventDefault();
  targetPosition.set(clamp(targetPosition.x, 34, width - 34), clamp(targetPosition.y, 40, height * 0.78));
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isFlying) setFlightMode(false);
});

clearButton.addEventListener("pointerdown", (event) => event.stopPropagation());
clearButton.addEventListener("click", () => {
  userPuffs = [];
  lastUserPuff = null;
  if (!isFlying) clearButton.classList.remove("is-visible");
});

storyCollapse.addEventListener("pointerdown", (event) => event.stopPropagation());
contactCollapse.addEventListener("pointerdown", (event) => event.stopPropagation());
storyCollapse.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  collapseStoryReward();
});
contactCollapse.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  collapseContactReward();
});
registerDraggableToken(storyToken, expandStoryReward);
registerDraggableToken(contactToken, expandContactReward);

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  smokeCanvas.width = Math.round(width * pixelRatio);
  smokeCanvas.height = Math.round(height * pixelRatio);
  smokeContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height);
  camera.left = -width / 2;
  camera.right = width / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.updateProjectionMatrix();
  buildSkywritingLayout();
  positionCollectibles();
  clampTokenPosition(storyToken);
  clampTokenPosition(contactToken);
  if (storyCard.classList.contains("is-visible") && tokenPositions.has(storyToken)) {
    positionRewardFromToken(storyToken, storyCard);
  }
  if (contactReward.classList.contains("is-visible") && tokenPositions.has(contactToken)) {
    positionRewardFromToken(contactToken, contactReward);
  }
}

window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(resize, 120);
});

async function startExperience() {
  try {
    if (document.fonts) {
      await Promise.race([
        document.fonts.load('100px "Sacramento"'),
        new Promise((resolve) => window.setTimeout(resolve, 3000)),
      ]);
    }
    initializeThree();
    smokeCanvas.width = Math.round(width * pixelRatio);
    smokeCanvas.height = Math.round(height * pixelRatio);
    smokeContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    document.body.dataset.experienceReady = "true";
    if (reduceMotion) {
      instructions.classList.add("is-visible");
      instructions.querySelector(".eyebrow").textContent = "Your turn";
    }
    requestAnimationFrame(render);
  } catch (error) {
    console.error("The skywriting experience could not start.", error);
    fallback.hidden = false;
  }
}

startExperience();
