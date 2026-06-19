(function () {
  'use strict';

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
  }

  window.addEventListener('wasabi-game-over', (e) => {
    if (window.wasabiChampRun?.isActive()) return;
    const { score } = e.detail;
    awardArcade(score || 0, Math.floor((score || 0) / 5) + 10);
  });

  window.addEventListener('wasabi-championship-complete', (e) => {
    const { total, isNewBest } = e.detail;
    awardArcade(total + (isNewBest ? 200 : 50), Math.floor(total / 3) + 50);
  });
})();
