/* ARS // Global Threat Defense Network
   Loaded with `defer`, so the DOM is already parsed when this runs. */
/* global gsap, ScrollTrigger, THREE */
(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof gsap !== 'undefined';
  const hasScrollTrigger = hasGsap && typeof ScrollTrigger !== 'undefined';

  if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* --- PRELOADER ---------------------------------------------------------
     Revealing is idempotent and also runs from a timeout, so a blocked CDN or
     a failed tween can never leave the page blank and unscrollable. */
  const preloader = document.querySelector('.preloader');
  const mainContent = document.getElementById('main-content');
  let revealed = false;

  function revealSite() {
    if (revealed) return;
    revealed = true;
    if (preloader) preloader.style.display = 'none';
    root.classList.remove('no-scroll');
    if (mainContent) mainContent.style.opacity = '1';
    initAnimations();
  }

  if (hasGsap && !prefersReducedMotion) {
    gsap.to('.progress-bar-inner', {
      scaleX: 1,
      duration: 2,
      ease: 'power2.out',
      onComplete: () => gsap.to(preloader, { opacity: 0, duration: 0.5, onComplete: revealSite })
    });
    setTimeout(revealSite, 5000); // safety net
  } else {
    revealSite();
  }

  /* --- CUSTOM CURSOR -----------------------------------------------------
     One delegated pointerover listener replaces two listeners per element. */
  if (finePointer && hasGsap) {
    const dot = document.querySelector('.cursor-dot');
    const outline = document.querySelector('.cursor-outline');

    // Only hide the native cursor once the replacement is actually wired up.
    root.classList.add('has-custom-cursor');

    const moveDotX = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3.out' });
    const moveDotY = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3.out' });
    const moveOutlineX = gsap.quickTo(outline, 'x', { duration: 0.35, ease: 'power3.out' });
    const moveOutlineY = gsap.quickTo(outline, 'y', { duration: 0.35, ease: 'power3.out' });

    addEventListener('pointermove', (e) => {
      moveDotX(e.clientX);
      moveDotY(e.clientY);
      moveOutlineX(e.clientX);
      moveOutlineY(e.clientY);
    }, { passive: true });

    /* The hover scale has to run through GSAP: GSAP writes `scale: none`
       alongside its inline `transform`, which would override a stylesheet
       `scale` rule (this is why the original dot-shrink never fired). */
    const HOVER_TARGETS = 'a, button, .interactive';
    let hovering = false;

    document.addEventListener('pointerover', (e) => {
      const isHover = !!e.target.closest(HOVER_TARGETS);
      if (isHover === hovering) return;
      hovering = isHover;
      body.classList.toggle('hovering', isHover);
      gsap.to(dot, { scale: isHover ? 0.5 : 1, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
      gsap.to(outline, { scale: isHover ? 1.5 : 1, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
    }, { passive: true });
  }

  /* --- ARSENAL ACCORDION -------------------------------------------------
     Delegated, and bound immediately rather than after the preloader so the
     section stays usable even if GSAP never loads. Keyboard support comes
     free from the <button> elements in the markup. */
  const arsenal = document.querySelector('.arsenal-container');
  if (arsenal) {
    arsenal.addEventListener('click', (e) => {
      const trigger = e.target.closest('.arsenal-header');
      if (!trigger) return;
      const item = trigger.closest('.arsenal-item');
      const isOpen = item.classList.toggle('active');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* --- CONTACT FORM ------------------------------------------------------ */
  const form = document.querySelector('.contact-form');
  if (form) {
    const field = form.querySelector('#transmission');
    const status = form.querySelector('.form-status');

    form.addEventListener('submit', (e) => {
      e.preventDefault(); // no backend: never reload and discard the draft
      if (!field.value.trim()) {
        status.dataset.state = 'error';
        status.textContent = 'TRANSMISSION EMPTY. INPUT REQUIRED.';
        field.focus();
        return;
      }
      delete status.dataset.state;
      status.textContent = 'PACKET TRANSMITTED. AWAITING HANDSHAKE.';
      form.reset();
    });
  }

  /* --- HERO VIDEO -------------------------------------------------------- */
  if (prefersReducedMotion) {
    const video = document.querySelector('.hero-video-bg');
    if (video) {
      video.removeAttribute('autoplay');
      video.pause();
    }
  }

  /* --- SCROLL-DRIVEN ANIMATIONS ------------------------------------------ */
  function initAnimations() {
    if (hasScrollTrigger && !prefersReducedMotion) {
      // One batched trigger instead of one ScrollTrigger per element.
      ScrollTrigger.batch('.fade-up', {
        start: 'top 85%',
        onEnter: (batch) => gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.1,
          ease: 'power3.out',
          overwrite: true
        })
      });

      const redacted = document.querySelector('.redacted-text');
      if (redacted) {
        ScrollTrigger.create({
          trigger: redacted,
          start: 'top 80%',
          once: true,
          onEnter: () => redacted.classList.add('revealed')
        });
      }

      // Trigger positions shift once fonts and the lazy image land.
      addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
    } else {
      document.querySelectorAll('.fade-up').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      document.querySelector('.redacted-text')?.classList.add('revealed');
    }

    initCounters();
    initGlobeWhenVisible();
  }

  /* --- STAT COUNTERS -----------------------------------------------------
     The final values live in the HTML (correct for crawlers and no-JS), and
     are rewound to zero here before counting up. */
  function initCounters() {
    const values = document.querySelectorAll('.stat-value');
    if (!values.length || prefersReducedMotion || !('IntersectionObserver' in window)) return;

    const targets = new Map();
    values.forEach((el) => {
      const target = parseFloat(el.textContent);
      if (Number.isNaN(target)) return;
      const decimals = (el.textContent.split('.')[1] || '').length;
      targets.set(el, { target, decimals });
      el.textContent = (0).toFixed(decimals);
    });

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        countUp(entry.target, targets.get(entry.target));
      });
    }, { threshold: 0.25 });

    targets.forEach((_, el) => observer.observe(el));
  }

  function countUp(el, { target, decimals }) {
    const duration = 2000;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // power1.inOut
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  /* --- THREE.JS GLOBE ----------------------------------------------------
     ~580KB of library for one decorative mesh, so it is only fetched once the
     globe is close to the viewport. */
  function initGlobeWhenVisible() {
    const container = document.getElementById('globe-container');
    if (!container || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries, obs) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      obs.disconnect();
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')
        .then(() => initGlobe(container))
        .catch(() => { /* decorative only: leave the slot empty */ });
    }, { rootMargin: '300px' });

    observer.observe(container);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initGlobe(container) {
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (err) {
      return; // no WebGL context available
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 7;

    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(3, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x00d9ff, wireframe: true })
    );
    scene.add(globe);

    // One geometry and one material shared by every marker.
    const anomalyGeom = new THREE.SphereGeometry(0.05, 8, 8);
    const anomalyMat = new THREE.MeshBasicMaterial({ color: 0xff2a6d });
    for (let i = 0; i < 10; i++) {
      const anomaly = new THREE.Mesh(anomalyGeom, anomalyMat);
      anomaly.position.setFromSphericalCoords(3.1, Math.random() * Math.PI, Math.random() * 2 * Math.PI);
      globe.add(anomaly);
    }

    renderer.render(scene, camera);

    if (prefersReducedMotion) return; // static globe, no loop, no tilt

    /* Render loop, paused whenever the globe is off-screen or the tab is
       hidden, instead of burning a frame budget forever. */
    let frameId = null;
    let onScreen = false;

    const render = () => {
      frameId = requestAnimationFrame(render);
      globe.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    const start = () => { if (frameId === null) render(); };
    const stop = () => {
      if (frameId !== null) { cancelAnimationFrame(frameId); frameId = null; }
    };
    const sync = () => (onScreen && !document.hidden ? start() : stop());

    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      sync();
    }).observe(container);

    document.addEventListener('visibilitychange', sync);

    // Pointer tilt: quickTo reuses a single tween rather than allocating one
    // per pointermove event.
    if (finePointer && hasGsap) {
      const lookAtCentre = () => camera.lookAt(scene.position);
      const tiltX = gsap.quickTo(camera.position, 'x', { duration: 1, ease: 'power2.out', onUpdate: lookAtCentre });
      const tiltY = gsap.quickTo(camera.position, 'y', { duration: 1, ease: 'power2.out', onUpdate: lookAtCentre });

      container.addEventListener('pointermove', (e) => {
        const rect = container.getBoundingClientRect();
        tiltX(((e.clientX - rect.left) / rect.width * 2 - 1) * 2);
        tiltY((-(e.clientY - rect.top) / rect.height * 2 + 1) * 2);
      }, { passive: true });
    }

    // ResizeObserver catches layout changes, not just window resizes, and is
    // coalesced by the browser so it needs no manual debounce.
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => {
        const { clientWidth: w, clientHeight: h } = container;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }).observe(container);
    }
  }
})();
