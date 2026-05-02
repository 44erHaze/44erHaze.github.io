// Theme Toggle mit LocalStorage
function toggleTheme() {
  const body = document.body;
  const icon = document.getElementById("theme-icon");
  
  if (body.getAttribute("data-theme") === "dark") {
    body.setAttribute("data-theme", "light");
    icon.classList.replace("fa-moon", "fa-sun");
    localStorage.setItem("theme", "light");
  } else {
    body.setAttribute("data-theme", "dark");
    icon.classList.replace("fa-sun", "fa-moon");
    localStorage.setItem("theme", "dark");
  }
}

// Lade gespeichertes Theme beim Start
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.body.setAttribute("data-theme", savedTheme);
  const icon = document.getElementById("theme-icon");
  if (savedTheme === "light") {
    icon.classList.replace("fa-moon", "fa-sun");
  }
  
  initFlyers();
});

// Scroll to top button Logic
const toTopBtn = document.getElementById("toTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    toTopBtn.classList.add("visible");
  } else {
    toTopBtn.classList.remove("visible");
  }
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Smooth Scroll für Navigation
function scrollToSection(event, id) {
  event.preventDefault();
  const headerOffset = 70;
  const element = document.getElementById(id);
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth"
  });
}

// Matrix/Monolith Code Flyer Logik
const codeSnippets = [
  "const x = 42;",
  "await fetch('/api/v1/auth');",
  "docker-compose up -d",
  "SELECT * FROM Users WHERE active = 1;",
  "public static void main(String[] args)",
  "npm run build",
  "git commit -m 'Initial commit'",
  "try { execute() } catch (e) { log(e) }",
  "border-radius: 12px;",
  "IConfiguration _config;"
];

const flyerContainer = document.querySelector('.code-flyer');
const codeLineCount = 12; // Weniger ist mehr für einen cleanen Look
let flyers = [];

function createCodeFlyer() {
  const span = document.createElement('div');
  span.className = 'code-snippet';
  span.textContent = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];

  // Startpositionen
  span.style.left = Math.random() * 90 + '%';
  span.style.top = (Math.random() * 100 + 100) + '%'; // Startet unterhalb des sichtbaren Bereichs
  
  flyerContainer.appendChild(span);

  // Vertikale Geschwindigkeit
  const speed = Math.random() * 0.5 + 0.2;

  return { elem: span, y: parseFloat(span.style.top), speed: speed };
}

function animateFlyers() {
  flyers.forEach(flyer => {
    flyer.y -= flyer.speed; // Fliegt nach oben
    
    // Fade in / Fade out Logik basierend auf der Höhe
    let opacity = 0;
    if (flyer.y < 100 && flyer.y > 0) {
      // Wenn es im Bild ist, einblenden, am Rand ausblenden
      opacity = Math.sin((flyer.y / 100) * Math.PI) * 0.5; 
    }
    
    // Reset, wenn es oben rausfliegt
    if (flyer.y < -10) {
      flyer.y = 110;
      flyer.elem.style.left = Math.random() * 90 + '%';
      flyer.elem.textContent = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
    }

    flyer.elem.style.top = flyer.y + '%';
    flyer.elem.style.opacity = opacity;
  });

  requestAnimationFrame(animateFlyers);
}

function initFlyers() {
  if(!flyerContainer) return;
  for (let i = 0; i < codeLineCount; i++) {
    flyers.push(createCodeFlyer());
  }
  animateFlyers();
}