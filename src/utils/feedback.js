/* ============================================
   Feedback Utilities — Confetti and Haptics
   ============================================ */

/**
 * Triggers haptic feedback via the Web Vibration API if supported.
 * @param {number} duration duration of vibration in milliseconds
 */
export function triggerHaptic(duration = 40) {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      window.navigator.vibrate(duration);
    } catch (e) {
      console.warn('Haptic feedback failed:', e);
    }
  }
}

/**
 * Triggers a full-screen confetti explosion using an on-the-fly HTML5 Canvas.
 */
export function triggerConfetti() {
  if (typeof document === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);

  const colors = [
    '#14b8a6', // Teal
    '#8b5cf6', // Violet
    '#f59e0b', // Amber
    '#f43f5e', // Rose
    '#10b981', // Emerald
    '#0ea5e9', // Sky
  ];

  const particles = [];
  const particleCount = 120;

  // Generate particles shooting from bottom corners or bottom center
  for (let i = 0; i < particleCount; i++) {
    const fromLeft = Math.random() < 0.5;
    particles.push({
      x: fromLeft ? 0 : width,
      y: height - 100,
      vx: fromLeft ? Math.random() * 12 + 6 : -Math.random() * 12 - 6,
      vy: -Math.random() * 18 - 8,
      size: Math.random() * 6 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      opacity: 1,
      gravity: Math.random() * 0.2 + 0.35,
    });
  }

  // Also shoot some particles straight up from bottom middle
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: width / 2,
      y: height + 10,
      vx: (Math.random() - 0.5) * 10,
      vy: -Math.random() * 16 - 10,
      size: Math.random() * 6 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      opacity: 1,
      gravity: Math.random() * 0.2 + 0.35,
    });
  }

  function update() {
    ctx.clearRect(0, 0, width, height);
    let active = false;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98; // Friction
      p.rotation += p.rotationSpeed;

      if (p.y > height && p.vy > 0) {
        p.opacity = 0;
      } else {
        p.opacity -= 0.006;
        if (p.opacity < 0) p.opacity = 0;
      }

      if (p.opacity > 0) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (active) {
      requestAnimationFrame(update);
    } else {
      window.removeEventListener('resize', handleResize);
      canvas.remove();
    }
  }

  update();
}
