(function () {
  'use strict';

  const ARCADE_COINS_KEY = 'wasabi-coins';
  const ARCADE_XP_KEY = 'wasabi-xp';
  const SITE_URL = 'https://wasabicraft.fun';

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
  }

  function buildSubmitUrl(gameLabel, score) {
    const text = '🏆 My $WASABICRAFT high score on ' + gameLabel + ': ' + score +
      '! Play at wasabicraft.fun — Top Player Rewards: 50/30/15 SOL @WasabiCraft';
    return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) +
      '&url=' + encodeURIComponent(SITE_URL);
  }

  const GAME_LABELS = { catch: 'CATCH', fly: 'FLY', cards: 'CARDS', action: 'DASH' };

  window.addEventListener('wasabi-game-over', (e) => {
    if (window.wasabiChampRun?.isActive()) return;
    const { score, game } = e.detail;
    awardArcade(score || 0, Math.floor((score || 0) / 5) + 10);

    const label = GAME_LABELS[game];
    const link = document.getElementById('rewards-submit-gameover');
    if (link && label && score > 0) {
      link.href = buildSubmitUrl(label, score);
      link.classList.remove('hidden');
    }
  });

  window.addEventListener('wasabi-championship-complete', (e) => {
    const { total, isNewBest } = e.detail;
    awardArcade(total + (isNewBest ? 200 : 50), Math.floor(total / 3) + 50);
  });

  window.wasabiRewardsSubmit = { buildSubmitUrl };
})();
