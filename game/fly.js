(function () {
  'use strict';

  const canvas = document.getElementById('fly-canvas');
  const shell = document.getElementById('fly-shell');
  if (!canvas || !shell) return;

  const ctx = canvas.getContext('2d');
  const STORAGE_KEY = 'wasabi-fly-best';
  const assetBase = shell.dataset.assetBase || '';

  const hudScore = document.getElementById('fly-hud-score');
  const hudBest = document.getElementById('fly-hud-best');
  const overlayStart = document.getElementById('fly-overlay-start');
  const overlayGameover = document.getElementById('fly-overlay-gameover');
  const goScore = document.getElementById('fly-go-score');
  const goBest = document.getElementById('fly-go-best');
  const goMsg = document.getElementById('fly-go-msg');

  const mascot = new Image();
  mascot.src = assetBase + '123.png';

  let W, H, dpr;
  let state = 'idle';
  let score = 0;
  let best = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
  let lastTime = 0;
  let pipes = [];
  let pipeTimer = 0;
  const keys = {};

  let player = { x: 0, y: 0, w: 48, h: 48, vy: 0 };
  const GRAVITY = 0.35;
  const FLAP = -7.5;
  const PIPE_GAP = 130;
  const PIPE_W = 52;

  if (hudBest) hudBest.textContent = best;

  function resize() {
    const rect = shell.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    player.x = W * 0.22;
  }

  function resetGame() {
    score = 0;
    pipes = [];
    pipeTimer = 0;
    player.y = H / 2 - player.h / 2;
    player.vy = 0;
    if (hudScore) hudScore.textContent = '0';
  }

  function spawnPipe() {
    const minGap = 80;
    const maxTop = H - PIPE_GAP - minGap;
    const topH = minGap + Math.random() * Math.max(40, maxTop - minGap);
    pipes.push({ x: W + 20, topH, scored: false });
  }

  function flap() {
    if (state === 'idle') startGame();
    else if (state === 'playing') player.vy = FLAP;
  }

  function startGame() {
    resetGame();
    state = 'playing';
    overlayStart.classList.add('hidden');
    overlayGameover.classList.add('hidden');
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function endGame() {
    state = 'over';
    if (score > best) {
      best = score;
      localStorage.setItem(STORAGE_KEY, String(best));
      if (hudBest) hudBest.textContent = best;
    }
    if (goScore) goScore.textContent = score;
    if (goBest) goBest.textContent = best;
    if (goMsg) {
      goMsg.textContent = score >= best && score > 0
        ? 'New high score! Spicy pilot.'
        : 'Crashed into the chilis. Try again.';
    }
    overlayGameover.classList.remove('hidden');
    window.dispatchEvent(new CustomEvent('wasabi-game-over', {
      detail: { score, best, game: 'fly' },
    }));
  }

  function update(dt) {
    player.vy += GRAVITY * (dt / 16);
    player.vy = Math.min(player.vy, 10);
    player.y += player.vy * (dt / 16);

    if (player.y < 0 || player.y + player.h > H) {
      endGame();
      return;
    }

    pipeTimer += dt;
    if (pipeTimer >= 1800) {
      pipeTimer = 0;
      spawnPipe();
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= 2.8 * (dt / 16);

      const px = player.x + 8;
      const py = player.y + 8;
      const pw = player.w - 16;
      const ph = player.h - 16;

      if (px + pw > p.x && px < p.x + PIPE_W) {
        if (py < p.topH || py + ph > p.topH + PIPE_GAP) {
          endGame();
          return;
        }
      }

      if (!p.scored && p.x + PIPE_W < player.x) {
        p.scored = true;
        score++;
        if (hudScore) hudScore.textContent = score;
        window.dispatchEvent(new CustomEvent('wasabi-game-update', {
          detail: { score, best, game: 'fly' },
        }));
      }

      if (p.x + PIPE_W < -20) pipes.splice(i, 1);
    }
  }

  function drawPipe(x, topH) {
    ctx.fillStyle = '#FF6B00';
    ctx.fillRect(Math.floor(x), 0, PIPE_W, Math.floor(topH));
    ctx.fillRect(Math.floor(x), Math.floor(topH + PIPE_GAP), PIPE_W, H);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(Math.floor(x), Math.floor(topH) - 8, PIPE_W, 8);
    ctx.fillRect(Math.floor(x), Math.floor(topH + PIPE_GAP), PIPE_W, 8);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.floor(x) + 0.5, 0.5, PIPE_W - 1, Math.floor(topH) - 1);
    ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(topH + PIPE_GAP) + 0.5, PIPE_W - 1, H - Math.floor(topH + PIPE_GAP) - 1);
  }

  function draw() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(111,255,0,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
      ctx.stroke();
    }

    for (const p of pipes) drawPipe(p.x, p.topH);

    const rot = Math.max(-0.4, Math.min(0.5, player.vy * 0.04));
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
    ctx.rotate(rot);
    ctx.imageSmoothingEnabled = false;
    if (mascot.complete) {
      ctx.drawImage(mascot, -player.w / 2, -player.h / 2, player.w, player.h);
    } else {
      ctx.fillStyle = '#6FFF00';
      ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);
    }
    ctx.restore();
  }

  function loop(now) {
    if (state !== 'playing') return;
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('mousedown', flap);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); flap(); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault();
      flap();
    }
  });

  document.getElementById('fly-btn-start')?.addEventListener('click', startGame);
  document.getElementById('fly-btn-retry')?.addEventListener('click', startGame);

  window.addEventListener('resize', () => {
    resize();
    if (state === 'idle' || state === 'over') draw();
  });

  resize();
  draw();
})();
