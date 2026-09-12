/* ==========================================================================
   ARS // Global Threat Defense Network
   Pure JavaScript Implementation (No External Dependencies / Three.js Free)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initPreloader();
  initCustomCursor();
  initAccordion();
  initRedactedText();
  initTacticalCanvas();
  initContactForm();
});

/* 1. PRELOADER ------------------------------------------------------------- */
function initPreloader() {
  const preloader = document.querySelector(".preloader");
  const progressBar = document.querySelector(".progress-bar-inner");
  const mainContent = document.getElementById("main-content");
  
  if (!preloader || !progressBar || !mainContent) return;

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 10;
    
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      
      progressBar.style.transform = "scaleX(1)";
      
      setTimeout(() => {
        preloader.style.transition = "opacity 0.5s ease";
        preloader.style.opacity = "0";
        
        mainContent.style.transition = "opacity 0.5s ease";
        mainContent.style.opacity = "1";
        
        document.documentElement.classList.remove("no-scroll");
        
        setTimeout(() => {
          preloader.style.display = "none";
          initScrollAnimations();
        }, 500);
      }, 200);
    } else {
      progressBar.style.transform = `scaleX(${progress / 100})`;
    }
  }, 60);
}

/* 2. CUSTOM CURSOR --------------------------------------------------------- */
function initCustomCursor() {
  const dot = document.querySelector(".cursor-dot");
  const outline = document.querySelector(".cursor-outline");
  
  if (!dot || !outline) return;
  
  document.documentElement.classList.add("has-custom-cursor");

  let mouseX = 0, mouseY = 0;
  let outlineX = 0, outlineY = 0;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  });

  function animateCursor() {
    outlineX += (mouseX - outlineX) * 0.15;
    outlineY += (mouseY - outlineY) * 0.15;
    
    outline.style.transform = `translate3d(${outlineX}px, ${outlineY}px, 0)`;
    requestAnimationFrame(animateCursor);
  }
  
  animateCursor();

  const interactives = document.querySelectorAll("a, button, .interactive");
  interactives.forEach((el) => {
    el.addEventListener("mouseenter", () => document.body.classList.add("hovering"));
    el.addEventListener("mouseleave", () => document.body.classList.remove("hovering"));
  });
}

/* 3. SCROLL REVEAL ANIMATIONS ---------------------------------------------- */
function initScrollAnimations() {
  const elements = document.querySelectorAll(".fade-up");
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.transition = "opacity 0.8s ease, transform 0.8s ease";
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  elements.forEach((el) => observer.observe(el));
}

/* 4. ARSENAL ACCORDION ----------------------------------------------------- */
function initAccordion() {
  const headers = document.querySelectorAll(".arsenal-header");

  headers.forEach((header) => {
    header.addEventListener("click", () => {
      const item = header.closest(".arsenal-item");
      const isExpanded = header.getAttribute("aria-expanded") === "true";

      document.querySelectorAll(".arsenal-item").forEach((i) => {
        i.classList.remove("active");
        const btn = i.querySelector(".arsenal-header");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });

      if (!isExpanded) {
        item.classList.add("active");
        header.setAttribute("aria-expanded", "true");
      }
    });
  });
}

/* 5. REDACTED TEXT REVEAL -------------------------------------------------- */
function initRedactedText() {
  const redactedElements = document.querySelectorAll(".redacted-text");
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  redactedElements.forEach((el) => observer.observe(el));
}

/* 6. NATIVE CANVAS TACTICAL MONITOR (Replaces Three.js) -------------------- */
function initTacticalCanvas() {
  const container = document.getElementById("globe-container");
  if (!container) return;

  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let width, height, radius;
  let angle = 0;

  function resize() {
    width = canvas.width = container.clientWidth;
    height = canvas.height = container.clientHeight;
    radius = Math.min(width, height) * 0.35;
  }

  window.addEventListener("resize", resize);
  resize();

  // Seed static target nodes
  const nodes = Array.from({ length: 24 }, () => ({
    theta: Math.random() * Math.PI * 2,
    phi: (Math.random() - 0.5) * Math.PI,
    size: Math.random() * 3 + 2,
    pulse: Math.random() * Math.PI
  }));

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;

    angle += 0.008;

    // Outer Radar Rings
    ctx.strokeStyle = "rgba(0, 217, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.arc(cx, cy, radius * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating Longitude Wireframes
    for (let i = 0; i < 6; i++) {
      const rotAngle = angle + (i * Math.PI) / 6;
      const xRad = Math.cos(rotAngle) * radius;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(xRad), radius, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 217, 255, 0.08)";
      ctx.stroke();
    }

    // Latitude Wireframes
    for (let i = -2; i <= 2; i++) {
      const yOffset = (i / 3) * radius;
      const rLat = Math.sqrt(Math.max(0, radius * radius - yOffset * yOffset));
      ctx.beginPath();
      ctx.ellipse(cx, cy + yOffset, rLat, rLat * 0.3, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 217, 255, 0.08)";
      ctx.stroke();
    }

    // Nodes Projection
    nodes.forEach((node) => {
      node.pulse += 0.04;
      const currentTheta = node.theta + angle;

      const x = cx + radius * Math.cos(node.phi) * Math.sin(currentTheta);
      const y = cy + radius * Math.sin(node.phi);
      const z = radius * Math.cos(node.phi) * Math.cos(currentTheta);

      // Render nodes on the front visible hemisphere
      if (z > 0) {
        const alpha = (z / radius) * 0.8 + 0.2;
        const pulseSize = node.size + Math.sin(node.pulse) * 1.5;

        ctx.fillStyle = `rgba(0, 217, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, pulseSize), 0, Math.PI * 2);
        ctx.fill();

        // Target Indicator Rings
        ctx.strokeStyle = `rgba(255, 42, 109, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(x, y, pulseSize + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    requestAnimationFrame(draw);
  }

  draw();
}

/* 7. CONTACT FORM TRANSMISSION --------------------------------------------- */
function initContactForm() {
  const form = document.querySelector(".contact-form");
  const status = document.querySelector(".form-status");

  if (!form || !status) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const textarea = form.querySelector("textarea");

    if (!textarea.value.trim()) {
      status.textContent = "ERROR: TRANSMISSION EMPTY.";
      status.setAttribute("data-state", "error");
      return;
    }

    status.textContent = "ENCRYPTING PACKET...";
    status.removeAttribute("data-state");

    setTimeout(() => {
      status.textContent = "TRANSMISSION SUCCESSFUL. PACKET DESTROYED.";
      textarea.value = "";
    }, 1200);
  });
}