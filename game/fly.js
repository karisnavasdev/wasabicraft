(function () {
  'use strict';

  const canvas = document.getElementById('fly-canvas');
  const shell = document.getElementById('fly-shell');
  if (!canvas || !shell) return;

  const ctx = canvas.getContext('2d');
  const STORAGE_KEY = 'wasabi-fly-best';
  const assetBase = shell.dataset.assetBase || '';

  const hudScore = document.getElementById('fly-hud-score');
  const hudKills = document.getElementById('fly-hud-kills');
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
  let kills = 0;
  let best = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
  let lastTime = 0;
  let pipes = [];
  let enemies = [];
  let bullets = [];
  let particles = [];
  let pipeTimer = 0;
  let fireCooldown = 0;
  let pipeGap = 180;
  let pipeW = 44;
  const keys = {};

  let player = { x: 0, y: 0, w: 48, h: 48, vy: 0 };
  const GRAVITY = 0.32;
  const FLAP = -7.2;
  const FIRE_RATE = 180;

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
    player.x = W * 0.18;
    pipeGap = Math.max(200, Math.floor(H * 0.52));
    pipeW = Math.max(36, Math.floor(W * 0.1));
  }

  function resetGame() {
    score = 0;
    kills = 0;
    pipes = [];
    enemies = [];
    bullets = [];
    particles = [];
    pipeTimer = 0;
    fireCooldown = 0;
    player.y = H / 2 - player.h / 2;
    player.vy = 0;
    if (hudScore) hudScore.textContent = '0';
    if (hudKills) hudKills.textContent = '0';
  }

  function spawnPipe() {
    const margin = 60;
    const maxTop = H - pipeGap - margin;
    const topH = margin + Math.random() * Math.max(80, maxTop - margin);
    const pipe = { x: W + 30, topH, scored: false, hp: 2 };
    pipes.push(pipe);
    if (Math.random() < 0.55) {
      const gapY = topH + pipeGap * (0.25 + Math.random() * 0.5);
      enemies.push({
        x: pipe.x + pipeW + 30 + Math.random() * 40,
        y: gapY,
        w: 30,
        h: 30,
        vx: -1.2,
        vy: Math.sin(Math.random() * Math.PI * 2) * 0.8,
        hp: 1,
        kind: 'chili',
      });
    }
  }

  function spawnFloatEnemy() {
    enemies.push({
      x: W + 20,
      y: 50 + Math.random() * (H - 100),
      w: 32,
      h: 32,
      vx: -2.4,
      vy: 0,
      hp: 1,
      kind: 'flyer',
    });
  }

  function flap() {
    if (state === 'idle') startGame();
    else if (state === 'playing') player.vy = FLAP;
  }

  function fire() {
    if (state !== 'playing' || fireCooldown > 0) return;
    fireCooldown = FIRE_RATE;
    bullets.push({
      x: player.x + player.w,
      y: player.y + player.h / 2 - 3,
      w: 14,
      h: 6,
      vx: 9,
    });
  }

  function startGame() {
    resetGame();
    state = 'playing';
    overlayStart.classList.add('hidden');
    overlayGameover.classList.add('hidden');
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function addScore(n) {
    score += n;
    if (hudScore) hudScore.textContent = score;
    window.dispatchEvent(new CustomEvent('wasabi-game-update', {
      detail: { score, best, game: 'fly' },
    }));
  }

  function spawnBurst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1,
        decay: 0.04 + Math.random() * 0.03,
        color,
        size: 2 + Math.random() * 3,
      });
    }
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
        ? 'New high score! Spicy ace pilot.'
        : 'Crashed into the chilis. Try again.';
    }
    overlayGameover.classList.remove('hidden');
    window.dispatchEvent(new CustomEvent('wasabi-game-over', {
      detail: { score, best, game: 'fly' },
    }));
  }

  function hitPlayerBox(ax, ay, aw, ah) {
    const pad = 6;
    const px = player.x + pad;
    const py = player.y + pad;
    const pw = player.w - pad * 2;
    const ph = player.h - pad * 2;
    return px < ax + aw && px + pw > ax && py < ay + ah && py + ph > ay;
  }

  function rectsHit(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function update(dt) {
    const step = dt / 16;
    player.vy += GRAVITY * step;
    player.vy = Math.min(player.vy, 9);
    player.y += player.vy * step;

    if (player.y < 0 || player.y + player.h > H) {
      endGame();
      return;
    }

    if (fireCooldown > 0) fireCooldown -= dt;

    pipeTimer += dt;
    if (pipeTimer >= 2400) {
      pipeTimer = 0;
      spawnPipe();
      if (Math.random() < 0.35) spawnFloatEnemy();
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * step;
      if (b.x > W + 20) {
        bullets.splice(i, 1);
        continue;
      }

      let hit = false;
      for (let j = pipes.length - 1; j >= 0 && !hit; j--) {
        const p = pipes[j];
        const topBox = { x: p.x, y: 0, w: pipeW, h: p.topH };
        const botBox = { x: p.x, y: p.topH + pipeGap, w: pipeW, h: H };
        if (rectsHit(b.x, b.y, b.w, b.h, topBox.x, topBox.y, topBox.w, topBox.h) ||
            rectsHit(b.x, b.y, b.w, b.h, botBox.x, botBox.y, botBox.w, botBox.h)) {
          p.hp--;
          spawnBurst(b.x, b.y, '#FFD700', 6);
          bullets.splice(i, 1);
          hit = true;
          if (p.hp <= 0) {
            spawnBurst(p.x + pipeW / 2, p.topH + pipeGap / 2, '#FF6B00', 14);
            pipes.splice(j, 1);
            addScore(8);
            kills++;
            if (hudKills) hudKills.textContent = kills;
          } else {
            addScore(2);
          }
        }
      }

      if (hit) continue;

      for (let j = enemies.length - 1; j >= 0; j--) {
        const en = enemies[j];
        if (rectsHit(b.x, b.y, b.w, b.h, en.x, en.y, en.w, en.h)) {
          spawnBurst(en.x + en.w / 2, en.y + en.h / 2, '#FF4444', 10);
          enemies.splice(j, 1);
          bullets.splice(i, 1);
          addScore(5);
          kills++;
          if (hudKills) hudKills.textContent = kills;
          break;
        }
      }
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= 2.2 * step;

      if (hitPlayerBox(p.x, 0, pipeW, p.topH) ||
          hitPlayerBox(p.x, p.topH + pipeGap, pipeW, H - p.topH - pipeGap)) {
        endGame();
        return;
      }

      if (!p.scored && p.x + pipeW < player.x) {
        p.scored = true;
        addScore(1);
      }

      if (p.x + pipeW < -30) pipes.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const en = enemies[i];
      en.x += en.vx * step;
      en.y += en.vy * step;
      if (en.kind === 'chili') en.y += Math.sin(performance.now() / 200 + i) * 0.4;

      if (hitPlayerBox(en.x, en.y, en.w, en.h)) {
        endGame();
        return;
      }

      if (en.x + en.w < -20) enemies.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * step;
      p.y += p.vy * step;
      p.life -= p.decay * step;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawPipe(p) {
    const x = Math.floor(p.x);
    const topH = Math.floor(p.topH);
    const dmg = p.hp < 2;
    ctx.fillStyle = dmg ? '#CC5500' : '#FF6B00';
    ctx.fillRect(x, 0, pipeW, topH);
    ctx.fillRect(x, topH + pipeGap, pipeW, H);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x, topH - 6, pipeW, 6);
    ctx.fillRect(x, topH + pipeGap, pipeW, 6);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 0.5, 0.5, pipeW - 1, topH - 1);
    ctx.strokeRect(x + 0.5, topH + pipeGap + 0.5, pipeW - 1, H - topH - pipeGap - 1);
    if (dmg) {
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 8, topH - 20, 12, 12);
      ctx.fillRect(x + 20, topH + pipeGap + 10, 10, 10);
    }
  }

  function drawEnemy(en) {
    ctx.font = en.kind === 'flyer' ? '22px serif' : '20px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌶️', en.x + en.w / 2, en.y + en.h / 2);
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

    for (const p of pipes) drawPipe(p);
    for (const en of enemies) drawEnemy(en);

    for (const b of bullets) {
      ctx.fillStyle = '#6FFF00';
      ctx.fillRect(Math.floor(b.x), Math.floor(b.y), b.w, b.h);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(Math.floor(b.x) + b.w - 3, Math.floor(b.y), 3, b.h);
    }

    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    const rot = Math.max(-0.35, Math.min(0.45, player.vy * 0.04));
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

    if (fireCooldown > 0 && state === 'playing') {
      ctx.fillStyle = 'rgba(111,255,0,0.15)';
      ctx.fillRect(player.x + player.w - 4, player.y + player.h / 2 - 2, 8, 4);
    }
  }

  function loop(now) {
    if (state !== 'playing') return;
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) { fire(); return; }
    flap();
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length > 1) fire();
    else flap();
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault();
      flap();
    }
    if (e.key === 'x' || e.key === 'X' || e.key === 'z' || e.key === 'Z' ||
        e.key === 'ArrowDown' || e.key === 'Shift') {
      e.preventDefault();
      fire();
    }
  });

  document.getElementById('fly-btn-start')?.addEventListener('click', startGame);
  document.getElementById('fly-btn-retry')?.addEventListener('click', startGame);
  document.getElementById('fly-btn-attack')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state === 'idle') startGame();
    fire();
  });

  window.addEventListener('resize', () => {
    resize();
    if (state === 'idle' || state === 'over') draw();
  });

  resize();
  draw();
})();
