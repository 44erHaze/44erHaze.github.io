// Dark Mode Toggle
function toggleTheme() {
  document.body.dataset.theme = document.body.dataset.theme === "dark" ? "" : "dark";
}

// Scroll to top button
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.onscroll = () => {
  const btn = document.getElementById("toTop");
  btn.style.display = window.scrollY > 200 ? "block" : "none";
};

function scrollToSection(event, id) {
  event.preventDefault();
  const headerOffset = 69;
  const element = document.getElementById(id);
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => {
    window.scrollBy(0, -headerOffset);
  }, 469);
}

// Fliegende Codezeilen im Header
const codeSnippets = [
  "const x = 42;",
  "function hello() { console.log('Hi'); }",
  "let y = x * 2;",
  "if (y > 50) { alert('Big number!'); }",
  "for(let i=0;i<10;i++){}",
  "console.log('Code fly!');",
  "const arr = [1,2,3,4];",
  "arr.map(n => n*n);",
  "import React from 'react';",
  "return fetch('/api/data');",
];

const flyerContainer = document.querySelector('.code-flyer-container');
const codeLineCount = 15; // Anzahl der Codezeilen

let flyers = [];

function createCodeFlyer() {
  const span = document.createElement('span');
  span.textContent = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];

  // Zufällige Startposition im Header
  span.style.left = Math.random() * window.innerWidth + 'px';
  const headerHeight = document.querySelector('header').offsetHeight;
  span.style.top = Math.random() * (headerHeight - 20) + 'px';

  flyerContainer.appendChild(span);

  // Zufällige Geschwindigkeit (x: horizontal, y: vertikal)
  const velocity = {
    x: (Math.random() * 0.5 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
    y: (Math.random() * 0.3 - 0.15)
  };

  return { elem: span, velocity };
}

function animateFlyers() {
  flyers.forEach(flyer => {
    const rect = flyer.elem.getBoundingClientRect();
    let left = parseFloat(flyer.elem.style.left);
    let top = parseFloat(flyer.elem.style.top);

    left += flyer.velocity.x;
    top += flyer.velocity.y;

    // Horizontal Schleife
    if (left > window.innerWidth) left = -rect.width;
    else if (left < -rect.width) left = window.innerWidth;

    // Vertikale Begrenzung (Headerhöhe)
    const headerHeight = document.querySelector('header').offsetHeight;
    if (top > headerHeight - rect.height) {
      top = headerHeight - rect.height;
      flyer.velocity.y *= -1;
    } else if (top < 0) {
      top = 0;
      flyer.velocity.y *= -1;
    }

    flyer.elem.style.left = left + 'px';
    flyer.elem.style.top = top + 'px';
  });

  requestAnimationFrame(animateFlyers);
}

function initFlyers() {
  for (let i = 0; i < codeLineCount; i++) {
    flyers.push(createCodeFlyer());
  }
  animateFlyers();
}

window.addEventListener('DOMContentLoaded', () => {
  initFlyers();
});
