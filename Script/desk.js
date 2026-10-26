import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('desk-3d');
const toggleBtn = document.getElementById('toggle-3d');
const introCard = document.getElementById('intro-card');
const hintEl = document.getElementById('term-hint');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Terminal-Elemente
const term = document.getElementById('term');
const termWin = term.querySelector('.term-window');
const termOut = document.getElementById('term-output');
const termForm = document.getElementById('term-form');
const termInput = document.getElementById('term-input');
const termClose = document.getElementById('term-close');

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

const LED_COLORS = [0x3b82f6, 0x22c55e, 0xf59e0b];

let renderer, scene, camera, controls, raycaster, deskGroup;
let screenCtx, screenTex, led;
let ledIndex = 0;
let visible = true;
let inView = true;
let frame = null;
let downPos = null;

const pointer = new THREE.Vector2();
const clickables = [];
const clock = new THREE.Clock();

// ---------- Bildschirm im 3D-Monitor ----------

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

function drawScreen() {
  const ctx = screenCtx;
  ctx.fillStyle = '#0b0f14';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#7ee787';
  ctx.font = 'bold 42px monospace';
  ctx.fillText('$ cat intro.txt', 48, 88);

  ctx.fillStyle = '#e6edf3';
  ctx.font = '42px monospace';
  const lines = wrapText(ctx, HERO_TEXT, CANVAS_W - 96);
  lines.forEach((line, i) => ctx.fillText(line, 48, 170 + i * 60));

  screenTex.needsUpdate = true;
}

// Aufkleber auf der Rückseite: Hinweis auf den Konami-Code
function drawBackSticker(ctx, w, h) {
  ctx.fillStyle = '#f5c542';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#0b0f14';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, w - 12, h - 12);

  ctx.fillStyle = '#0b0f14';
  ctx.textAlign = 'center';

  ctx.font = 'bold 40px monospace';
  ctx.fillText('CHEAT CODE', w / 2, 62);

  ctx.font = '34px monospace';
  ctx.fillText('↑ ↑ ↓ ↓ ← → ← → B A', w / 2, 120);

  ctx.font = '22px monospace';
  ctx.fillText('auf der Seite eingeben', w / 2, 166);

  ctx.textAlign = 'left';
}

// ---------- 3D-Szene ----------

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

  // Monitor
  const monitor = new THREE.Group();
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.7, 0.08), black);
  bezel.position.y = 0.6;
  bezel.userData.action = 'monitor';
  clickables.push(bezel);

  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 0.6, 16), black);
  stand.position.y = -0.55;

  // Bildschirm-Textur
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
  screen.userData.action = 'monitor';
  clickables.push(screen);

  // Aufkleber auf der Rückseite des Monitors
  const stickerCanvas = document.createElement('canvas');
  stickerCanvas.width = 512;
  stickerCanvas.height = 200;
  const stickerCtx = stickerCanvas.getContext('2d');
  drawBackSticker(stickerCtx, stickerCanvas.width, stickerCanvas.height);
  const stickerTex = new THREE.CanvasTexture(stickerCanvas);
  stickerTex.colorSpace = THREE.SRGBColorSpace;

  const sticker = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.6),
    new THREE.MeshBasicMaterial({ map: stickerTex })
  );
  // Um 180 Grad gedreht, damit die Schrift von hinten lesbar ist
  sticker.rotation.y = Math.PI;
  sticker.position.set(0, 0.6, -0.046);

  monitor.add(bezel, stand, screen, sticker);
  deskGroup.add(monitor);
  drawScreen();

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
  const neededHeight = Math.max(2.9, 7.2 / aspect);
  const r = neededHeight / 2 / Math.tan(fovRad / 2);
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

// Gibt das oberste getroffene Objekt unter dem Mauszeiger zurück
function pick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(clickables, false)[0] || null;
}

function onClick(event) {
  const hit = pick(event);
  if (!hit) return;
  const action = hit.object.userData.action;
  if (action === 'led' || action === 'tower') {
    ledIndex = (ledIndex + 1) % LED_COLORS.length;
    led.material.color.setHex(LED_COLORS[ledIndex]);
    led.material.emissive.setHex(LED_COLORS[ledIndex]);
  }
  render();
}

function onDblClick(event) {
  const hit = pick(event);
  if (!hit) return;
  if (hit.object.userData.action === 'monitor') openTerminal();
}

function init() {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (err) {
    // Ohne WebGL: 3D weglassen, Text als normalen Block zeigen
    container.innerHTML = '<p class="desk-fallback">3D-Ansicht nicht verfügbar.</p>';
    toggleBtn.hidden = true;
    hintEl.hidden = true;
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
  controls.enableZoom = true;
  controls.zoomSpeed = 0.8;
  controls.minDistance = 2.5;
  controls.maxDistance = 20;
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
  renderer.domElement.addEventListener('dblclick', onDblClick);

  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) startLoop();
  }).observe(container);

  resize();
  startLoop();
}

// ---------- Terminal ----------

const cmdHistory = [];
let cmdIdx = 0;
let busy = false;
let backdropDown = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Alle Befehle, inklusive der versteckten Spielereien
const HELP = [
  'Verfügbare Befehle:',
  '  help           diese Übersicht',
  '  about          kurzes Profil',
  '  skills         Tech-Stack',
  '  projects       meine Projekte',
  '  ls             Inhalt des Labors',
  '  whoami         wer bin ich',
  '  date           aktuelles Datum und Uhrzeit',
  '  neofetch       Systeminfo des Labors',
  '  ping kontakt   Verbindung zu mir prüfen',
  '  sudo hire-me   Zugriff anfragen',
  '  matrix         Zeichenregen im Terminal',
  '  clear          Ausgabe leeren',
  '  exit           Terminal schliessen',
];

const NEOFETCH = [
  '       ____        anthony@labor',
  '      /    \\       ---------------',
  '     | ()() |      OS:       Ubuntu Server',
  '      \\ __ /       Host:     Proxmox VE',
  '     /      \\      Firewall: OPNsense',
  '    /________\\     Rolle:    Praktikant IT',
  '                   Stack:    C#, Java, SQL, Docker',
];

function scrollOutput() {
  termOut.scrollTop = termOut.scrollHeight;
}

function print(text, cls = '') {
  const p = document.createElement('p');
  p.className = `term-line ${cls}`.trim();
  p.textContent = text;
  termOut.appendChild(p);
  scrollOutput();
}

function printLink(label, href) {
  const p = document.createElement('p');
  p.className = 'term-line';
  const a = document.createElement('a');
  a.href = href;
  a.textContent = label;
  if (href.startsWith('http')) {
    a.target = '_blank';
    a.rel = 'noopener';
  }
  p.appendChild(a);
  termOut.appendChild(p);
  scrollOutput();
}

async function pingKontakt() {
  print('PING kontakt (simuliert): 56 Datenbytes');
  for (let i = 1; i <= 3; i++) {
    await sleep(350);
    const ms = (8 + Math.random() * 10).toFixed(1);
    print(`64 Bytes von kontakt: icmp_seq=${i} time=${ms} ms`);
  }
  await sleep(300);
  print('--- kontakt Ping-Statistik ---');
  print('3 Pakete gesendet, 3 empfangen, 0 % Verlust');
  printLink('→ E-Mail senden: anthony.franz7@gmail.com', 'mailto:anthony.franz7@gmail.com');
  printLink('→ LinkedIn', 'https://www.linkedin.com/in/anthony-franz/');
}

async function hireMe() {
  print('[sudo] Passwort für anthony: ••••••••');
  await sleep(700);
  print('Zugriff gewährt. Willkommen, Recruiter.', 'cmd');
  printLink('→ Kontakt per E-Mail', 'mailto:anthony.franz7@gmail.com');
}

async function matrix() {
  const chars = 'アイウエオカキクケコサシスセソ0123456789ABCDEF';
  for (let i = 0; i < 14; i++) {
    let row = '';
    for (let j = 0; j < 56; j++) {
      row += chars[Math.floor(Math.random() * chars.length)];
    }
    print(row, 'muted');
    await sleep(90);
  }
  await sleep(300);
  print('Wake up, Neo …');
}

async function runCommand(raw) {
  const input = raw.trim();
  if (!input) return;

  print(`anthony@labor:~$ ${input}`, 'cmd');

  const [cmd, ...args] = input.toLowerCase().split(/\s+/);

  switch (cmd) {
    case 'help':
      HELP.forEach((line) => print(line));
      break;

    case 'about':
      print('Anthony Franz, Informatiker EFZ mit Spezialisierung in Applikations- und Plattformentwicklung.');
      print('Praktikant bei der ipso! Bildung AG. Ich löse Support-Anfragen aller Art und betreibe ein');
      print('eigenes Praktikums-Labor mit Linux, Proxmox und OPNsense.');
      break;

    case 'skills':
      print('Sprachen:   C#, Java, JavaScript, PHP, SQL, PowerShell');
      print('Plattform:  Linux, Windows Server, Proxmox, Docker, OPNsense');
      print('Netzwerk:   TCP/IP, Cisco, VLANs, IPSec, Wireshark');
      break;

    case 'projects':
      print('SaveUp App         C# / .NET');
      print('JetStreamService   Java');
      print('CRUD               SQL / Backend');
      printLink('→ Alle Projekte auf GitHub', 'https://github.com/44erHaze');
      break;

    case 'ls':
      print('about.txt   kontakt.txt   projekte/   labor/');
      break;

    case 'whoami':
      print('anthony.franz – Informatiker EFZ, Raum Basel');
      break;

    case 'date':
      print(new Date().toLocaleString('de-CH'));
      break;

    case 'neofetch':
      NEOFETCH.forEach((line) => print(line, 'muted'));
      break;

    case 'ping':
      if (args[0] === 'kontakt') {
        await pingKontakt();
      } else {
        print(`ping: ${args[0] ?? ''}: Ziel nicht gefunden`, 'err');
      }
      break;

    case 'sudo':
      if (args.join(' ') === 'hire-me' || args.join(' ') === 'hire-me --now') {
        await hireMe();
      } else {
        print('sudo: Berechtigung verweigert. Versuch: sudo hire-me', 'err');
      }
      break;

    case 'matrix':
      await matrix();
      break;

    case 'clear':
      termOut.innerHTML = '';
      break;

    case 'exit':
      closeTerminal();
      break;

    default:
      print(`${cmd}: Befehl nicht gefunden. Tippe 'help' für eine Übersicht.`, 'err');
  }
}

function openTerminal() {
  term.hidden = false;
  if (!termOut.childElementCount) {
    print('Willkommen im Labor-Terminal. Tippe "help" für eine Übersicht.', 'muted');
  }
  // Kurz warten, bis das Overlay sichtbar ist, dann Fokus setzen
  setTimeout(() => termInput.focus(), 50);
}

function closeTerminal() {
  term.hidden = true;
  termInput.blur();
}

// Tastatureingaben im Terminal nicht an andere Skripte der Seite weitergeben
['keydown', 'keyup', 'keypress'].forEach((type) => {
  term.addEventListener(type, (e) => e.stopPropagation());
});

// Klick auf den dunklen Hintergrund schliesst das Terminal.
// Nur wenn Mausdruck UND Loslassen auf dem Hintergrund passieren.
term.addEventListener('pointerdown', (e) => {
  backdropDown = e.target === term;
});
term.addEventListener('click', (e) => {
  if (e.target === term && backdropDown) closeTerminal();
  backdropDown = false;
});

// Klick ins Fenster setzt den Fokus zurück auf die Eingabezeile
termWin.addEventListener('click', () => termInput.focus());

// Escape schliesst das Terminal
term.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTerminal();
});

termForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (busy) return;
  const value = termInput.value;
  termInput.value = '';
  if (value.trim()) {
    cmdHistory.push(value);
    cmdIdx = cmdHistory.length;
  }
  busy = true;
  await runCommand(value);
  busy = false;
  termInput.focus();
});

// Pfeiltasten: vorherige und nächste Eingabe
termInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' && cmdHistory.length) {
    e.preventDefault();
    cmdIdx = Math.max(0, cmdIdx - 1);
    termInput.value = cmdHistory[cmdIdx];
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    cmdIdx = Math.min(cmdHistory.length, cmdIdx + 1);
    termInput.value = cmdHistory[cmdIdx] ?? '';
  }
});

termClose.addEventListener('click', closeTerminal);

// ---------- 3D-Schreibtisch ein- und ausblenden ----------

toggleBtn?.addEventListener('click', () => {
  visible = !visible;
  container.style.display = visible ? '' : 'none';
  hintEl.hidden = !visible;
  introCard.hidden = visible; // Text im Monitor ODER als Block, nie beides
  toggleBtn.textContent = visible ? '3D ausschalten' : '3D einschalten';
  if (visible) {
    resize();
    startLoop();
  }
});

init();
