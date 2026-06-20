(function () {
  'use strict';

  const GAMES = [
    { id: 'catch', label: 'CATCH', key: 'wasabi-catch-best', page: 'game/index.html' },
    { id: 'fly', label: 'FLY', key: 'wasabi-fly-best', page: 'game/fly.html' },
    { id: 'cards', label: 'CARDS', key: 'wasabi-cards-best', page: 'game/cards.html' },
    { id: 'action', label: 'DASH', key: 'wasabi-dash-best', page: 'game/action.html' },
  ];

  const CHAMP_KEY = 'wasabi-championship-best';
  const X_PROFILE = 'https://x.com/WasabiCraft';
  const ANNOUNCEMENT = 'https://x.com/WasabiCraft/status/2068168033491726484';
  const SITE_URL = 'https://wasabicraft.fun';

  function loadBest(key) {
    return parseInt(localStorage.getItem(key) || '0', 10) || 0;
  }

  function getTopScore() {
    const scores = GAMES.map((g) => ({ game: g, score: loadBest(g.key) }));
    const champ = loadBest(CHAMP_KEY);
    scores.push({ game: { id: 'champ', label: 'CHAMPIONSHIP', page: '#championship-zone' }, score: champ });
    return scores.reduce((best, row) => (row.score > best.score ? row : best), { score: 0, game: GAMES[0] });
  }

  function buildSubmitUrl(gameLabel, score) {
    const text = '🏆 My $WASABICRAFT high score on ' + gameLabel + ': ' + score +
      '! Play at wasabicraft.fun — Top Player Rewards: 50/30/15 SOL @WasabiCraft';
    return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) +
      '&url=' + encodeURIComponent(SITE_URL);
  }

  function renderScoreCards() {
    const grid = document.getElementById('rewards-scores-grid');
    if (!grid) return;

    grid.innerHTML = GAMES.map((g) => {
      const score = loadBest(g.key);
      return (
        '<div class="rewards-score-card">' +
          '<span class="rewards-score-game">' + g.label + '</span>' +
          '<span class="rewards-score-val" id="rewards-score-' + g.id + '">' + score.toLocaleString() + '</span>' +
          '<a href="' + g.page + '" class="rewards-score-play">PLAY</a>' +
          (score > 0
            ? '<a href="' + buildSubmitUrl(g.label, score) + '" target="_blank" rel="noopener noreferrer" class="rewards-score-submit">SUBMIT</a>'
            : '<span class="rewards-score-submit rewards-score-submit-disabled">SUBMIT</span>') +
        '</div>'
      );
    }).join('') +
      '<div class="rewards-score-card rewards-score-card-champ">' +
        '<span class="rewards-score-game">CHAMP</span>' +
        '<span class="rewards-score-val" id="rewards-score-champ">' + loadBest(CHAMP_KEY).toLocaleString() + '</span>' +
        '<a href="#championship-zone" class="rewards-score-play">PLAY</a>' +
        (loadBest(CHAMP_KEY) > 0
          ? '<a href="' + buildSubmitUrl('CHAMPIONSHIP', loadBest(CHAMP_KEY)) + '" target="_blank" rel="noopener noreferrer" class="rewards-score-submit">SUBMIT</a>'
          : '<span class="rewards-score-submit rewards-score-submit-disabled">SUBMIT</span>') +
      '</div>';
  }

  function updateTopSubmit() {
    const top = getTopScore();
    const btn = document.getElementById('rewards-submit-top');
    const label = document.getElementById('rewards-top-game');
    const val = document.getElementById('rewards-top-score');
    if (label) label.textContent = top.game.label || '—';
    if (val) val.textContent = top.score.toLocaleString();
    if (btn) {
      if (top.score > 0) {
        btn.href = buildSubmitUrl(top.game.label, top.score);
        btn.classList.remove('rewards-btn-disabled');
        btn.removeAttribute('aria-disabled');
      } else {
        btn.href = '#rewards-scores-grid';
        btn.classList.add('rewards-btn-disabled');
        btn.setAttribute('aria-disabled', 'true');
      }
    }
  }

  function refresh() {
    renderScoreCards();
    updateTopSubmit();
  }

  document.getElementById('rewards-announce-link')?.setAttribute('href', ANNOUNCEMENT);
  document.getElementById('rewards-x-link')?.setAttribute('href', X_PROFILE);

  refresh();

  window.addEventListener('wasabi-game-over', refresh);
  window.addEventListener('wasabi-championship-complete', refresh);
  window.addEventListener('storage', refresh);
  window.addEventListener('focus', refresh);

  window.wasabiRewards = { buildSubmitUrl, refresh };
})();
