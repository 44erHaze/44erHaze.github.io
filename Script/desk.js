import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('desk-3d');
const toggleBtn = document.getElementById('toggle-3d');
const introCard = document.getElementById('intro-card');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Text aus dem Intro-Block. Bei Änderungen im HTML hier ebenfalls anpassen.
const HERO_TEXT =
  'Ich entwickle Applikationen und betreue die Infrastruktur dahinter, von der ersten Zeile Code bis zum laufenden Betrieb. ' +
  'Aktuell arbeite ich Vollzeit als Praktikant bei der ipso! Bildung AG. ' +
  'Meine duale Ausbildung zum Informatiker EFZ mit Spezialisierung in Applikations- und Plattformentwicklung schliesse ich im September 2027 ab.';

// Canvas-Auflösung des Bildschirms (Seitenverhältnis 1024:720)
const CANVAS_W = 1024;
const CANVAS_H = 720;
// Größe der Bildschirmfläche in der 3D-Szene
const SCREEN_W = 2.1;
const SCREEN_H = SCREEN_W * (CANVAS_H / CANVAS_W);

const SCREEN_HERO = 0;
const SCREEN_SUDO = 1;
const LED_COLORS = [0x3b82f6, 0x22c55e, 0xf59e0b];

let renderer, scene, camera, controls, raycaster, deskGroup;
let screenCtx, screenTex, led;
let screenIndex = SCREEN_HERO;
let ledIndex = 0;
let visible = true;
let inView = true;
let frame = null;
let downPos = null;

const pointer = new THREE.Vector2();
const clickables = [];
const clock = new THREE.Clock();

// Bricht Text an Wortgrenzen um, damit er auf den Bildschirm passt
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawScreen(index) {
  const ctx = screenCtx;
  ctx.fillStyle = '#0b0f14';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (index === SCREEN_HERO) {
    ctx.fillStyle = '#7ee787';
    ctx.font = 'bold 42px monospace';
    ctx.fillText('$ cat intro.txt', 48, 88);

    ctx.fillStyle = '#e6edf3';
    ctx.font = '42px monospace';
    const lines = wrapText(ctx, HERO_TEXT, CANVAS_W - 96);
    lines.forEach((line, i) => ctx.fillText(line, 48, 170 + i * 60));
  } else {
    ctx.fillStyle = '#7ee787';
    ctx.font = 'bold 64px monospace';
    const rows = ['$ sudo hire-me --now', 'Zugriff gewährt.', 'Kontakt weiter unten ↓', '', '$ _'];
    rows.forEach((row, i) => ctx.fillText(row, 48, 150 + i * 95));
  }
  screenTex.needsUpdate = true;
}

function buildScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  scene.add(key);

  // Alle Schreibtisch-Teile in einer Gruppe, damit sie gemeinsam schwingen
  deskGroup = new THREE.Group();
  scene.add(deskGroup);

  const dark = new THREE.MeshStandardMaterial({ color: 0x1b2330, roughness: 0.6 });
  const black = new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.4 });

  const desk = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.12, 2.8), dark);
  desk.position.y = -0.9;
  deskGroup.add(desk);

  // Monitor mit Bildschirm-Textur
  const monitor = new THREE.Group();
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.7, 0.08), black);
  bezel.position.y = 0.6;
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 0.6, 16), black);
  stand.position.y = -0.55;

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = CANVAS_W;
  screenCanvas.height = CANVAS_H;
  screenCtx = screenCanvas.getContext('2d');
  screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(SCREEN_W, SCREEN_H),
    new THREE.MeshBasicMaterial({ map: screenTex })
  );
  screen.position.set(0, 0.6, 0.045);
  screen.userData.action = 'screen';
  clickables.push(screen);

  monitor.add(bezel, stand, screen);
  deskGroup.add(monitor);
  drawScreen(SCREEN_HERO);

  // PC-Tower mit LED (Klick wechselt die Farbe)
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.7, 1.3), dark);
  tower.position.set(-2.4, -0.05, 0);
  tower.userData.action = 'tower';
  clickables.push(tower);
  deskGroup.add(tower);

  led = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.5, 0.02),
    new THREE.MeshStandardMaterial({ color: LED_COLORS[0], emissive: LED_COLORS[0], emissiveIntensity: 1.2 })
  );
  led.position.set(-2.4, 0.3, 0.66);
  led.userData.action = 'led';
  clickables.push(led);
  deskGroup.add(led);

  // Tastatur und Maus
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.6), black);
  keyboard.position.set(0, -0.82, 1.0);
  const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.28), black);
  mouse.position.set(1.4, -0.82, 1.0);
  deskGroup.add(keyboard, mouse);
}

// Kamera so setzen, dass die ganze Szene in den Canvas passt.
// Auf breiten Bildschirmen füllt der Tisch die Breite, auf schmalen passt er nur gerade hinein.
function fitCamera() {
  const aspect = container.clientWidth / container.clientHeight;
  const fovRad = THREE.MathUtils.degToRad(camera.fov);
  // Sichtbare Höhe: mindestens die Szenenhöhe, auf schmalen Bildschirmen zusätzlich die Breite
  const neededHeight = Math.max(2.9, 7.2 / aspect);
  const r = neededHeight / 2 / Math.tan(fovRad / 2);
  // Leicht erhöhte Position, Abstand r bleibt gleich
  camera.position.set(0, r * 0.33, r * 0.94);
  camera.lookAt(0, 0, 0);
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
}

function render() {
  renderer.render(scene, camera);
}

function loop() {
  frame = null;
  if (!visible || !inView) return;

  if (!reduceMotion) {
    // Schwingt ca. ±29°, damit der Bildschirm von vorne lesbar bleibt
    deskGroup.rotation.y = Math.sin(clock.getElapsedTime() * 0.35) * 0.5;
  }
  controls.update();
  render();

  if (!reduceMotion) frame = requestAnimationFrame(loop);
}

function startLoop() {
  if (frame === null) frame = requestAnimationFrame(loop);
}

function resize() {
  if (!renderer || !controls) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h);
  fitCamera();
  controls.update();
  render();
}

function init() {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (err) {
    // Ohne WebGL: 3D weglassen, Text als normalen Block zeigen
    container.innerHTML = '<p class="desk-fallback">3D-Ansicht nicht verfügbar.</p>';
    toggleBtn.hidden = true;
    introCard.hidden = false;
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  buildScene();
  raycaster = new THREE.Raycaster();

  // Text steht jetzt im Monitor, daher Textblock ausblenden
  introCard.hidden = true;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduceMotion;
  controls.enablePan = false;
  controls.enableZoom = true;        // Zoom mit Mausrad und Pinch
  controls.zoomSpeed = 0.8;
  controls.minDistance = 2.5;        // nicht zu nah heran
  controls.maxDistance = 20;         // weit genug für schmale Bildschirme
  controls.minPolarAngle = Math.PI / 3;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.target.set(0, 0, 0);
  controls.addEventListener('change', render);

  // Klick nur auslösen, wenn die Maus nicht gezogen wurde
  renderer.domElement.addEventListener('pointerdown', (e) => {
    downPos = [e.clientX, e.clientY];
  });
  renderer.domElement.addEventListener('click', (e) => {
    if (downPos && Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]) > 5) return;
    onClick(e);
  });

  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) startLoop();
  }).observe(container);

  resize();
  startLoop();
}

function onClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hit = raycaster.intersectObjects(clickables, false)[0];
  if (!hit) return;

  const action = hit.object.userData.action;
  if (action === 'screen') {
    screenIndex = screenIndex === SCREEN_HERO ? SCREEN_SUDO : SCREEN_HERO;
    drawScreen(screenIndex);
  }
  if (action === 'led' || action === 'tower') {
    ledIndex = (ledIndex + 1) % LED_COLORS.length;
    led.material.color.setHex(LED_COLORS[ledIndex]);
    led.material.emissive.setHex(LED_COLORS[ledIndex]);
  }
  render();
}

toggleBtn?.addEventListener('click', () => {
  visible = !visible;
  container.style.display = visible ? '' : 'none';
  introCard.hidden = visible; // Text im Monitor ODER als Block, nie beides
  toggleBtn.textContent = visible ? '3D ausschalten' : '3D einschalten';
  if (visible) {
    resize();
    startLoop();
  }
});

init();