const canvas = document.getElementById("heartCanvas");
const ctx = canvas.getContext("2d");
const pulseButton = document.getElementById("pulseButton");
const ponyModeToggle = document.getElementById("ponyModeToggle");
const fullscreenButton = document.getElementById("fullscreenButton");
const app = document.getElementById("app");

const state = {
  particles: [],
  pointer: { x: 0, y: 0 },
  ripples: [],
  t: 0,
  ponyMode: false,
  targets: [],
  dpr: Math.min(window.devicePixelRatio || 1, 2),
};

const textCanvas = document.createElement("canvas");
const textCtx = textCanvas.getContext("2d");

function setCanvasSize() {
  const landscape = window.matchMedia("(orientation: landscape)").matches;
  const availableWidth = Math.min(window.innerWidth * 0.96, 1250);
  const mobileHeight = landscape ? window.innerHeight * 0.7 : window.innerHeight * 0.46;
  const targetHeight = Math.min(window.innerHeight * 0.72, Math.max(300, mobileHeight, availableWidth * 0.58));

  const cssWidth = Math.floor(availableWidth);
  const cssHeight = Math.floor(targetHeight);

  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(cssWidth * state.dpr);
  canvas.height = Math.floor(cssHeight * state.dpr);

  textCanvas.width = canvas.width;
  textCanvas.height = canvas.height;

  state.pointer.x = canvas.width / 2;
  state.pointer.y = canvas.height / 2;
}

function buildTextTargets() {
  textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
  textCtx.fillStyle = "#fff";
  textCtx.textAlign = "center";

  const fontSize = Math.max(72, Math.min(canvas.width * 0.16, canvas.height * 0.4));
  textCtx.font = `700 ${fontSize}px 'Trebuchet MS', sans-serif`;
  textCtx.fillText("Chelsea", canvas.width / 2, canvas.height * 0.58);

  const pixels = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height).data;
  const points = [];
  const gap = Math.max(8, Math.floor(canvas.width / 110));

  for (let y = 0; y < canvas.height; y += gap) {
    for (let x = 0; x < canvas.width; x += gap) {
      const index = (y * canvas.width + x) * 4 + 3;
      if (pixels[index] > 100) points.push({ x, y });
    }
  }

  return points;
}

function rebuildParticles(resetPositions = false) {
  state.targets = buildTextTargets();
  const count = Math.min(1050, Math.max(220, state.targets.length));

  if (state.particles.length > count) {
    state.particles.length = count;
  }

  while (state.particles.length < count) {
    state.particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: 0,
      vy: 0,
      size: 6 + Math.random() * 6,
      hueShift: Math.random() * 30,
      phase: Math.random() * Math.PI * 2,
      target: state.targets[state.particles.length % state.targets.length],
    });
  }

  state.particles.forEach((particle, index) => {
    particle.target = state.targets[index % state.targets.length];

    if (resetPositions) {
      particle.x = Math.random() * canvas.width;
      particle.y = Math.random() * canvas.height;
      particle.vx = 0;
      particle.vy = 0;
    }
  });
}

function drawHeart(x, y, size, glow = 0) {
  ctx.save();
  ctx.translate(x, y);
  const scale = size / 18;
  ctx.scale(scale, scale);

  ctx.shadowBlur = 8 + glow;
  ctx.shadowColor = `rgba(255, 98, 173, ${0.7 + glow / 25})`;
  ctx.fillStyle = `hsl(${335 + glow}, 100%, ${65 + glow / 2}%)`;

  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(0, 2, -7, -4, -12, -1);
  ctx.bezierCurveTo(-16, 1.5, -15.5, 8, -12, 11.5);
  ctx.lineTo(0, 22);
  ctx.lineTo(12, 11.5);
  ctx.bezierCurveTo(15.5, 8, 16, 1.5, 12, -1);
  ctx.bezierCurveTo(7, -4, 0, 2, 0, 6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawPony(x, y, size, glow = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.font = `${Math.max(14, size * 2)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowBlur = 8 + glow;
  ctx.shadowColor = `rgba(255, 174, 214, ${0.72 + glow / 24})`;
  ctx.fillText("🐴", 0, 0);
  ctx.restore();
}

function addRipple(x, y, magnitude = 1) {
  state.ripples.push({ x, y, radius: 1, speed: 5 + magnitude * 1.8, power: 0.9 + magnitude * 0.5, life: 95 });
}

function animate() {
  state.t += 0.015;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = state.ponyMode ? "rgba(31, 13, 36, 0.2)" : "rgba(24, 8, 27, 0.17)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  state.ripples = state.ripples.filter((ripple) => {
    ripple.radius += ripple.speed;
    ripple.life -= 1;

    const alpha = Math.max(0, ripple.life / 95);
    ctx.strokeStyle = state.ponyMode
      ? `rgba(255, 175, 215, ${alpha * 0.56})`
      : `rgba(255, 120, 196, ${alpha * 0.5})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.stroke();

    return ripple.life > 0;
  });

  state.particles.forEach((particle) => {
    const targetPull = 0.017;
    const jitter = Math.sin(state.t * 2.4 + particle.phase) * 0.34;

    particle.vx += (particle.target.x - particle.x) * targetPull;
    particle.vy += (particle.target.y - particle.y) * targetPull;

    const dx = particle.x - state.pointer.x;
    const dy = particle.y - state.pointer.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (dist < 180 * state.dpr) {
      const push = (180 * state.dpr - dist) / (180 * state.dpr);
      particle.vx += (dx / dist) * push * 1.4;
      particle.vy += (dy / dist) * push * 1.4;
    }

    for (const ripple of state.ripples) {
      const rx = particle.x - ripple.x;
      const ry = particle.y - ripple.y;
      const rippleDist = Math.hypot(rx, ry) || 1;
      const waveEdge = Math.abs(rippleDist - ripple.radius);

      if (waveEdge < 20 * state.dpr) {
        const wave = (1 - waveEdge / (20 * state.dpr)) * ripple.power;
        particle.vx += (rx / rippleDist) * wave;
        particle.vy += (ry / rippleDist) * wave;
      }
    }

    particle.vx *= 0.88;
    particle.vy *= 0.88;

    particle.x += particle.vx + jitter;
    particle.y += particle.vy + jitter * 0.6;

    const glow = Math.min(18, Math.abs(particle.vx) + Math.abs(particle.vy) + 2);
    if (state.ponyMode) {
      drawPony(particle.x, particle.y, particle.size, glow * 0.7 + particle.hueShift * 0.02);
    } else {
      drawHeart(particle.x, particle.y, particle.size, glow * 0.8 + particle.hueShift * 0.04);
    }
  });

  requestAnimationFrame(animate);
}

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  state.pointer.x = (event.clientX - rect.left) * scaleX;
  state.pointer.y = (event.clientY - rect.top) * scaleY;
  addRipple(state.pointer.x, state.pointer.y, 0.5);
}

canvas.addEventListener("mousemove", updatePointer);
canvas.addEventListener("click", (event) => {
  updatePointer(event);
  addRipple(state.pointer.x, state.pointer.y, 2);
});

canvas.addEventListener(
  "touchmove",
  (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    updatePointer({ clientX: touch.clientX, clientY: touch.clientY });
  },
  { passive: true },
);

canvas.addEventListener(
  "touchstart",
  (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    updatePointer({ clientX: touch.clientX, clientY: touch.clientY });
    addRipple(state.pointer.x, state.pointer.y, 2);
  },
  { passive: true },
);

ponyModeToggle.addEventListener("change", (event) => {
  state.ponyMode = event.target.checked;
  addRipple(canvas.width / 2, canvas.height / 2, 3.2);
});

fullscreenButton.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await app.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch {
    // Ignore fullscreen errors from unsupported contexts.
  }
  setTimeout(() => {
    setCanvasSize();
    rebuildParticles(false);
  }, 120);
});

pulseButton.addEventListener("click", () => {
  addRipple(canvas.width / 2, canvas.height / 2, 4);
});

setInterval(() => {
  addRipple(Math.random() * canvas.width, Math.random() * canvas.height, 0.9);
}, 1300);

let resizeDebounce;
window.addEventListener("resize", () => {
  clearTimeout(resizeDebounce);
  resizeDebounce = setTimeout(() => {
    setCanvasSize();
    rebuildParticles(false);
  }, 100);
});

window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    setCanvasSize();
    rebuildParticles(false);
  }, 120);
});

setCanvasSize();
rebuildParticles(true);
animate();
