const canvas = document.getElementById("heartCanvas");
const ctx = canvas.getContext("2d");
const pulseButton = document.getElementById("pulseButton");

const state = {
  hearts: [],
  pointer: { x: canvas.width / 2, y: canvas.height / 2 },
  ripples: [],
  t: 0,
};

const textCanvas = document.createElement("canvas");
textCanvas.width = canvas.width;
textCanvas.height = canvas.height;
const textCtx = textCanvas.getContext("2d");

function buildTextTargets() {
  textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
  textCtx.fillStyle = "#fff";
  textCtx.textAlign = "center";
  textCtx.font = "bold 180px 'Trebuchet MS', sans-serif";
  textCtx.fillText("Chelsea", canvas.width / 2, canvas.height / 2 + 60);

  const pixels = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height).data;
  const points = [];
  const gap = 11;

  for (let y = 0; y < canvas.height; y += gap) {
    for (let x = 0; x < canvas.width; x += gap) {
      const index = (y * canvas.width + x) * 4 + 3;
      if (pixels[index] > 120) {
        points.push({ x, y });
      }
    }
  }

  return points;
}

const targets = buildTextTargets();
const heartCount = Math.min(950, targets.length);

for (let i = 0; i < heartCount; i += 1) {
  const target = targets[i % targets.length];
  state.hearts.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: 0,
    vy: 0,
    size: 5 + Math.random() * 5,
    target,
    hueShift: Math.random() * 30,
    phase: Math.random() * Math.PI * 2,
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

function addRipple(x, y, magnitude = 1) {
  state.ripples.push({ x, y, radius: 1, speed: 5 + magnitude * 1.8, power: 0.9 + magnitude * 0.5, life: 95 });
}

function animate() {
  state.t += 0.015;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(24, 8, 27, 0.17)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  state.ripples = state.ripples.filter((ripple) => {
    ripple.radius += ripple.speed;
    ripple.life -= 1;

    const alpha = Math.max(0, ripple.life / 95);
    ctx.strokeStyle = `rgba(255, 120, 196, ${alpha * 0.5})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.stroke();

    return ripple.life > 0;
  });

  state.hearts.forEach((heart) => {
    const targetPull = 0.017;
    const jitter = Math.sin(state.t * 2.4 + heart.phase) * 0.34;

    heart.vx += (heart.target.x - heart.x) * targetPull;
    heart.vy += (heart.target.y - heart.y) * targetPull;

    const dx = heart.x - state.pointer.x;
    const dy = heart.y - state.pointer.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (dist < 180) {
      const push = (180 - dist) / 180;
      heart.vx += (dx / dist) * push * 1.4;
      heart.vy += (dy / dist) * push * 1.4;
    }

    for (const ripple of state.ripples) {
      const rx = heart.x - ripple.x;
      const ry = heart.y - ripple.y;
      const rippleDist = Math.hypot(rx, ry) || 1;
      const waveEdge = Math.abs(rippleDist - ripple.radius);

      if (waveEdge < 20) {
        const wave = (1 - waveEdge / 20) * ripple.power;
        heart.vx += (rx / rippleDist) * wave;
        heart.vy += (ry / rippleDist) * wave;
      }
    }

    heart.vx *= 0.88;
    heart.vy *= 0.88;

    heart.x += heart.vx + jitter;
    heart.y += heart.vy + jitter * 0.6;

    const glow = Math.min(18, Math.abs(heart.vx) + Math.abs(heart.vy) + 2);
    drawHeart(heart.x, heart.y, heart.size, glow * 0.8 + heart.hueShift * 0.04);
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

canvas.addEventListener("touchmove", (event) => {
  const touch = event.touches[0];
  if (!touch) return;
  updatePointer({ clientX: touch.clientX, clientY: touch.clientY });
}, { passive: true });

pulseButton.addEventListener("click", () => {
  addRipple(canvas.width / 2, canvas.height / 2, 4);
});

setInterval(() => {
  addRipple(Math.random() * canvas.width, Math.random() * canvas.height, 0.9);
}, 1300);

animate();
