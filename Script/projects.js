// Detailansicht der Projekte: lädt das README aus dem GitHub-Repo
// und zeigt es im Fenster an.

import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12.0.2/lib/marked.esm.js';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.es.mjs';

// Die Schlüssel passen zu den data-project-Attributen in der index.html.
// repo = Name des GitHub-Repos unter 44erHaze.
const PROJECTS = {
  saveup: {
    title: 'SaveUp App',
    repo: 'SaveUp2025',
    stack: ['C#', '.NET'],
    summary: 'Finanz- und Spar-Tracker Applikation.',
  },
  jetstream: {
    title: 'JetStreamService',
    repo: 'JetstreamService',
    stack: ['Java'],
    summary: 'Backend-Service-System mit Fokus auf Performance.',
  },
  crud: {
    title: 'CRUD',
    repo: 'CRUD',
    stack: ['SQL', 'Backend'],
    summary: 'Create-Read-Update-Delete Applikation.',
  },
};

const modal = document.getElementById('project-modal');
const titleEl = document.getElementById('modal-title');
const tagsEl = document.getElementById('modal-tags');
const bodyEl = document.getElementById('modal-body');
const repoLink = document.getElementById('modal-repo');
const closeBtn = document.getElementById('modal-close');

let currentKey = null;
let lastFocus = null;

// Technologie-Tags im Fenster anzeigen
function fillTags(stack) {
  tagsEl.replaceChildren(
    ...stack.map((name) => {
      const span = document.createElement('span');
      span.className = 'tech-tag';
      span.textContent = name;
      return span;
    })
  );
}

// README holen und in HTML umwandeln. DOMPurify entfernt gefährliche Teile.
async function loadReadme(project) {
  const url = `https://raw.githubusercontent.com/44erHaze/${project.repo}/HEAD/README.md`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const markdown = await res.text();
  return DOMPurify.sanitize(marked.parse(markdown));
}

async function openProject(key, trigger) {
  const project = PROJECTS[key];
  if (!project) return;

  currentKey = key;
  lastFocus = trigger;

  titleEl.textContent = project.title;
  repoLink.href = `https://github.com/44erHaze/${project.repo}`;
  fillTags(project.stack);

  const loading = document.createElement('p');
  loading.className = 'modal-status';
  loading.textContent = 'README wird geladen …';
  bodyEl.replaceChildren(loading);

  modal.hidden = false;
  closeBtn.focus();

  try {
    const html = await loadReadme(project);
    // Nur anzeigen, wenn dieses Fenster noch offen ist
    if (currentKey !== key) return;
    bodyEl.innerHTML = html;
  } catch (err) {
    if (currentKey !== key) return;
    console.warn('README konnte nicht geladen werden:', err);

    const summary = document.createElement('p');
    summary.textContent = project.summary;
    const note = document.createElement('p');
    note.className = 'modal-status';
    note.textContent = 'Das README konnte nicht geladen werden. Den vollständigen Inhalt findest du auf GitHub.';
    bodyEl.replaceChildren(summary, note);
  }
}

function closeProject() {
  if (modal.hidden) return;
  modal.hidden = true;
  currentKey = null;
  if (lastFocus) lastFocus.focus();
}

// Karten öffnen das Fenster
document.querySelectorAll('[data-project]').forEach((btn) => {
  btn.addEventListener('click', () => openProject(btn.dataset.project, btn));
});

// Schliessen: Button, Klick auf den dunklen Hintergrund, Esc
closeBtn.addEventListener('click', closeProject);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeProject();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeProject();
});