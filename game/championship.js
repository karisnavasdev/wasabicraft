(function () {
  'use strict';

  const CHAMP_BEST_KEY = 'wasabi-championship-best';
  const CHAMP_LAST_KEY = 'wasabi-championship-last';

  const RANKS = [
    { min: 1000, title: 'GRAND CHAMPION', color: '#FFD700' },
    { min: 600, title: 'WASABI WARRIOR', color: '#FF6B00' },
    { min: 300, title: 'HOT SHOT', color: '#39FF14' },
    { min: 100, title: 'SPICY FIGHTER', color: '#6FFF00' },
    { min: 0, title: 'ROOKIE SLIME', color: '#888888' },
  ];

  const ROUNDS = window.wasabiChampRun?.ROUNDS || [
    { id: 'catch', label: 'CATCH' },
    { id: 'fly', label: 'FLY' },
    { id: 'cards', label: 'CARDS' },
    { id: 'action', label: 'DASH' },
  ];

  let bestTotal = parseInt(localStorage.getItem(CHAMP_BEST_KEY) || '0', 10) || 0;

  const bestEl = document.getElementById('champ-best-total');
  const lastRunEl = document.getElementById('champ-last-run');
  const rankEl = document.getElementById('champ-rank-title');
  const resultsModal = document.getElementById('champ-results');
  const resultsTotal = document.getElementById('champ-results-total');
  const resultsBest = document.getElementById('champ-results-best');
  const resultsRank = document.getElementById('champ-results-rank');
  const resultsBreakdown = document.getElementById('champ-results-breakdown');
  const resultsNew = document.getElementById('champ-results-new');

  function getRank(total) {
    return RANKS.find((r) => total >= r.min) || RANKS[RANKS.length - 1];
  }

  function updateBestDisplay() {
    bestTotal = parseInt(localStorage.getItem(CHAMP_BEST_KEY) || '0', 10) || 0;
    if (bestEl) bestEl.textContent = bestTotal.toLocaleString();
    const rank = getRank(bestTotal);
    if (rankEl) {
      rankEl.textContent = rank.title;
      rankEl.style.color = rank.color;
    }
  }

  function showResults(payload) {
    const { scores, total, isNewBest } = payload;
    const rank = getRank(total);
    if (resultsTotal) resultsTotal.textContent = total.toLocaleString();
    if (resultsBest) resultsBest.textContent = bestTotal.toLocaleString();
    if (resultsRank) {
      resultsRank.textContent = rank.title;
      resultsRank.style.color = rank.color;
    }
    if (resultsNew) resultsNew.classList.toggle('hidden', !isNewBest);
    if (resultsBreakdown) {
      resultsBreakdown.innerHTML = ROUNDS.map((r) =>
        '<div class="champ-breakdown-row"><span>' + r.label + '</span><span>' +
        (scores[r.id] || 0).toLocaleString() + '</span></div>'
      ).join('') +
        '<div class="champ-breakdown-row champ-breakdown-total"><span>TOTAL</span><span>' +
        total.toLocaleString() + '</span></div>';
    }
    if (lastRunEl) {
      lastRunEl.textContent = ROUNDS.map((r) => r.label + ': ' + (scores[r.id] || 0)).join(' · ') +
        ' · TOTAL: ' + total;
    }
    resultsModal?.classList.remove('hidden');
    updateBestDisplay();
    window.dispatchEvent(new CustomEvent('wasabi-championship-complete', {
      detail: { scores, total, best: bestTotal, isNewBest, rank },
    }));
  }

  function hideResults() {
    resultsModal?.classList.add('hidden');
  }

  function startChampionship() {
    window.wasabiChampRun?.startRun();
  }

  document.getElementById('champ-btn-start')?.addEventListener('click', startChampionship);
  document.getElementById('champ-results-close')?.addEventListener('click', hideResults);
  document.getElementById('champ-results-retry')?.addEventListener('click', () => {
    hideResults();
    startChampionship();
  });

  updateBestDisplay();

  const last = localStorage.getItem(CHAMP_LAST_KEY);
  if (last && lastRunEl) {
    try {
      const data = JSON.parse(last);
      lastRunEl.textContent = ROUNDS.map((r) => r.label + ': ' + (data.scores?.[r.id] || 0)).join(' · ') +
        ' · TOTAL: ' + (data.total || 0);
    } catch (_) { /* ignore */ }
  }

  const done = window.wasabiChampRun?.consumeDonePayload();
  if (done) {
    updateBestDisplay();
    showResults(done);
    if (location.hash !== '#championship-zone') {
      document.getElementById('championship-zone')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  window.wasabiChampionship = { startChampionship, getRank };
})();
