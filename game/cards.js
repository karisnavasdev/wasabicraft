(function () {
  'use strict';

  const root = document.getElementById('cards-game');
  if (!root) return;

  const STORAGE_KEY = 'wasabi-cards-best';
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const currentCardEl = document.getElementById('cards-current');
  const nextCardEl = document.getElementById('cards-next');
  const streakEl = document.getElementById('cards-streak');
  const bestEl = document.getElementById('cards-best');
  const msgEl = document.getElementById('cards-msg');
  const btnHigher = document.getElementById('cards-btn-higher');
  const btnLower = document.getElementById('cards-btn-lower');
  const btnStart = document.getElementById('cards-btn-start');
  const btnRetry = document.getElementById('cards-btn-retry');
  const overlayStart = document.getElementById('cards-overlay-start');
  const overlayGameover = document.getElementById('cards-overlay-gameover');
  const goStreak = document.getElementById('cards-go-streak');
  const goBest = document.getElementById('cards-go-best');

  let deck = [];
  let current = null;
  let next = null;
  let streak = 0;
  let best = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
  let playing = false;

  if (bestEl) bestEl.textContent = best;

  function cardValue(card) {
    if (card.rank === 'A') return 1;
    if (card.rank === 'J') return 11;
    if (card.rank === 'Q') return 12;
    if (card.rank === 'K') return 13;
    return parseInt(card.rank, 10);
  }

  function buildDeck() {
    const d = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        d.push({ suit, rank, red: suit === '♥' || suit === '♦' });
      }
    }
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }

  function drawCard() {
    if (deck.length < 2) deck = buildDeck();
    return deck.pop();
  }

  function renderCard(el, card, hidden) {
    if (!el) return;
    if (!card) {
      el.innerHTML = '<span class="card-back">?</span>';
      el.className = 'playing-card card-hidden';
      return;
    }
    el.className = 'playing-card' + (card.red ? ' card-red' : ' card-black');
    if (hidden) {
      el.innerHTML = '<span class="card-back">W</span>';
      el.classList.add('card-hidden');
    } else {
      el.innerHTML =
        '<span class="card-rank">' + card.rank + '</span>' +
        '<span class="card-suit">' + card.suit + '</span>';
      el.classList.remove('card-hidden');
    }
  }

  function setMsg(text, type) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = 'cards-msg' + (type ? ' cards-msg-' + type : '');
  }

  function startGame() {
    deck = buildDeck();
    streak = 0;
    playing = true;
    current = drawCard();
    next = drawCard();
    if (streakEl) streakEl.textContent = '0';
    renderCard(currentCardEl, current, false);
    renderCard(nextCardEl, next, true);
    setMsg('Higher or lower than ' + current.rank + '?', '');
    overlayStart?.classList.add('hidden');
    overlayGameover?.classList.add('hidden');
    btnHigher.disabled = false;
    btnLower.disabled = false;
  }

  function endGame(won) {
    playing = false;
    btnHigher.disabled = true;
    btnLower.disabled = true;
    if (streak > best) {
      best = streak;
      localStorage.setItem(STORAGE_KEY, String(best));
      if (bestEl) bestEl.textContent = best;
    }
    renderCard(nextCardEl, next, false);
    if (goStreak) goStreak.textContent = streak;
    if (goBest) goBest.textContent = best;
    setMsg(won ? 'Correct!' : 'Wrong! Streak ended.', won ? 'win' : 'lose');
    overlayGameover?.classList.remove('hidden');
    window.dispatchEvent(new CustomEvent('wasabi-game-over', {
      detail: { score: streak, best, game: 'cards' },
    }));
  }

  function guess(higher) {
    if (!playing || !current || !next) return;

    renderCard(nextCardEl, next, false);
    const cur = cardValue(current);
    const nxt = cardValue(next);
    const correct = higher ? nxt >= cur : nxt <= cur;

    if (nxt === cur) {
      setMsg('Tie — streak continues!', 'win');
      streak++;
    } else if (correct) {
      streak++;
      setMsg('Correct! +' + streak, 'win');
    } else {
      endGame(false);
      return;
    }

    if (streakEl) streakEl.textContent = streak;
    window.dispatchEvent(new CustomEvent('wasabi-game-update', {
      detail: { score: streak, best, game: 'cards' },
    }));

    setTimeout(() => {
      if (!playing) return;
      current = next;
      next = drawCard();
      renderCard(currentCardEl, current, false);
      renderCard(nextCardEl, next, true);
      setMsg('Higher or lower than ' + current.rank + '?', '');
    }, 600);
  }

  btnStart?.addEventListener('click', startGame);
  btnRetry?.addEventListener('click', startGame);
  btnHigher?.addEventListener('click', () => guess(true));
  btnLower?.addEventListener('click', () => guess(false));
})();
