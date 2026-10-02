const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startOverlay = document.getElementById("startOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const finalScoreEl = document.getElementById("finalScore");

const COLS = 24;
const ROWS = 18;
let cellW = 20;
let cellH = 20;

let snake = [];
let food = { x: 10, y: 8 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let best = Number(localStorage.getItem("nokiaSnakeBest") || 0);
let running = false;
let paused = false;
let timer = null;
let touchStartX = 0;
let touchStartY = 0;

bestEl.textContent = best;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cellW = rect.width / COLS;
  cellH = rect.height / ROWS;
  draw();
}

function resetGame() {
  snake = [
    { x: 8, y: 9 },
    { x: 7, y: 9 },
    { x: 6, y: 9 },
    { x: 5, y: 9 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = score;
  paused = false;
  pauseBtn.textContent = "Ⅱ";
  placeFood();
  draw();
}

function placeFood() {
  let valid = false;
  while (!valid) {
    food.x = Math.floor(Math.random() * COLS);
    food.y = Math.floor(Math.random() * ROWS);
    valid = !snake.some(part => part.x === food.x && part.y === food.y);
  }
}

function startGame() {
  resetGame();
  startOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  running = true;
  startLoop();
}

function startLoop() {
  clearInterval(timer);
  timer = setInterval(update, Math.max(55, 145 - score * 2));
}

function update() {
  if (!running || paused) return;

  direction = nextDirection;
  const head = snake[0];

  // Wrap around all four edges, just like the requested classic behavior.
  const newHead = {
    x: (head.x + direction.x + COLS) % COLS,
    y: (head.y + direction.y + ROWS) % ROWS
  };

  // Snake touching its own tail/body = game over.
  if (snake.some(part => part.x === newHead.x && part.y === newHead.y)) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  if (newHead.x === food.x && newHead.y === food.y) {
    score++;
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      localStorage.setItem("nokiaSnakeBest", best);
    }
    placeFood();
    startLoop();
  } else {
    snake.pop();
  }

  draw();
}

function endGame() {
  running = false;
  clearInterval(timer);
  finalScoreEl.textContent = score;
  gameOverOverlay.classList.remove("hidden");
  draw();
}

function setDirection(dir) {
  if (!running) return;

  const opposite = direction.x + dir.x === 0 && direction.y + dir.y === 0;
  if (opposite) return;

  nextDirection = dir;
}

function drawRoundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function draw() {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  // Dark-blue Nokia-inspired display.
  ctx.fillStyle = "#061a3a";
  ctx.fillRect(0, 0, w, h);

  // Subtle pixel-grid.
  ctx.strokeStyle = "rgba(117, 161, 215, .055)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellW, 0);
    ctx.lineTo(x * cellW, h);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellH);
    ctx.lineTo(w, y * cellH);
    ctx.stroke();
  }

  // Food.
  const fx = food.x * cellW;
  const fy = food.y * cellH;
  const foodSize = Math.max(5, Math.min(cellW, cellH) * .44);
  ctx.fillStyle = "#ff4b61";
  ctx.shadowColor = "rgba(255, 24, 56, .65)";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(fx + cellW / 2, fy + cellH / 2, foodSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Snake: red, growing whenever it eats food.
  snake.forEach((part, index) => {
    const x = part.x * cellW + 2;
    const y = part.y * cellH + 2;
    const sizeW = Math.max(3, cellW - 4);
    const sizeH = Math.max(3, cellH - 4);

    ctx.fillStyle = index === 0 ? "#ff1838" : "#d90b2f";
    drawRoundedRect(x, y, sizeW, sizeH, Math.min(5, cellW * .22));
    ctx.fill();

    if (index === 0) {
      // Small highlight on the head.
      ctx.fillStyle = "rgba(255,255,255,.45)";
      ctx.fillRect(x + sizeW * .25, y + sizeH * .2, Math.max(2, sizeW * .18), Math.max(2, sizeH * .16));
    }
  });
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? "▶" : "Ⅱ";
  if (!paused) draw();
}

// Keyboard controls.
window.addEventListener("keydown", e => {
  const keys = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
    s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
    a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
    d: { x: 1, y: 0 }, D: { x: 1, y: 0 }
  };

  if (keys[e.key]) {
    e.preventDefault();
    setDirection(keys[e.key]);
  }
  if (e.key === " " || e.key === "p" || e.key === "P") {
    e.preventDefault();
    togglePause();
  }
});

// Touch/swipe controls.
canvas.addEventListener("touchstart", e => {
  const t = e.changedTouches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}, { passive: true });

canvas.addEventListener("touchend", e => {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    setDirection({ x: dx > 0 ? 1 : -1, y: 0 });
  } else {
    setDirection({ x: 0, y: dy > 0 ? 1 : -1 });
  }
}, { passive: true });

// On-screen buttons.
document.querySelectorAll(".control[data-dir]").forEach(button => {
  button.addEventListener("pointerdown", e => {
    e.preventDefault();
    const d = button.dataset.dir;
    const dirs = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };
    setDirection(dirs[d]);
  });
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);

window.addEventListener("resize", resizeCanvas);

resetGame();
resizeCanvas();
