document.addEventListener('DOMContentLoaded', () => {

  // --- PRELOADER ---
  const progressBar = document.querySelector('.progress-bar-inner');
  const mainContent = document.getElementById('main-content');

  gsap.to(progressBar, {
    width: '100%',
    duration: 2,
    ease: 'power2.out',
    onComplete: () => {
      gsap.to('.preloader', {
        opacity: 0, duration: 0.5, onComplete: () => {
          document.querySelector('.preloader').style.display = 'none';
          document.documentElement.classList.remove('no-scroll');
          mainContent.style.opacity = 1;
          initAnimations();
        }
      });
    }
  });

  // --- CURSOR LOGIC (IMPROVED) ---
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorOutline = document.querySelector('.cursor-outline');

  // High-performance GSAP setters for smooth movement
  const moveDotX = gsap.quickTo(cursorDot, "x", { duration: 0.1, ease: "power3.out" });
  const moveDotY = gsap.quickTo(cursorDot, "y", { duration: 0.1, ease: "power3.out" });
  const moveOutlineX = gsap.quickTo(cursorOutline, "x", { duration: 0.35, ease: "power3.out" });
  const moveOutlineY = gsap.quickTo(cursorOutline, "y", { duration: 0.35, ease: "power3.out" });

  window.addEventListener('mousemove', (e) => {
    moveDotX(e.clientX);
    moveDotY(e.clientY);
    moveOutlineX(e.clientX);
    moveOutlineY(e.clientY);
  });

  // Hover interactions
  const interactives = document.querySelectorAll('a, button, .interactive, .arsenal-header');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
  });

  // --- MAIN ANIMATIONS ---
  function initAnimations() {
    // --- GSAP DEFAULTS & REVEALS ---
    gsap.utils.toArray('.fade-up').forEach(elem => {
      gsap.fromTo(elem, { opacity: 0, y: 50 }, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: elem, start: 'top 85%' }
      });
    });

    // --- SQUAD INTEL: REDACTED TEXT REVEAL ---
    const redactedText = document.querySelector('.redacted-text');
    if (redactedText) {
      ScrollTrigger.create({
        trigger: redactedText,
        start: 'top 80%',
        onEnter: () => redactedText.classList.add('revealed')
      });
    }

    // --- ARSENAL ACCORDION ---
    document.querySelectorAll('.arsenal-item').forEach(item => {
      const header = item.querySelector('.arsenal-header');
      header.addEventListener('click', () => {
        item.classList.toggle('active');
      });
    });

    // --- LIVE UPLINK: NUMBER COUNTERS ---
    gsap.utils.toArray('.stat-value').forEach(elem => {
      gsap.from(elem, {
        textContent: 0,
        duration: 2,
        ease: 'power1.inOut',
        snap: { textContent: 1 },
        scrollTrigger: { trigger: elem, start: 'top 90%' }
      });
    });

    // --- THREE.JS GLOBE ---
    const container = document.getElementById('globe-container');
    if (container) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);

      // Earth Globe
      const geometry = new THREE.SphereGeometry(3, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: 0x00d9ff, wireframe: true });
      const globe = new THREE.Mesh(geometry, material);
      scene.add(globe);

      // Anomaly markers
      const anomalyGeom = new THREE.SphereGeometry(0.05, 8, 8);
      const anomalyMat = new THREE.MeshBasicMaterial({ color: 0xff2a6d });
      for (let i = 0; i < 10; i++) {
        const anomaly = new THREE.Mesh(anomalyGeom, anomalyMat);
        const phi = Math.random() * Math.PI;
        const theta = Math.random() * 2 * Math.PI;
        anomaly.position.setFromSphericalCoords(3.1, phi, theta);
        globe.add(anomaly);
      }

      camera.position.z = 7;

      function animate() {
        requestAnimationFrame(animate);
        globe.rotation.y += 0.002;
        renderer.render(scene, camera);
      }
      animate();

      // Mouse interaction for globe tilt
      let mouseX = 0, mouseY = 0;
      container.addEventListener('mousemove', e => {
        const rect = container.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) / rect.width * 2 - 1;
        mouseY = -(e.clientY - rect.top) / rect.height * 2 + 1;
        gsap.to(camera.position, {
          x: mouseX * 2,
          y: mouseY * 2,
          duration: 1,
          ease: 'power2.out',
          onUpdate: () => camera.lookAt(scene.position)
        });
      });

      // Handle window resize for Three.js
      window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      });
    }
  }
});