const canvas = document.querySelector("#confetti");
const button = document.querySelector("#celebrateButton");
const music = document.querySelector("#backgroundMusic");
const musicToggle = document.querySelector("#musicToggle");
const luckyNumber = document.querySelector("#luckyNumber");
const luckyNumberButton = document.querySelector("#luckyNumberButton");
const ctx = canvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let width = 0;
let height = 0;
let pieces = [];
let animationFrame = 0;

const colors = ["#d94f61", "#f07866", "#f6b7a9", "#e8a84d", "#647a4d", "#fff7ec"];

function updateMusicButton(isPlaying, needsAction = false) {
  musicToggle.classList.toggle("is-playing", isPlaying);
  musicToggle.classList.toggle("needs-action", needsAction);
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicToggle.innerHTML = isPlaying
    ? '<span aria-hidden="true">♪</span> 暂停音乐'
    : '<span aria-hidden="true">♪</span> 播放音乐';
}

async function playMusic({ userStarted = false } = {}) {
  try {
    music.volume = 0.55;
    await music.play();
    updateMusicButton(true, false);
  } catch {
    updateMusicButton(false, !userStarted);
  }
}

function toggleMusic() {
  if (music.paused) {
    playMusic({ userStarted: true });
  } else {
    music.pause();
    updateMusicButton(false, false);
  }
}

function generateLuckyNumber() {
  const value = Math.floor(Math.random() * 10000);
  luckyNumber.textContent = String(value).padStart(4, "0");
}

function resizeCanvas() {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function createPiece(originX, originY) {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.25;
  const speed = 5 + Math.random() * 7;
  const shape = Math.random() > 0.68 ? "heart" : "petal";

  return {
    x: originX,
    y: originY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    gravity: 0.16 + Math.random() * 0.08,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.22,
    size: 7 + Math.random() * 9,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 0,
    maxLife: 85 + Math.random() * 45,
    shape
  };
}

function drawHeart(piece) {
  const size = piece.size / 15;
  ctx.beginPath();
  for (let t = 0; t <= Math.PI * 2; t += 0.24) {
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    const px = x * size;
    const py = y * size;
    if (t === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

function drawPetal(piece) {
  ctx.beginPath();
  ctx.ellipse(0, 0, piece.size * 0.42, piece.size, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPiece(piece) {
  ctx.save();
  ctx.translate(piece.x, piece.y);
  ctx.rotate(piece.rotation);
  ctx.globalAlpha = Math.max(0, 1 - piece.life / piece.maxLife);
  ctx.fillStyle = piece.color;

  if (piece.shape === "heart") {
    drawHeart(piece);
  } else {
    drawPetal(piece);
  }

  ctx.restore();
}

function tick() {
  ctx.clearRect(0, 0, width, height);

  pieces = pieces.filter((piece) => {
    piece.life += 1;
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.vy += piece.gravity;
    piece.vx *= 0.992;
    piece.rotation += piece.spin;

    drawPiece(piece);

    return piece.life < piece.maxLife && piece.y < height + 40;
  });

  if (pieces.length) {
    animationFrame = requestAnimationFrame(tick);
  } else {
    animationFrame = 0;
    ctx.clearRect(0, 0, width, height);
  }
}

function burstConfetti(sourceElement = button) {
  if (reduceMotion.matches) {
    sourceElement.classList.add("is-loved");
    window.setTimeout(() => sourceElement.classList.remove("is-loved"), 600);
    return;
  }

  const rect = sourceElement.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  const count = width < 520 ? 72 : 112;

  for (let index = 0; index < count; index += 1) {
    pieces.push(createPiece(originX, originY));
  }

  if (!animationFrame) {
    animationFrame = requestAnimationFrame(tick);
  }
}

window.addEventListener("resize", resizeCanvas);
button.addEventListener("click", () => burstConfetti(button));
musicToggle.addEventListener("click", toggleMusic);
luckyNumberButton.addEventListener("click", generateLuckyNumber);
document.addEventListener(
  "pointerdown",
  (event) => {
    if (event.target.closest("#musicToggle")) {
      return;
    }

    if (music.paused) {
      playMusic({ userStarted: true });
    }
  },
  { once: true }
);

resizeCanvas();
generateLuckyNumber();
playMusic();
window.setTimeout(() => {
  if (document.hasFocus()) {
    burstConfetti(button);
  }
}, 700);
