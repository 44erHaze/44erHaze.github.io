// Theme-Umschalter, Scroll-Hilfen und Nach-oben-Button.
// Die index.html ruft toggleTheme(), scrollToSection() und scrollToTop() über onclick auf.

const THEME_KEY = 'theme';

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

function scrollToSection(event, id) {
  event.preventDefault();
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Gespeichertes Theme beim Laden wiederherstellen
try {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') applyTheme(saved);
} catch (e) {
  // ignorieren
}

// Nach-oben-Button nur zeigen, wenn man weit genug gescrollt hat
const toTop = document.getElementById('toTop');

function updateToTop() {
  if (toTop) toTop.classList.toggle('visible', window.scrollY > 300);
}

window.addEventListener('scroll', updateToTop, { passive: true });
updateToTop();
