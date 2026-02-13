const canvas = document.getElementById("heartCanvas");
const ctx = canvas.getContext("2d");
const ponyModeToggle = document.getElementById("ponyModeToggle");
const fullscreenButton = document.getElementById("fullscreenButton");

const state = {
  particles: [],
  pointer: { x: 0, y: 0, force: 0 },
  ripples: [],
  t: 0,
  ponyMode: false,
  targets: [],
  dpr: Math.min(window.devicePixelRatio || 1, 2),
};

const textCanvas = document.createElement("canvas");
const textCtx = textCanvas.getContext("2d");

// Source: Twemoji unicorn SVG (https://github.com/twitter/twemoji/blob/master/assets/svg/1f984.svg)
const PONY_OUTLINE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill="#fff" d="M36 19.854C33.518 9.923 25.006 1.909 16.031 6.832c0 0-4.522-1.496-5.174-1.948-.635-.44-1.635-.904-.912.436.423.782.875 1.672 2.403 3.317C8 12.958 9.279 18.262 7.743 21.75c-1.304 2.962-2.577 4.733-1.31 6.976 1.317 2.33 4.729 3.462 7.018 1.06 1.244-1.307.471-1.937 3.132-4.202 2.723-.543 4.394-1.791 4.394-4.375 0 0 .795-.382 1.826 6.009.456 2.818-.157 5.632-.039 8.783H36V19.854z"/></svg>`;

let ponyImagePromise;

function ensurePonyImage() {
  if (ponyImagePromise) return ponyImagePromise;

  ponyImagePromise = new Promise((resolve) => {
    const ponyImage = new Image();
    ponyImage.onload = () => resolve(ponyImage);
    ponyImage.onerror = () => resolve(null);
    ponyImage.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PONY_OUTLINE_SVG)}`;
  });

  return ponyImagePromise;
}

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

  if (state.pointer.force > 0) {
    state.pointer.x = Math.min(canvas.width, Math.max(0, state.pointer.x));
    state.pointer.y = Math.min(canvas.height, Math.max(0, state.pointer.y));
  }
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

function buildPonyTargets(ponyImage) {
  if (!ponyImage) return buildTextTargets();

  textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);

  const size = Math.min(canvas.width * 0.46, canvas.height * 0.64);
  const drawWidth = size;
  const drawHeight = size;
  const offsetX = (canvas.width - drawWidth) / 2;
  const offsetY = (canvas.height - drawHeight) / 2;

  textCtx.drawImage(ponyImage, offsetX, offsetY, drawWidth, drawHeight);

  const pixels = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height).data;
  const points = [];
  const gap = Math.max(10, Math.floor(canvas.width / 82));

  for (let y = gap; y < canvas.height - gap; y += gap) {
    for (let x = gap; x < canvas.width - gap; x += gap) {
      const index = (y * canvas.width + x) * 4 + 3;
      const alpha = pixels[index];
      if (alpha < 70) continue;

      const left = pixels[(y * canvas.width + (x - gap)) * 4 + 3];
      const right = pixels[(y * canvas.width + (x + gap)) * 4 + 3];
      const up = pixels[((y - gap) * canvas.width + x) * 4 + 3];
      const down = pixels[((y + gap) * canvas.width + x) * 4 + 3];
      const isEdge = left < 70 || right < 70 || up < 70 || down < 70;

      if (isEdge || Math.random() < 0.08) {
        points.push({ x, y });
      }
    }
  }

  return points;
}

async function rebuildParticles(resetPositions = false) {
  const ponyImage = state.ponyMode ? await ensurePonyImage() : null;
  state.targets = state.ponyMode ? buildPonyTargets(ponyImage) : buildTextTargets();

  const count = state.ponyMode
    ? Math.min(420, Math.max(150, state.targets.length))
    : Math.min(1050, Math.max(220, state.targets.length));

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

function drawHeartShape() {
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(0, 2, -7, -4, -12, -1);
  ctx.bezierCurveTo(-16, 1.5, -15.5, 8, -12, 11.5);
  ctx.lineTo(0, 22);
  ctx.lineTo(12, 11.5);
  ctx.bezierCurveTo(15.5, 8, 16, 1.5, 12, -1);
  ctx.bezierCurveTo(7, -4, 0, 2, 0, 6);
  ctx.closePath();
}

function drawHeart(x, y, size, glow = 0, tone = 0) {
  ctx.save();
  ctx.translate(x, y);
  const scale = size / 18;
  ctx.scale(scale, scale);

  ctx.shadowBlur = 8 + glow;
  ctx.shadowColor = `rgba(255, 98, 173, ${0.7 + glow / 25})`;
  ctx.fillStyle = `hsl(${335 + glow + tone}, 100%, ${65 + glow / 2}%)`;

  drawHeartShape();
  ctx.fill();

  ctx.restore();
}

function applyPointerInfluence(x, y, strength = 1.2) {
  state.pointer.x = x;
  state.pointer.y = y;
  state.pointer.force = Math.max(state.pointer.force, strength);
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
    const targetPull = state.ponyMode ? 0.021 : 0.017;
    const jitter = Math.sin(state.t * 2.4 + particle.phase) * (state.ponyMode ? 0.2 : 0.34);

    particle.vx += (particle.target.x - particle.x) * targetPull;
    particle.vy += (particle.target.y - particle.y) * targetPull;

    const dx = particle.x - state.pointer.x;
    const dy = particle.y - state.pointer.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (state.pointer.force > 0.001 && dist < 180 * state.dpr) {
      const push = (180 * state.dpr - dist) / (180 * state.dpr);
      const force = 1.4 * state.pointer.force;
      particle.vx += (dx / dist) * push * force;
      particle.vy += (dy / dist) * push * force;
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

    particle.vx *= state.ponyMode ? 0.9 : 0.88;
    particle.vy *= state.ponyMode ? 0.9 : 0.88;

    particle.x += particle.vx + jitter;
    particle.y += particle.vy + jitter * 0.6;

    const glow = Math.min(18, Math.abs(particle.vx) + Math.abs(particle.vy) + 2);
    const ponyTone = state.ponyMode ? -22 : 0;
    drawHeart(particle.x, particle.y, particle.size, glow * 0.8 + particle.hueShift * 0.04, ponyTone);
  });

  state.pointer.force *= 0.93;
  if (state.pointer.force < 0.003) {
    state.pointer.force = 0;
  }

  requestAnimationFrame(animate);
}

function updatePointer(event, strength = 1.2, createRipple = false, magnitude = 1.6) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  applyPointerInfluence(x, y, strength);

  if (createRipple) {
    addRipple(state.pointer.x, state.pointer.y, magnitude);
  }
}

canvas.addEventListener("mousemove", (event) => updatePointer(event, 0.85));
canvas.addEventListener("click", (event) => {
  updatePointer(event, 2.2, true, 2);
});

canvas.addEventListener(
  "touchmove",
  (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    updatePointer({ clientX: touch.clientX, clientY: touch.clientY }, 1.05);
  },
  { passive: true },
);

canvas.addEventListener(
  "touchstart",
  (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    updatePointer({ clientX: touch.clientX, clientY: touch.clientY }, 2.4, true, 2);
  },
  { passive: true },
);

ponyModeToggle.addEventListener("change", async (event) => {
  state.ponyMode = event.target.checked;
  await rebuildParticles(true);
  addRipple(canvas.width / 2, canvas.height / 2, 2.4);
});

fullscreenButton?.addEventListener("click", async () => {
  const fullscreenTarget = document.documentElement;

  try {
    if (!document.fullscreenElement) {
      if (fullscreenTarget.requestFullscreen) {
        await fullscreenTarget.requestFullscreen();
      } else if (fullscreenTarget.webkitRequestFullscreen) {
        fullscreenTarget.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  } catch {
    // Ignore fullscreen errors from unsupported contexts.
  }
  setTimeout(() => {
    setCanvasSize();
    rebuildParticles(false);
  }, 120);
});

document.addEventListener("fullscreenchange", () => {
  setCanvasSize();
  rebuildParticles(false);
});

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
