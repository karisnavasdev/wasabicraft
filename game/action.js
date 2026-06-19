(function () {
  'use strict';

  const canvas = document.getElementById('action-canvas');
  const shell = document.getElementById('action-shell');
  if (!canvas || !shell) return;

  const ctx = canvas.getContext('2d');
  const STORAGE_KEY = 'wasabi-dash-best';
  const assetBase = shell.dataset.assetBase || '';

  const hudScore = document.getElementById('action-hud-score');
  const hudBest = document.getElementById('action-hud-best');
  const overlayStart = document.getElementById('action-overlay-start');
  const overlayGameover = document.getElementById('action-overlay-gameover');
  const goScore = document.getElementById('action-go-score');
  const goBest = document.getElementById('action-go-best');
  const goMsg = document.getElementById('action-go-msg');

  const mascot = new Image();
  mascot.src = assetBase + '123.png';

  let W, H, dpr;
  let state = 'idle';
  let score = 0;
  let best = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
  let lastTime = 0;
  let obstacles = [];
  let coins = [];
  let spawnTimer = 0;
  let speed = 4;
  const keys = {};

  let player = { x: 0, y: 0, w: 56, h: 56, vy: 0, grounded: true, jumpVel: -11 };

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
    player.x = W * 0.15;
    player.y = H - player.h - 24;
  }

  function resetGame() {
    score = 0;
    speed = 4;
    obstacles = [];
    coins = [];
    spawnTimer = 0;
    player.y = H - player.h - 24;
    player.vy = 0;
    player.grounded = true;
    if (hudScore) hudScore.textContent = '0';
  }

  function jump() {
    if (state === 'idle') { startGame(); return; }
    if (state !== 'playing') return;
    if (player.grounded) {
      player.vy = player.jumpVel;
      player.grounded = false;
    }
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
    const finalScore = Math.floor(score);
    if (finalScore > best) {
      best = finalScore;
      localStorage.setItem(STORAGE_KEY, String(best));
      if (hudBest) hudBest.textContent = best;
    }
    if (goScore) goScore.textContent = finalScore;
    if (goBest) goBest.textContent = best;
    if (goMsg) {
      goMsg.textContent = finalScore >= best && finalScore > 0
        ? 'New record! Absolute unit.'
        : 'Hit a chili. Dash again.';
    }
    overlayGameover.classList.remove('hidden');
    window.dispatchEvent(new CustomEvent('wasabi-game-over', {
      detail: { score: finalScore, best, game: 'action' },
    }));
  }

  function spawnObstacle() {
    const groundY = H - 24;
    const type = Math.random() < 0.35 ? 'fly' : 'ground';
    if (type === 'ground') {
      obstacles.push({ x: W + 20, y: groundY - 36, w: 28, h: 36, type: 'ground' });
    } else {
      obstacles.push({ x: W + 20, y: groundY - 100 - Math.random() * 60, w: 32, h: 32, type: 'fly' });
    }
    if (Math.random() < 0.5) {
      coins.push({ x: W + 40, y: groundY - 70 - Math.random() * 50, r: 10, taken: false });
    }
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    const pad = 6;
    return ax + pad < bx + bw - pad && ax + aw - pad > bx + pad &&
           ay + pad < by + bh - pad && ay + ah - pad > by + pad;
  }

  function update(dt) {
    const mult = dt / 16;
    speed = 4 + score * 0.05;

    if (!player.grounded) {
      player.vy += 0.55 * mult;
      player.y += player.vy * mult;
    }
    const groundY = H - player.h - 24;
    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.grounded = true;
    }

    spawnTimer += dt;
    if (spawnTimer >= Math.max(900, 1600 - score * 8)) {
      spawnTimer = 0;
      spawnObstacle();
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed * mult;
      if (rectsOverlap(player.x, player.y, player.w, player.h, o.x, o.y, o.w, o.h)) {
        endGame();
        return;
      }
      if (o.x + o.w < -20) obstacles.splice(i, 1);
    }

    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.x -= speed * mult;
      const cx = player.x + player.w / 2;
      const cy = player.y + player.h / 2;
      const dist = Math.hypot(cx - c.x, cy - c.y);
      if (!c.taken && dist < player.w / 2 + c.r) {
        c.taken = true;
        score += 10;
        if (hudScore) hudScore.textContent = score;
        window.dispatchEvent(new CustomEvent('wasabi-game-update', {
          detail: { score, best, game: 'action' },
        }));
        coins.splice(i, 1);
        continue;
      }
      if (c.x < -20) coins.splice(i, 1);
    }

    score += 0.02 * mult;
    const displayScore = Math.floor(score);
    if (hudScore) hudScore.textContent = displayScore;
  }

  function drawGround() {
    const groundY = H - 24;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, groundY, W, 24);
    ctx.fillStyle = '#6FFF00';
    for (let x = 0; x < W; x += 16) {
      ctx.fillRect(x, groundY, 8, 4);
    }
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 0.5);
    ctx.lineTo(W, groundY + 0.5);
    ctx.stroke();
  }

  function draw() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(111,255,0,0.08)';
    for (let x = 0; x < W; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
      ctx.stroke();
    }

    drawGround();

    for (const o of obstacles) {
      ctx.fillStyle = o.type === 'fly' ? '#FF4444' : '#FF6B00';
      ctx.fillRect(Math.floor(o.x), Math.floor(o.y), o.w, o.h);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(Math.floor(o.x) + 0.5, Math.floor(o.y) + 0.5, o.w - 1, o.h - 1);
      if (o.type === 'ground') {
        ctx.font = '20px serif';
        ctx.fillText('🌶️', o.x + 2, o.y + 26);
      }
    }

    for (const c of coins) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.stroke();
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (mascot.complete) {
      ctx.drawImage(mascot, Math.round(player.x), Math.round(player.y), player.w, player.h);
    } else {
      ctx.fillStyle = '#6FFF00';
      ctx.fillRect(Math.round(player.x), Math.round(player.y), player.w, player.h);
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

  canvas.addEventListener('mousedown', jump);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault();
      jump();
    }
  });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  document.getElementById('action-btn-start')?.addEventListener('click', startGame);
  document.getElementById('action-btn-retry')?.addEventListener('click', startGame);

  window.addEventListener('resize', () => {
    resize();
    if (state === 'idle' || state === 'over') draw();
  });

  resize();
  draw();
})();
