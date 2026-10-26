// Theme-Umschalter, Scroll-Hilfen, Nach-oben-Button,
// Schreibmaschinen-Effekt, Konami-Code (Tastatur und Touch) und Kontaktformular.

const THEME_KEY = 'theme';
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;

// ---------- Theme ----------

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.classList.toggle('fa-moon', theme === 'dark');
    icon.classList.toggle('fa-sun', theme === 'light');
  }
}

function toggleTheme() {
  const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (e) {
    // Speicher nicht verfügbar, Theme gilt dann nur für diese Sitzung
  }
}

try {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') applyTheme(saved);
} catch (e) {
  // ignorieren
}

// ---------- Scroll ----------

function scrollToSection(event, id) {
  event.preventDefault();
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const toTop = document.getElementById('toTop');

function updateToTop() {
  if (toTop) toTop.classList.toggle('visible', window.scrollY > 300);
}

window.addEventListener('scroll', updateToTop, { passive: true });
updateToTop();

// ---------- Schreibmaschinen-Effekt ----------

function typeWriter(el) {
  const full = el.textContent;
  if (!full || REDUCE_MOTION) return;

  el.textContent = '';
  el.classList.add('typing-caret');
  let i = 0;

  const tick = () => {
    i++;
    el.textContent = full.slice(0, i);
    if (i < full.length) {
      setTimeout(tick, 35);
    } else {
      el.classList.remove('typing-caret');
    }
  };
  setTimeout(tick, 400);
}

const subtitle = document.getElementById('subtitle');
if (subtitle) typeWriter(subtitle);

// ---------- Konami-Code ----------

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;
let rain = null;

function showToast(text) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function startRain() {
  const canvas = document.createElement('canvas');
  canvas.className = 'rain-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const chars = '01アイウエオカキクケコ<>{}();=';
  const fontSize = 16;
  let drops = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / fontSize);
    drops = Array.from({ length: cols }, () => Math.random() * -50);
  }

  function draw() {
    // Leichtes Überblenden, damit die Spuren verblassen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#7ee787';
    ctx.font = `${fontSize}px monospace`;

    drops.forEach((y, i) => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, y * fontSize);
      if (y * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      } else {
        drops[i] = y + 1;
      }
    });
  }

  resize();
  window.addEventListener('resize', resize);
  const timer = setInterval(draw, 50);

  return {
    stop() {
      clearInterval(timer);
      window.removeEventListener('resize', resize);
      canvas.remove();
    },
  };
}

function toggleRain() {
  if (rain) {
    rain.stop();
    rain = null;
    showToast('Matrix-Modus aus');
  } else {
    rain = startRain();
    showToast('Matrix-Modus an. Cheat-Code erneut eingeben zum Beenden.');
  }
}

// Eine Taste (Tastatur oder Touch-Button) in die Konami-Sequenz einordnen
function handleKonamiKey(rawKey) {
  const key = rawKey.length === 1 ? rawKey.toLowerCase() : rawKey;

  if (key === KONAMI[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === KONAMI.length) {
      konamiIndex = 0;
      toggleRain();
    }
  } else {
    konamiIndex = key === KONAMI[0] ? 1 : 0;
  }
}

// Tastatureingaben: nicht reagieren, wenn gerade in ein Eingabefeld getippt wird
document.addEventListener('keydown', (e) => {
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  handleKonamiKey(e.key);
});

// ---------- Touch-Eingabe für den Cheat-Code ----------

const padOpen = document.getElementById('pad-open');
const touchPad = document.getElementById('touch-pad');
const padClose = document.getElementById('pad-close');
const konamiText = document.getElementById('konami-text');

if (IS_TOUCH) {
  // Auf Handys den Button zeigen und den Hinweistext anpassen
  if (padOpen) padOpen.hidden = false;
  if (konamiText) konamiText.textContent = 'Psst … Cheat-Code? Unten auf den Button tippen.';
}

if (padOpen && touchPad) {
  padOpen.addEventListener('click', () => {
    touchPad.hidden = false;
  });
}

if (padClose && touchPad) {
  padClose.addEventListener('click', () => {
    touchPad.hidden = true;
  });
}

if (touchPad) {
  touchPad.querySelectorAll('[data-key]').forEach((btn) => {
    btn.addEventListener('click', () => handleKonamiKey(btn.dataset.key));
  });
}

// ---------- Kontaktformular (Web3Forms) ----------

const form = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(form);

    // Honeypot: wurde das versteckte Feld ausgefüllt, ist es vermutlich ein Bot
    if (data.get('website')) return;

    const accessKey = String(data.get('access_key') || '').trim();
    if (!accessKey || accessKey.startsWith('DEIN_')) {
      formStatus.textContent = 'Formular noch nicht eingerichtet: Access Key fehlt.';
      console.error('Web3Forms: access_key ist noch der Platzhalter.');
      return;
    }

    const payload = Object.fromEntries(data.entries());
    delete payload.website;
    payload.access_key = accessKey;

    formStatus.textContent = 'Wird gesendet …';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));

      if (json.success) {
        formStatus.textContent = 'Danke, deine Nachricht ist angekommen.';
        form.reset();
      } else {
        console.error('Web3Forms Antwort:', res.status, json);
        formStatus.textContent = json.message
          ? `Senden fehlgeschlagen: ${json.message}`
          : 'Senden fehlgeschlagen. Bitte schreib direkt per E-Mail.';
      }
    } catch (err) {
      console.error('Web3Forms Netzwerkfehler:', err);
      formStatus.textContent = 'Keine Verbindung. Bitte schreib direkt per E-Mail.';
    }
  });
}
