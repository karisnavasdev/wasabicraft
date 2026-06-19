// ── Token config ──
const WASABI_CA = '2pL9J9mTD9RAGS9jnNeB2kKR62ar8pnQAV2sMgyrpump';
const WASABI_PUMP_URL = 'https://pump.fun/coin/' + WASABI_CA;

// ── Deco canvas (cheese + chili emojis) ──
const decoCanvas = document.getElementById('deco-canvas');
const dctx = decoCanvas.getContext('2d');

function resizeDeco() {
  decoCanvas.width = window.innerWidth;
  decoCanvas.height = window.innerHeight;
}
resizeDeco();
window.addEventListener('resize', resizeDeco);

// Pre-render emojis to offscreen canvases once — much faster than fillText every frame
const EMOJI_SIZE = 48;
function makeEmojiSprite(emoji) {
  const oc = document.createElement('canvas');
  oc.width = oc.height = EMOJI_SIZE;
  const ox = oc.getContext('2d');
  ox.font = `${EMOJI_SIZE * 0.85}px serif`;
  ox.textAlign = 'center';
  ox.textBaseline = 'middle';
  ox.fillText(emoji, EMOJI_SIZE / 2, EMOJI_SIZE / 2);
  return oc;
}
const sprites = {
  cheese: makeEmojiSprite('🧀'),
  chili:  makeEmojiSprite('🌶️'),
};

class DecoParticle {
  constructor(initial) {
    this.reset(initial);
  }
  reset(initial) {
    this.sprite = Math.random() > 0.5 ? sprites.cheese : sprites.chili;
    this.x = Math.random() * window.innerWidth;
    this.y = initial ? Math.random() * window.innerHeight : -60;
    this.scale = Math.random() * 0.45 + 0.3;
    this.rot = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.012;
    this.vy = Math.random() * 0.4 + 0.2;
    this.vx = (Math.random() - 0.5) * 0.2;
    this.sway = Math.random() * Math.PI * 2;
    this.swaySpeed = Math.random() * 0.006 + 0.003;
    this.swayAmt = Math.random() * 0.5 + 0.2;
    this.opacity = Math.random() * 0.3 + 0.45;
  }
  update() {
    this.y += this.vy;
    this.x += this.vx + Math.sin(this.sway) * this.swayAmt;
    this.sway += this.swaySpeed;
    this.rot += this.rotSpeed;
    if (this.y > window.innerHeight + 80) this.reset(false);
  }
  draw() {
    const half = (EMOJI_SIZE * this.scale) / 2;
    dctx.save();
    dctx.globalAlpha = this.opacity;
    dctx.translate(this.x, this.y);
    dctx.rotate(this.rot);
    dctx.drawImage(this.sprite, -half, -half, EMOJI_SIZE * this.scale, EMOJI_SIZE * this.scale);
    dctx.restore();
  }
}

const decoParticles = Array.from({ length: 18 }, (_, i) => new DecoParticle(i < 14));

function animateDeco() {
  dctx.clearRect(0, 0, decoCanvas.width, decoCanvas.height);
  decoParticles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animateDeco);
}
animateDeco();

// ── Fire canvas (cursor trail) ──
const canvas = document.getElementById('fire-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 6 + 2;
    this.speedX = (Math.random() - 0.5) * 2;
    this.speedY = -(Math.random() * 3 + 1);
    this.life = 1;
    this.decay = Math.random() * 0.04 + 0.02;
    const colors = ['#6FFF00', '#39FF14', '#FFD700', '#FF6B00'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= this.decay;
    this.size *= 0.97;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

window.addEventListener('mousemove', (e) => {
  for (let i = 0; i < 3; i++) {
    particles.push(new Particle(e.clientX, e.clientY));
  }
});

class Ember {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * window.innerWidth;
    this.y = window.innerHeight + 10;
    this.size = Math.random() * 3 + 1;
    this.speedY = -(Math.random() * 1.5 + 0.5);
    this.speedX = (Math.random() - 0.5) * 0.8;
    this.life = 1;
    this.decay = Math.random() * 0.004 + 0.002;
    const colors = ['#6FFF00', '#39FF14', '#FFD700'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.x += this.speedX + Math.sin(Date.now() * 0.001 + this.x) * 0.3;
    this.y += this.speedY;
    this.life -= this.decay;
    if (this.life <= 0 || this.y < -10) this.reset();
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.life * 0.6;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const embers = Array.from({ length: 40 }, () => new Ember());

function animateAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => { p.update(); p.draw(); });
  embers.forEach(e => { e.update(); e.draw(); });
  requestAnimationFrame(animateAll);
}
animateAll();

function copyCA() {
  const ca = WASABI_CA;

  const confirm = () => {
    document.querySelectorAll('#copy-btn, #footer-ca button').forEach(btn => {
      btn.textContent = 'COPIED!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'COPY'; btn.classList.remove('copied'); }, 2000);
    });
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(ca).then(confirm).catch(() => fallbackCopy(ca, confirm));
  } else {
    fallbackCopy(ca, confirm);
  }
}

function fallbackCopy(text, cb) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); cb(); } catch(e) {}
  document.body.removeChild(ta);
}

const meterFill = document.getElementById('spicy-meter-fill');
const spicyMascot = document.getElementById('spicy-mascot-icon');

const spicyLevels = [
  { pct: 0,   label: 'MILD',         color: '#6FFF00' },
  { pct: 25,  label: 'HOT',          color: '#AAFF00' },
  { pct: 50,  label: 'SPICY',        color: '#FFD700' },
  { pct: 75,  label: 'FACE MELTING', color: '#FF6B00' },
  { pct: 100, label: 'ASCENDED',     color: '#FF0000' },
];

function updateSpicyMeter() {
  const scrollable = document.body.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return;
  const pct = Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));

  meterFill.style.height = pct + '%';

  const level = spicyLevels.reduce((prev, curr) => pct >= curr.pct ? curr : prev);

  meterFill.style.background = `linear-gradient(to top, #6FFF00, ${level.color})`;
  meterFill.style.boxShadow = pct > 75 ? `0 0 8px ${level.color}` : 'none';
  spicyMascot.textContent = level.label;
  spicyMascot.title = level.label;
}

window.addEventListener('scroll', updateSpicyMeter, { passive: true });

const meltMessages = [
  'FACE MELTED. YOU ARE NOW NGMI-PROOF.',
  'TOO SPICY. YOUR WALLET IS ON FIRE.',
  'CONGRATULATIONS. YOU ARE FULLY COOKED.',
  'FACE: DISSOLVED. BAGS: HEAVY. VIBES: IMMACULATE.',
  'WARNING: FACE NO LONGER INTACT. BUY MORE WASABI.',
];

let meltTimeout = null;
let meltCleanupTimeout = null;

function meltFace() {
  clearTimeout(meltTimeout);
  clearTimeout(meltCleanupTimeout);

  meltCount++;
  localStorage.setItem('meltCount', meltCount);
  updateMeltDisplay();

  const msg = document.getElementById('melt-msg');

  document.body.classList.remove('shake');
  void document.body.offsetWidth;
  document.body.classList.add('shake');

  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9998;background:radial-gradient(ellipse at center, transparent 40%, rgba(255,107,0,0.4) 100%);animation:fadeFlash 1s ease forwards;';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 1000);

  const mascot = document.getElementById('mascot');
  mascot.style.animation = 'none';
  mascot.style.transform = 'scale(1.3) rotate(10deg)';
  mascot.style.filter = 'drop-shadow(3px 3px 0 #000) drop-shadow(5px 5px 0 rgba(255,107,0,0.8))';

  msg.textContent = meltMessages[Math.floor(Math.random() * meltMessages.length)];
  msg.style.opacity = '1';

  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const x = window.innerWidth / 2 + (Math.random() - 0.5) * 400;
      const y = window.innerHeight / 2 + (Math.random() - 0.5) * 200;
      particles.push(new Particle(x, y));
    }, i * 15);
  }

  meltTimeout = setTimeout(() => {
    document.body.classList.remove('shake');
    mascot.style.transform = '';
    mascot.style.filter = '';
    mascot.style.animation = '';
    msg.style.opacity = '0';
    meltCleanupTimeout = setTimeout(() => { msg.textContent = ''; msg.style.opacity = '1'; }, 500);
  }, 3000);

  if (typeof awardArcade === 'function') awardArcade(50, 25);
}
updateSpicyMeter();

// Scroll reveal
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Faces melted counter
let meltCount = parseInt(localStorage.getItem('meltCount') || '69420', 10);
function updateMeltDisplay() {
  document.getElementById('melt-counter-num').textContent = meltCount.toLocaleString();
}
updateMeltDisplay();

// ── Live Price Data ──
const DEXSCREENER_URL = 'https://api.dexscreener.com/latest/dex/tokens/' + WASABI_CA;

const HEAT_LEVELS = [
  { min: -Infinity, label: 'ICE COLD',     color: '#4499FF', cls: 'heat-0' },
  { min: 0,         label: 'WARMING UP',   color: '#6FFF00', cls: 'heat-1' },
  { min: 10,        label: 'SPICY',        color: '#FFD700', cls: 'heat-2' },
  { min: 30,        label: 'FACE MELTING', color: '#FF6B00', cls: 'heat-3' },
  { min: 100,       label: 'NUCLEAR',      color: '#FF0000', cls: 'heat-4' },
];

function getHeat(change) {
  return [...HEAT_LEVELS].reverse().find(h => change >= h.min) || HEAT_LEVELS[0];
}

function fmtPrice(p) {
  const n = parseFloat(p);
  if (isNaN(n) || n === 0) return '--';
  if (n < 0.000001) return '$' + n.toExponential(2);
  if (n < 0.001)    return '$' + n.toFixed(8);
  if (n < 1)        return '$' + n.toFixed(6);
  return '$' + n.toFixed(4);
}

function fmtUSD(n) {
  if (!n) return '--';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}

async function fetchPriceData() {
  try {
    const res = await fetch(DEXSCREENER_URL);
    const data = await res.json();
    const pair = data.pairs?.[0];
    if (!pair) return;

    const change = parseFloat(pair.priceChange?.h24 || 0);
    const heat = getHeat(change);

    const priceEl   = document.getElementById('ps-price');
    const changeEl  = document.getElementById('ps-change');
    const mcapEl    = document.getElementById('ps-mcap');
    const volEl     = document.getElementById('ps-vol');
    const heatLabel = document.getElementById('ps-heat-label');
    const badgeText = document.getElementById('heat-badge-text');
    const badgeEl   = document.getElementById('heat-badge');
    const mascot    = document.getElementById('mascot');

    if (priceEl)   priceEl.textContent = fmtPrice(pair.priceUsd);
    if (mcapEl)    mcapEl.textContent  = fmtUSD(pair.fdv);
    if (volEl)     volEl.textContent   = fmtUSD(pair.volume?.h24);

    if (changeEl) {
      changeEl.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
      changeEl.style.color = change >= 0 ? '#6FFF00' : '#FF4444';
    }
    if (heatLabel) { heatLabel.textContent = heat.label; heatLabel.style.color = heat.color; }
    if (badgeText) { badgeText.textContent = heat.label; badgeText.style.color = heat.color; }
    if (badgeEl)   badgeEl.style.borderColor = heat.color + '44';

    if (mascot) {
      mascot.classList.remove('heat-0','heat-1','heat-2','heat-3','heat-4');
      mascot.classList.add(heat.cls);
    }
  } catch (e) { /* silently fail */ }
}

fetchPriceData();
setInterval(fetchPriceData, 30000);

// ── Wasabi Roulette ──
function effectMild() {
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9997;background:rgba(111,255,0,0.07);animation:fadeFlash 0.5s ease forwards;';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 600);
}

function effectSpicy() {
  document.body.classList.remove('shake');
  void document.body.offsetWidth;
  document.body.classList.add('shake');
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9997;background:radial-gradient(ellipse at center,transparent 30%,rgba(255,107,0,0.35) 100%);animation:fadeFlash 0.9s ease forwards;';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 900);
  for (let i = 0; i < 40; i++) {
    setTimeout(() => {
      particles.push(new Particle(
        window.innerWidth / 2 + (Math.random() - 0.5) * 500,
        window.innerHeight / 2 + (Math.random() - 0.5) * 300
      ));
    }, i * 12);
  }
}

function effectNuclear() {
  document.body.classList.remove('nuclear-shake');
  void document.body.offsetWidth;
  document.body.classList.add('nuclear-shake');
  setTimeout(() => document.body.classList.remove('nuclear-shake'), 1000);

  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9997;background:radial-gradient(ellipse at center,rgba(255,0,0,0.55) 0%,rgba(0,0,0,0.5) 100%);animation:nuclearFlash 1.5s ease forwards;';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 1500);

  const mascot = document.getElementById('mascot');
  mascot.style.animation = 'none';
  mascot.style.transform = 'scale(1.4) rotate(-8deg)';
  mascot.style.filter = 'drop-shadow(3px 3px 0 #000) drop-shadow(6px 6px 0 rgba(255,0,0,0.8))';
  setTimeout(() => { mascot.style.transform = ''; mascot.style.filter = ''; mascot.style.animation = ''; }, 2000);

  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      particles.push(new Particle(
        window.innerWidth / 2 + (Math.random() - 0.5) * 700,
        window.innerHeight / 2 + (Math.random() - 0.5) * 500
      ));
    }, i * 8);
  }

  const splash = document.createElement('div');
  splash.textContent = 'NUCLEAR';
  splash.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.3);font-family:'Bangers',cursive;font-size:clamp(5rem,15vw,11rem);letter-spacing:8px;color:#FF0000;text-shadow:0 0 40px #FF0000,0 0 80px rgba(255,0,0,0.6);pointer-events:none;z-index:9998;animation:nuclearWord 1.5s ease forwards;";
  document.body.appendChild(splash);
  setTimeout(() => splash.remove(), 1500);
}

const ROULETTE_OUTCOMES = [
  { id: 'mild',    label: 'MILD',    color: '#6FFF00', effect: effectMild,    msgs: ['TOO WEAK. YOUR SINUSES ARE INTACT. SAD.','YOU FELT NOTHING. ARE YOU EVEN HUMAN?','MILD? REALLY? BUY MORE AND TRY AGAIN.'] },
  { id: 'spicy',   label: 'SPICY',   color: '#FFD700', effect: effectSpicy,   msgs: ['YOUR NOSE IS RUNNING. THIS IS NORMAL.','FACE: TINGLING. WALLET: GROWING. THIS IS THE WAY.','SPICY DETECTED. YOU ARE BECOMING BASED.'] },
  { id: 'nuclear', label: 'NUCLEAR', color: '#FF0000', effect: effectNuclear, msgs: ['FACE: DISSOLVED. SINUSES: GONE. BAGS: HEAVY.','YOUR NOSE HAS LEFT YOUR BODY. CONGRATULATIONS.','MAXIMUM WASABI ACHIEVED. YOU CANNOT BE STOPPED.'] },
];

let rouletteSpinning = false;

function spinRoulette() {
  if (rouletteSpinning) return;
  rouletteSpinning = true;

  const btn     = document.getElementById('roulette-btn');
  const display = document.getElementById('roulette-display');
  const msg     = document.getElementById('roulette-msg');

  btn.disabled = true;
  btn.textContent = 'BITING...';
  msg.style.opacity = '0';
  display.className = '';
  display.style.color = '#555';
  display.textContent = '?';

  const rand = Math.random();
  const outcome = rand < 0.15 ? ROULETTE_OUTCOMES[2] : rand < 0.55 ? ROULETTE_OUTCOMES[1] : ROULETTE_OUTCOMES[0];

  const labels = ['MILD','SPICY','NUCLEAR'];
  const colors = { MILD: '#6FFF00', SPICY: '#FFD700', NUCLEAR: '#FF0000' };
  let step = 0;
  const totalSteps = 22;

  function tick() {
    const lbl = labels[step % labels.length];
    display.textContent = lbl;
    display.style.color = colors[lbl];
    step++;
    if (step < totalSteps) {
      setTimeout(tick, 50 + 350 * Math.pow(step / totalSteps, 2.5));
    } else {
      display.className = 'result-' + outcome.id;
      display.textContent = outcome.label;
      display.style.color = outcome.color;
      outcome.effect();
      msg.textContent = outcome.msgs[Math.floor(Math.random() * outcome.msgs.length)];
      msg.style.color = outcome.color;
      msg.style.textShadow = '0 0 20px ' + outcome.color;
      msg.style.opacity = '1';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'TAKE A BITE';
        rouletteSpinning = false;
        if (typeof awardArcade === 'function') awardArcade(20, 15);
        setTimeout(() => {
          display.className = '';
          display.style.color = '#333';
          display.textContent = '?';
          msg.style.opacity = '0';
        }, 3000);
      }, 2000);
    }
  }
  tick();
}

// ── Arcade HUD (coins, XP, best score) ──
const ARCADE_COINS_KEY = 'wasabi-coins';
const ARCADE_XP_KEY = 'wasabi-xp';

function loadArcadeStat(key) {
  return parseInt(localStorage.getItem(key) || '0', 10) || 0;
}

let arcadeCoins = loadArcadeStat(ARCADE_COINS_KEY);
let arcadeXp = loadArcadeStat(ARCADE_XP_KEY);

function saveArcadeStats() {
  localStorage.setItem(ARCADE_COINS_KEY, String(arcadeCoins));
  localStorage.setItem(ARCADE_XP_KEY, String(arcadeXp));
}

function awardArcade(amount, xp) {
  arcadeCoins += amount;
  arcadeXp += xp;
  saveArcadeStats();
  updateArcadeHud();
  flashHudStat('hud-coins');
}

function flashHudStat(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('hud-flash');
  setTimeout(() => el.classList.remove('hud-flash'), 400);
}

function getAllGameBests() {
  const keys = ['wasabi-catch-best', 'wasabi-fly-best', 'wasabi-cards-best', 'wasabi-dash-best'];
  const singles = keys.map((k) => parseInt(localStorage.getItem(k) || '0', 10) || 0);
  const champ = parseInt(localStorage.getItem('wasabi-championship-best') || '0', 10) || 0;
  return singles.concat(champ);
}

function updateArcadeHud() {
  const coinsEl = document.getElementById('hud-coins');
  const xpEl = document.getElementById('hud-xp');
  const bestEl = document.getElementById('hud-best');
  const best = Math.max(0, ...getAllGameBests());
  if (coinsEl) coinsEl.textContent = arcadeCoins.toLocaleString();
  if (xpEl) xpEl.textContent = arcadeXp.toLocaleString();
  if (bestEl) bestEl.textContent = best.toLocaleString();
}

updateArcadeHud();

window.addEventListener('wasabi-game-update', (e) => {
  const { score } = e.detail;
  const coinsEl = document.getElementById('hud-coins');
  if (coinsEl) coinsEl.textContent = (arcadeCoins + score).toLocaleString();
});

window.addEventListener('wasabi-game-over', (e) => {
  if (window.wasabiChampionship?.handleGameOver(e)) return;
  const { score } = e.detail;
  awardArcade(score, Math.floor(score / 5) + 10);
});

window.addEventListener('wasabi-championship-complete', (e) => {
  const { total, isNewBest } = e.detail;
  const bonus = total + (isNewBest ? 200 : 50);
  awardArcade(bonus, Math.floor(total / 3) + 50);
  flashHudStat('hud-best');
  updateArcadeHud();
});

