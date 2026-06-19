(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const shell = document.getElementById('canvas-shell');
  if (!canvas || !shell) return;

  const ctx = canvas.getContext('2d');
  const STORAGE_KEY = 'wasabi-catch-best';
  const isSubpage = /\/game\/?$/.test(window.location.pathname) ||
    window.location.pathname.endsWith('/game/index.html');

  const hudScore = document.getElementById('hud-score');
  const hudLevel = document.getElementById('hud-level');
  const hudHearts = document.getElementById('hud-hearts');
  const headerHighVal = document.getElementById('header-high-val');

  const overlayStart = document.getElementById('overlay-start');
  const overlayPause = document.getElementById('overlay-pause');
  const overlayGameover = document.getElementById('overlay-gameover');
  const goTitle = document.getElementById('go-title');
  const goMsg = document.getElementById('go-msg');
  const goScore = document.getElementById('go-score');
  const goBest = document.getElementById('go-best');

  const ITEMS = {
    sushi:  { emoji: '🍣', score: 15, weight: 35, bad: false },
    cheese: { emoji: '🧀', score: 5,  weight: 40, bad: false },
    chili:  { emoji: '🌶️', score: 0,  weight: 25, bad: true },
  };

  const COLORS = ['#6FFF00', '#39FF14', '#FFD700', '#FF6B00'];

  let W, H, dpr;
  let state = 'idle';
  let score = 0;
  let lives = 3;
  let level = 1;
  let best = loadBest();
  let lastTime = 0;
  let spawnTimer = 0;
  let difficulty = 1;

  let player = { x: 0, y: 0, w: 80, h: 80, targetX: 0 };
  let items = [];
  let particles = [];
  let floatTexts = [];
  let shakeTimer = 0;
  let flashTimer = 0;
  const keys = {};

  const mascot = new Image();
  mascot.src = (isSubpage ? '../' : '') + '123.png';

  const emojiSprites = {};
  for (const key of Object.keys(ITEMS)) {
    emojiSprites[key] = makeEmojiSprite(ITEMS[key].emoji);
  }

  if (headerHighVal) headerHighVal.textContent = best;
  renderHearts();

  function syncSiteHud() {
    window.dispatchEvent(new CustomEvent('wasabi-game-update', {
      detail: { score, best, level },
    }));
  }

  function loadBest() {
    return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
  }

  function saveBest(val) {
    if (val > best) {
      best = val;
      localStorage.setItem(STORAGE_KEY, String(val));
      if (headerHighVal) headerHighVal.textContent = best;
      syncSiteHud();
    }
  }

  function makeEmojiSprite(emoji) {
    const size = 64;
    const oc = document.createElement('canvas');
    oc.width = oc.height = size;
    const ox = oc.getContext('2d');
    ox.font = `${size * 0.75}px serif`;
    ox.textAlign = 'center';
    ox.textBaseline = 'middle';
    ox.fillText(emoji, size / 2, size / 2);
    return oc;
  }

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
    player.y = H - player.h - 24;
    player.x = W / 2 - player.w / 2;
    player.targetX = player.x;
  }

  function renderHearts() {
    hudHearts.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.className = 'heart' + (i >= lives ? ' lost' : '');
      span.textContent = '❤️';
      hudHearts.appendChild(span);
    }
  }

  function flashHeart() {
    const hearts = hudHearts.querySelectorAll('.heart');
    if (hearts[lives]) {
      hearts[lives].classList.add('hit');
      setTimeout(() => hearts[lives]?.classList.remove('hit'), 400);
    }
  }

  function pickItemType() {
    const total = Object.values(ITEMS).reduce((s, i) => s + i.weight, 0);
    let r = Math.random() * total;
    for (const [key, cfg] of Object.entries(ITEMS)) {
      r -= cfg.weight;
      if (r <= 0) return key;
    }
    return 'cheese';
  }

  function spawnItem() {
    const type = pickItemType();
    const size = 36 + Math.random() * 8;
    items.push({
      type,
      x: size + Math.random() * (W - size * 2),
      y: -size,
      size,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.06,
      vy: (2.2 + level * 0.15 + Math.random() * 0.8) * difficulty,
    });
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        life: 1,
        decay: Math.random() * 0.04 + 0.03,
        size: Math.random() * 5 + 2,
        color,
      });
    }
  }

  function spawnFloatText(x, y, text, color) {
    floatTexts.push({ x, y, text, color, life: 1, vy: -1.5 });
  }

  function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    difficulty = 1;
    items = [];
    particles = [];
    floatTexts = [];
    spawnTimer = 0;
    shakeTimer = 0;
    flashTimer = 0;
    player.x = W / 2 - player.w / 2;
    player.targetX = player.x;
    hudScore.textContent = '0';
    hudLevel.textContent = '1';
    renderHearts();
  }

  function startGame() {
    resetGame();
    state = 'playing';
    overlayStart.classList.add('hidden');
    overlayGameover.classList.add('hidden');
    overlayPause.classList.add('hidden');
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function endGame(won) {
    state = 'over';
    saveBest(score);
    syncSiteHud();
    window.dispatchEvent(new CustomEvent('wasabi-game-over', {
      detail: { score, best, won },
    }));
    goScore.textContent = score;
    goBest.textContent = best;
    if (won) {
      goTitle.textContent = 'SPICY LEGEND';
      goMsg.textContent = 'You caught everything. Absolutely based.';
    } else {
      goTitle.textContent = 'FACE MELTED';
      goMsg.textContent = score >= best && score > 0
        ? 'New high score! But still melted.'
        : 'Too spicy. Try again.';
    }
    overlayGameover.classList.remove('hidden');
  }

  function pauseGame() {
    if (state !== 'playing') return;
    state = 'paused';
    overlayPause.classList.remove('hidden');
  }

  function resumeGame() {
    if (state !== 'paused') return;
    state = 'playing';
    overlayPause.classList.add('hidden');
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    const pad = 6;
    return ax + pad < bx + bw - pad &&
           ax + aw - pad > bx + pad &&
           ay + pad < by + bh - pad &&
           ay + ah - pad > by + pad;
  }

  function update(dt) {
    const lerp = Math.min(1, dt * 0.012);
    const keySpeed = 0.5 * dt;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.targetX -= keySpeed;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.targetX += keySpeed;
    player.x += (player.targetX - player.x) * lerp;
    player.x = Math.max(8, Math.min(W - player.w - 8, player.x));

    spawnTimer += dt;
    const spawnInterval = Math.max(380, 900 - level * 40) / difficulty;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      spawnItem();
      if (Math.random() < 0.25 + level * 0.03) spawnItem();
    }

    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
      level = newLevel;
      hudLevel.textContent = level;
      difficulty = 1 + (level - 1) * 0.08;
      spawnFloatText(W / 2, H / 2, 'LEVEL ' + level, '#FFD700');
    }

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.vy * (dt / 16);
      it.rot += it.rotSpeed * (dt / 16);

      if (rectsOverlap(player.x, player.y, player.w, player.h, it.x - it.size / 2, it.y - it.size / 2, it.size, it.size)) {
        const cfg = ITEMS[it.type];
        if (cfg.bad) {
          lives--;
          renderHearts();
          flashHeart();
          shakeTimer = 300;
          flashTimer = 200;
          spawnParticles(it.x, it.y, '#FF6B00', 16);
          spawnFloatText(it.x, it.y, 'OUCH!', '#FF6B00');
          if (lives <= 0) {
            endGame(false);
            return;
          }
        } else {
          score += cfg.score;
          hudScore.textContent = score;
          syncSiteHud();
          spawnParticles(it.x, it.y, COLORS[Math.floor(Math.random() * COLORS.length)], 10);
          spawnFloatText(it.x, it.y, '+' + cfg.score, '#6FFF00');
        }
        items.splice(i, 1);
        continue;
      }

      if (it.y > H + 60) {
        if (!ITEMS[it.type].bad) {
          spawnFloatText(it.x, H - 40, 'MISS', '#888');
        }
        items.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);
      p.vy += 0.15 * (dt / 16);
      p.life -= p.decay * (dt / 16);
      if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const f = floatTexts[i];
      f.y += f.vy * (dt / 16);
      f.life -= 0.02 * (dt / 16);
      if (f.life <= 0) floatTexts.splice(i, 1);
    }

    if (shakeTimer > 0) shakeTimer -= dt;
    if (flashTimer > 0) flashTimer -= dt;
  }

  function drawBackground() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(111,255,0,0.08)';
    ctx.lineWidth = 1;
    const grid = 16;
    for (let x = 0; x < W; x += grid) {
      ctx.beginPath();
      ctx.moveTo(Math.floor(x) + 0.5, 0);
      ctx.lineTo(Math.floor(x) + 0.5, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, Math.floor(y) + 0.5);
      ctx.lineTo(W, Math.floor(y) + 0.5);
      ctx.stroke();
    }
  }

  function draw() {
    ctx.save();

    if (shakeTimer > 0) {
      const s = shakeTimer / 300;
      ctx.translate((Math.random() - 0.5) * 10 * s, (Math.random() - 0.5) * 6 * s);
    }

    drawBackground();

    if (flashTimer > 0) {
      ctx.fillStyle = `rgba(255,107,0,${flashTimer / 400})`;
      ctx.fillRect(0, 0, W, H);
    }

    for (const it of items) {
      const sprite = emojiSprites[it.type];
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      ctx.drawImage(sprite, -it.size / 2, -it.size / 2, it.size, it.size);
      ctx.restore();
    }

    if (mascot.complete) {
      const bob = Math.sin(performance.now() / 300) * 3;
      const px = Math.round(player.x);
      const py = Math.round(player.y + bob);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(mascot, px, py, player.w, player.h);
      ctx.restore();
    } else {
      const px = Math.round(player.x);
      const py = Math.round(player.y);
      ctx.fillStyle = '#6FFF00';
      ctx.fillRect(px + 8, py + 4, player.w - 16, player.h - 8);
      ctx.fillRect(px + 4, py + 12, player.w - 8, player.h - 20);
      ctx.fillRect(px + 20, py, player.w - 28, 12);
      ctx.fillStyle = '#000';
      ctx.fillRect(px + 24, py + 20, 8, 8);
      ctx.fillRect(px + 48, py + 20, 8, 8);
      ctx.fillRect(px + 28, py + 36, 24, 10);
      ctx.fillStyle = '#FF69B4';
      ctx.fillRect(px + 36, py + 44, 8, 4);
    }

    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.font = 'bold 18px Bangers, cursive';
    ctx.textAlign = 'center';
    for (const f of floatTexts) {
      ctx.globalAlpha = f.life;
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

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

  function setTargetFromClientX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    player.targetX = x - player.w / 2;
  }

  canvas.addEventListener('mousemove', (e) => {
    if (state === 'playing') setTargetFromClientX(e.clientX);
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (state === 'playing' && e.touches[0]) {
      setTargetFromClientX(e.touches[0].clientX);
    }
  }, { passive: false });

  canvas.addEventListener('touchstart', (e) => {
    if (state === 'playing' && e.touches[0]) {
      setTargetFromClientX(e.touches[0].clientX);
    }
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (state === 'playing') pauseGame();
      else if (state === 'paused') resumeGame();
    }
    if (e.key === 'Enter' && state === 'idle') startGame();
  });

  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  document.getElementById('btn-start').addEventListener('click', startGame);
  document.getElementById('btn-retry').addEventListener('click', startGame);
  document.getElementById('btn-resume').addEventListener('click', resumeGame);
  document.getElementById('btn-quit').addEventListener('click', () => {
    state = 'idle';
    overlayPause.classList.add('hidden');
    overlayStart.classList.remove('hidden');
    draw();
  });

  window.addEventListener('resize', () => {
    resize();
    if (state === 'idle' || state === 'over') draw();
  });

  resize();
  draw();
})();
