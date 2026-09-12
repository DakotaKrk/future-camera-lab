
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071016);
scene.fog = new THREE.FogExp2(0x071016, 0.014);

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.05, 300);
camera.position.set(8.2, 4.15, 11.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.target.set(0, 0.1, 0);
controls.minDistance = 4.8;
controls.maxDistance = 28;
controls.enablePan = true;
controls.panSpeed = 0.72;
controls.screenSpacePanning = true;
controls.zoomSpeed = 0.42;
controls.rotateSpeed = 0.74;
controls.minPolarAngle = Math.PI * 0.16;
controls.maxPolarAngle = Math.PI * 0.84;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.18;
controls.saveState();

scene.add(new THREE.HemisphereLight(0xffffff, 0x1d2529, 1.62));
const key = new THREE.DirectionalLight(0xffffff, 2.45);
key.position.set(-3.5, 5.6, 5.2);
key.castShadow = true;
scene.add(key);

const frontFill = new THREE.PointLight(0xf3fbff, 22, 18, 2.2);
frontFill.position.set(3.6, 1.4, 5.8);
scene.add(frontFill);

const rearReadLight = new THREE.PointLight(0xffffff, 28, 16, 2.1);
rearReadLight.position.set(-2.4, 1.8, -5.6);
scene.add(rearReadLight);

const rim = new THREE.PointLight(0xdcefff, 44, 28, 2);
rim.position.set(-7, 2.6, -5.2);
scene.add(rim);

const warm = new THREE.PointLight(0xfff7ec, 12, 20, 2);
warm.position.set(5, 1, -4);
scene.add(warm);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({ color: 0x081116, roughness: .26, metalness: .58 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2.15;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(60, 60, 0x365664, 0x111c22);
grid.position.y = -2.14;
grid.material.transparent = true;
grid.material.opacity = .035;
scene.add(grid);

const floorGlow = new THREE.Mesh(
  new THREE.CircleGeometry(5.8, 96),
  new THREE.MeshBasicMaterial({
    color: 0xd8f6ff,
    transparent: true,
    opacity: 0.042,
    depthWrite: false
  })
);
floorGlow.rotation.x = -Math.PI / 2;
floorGlow.position.y = -2.12;
scene.add(floorGlow);

const billiardRoom = new THREE.Group();
scene.add(billiardRoom);
billiardRoom.visible = false;

const feltMat = new THREE.MeshStandardMaterial({ color: 0x0d3b31, roughness: 0.82, metalness: 0.02 });
const railMat = new THREE.MeshStandardMaterial({ color: 0x25130b, roughness: 0.42, metalness: 0.08 });
const leatherMat = new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 0.68, metalness: 0.02 });
const brassMat = new THREE.MeshStandardMaterial({ color: 0xc49b55, roughness: 0.26, metalness: 0.72 });

const tableTop = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.18, 5.05), feltMat);
tableTop.position.y = -1.86;
tableTop.receiveShadow = true;
billiardRoom.add(tableTop);

[
  [0, -1.68, -2.72, 9.2, 0.36, 0.42],
  [0, -1.68, 2.72, 9.2, 0.36, 0.42],
  [-4.82, -1.68, 0, 0.42, 0.36, 5.3],
  [4.82, -1.68, 0, 0.42, 0.36, 5.3]
].forEach(([x, y, z, sx, sy, sz]) => {
  const rail = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), railMat);
  rail.position.set(x, y, z);
  rail.castShadow = true;
  rail.receiveShadow = true;
  billiardRoom.add(rail);
});

[
  [-4.32, -1.58, -2.28], [0, -1.58, -2.35], [4.32, -1.58, -2.28],
  [-4.32, -1.58, 2.28], [0, -1.58, 2.35], [4.32, -1.58, 2.28]
].forEach(([x, y, z]) => {
  const pocket = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.05, 32), leatherMat);
  pocket.rotation.x = Math.PI / 2;
  pocket.position.set(x, y, z);
  billiardRoom.add(pocket);
});

[-3.9, 3.9].forEach(x => {
  [-2.15, 2.15].forEach(z => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.25, 0.42), railMat);
    leg.position.set(x, -2.58, z);
    leg.castShadow = true;
    billiardRoom.add(leg);
  });
});

const cue = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 4.6, 18), new THREE.MeshStandardMaterial({ color: 0x8b623c, roughness: 0.48, metalness: 0.02 }));
cue.rotation.z = Math.PI / 2;
cue.rotation.y = -0.42;
cue.position.set(2.2, -1.56, 1.75);
billiardRoom.add(cue);

[
  [2.9, -1.52, -1.25, 0xffffff],
  [3.28, -1.52, -1.02, 0x812323],
  [3.28, -1.52, -1.48, 0x184d8b],
  [3.66, -1.52, -1.25, 0xe1c54b]
].forEach(([x, y, z, color]) => {
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.18, metalness: 0.02 }));
  ball.position.set(x, y, z);
  ball.castShadow = true;
  billiardRoom.add(ball);
});

const wallMat = new THREE.MeshStandardMaterial({ color: 0x100b08, roughness: 0.74, metalness: 0.02 });
const backWall = new THREE.Mesh(new THREE.BoxGeometry(18, 5.4, 0.22), wallMat);
backWall.position.set(0, 0.12, -7.6);
backWall.receiveShadow = true;
billiardRoom.add(backWall);

[-5.2, 0, 5.2].forEach(x => {
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.0, 0.08), new THREE.MeshStandardMaterial({ color: 0x17100b, roughness: 0.6, metalness: 0.04 }));
  panel.position.set(x, 0.65, -7.45);
  billiardRoom.add(panel);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(2.95, 2.15, 0.03), brassMat);
  trim.position.set(x, 0.65, -7.49);
  trim.scale.z = 0.3;
  billiardRoom.add(trim);
});

[-1.65, 1.65].forEach(x => {
  const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.48, 0.36, 48), new THREE.MeshStandardMaterial({ color: 0x183529, roughness: 0.36, metalness: 0.22 }));
  lampShade.position.set(x, 2.35, -0.25);
  lampShade.castShadow = true;
  billiardRoom.add(lampShade);

  const lampGlow = new THREE.PointLight(0xffe1a7, 38, 7, 2);
  lampGlow.position.set(x, 1.9, -0.25);
  billiardRoom.add(lampGlow);
});

function fitEnvironment(obj) {
  obj.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  obj.position.sub(center);
  obj.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const max = Math.max(size.x, size.z) || 1;
  obj.scale.multiplyScalar(8.8 / max);
  obj.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(obj);
  obj.position.y += (-2.55 - box.min.y);
  obj.position.z -= 5.2;
}

const roomLoader = new GLTFLoader();
// Kept for later experiments. The active scene is intentionally simple for now.

const particles = new THREE.Points(
  new THREE.BufferGeometry(),
  new THREE.PointsMaterial({ color: 0x9ad9ee, size: 0.012, transparent: true, opacity: 0.24, depthWrite: false })
);
const particlePositions = [];
for (let i = 0; i < 420; i++) {
  particlePositions.push(
    (Math.random() - 0.5) * 34,
    Math.random() * 12 - 2,
    (Math.random() - 0.5) * 34
  );
}
particles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
scene.add(particles);

let modelRoot = null;
let placeholderRoot = null;
let iris = null;
let screenPlane = null;
let liveView = null;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const interactives = [];
let hovered = null;
let selectedPartLabel = null;
const exposureControl = document.getElementById('exposureControl');
document.body.appendChild(exposureControl);
exposureControl.addEventListener('wheel', event => event.stopPropagation(), { passive: true });

function fitModel(obj) {
  obj.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  obj.position.sub(center);
  obj.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const max = Math.max(size.x, size.y, size.z) || 1;
  obj.scale.multiplyScalar(5.8 / max);
  obj.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(obj);
  obj.position.y += (-1.7 - box.min.y);
}

function updateStats(obj) {
  let meshes = 0, tris = 0;
  obj.traverse(o => {
    if (o.isMesh) {
      meshes++;
      o.castShadow = true;
      o.receiveShadow = true;
      const g = o.geometry;
      if (g) tris += g.index ? g.index.count / 3 : (g.attributes.position ? g.attributes.position.count / 3 : 0);
    }
  });
  document.getElementById('meshCount').textContent = meshes;
  document.getElementById('triCount').textContent = Math.round(tris).toLocaleString('sv-SE');
}

const loader = new GLTFLoader();

const lessons = {
  Aperture: 'Bländaren styr hur mycket ljus som kommer in och hur stort skärpedjupet blir.',
  Shutter: 'Slutarknappen startar exponeringen och fryser ögonblicket.',
  Mode: 'Programratten växlar mellan kamerans kreativa och manuella lägen.',
  Viewfinder: 'Sökaren hjälper dig isolera kompositionen från allt runt omkring.',
  Lens: 'Objektivet samlar ljus och formar perspektiv, skärpa och bakgrundsoskärpa.',
  Screen: 'Skärmen visar bilden och gör effekten av inställningar lätt att förstå.'
};

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const apertureValues = [1.4, 1.8, 2.0, 2.8, 4, 5.6, 8, 11, 16];
const shutterValues = [
  { label: '1/4', seconds: 1 / 4 },
  { label: '1/8', seconds: 1 / 8 },
  { label: '1/15', seconds: 1 / 15 },
  { label: '1/30', seconds: 1 / 30 },
  { label: '1/60', seconds: 1 / 60 },
  { label: '1/250', seconds: 1 / 250 },
  { label: '1/500', seconds: 1 / 500 },
  { label: '1/1000', seconds: 1 / 1000 },
  { label: '1/2000', seconds: 1 / 2000 },
  { label: '1/4000', seconds: 1 / 4000 },
  { label: '1/6000', seconds: 1 / 6000 },
  { label: '1/8000', seconds: 1 / 8000 }
];
const isoValues = [100, 200, 400, 800, 1600, 3200, 6400];
const apertureBlur = new Map([
  [1.4, 18],
  [1.8, 15],
  [2.0, 13],
  [2.8, 10],
  [4, 7],
  [5.6, 4],
  [8, 2],
  [11, 1],
  [16, 0]
]);

function formatAperture(value) {
  return `f/${Number.isInteger(value) ? value : value.toFixed(1)}`;
}

function loadLiveViewImage(src) {
  const image = new Image();
  image.onload = () => drawLiveViewTexture();
  image.src = src;
  return image;
}

function drawImageCover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function createLiveViewTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  liveView = {
    canvas,
    ctx,
    texture,
    apertureIndex: 3,
    shutterIndex: 5,
    isoIndex: 0,
    backgroundImage: loadLiveViewImage('./assets/images/background.png'),
    subjectImage: loadLiveViewImage('./assets/images/subject.png')
  };
  drawLiveViewTexture();
  return texture;
}

function drawPortraitBackground(ctx, blurPx) {
  ctx.save();
  ctx.filter = blurPx ? `blur(${blurPx}px)` : 'none';
  const overscan = blurPx * 2;

  if (liveView?.backgroundImage?.complete && liveView.backgroundImage.naturalWidth) {
    drawImageCover(ctx, liveView.backgroundImage, -overscan, -overscan, 1024 + overscan * 2, 640 + overscan * 2);
    ctx.restore();
    return;
  }

  const sky = ctx.createLinearGradient(0, 0, 0, 640);
  sky.addColorStop(0, '#7f8d94');
  sky.addColorStop(0.46, '#b9aea2');
  sky.addColorStop(1, '#27312c');
  ctx.fillStyle = sky;
  ctx.fillRect(-overscan, -overscan, 1024 + overscan * 2, 640 + overscan * 2);

  ctx.fillStyle = '#53493f';
  ctx.fillRect(-overscan, 250, 1024 + overscan * 2, 390 + overscan);

  for (let i = 0; i < 12; i++) {
    const x = 36 + i * 88;
    const h = 160 + (i % 3) * 56;
    ctx.fillStyle = i % 2 ? '#5f625f' : '#464f50';
    ctx.fillRect(x, 92 + (i % 4) * 18, 56, h);
  }

  for (let i = 0; i < 34; i++) {
    const x = 24 + i * 31;
    const y = 120 + (i * 47) % 380;
    const radius = 5 + (i % 5) * 3;
    ctx.beginPath();
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255,218,145,.72)' : 'rgba(218,239,255,.42)';
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(18,28,22,.38)';
  for (let i = 0; i < 22; i++) {
    const x = 24 + i * 48;
    ctx.beginPath();
    ctx.ellipse(x, 470 + Math.sin(i) * 30, 54, 92, 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSharpSubject(ctx, motionBlurPx) {
  if (motionBlurPx > 0) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.filter = `blur(${Math.min(motionBlurPx, 9)}px)`;
    ctx.translate(motionBlurPx * 1.7, 0);
    drawSubjectShape(ctx);
    ctx.restore();
  }
  drawSubjectShape(ctx);
}

function drawSubjectShape(ctx) {
  if (liveView?.subjectImage?.complete && liveView.subjectImage.naturalWidth) {
    ctx.save();
    roundedRect(ctx, 304, 56, 418, 584, 16);
    ctx.clip();
    drawImageCover(ctx, liveView.subjectImage, 276, 28, 474, 670);

    const fade = ctx.createRadialGradient(512, 290, 120, 512, 310, 380);
    fade.addColorStop(0, 'rgba(255,255,255,0)');
    fade.addColorStop(0.72, 'rgba(255,255,255,0)');
    fade.addColorStop(1, 'rgba(0,0,0,.26)');
    ctx.fillStyle = fade;
    ctx.fillRect(276, 28, 474, 670);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(520, 352);

  ctx.fillStyle = 'rgba(24,28,30,.72)';
  ctx.beginPath();
  ctx.ellipse(0, 168, 176, 128, 0, 0, Math.PI * 2);
  ctx.fill();

  const jacket = ctx.createLinearGradient(-120, 80, 120, 260);
  jacket.addColorStop(0, '#2d3438');
  jacket.addColorStop(1, '#11181b');
  ctx.fillStyle = jacket;
  ctx.beginPath();
  ctx.moveTo(-116, 244);
  ctx.quadraticCurveTo(-88, 66, -22, 54);
  ctx.lineTo(22, 54);
  ctx.quadraticCurveTo(90, 70, 122, 244);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#c69a7d';
  ctx.beginPath();
  ctx.ellipse(0, -22, 70, 86, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2f201b';
  ctx.beginPath();
  ctx.ellipse(-8, -88, 78, 48, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-72, -72, 144, 56);

  ctx.fillStyle = 'rgba(255,226,205,.55)';
  ctx.beginPath();
  ctx.ellipse(24, -38, 18, 34, -0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.beginPath();
  ctx.ellipse(-26, -30, 8, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(24, -30, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawExposureResponse(ctx, exposureValue, iso, motionBlurPx) {
  ctx.save();
  const underExposure = Math.max(0, 1 - exposureValue);
  const overExposure = Math.max(0, exposureValue - 1);
  const darkness = Math.min(0.78, underExposure * 0.58);
  const brightness = Math.min(0.52, overExposure * 0.26);
  const highlightClip = Math.max(0, exposureValue - 2.15);

  if (darkness > 0) {
    ctx.fillStyle = `rgba(0,0,0,${darkness.toFixed(3)})`;
    ctx.fillRect(0, 0, 1024, 640);
  }
  if (brightness > 0) {
    ctx.fillStyle = `rgba(255,246,229,${brightness.toFixed(3)})`;
    ctx.fillRect(0, 0, 1024, 640);
  }
  if (highlightClip > 0) {
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.28, highlightClip * 0.18).toFixed(3)})`;
    ctx.fillRect(0, 0, 1024, 640);
    ctx.globalCompositeOperation = 'source-over';
  }

  const isoStops = Math.max(0, Math.log2(iso / 100));
  if (isoStops > 0) {
    const grainAlpha = Math.min(0.42, 0.035 + isoStops * 0.06);
    const speckCount = Math.round(650 + isoStops * 620);
    ctx.globalAlpha = grainAlpha;
    for (let i = 0; i < speckCount; i++) {
      const seed = (i * 9301 + liveView.isoIndex * 49297 + liveView.shutterIndex * 233) % 233280;
      const x = (seed * 17) % 1024;
      const y = (seed * 41) % 640;
      const warmNoise = i % 5 === 0;
      const coolNoise = i % 7 === 0;
      ctx.fillStyle = warmNoise ? '#ffd6a4' : coolNoise ? '#9edcff' : (i % 2 ? '#ffffff' : '#111619');
      const size = iso >= 3200 && i % 4 === 0 ? 2 : 1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = Math.min(0.24, isoStops * 0.045);
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < 640; y += 3) {
      if ((y + liveView.isoIndex) % 9 === 0) ctx.fillRect(0, y, 1024, 1);
    }
    ctx.globalAlpha = 1;
  }
  if (motionBlurPx > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.08, motionBlurPx * 0.008).toFixed(3)})`;
    ctx.fillRect(0, 0, 1024, 640);
  }
  ctx.restore();
}

function drawCameraOverlay(ctx, aperture, shutter = '1/250', iso = 'ISO 100', mode = 'M') {
  ctx.save();

  const vignette = ctx.createRadialGradient(512, 310, 60, 512, 320, 590);
  vignette.addColorStop(0, 'rgba(255,255,255,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,.42)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 1024, 640);

  ctx.fillStyle = 'rgba(0,0,0,.42)';
  ctx.fillRect(0, 0, 1024, 68);
  ctx.fillRect(0, 570, 1024, 70);

  ctx.strokeStyle = 'rgba(235,255,246,.88)';
  ctx.lineWidth = 4;
  roundedRect(ctx, 390, 238, 244, 154, 10);
  ctx.stroke();
  ctx.lineWidth = 3;
  roundedRect(ctx, 690, 292, 118, 78, 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(512, 300);
  ctx.lineTo(512, 330);
  ctx.moveTo(497, 315);
  ctx.lineTo(527, 315);
  ctx.stroke();

  ctx.fillStyle = 'rgba(246,255,250,.96)';
  ctx.font = '700 34px Inter, Arial, sans-serif';
  ctx.fillText(mode, 34, 45);
  ctx.font = '600 24px Inter, Arial, sans-serif';
  ctx.fillText(aperture, 215, 45);
  ctx.fillText(shutter, 350, 45);
  ctx.fillText(iso, 520, 45);
  ctx.font = '600 28px Inter, Arial, sans-serif';
  ctx.fillText(aperture, 308, 618);
  ctx.fillText(shutter, 454, 618);
  ctx.fillText(iso, 628, 618);

  ctx.font = '500 22px Inter, Arial, sans-serif';
  ctx.fillText('RAW', 792, 44);
  ctx.strokeStyle = 'rgba(246,255,250,.9)';
  ctx.lineWidth = 3;
  roundedRect(ctx, 914, 22, 58, 24, 4);
  ctx.stroke();
  ctx.fillStyle = 'rgba(246,255,250,.72)';
  ctx.fillRect(920, 28, 36, 12);
  ctx.fillRect(974, 29, 5, 10);

  ctx.strokeStyle = 'rgba(246,255,250,.32)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(56, 96);
  ctx.lineTo(56, 144);
  ctx.moveTo(968, 96);
  ctx.lineTo(968, 144);
  ctx.moveTo(56, 496);
  ctx.lineTo(56, 544);
  ctx.moveTo(968, 496);
  ctx.lineTo(968, 544);
  ctx.stroke();
  ctx.restore();
}

function drawLiveViewTexture() {
  if (!liveView) return;
  const aperture = apertureValues[liveView.apertureIndex];
  const shutter = shutterValues[liveView.shutterIndex];
  const iso = isoValues[liveView.isoIndex];
  const label = formatAperture(aperture);
  const blurPx = apertureBlur.get(aperture) ?? 0;
  const exposureStops =
    Math.log2((2.8 / aperture) ** 2) +
    Math.log2(shutter.seconds / (1 / 250)) +
    Math.log2(iso / 100);
  const exposureValue = Math.min(3.6, Math.max(0.14, 2 ** exposureStops));
  const motionBlurPx = Math.max(0, Math.log2(shutter.seconds / (1 / 125))) * 4.2;
  const { ctx, texture } = liveView;

  ctx.clearRect(0, 0, 1024, 640);
  drawPortraitBackground(ctx, blurPx);
  drawSharpSubject(ctx, motionBlurPx);
  drawExposureResponse(ctx, exposureValue, iso, motionBlurPx);
  drawCameraOverlay(ctx, label, shutter.label, `ISO ${iso}`);
  texture.needsUpdate = true;
}

function applyLiveViewTexture(root) {
  const texture = createLiveViewTexture();
  root.traverse(o => {
    if (!o.isMesh) return;
    const materialName = Array.isArray(o.material)
      ? o.material.map(m => m?.name || '').join(' ')
      : o.material?.name || '';
    const targetName = `${o.name || ''} ${materialName}`.toLowerCase();
    if (targetName.includes('fcd__glass_all_0')) {
      o.visible = false;
      return;
    }
    if (!targetName.includes('screen')) return;

    const screenMat = new THREE.MeshStandardMaterial({
      name: 'LiveView Canvas Screen',
      map: texture,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: texture,
      emissiveIntensity: 0.58,
      roughness: 0.36,
      metalness: 0,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      depthTest: true,
      toneMapped: false
    });
    o.material = screenMat;
    screenPlane = o;
  });
}

function makePlaceholderCamera() {
  const root = new THREE.Group();
  root.name = 'Missing camera.glb placeholder';

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x10171c, roughness: 0.46, metalness: 0.78 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x263943, roughness: 0.32, metalness: 0.62 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x071015, roughness: 0.08, metalness: 0.25, transmission: 0.2, transparent: true, opacity: 0.78 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.7, 1.45), bodyMat);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.95, 1.8), edgeMat);
  grip.position.set(-2.15, -0.05, 0.08);
  const prism = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.35), bodyMat);
  prism.position.set(0, 1.55, 0);

  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 2.1, 64), edgeMat);
  lens.rotation.x = Math.PI / 2;
  lens.position.z = -1.45;
  iris = new THREE.Mesh(new THREE.CircleGeometry(0.58, 64), new THREE.MeshBasicMaterial({ color: 0x030607 }));
  iris.position.set(0, 0, -2.53);

  screenPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.55, 0.9),
    new THREE.MeshBasicMaterial({ map: createLiveViewTexture(), toneMapped: false })
  );
  screenPlane.position.set(0.62, 0.08, 0.78);

  const viewfinder = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.42, 0.22), glassMat);
  viewfinder.position.set(0, 1.1, 0.78);
  const shutter = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 32), glassMat);
  shutter.position.set(-1.45, 1.55, -0.38);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.18, 48), edgeMat);
  dial.position.set(1.35, 1.5, -0.16);

  root.add(body, grip, prism, lens, iris, screenPlane, viewfinder, shutter, dial);
  root.position.y = -0.25;
  root.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return root;
}

function addHitbox(name, label, position, scale, focus) {
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hitbox.name = name;
  hitbox.position.set(...position);
  hitbox.scale.set(...scale);
  hitbox.userData = { label, focus, originalOpacity: 0 };
  scene.add(hitbox);
  interactives.push(hitbox);
}

function setupInteractionZones() {
  interactives.length = 0;
  addHitbox('Aperture Dial', 'Aperture', [1.35, 1.22, -0.42], [0.95, 0.55, 0.9], [[2.4, 1.1, -4.6], [0.45, 0.3, -1.2]]);
  addHitbox('Shutter Button', 'Shutter', [-1.45, 1.45, -0.35], [0.75, 0.4, 0.55], [[-2.6, 2.1, -4.3], [-1.2, 1.1, -0.4]]);
  addHitbox('Mode Dial', 'Mode', [1.35, 1.42, -0.1], [0.9, 0.48, 0.9], [[2.4, 2.0, -4.2], [1.0, 1.1, -0.1]]);
  addHitbox('Viewfinder', 'Viewfinder', [0, 0.95, 0.9], [1.15, 0.62, 0.55], [[0, 0.98, 2.05], [0, 0.98, -8]]);
  addHitbox('Lens Ring', 'Lens', [0, 0, -1.85], [2.25, 2.25, 1.05], [[0, 0.25, -4.0], [0, 0, -1.6]]);
  addHitbox('Rear Screen', 'Screen', [0.6, 0.08, 0.95], [1.9, 1.15, 0.42], [[0.7, 0.2, 3.5], [0.55, 0.05, 0.8]]);
}

function selectPart(label) {
  selectedPartLabel = label;
  document.getElementById('selectedPart').textContent = label;
  document.getElementById('selectedText').textContent = lessons[label] || 'Den här delen kan kopplas till en lektion senare.';
  document.body.classList.toggle('aperture-mode', label === 'Aperture');
  if (label === 'Aperture') setAperture(Number(document.getElementById('apertureSlider').value));
  if (label === 'Viewfinder') document.body.classList.add('viewfinder-mode');
  else document.body.classList.remove('viewfinder-mode');
}

loader.load(
  './assets/models/camera.glb',
  gltf => {
    modelRoot = gltf.scene;
    scene.add(modelRoot);
    fitModel(modelRoot);
    applyLiveViewTexture(modelRoot);
    updateStats(modelRoot);
    document.getElementById('modelName').textContent = 'camera.glb';
    document.getElementById('copy').textContent =
      'Modellen är laddad lokalt. Dra för att rotera och använd vyknapparna för att inspektera kameran.';
    setupInteractionZones();
  },
  undefined,
  err => {
    console.warn('Ingen camera.glb hittades ännu.', err);
    placeholderRoot = makePlaceholderCamera();
    scene.add(placeholderRoot);
    updateStats(placeholderRoot);
    setupInteractionZones();
    document.getElementById('copy').innerHTML =
      'Ingen <code>camera.glb</code> hittades ännu. Placeholdern är interaktiv tills modellen läggs i <code>assets/models/camera.glb</code>.';
  }
);

let targetPos = null;
let targetLook = null;
let viewTransitionActive = false;
let pointerDown = null;
const homePosition = new THREE.Vector3(8.2, 4.15, 11.2);
const homeTarget = new THREE.Vector3(0, 0.1, 0);
const targetBounds = {
  x: 3.2,
  yMin: -1.25,
  yMax: 1.85,
  z: 3.2
};

function go(pos, look) {
  targetPos = new THREE.Vector3(...pos);
  targetLook = new THREE.Vector3(...look);
  viewTransitionActive = true;
  controls.autoRotate = false;
}

function clampControlsTarget() {
  controls.target.x = THREE.MathUtils.clamp(controls.target.x, -targetBounds.x, targetBounds.x);
  controls.target.y = THREE.MathUtils.clamp(controls.target.y, targetBounds.yMin, targetBounds.yMax);
  controls.target.z = THREE.MathUtils.clamp(controls.target.z, -targetBounds.z, targetBounds.z);
}

function releaseViewTransition() {
  if (!viewTransitionActive && !targetPos && !targetLook) return;
  targetPos = null;
  targetLook = null;
  viewTransitionActive = false;
  controls.autoRotate = false;
}

function resetView() {
  targetPos = null;
  targetLook = null;
  viewTransitionActive = false;
  camera.position.copy(homePosition);
  controls.target.copy(homeTarget);
  controls.autoRotate = false;
  controls.update();
  controls.saveState();
}

function setActive(id) {
  document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

document.getElementById('orbit').onclick = () => {
  go([8.2, 4.15, 11.2], [0, 0.1, 0]);
  controls.autoRotate = false;
  setActive('orbit');
};
document.getElementById('front').onclick = () => {
  go([0, .55, 8.4], [0, 0.12, 0]);
  setActive('front');
};
document.getElementById('rear').onclick = () => {
  go([0, .72, -8.6], [0, 0.18, 0]);
  setActive('rear');
};
document.getElementById('viewfinder').onclick = () => {
  go([0, 1.05, 4.9], [0, .72, -1.8]);
  selectPart('Viewfinder');
  setActive('viewfinder');
};
document.getElementById('lens').onclick = () => {
  go([0, .35, -5.1], [0, 0, -1.25]);
  selectPart('Lens');
  setActive('lens');
};
document.getElementById('top').onclick = () => {
  go([.1, 9, .1], [0, 0, 0]);
  setActive('top');
};
document.getElementById('reset').onclick = () => {
  resetView();
  setActive('orbit');
};

function setAperture(index) {
  const clamped = Math.max(0, Math.min(apertureValues.length - 1, index));
  const aperture = apertureValues[clamped];
  const value = formatAperture(aperture);
  document.getElementById('apertureSlider').value = clamped;
  document.getElementById('apertureValue').textContent = value;
  if (liveView) {
    liveView.apertureIndex = clamped;
    drawLiveViewTexture();
  }
  if (iris) {
    const openness = 1 - clamped / (apertureValues.length - 1);
    iris.scale.setScalar(0.26 + openness * 1.05);
  }
  if (screenPlane) {
    if (liveView && screenPlane.material.emissiveIntensity !== undefined) {
      screenPlane.material.emissiveIntensity = 0.5 + (clamped / (apertureValues.length - 1)) * 0.12;
    } else if (screenPlane.material.color) {
      const blurColor = new THREE.Color().setHSL(0.54, 0.18 + clamped * 0.018, 0.22 + clamped * 0.018);
      screenPlane.material.color.copy(blurColor);
      screenPlane.material.opacity = 0.62 + clamped * 0.026;
    }
  }
}
document.getElementById('apertureSlider').addEventListener('input', e => setAperture(Number(e.target.value)));

function setShutter(index) {
  const clamped = Math.max(0, Math.min(shutterValues.length - 1, index));
  document.getElementById('shutterSlider').value = clamped;
  document.getElementById('shutterValue').textContent = shutterValues[clamped].label;
  if (liveView) {
    liveView.shutterIndex = clamped;
    drawLiveViewTexture();
  }
}

function setIso(index) {
  const clamped = Math.max(0, Math.min(isoValues.length - 1, index));
  document.getElementById('isoSlider').value = clamped;
  document.getElementById('isoValue').textContent = `ISO ${isoValues[clamped]}`;
  if (liveView) {
    liveView.isoIndex = clamped;
    drawLiveViewTexture();
  }
}

document.getElementById('shutterSlider').addEventListener('input', e => setShutter(Number(e.target.value)));
document.getElementById('isoSlider').addEventListener('input', e => setIso(Number(e.target.value)));
controls.addEventListener('start', () => {
  releaseViewTransition();
  controls.autoRotate = false;
});
renderer.domElement.addEventListener('pointerdown', event => {
  pointerDown = { x: event.clientX, y: event.clientY, time: performance.now() };
  releaseViewTransition();
  controls.autoRotate = false;
});
renderer.domElement.addEventListener('wheel', () => {
  releaseViewTransition();
  controls.autoRotate = false;
}, { passive: true });

function updatePointer(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function findInteractive() {
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(interactives, false)[0]?.object || null;
}

renderer.domElement.addEventListener('pointermove', event => {
  updatePointer(event);
  const next = findInteractive();
  if (hovered !== next) {
    hovered = next;
    document.body.style.cursor = hovered ? 'pointer' : '';
  }
});

renderer.domElement.addEventListener('click', event => {
  if (!pointerDown) return;
  const dx = event.clientX - pointerDown.x;
  const dy = event.clientY - pointerDown.y;
  const moved = Math.hypot(dx, dy);
  const elapsed = performance.now() - pointerDown.time;
  pointerDown = null;
  if (moved > 5 || elapsed > 450) return;

  updatePointer(event);
  const hit = findInteractive();
  if (!hit) return;
  selectPart(hit.userData.label);
  if (hit.userData.label === 'Screen') return;
  if (hit.userData.focus) go(...hit.userData.focus);
});

function animate() {
  requestAnimationFrame(animate);
  particles.rotation.y += 0.0002;
  if (targetPos) {
    camera.position.lerp(targetPos, .1);
    controls.target.lerp(targetLook, .1);
    if (camera.position.distanceTo(targetPos) < .025) {
      targetPos = null;
      targetLook = null;
      viewTransitionActive = false;
    }
  }
  clampControlsTarget();
  controls.update();
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
