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

  const ROUNDS = [
    { id: 'catch', label: 'CATCH', section: 'play-zone', startId: 'btn-start' },
    { id: 'fly', label: 'FLY', section: 'fly-zone', startId: 'fly-btn-start' },
    { id: 'cards', label: 'CARDS', section: 'cards-zone', startId: 'cards-btn-start' },
    { id: 'action', label: 'DASH', section: 'action-zone', startId: 'action-btn-start' },
  ];

  let active = false;
  let roundIndex = 0;
  let runScores = {};
  let bestTotal = parseInt(localStorage.getItem(CHAMP_BEST_KEY) || '0', 10) || 0;

  const hud = document.getElementById('championship-hud');
  const hudRound = document.getElementById('champ-hud-round');
  const hudTotal = document.getElementById('champ-hud-total');
  const hudSlots = document.getElementById('champ-hud-slots');
  const bestEl = document.getElementById('champ-best-total');
  const lastRunEl = document.getElementById('champ-last-run');
  const rankEl = document.getElementById('champ-rank-title');
  const roundPrompt = document.getElementById('champ-round-prompt');
  const promptTitle = document.getElementById('champ-prompt-title');
  const promptMsg = document.getElementById('champ-prompt-msg');
  const promptBtn = document.getElementById('champ-prompt-btn');
  const resultsModal = document.getElementById('champ-results');
  const resultsTotal = document.getElementById('champ-results-total');
  const resultsBest = document.getElementById('champ-results-best');
  const resultsRank = document.getElementById('champ-results-rank');
  const resultsBreakdown = document.getElementById('champ-results-breakdown');
  const resultsNew = document.getElementById('champ-results-new');

  function getRank(total) {
    return RANKS.find((r) => total >= r.min) || RANKS[RANKS.length - 1];
  }

  function sumRun() {
    return ROUNDS.reduce((s, r) => s + (runScores[r.id] || 0), 0);
  }

  function updateBestDisplay() {
    if (bestEl) bestEl.textContent = bestTotal.toLocaleString();
    const rank = getRank(bestTotal);
    if (rankEl) {
      rankEl.textContent = rank.title;
      rankEl.style.color = rank.color;
    }
  }

  function renderHudSlots() {
    if (!hudSlots) return;
    hudSlots.innerHTML = ROUNDS.map((r, i) => {
      const done = runScores[r.id] !== undefined;
      const current = active && i === roundIndex;
      const score = done ? runScores[r.id] : '—';
      return '<span class="champ-slot' +
        (done ? ' champ-slot-done' : '') +
        (current ? ' champ-slot-current' : '') +
        '"><span class="champ-slot-name">' + r.label + '</span>' +
        '<span class="champ-slot-score">' + score + '</span></span>';
    }).join('');
  }

  function updateHud() {
    if (hudRound) hudRound.textContent = active ? 'ROUND ' + (roundIndex + 1) + '/4' : '—';
    if (hudTotal) hudTotal.textContent = sumRun().toLocaleString();
    renderHudSlots();
  }

  function highlightRound() {
    document.querySelectorAll('.championship-round-active').forEach((el) => {
      el.classList.remove('championship-round-active');
    });
    if (!active || roundIndex >= ROUNDS.length) return;
    const section = document.getElementById(ROUNDS[roundIndex].section);
    section?.classList.add('championship-round-active');
  }

  function scrollToRound() {
    if (roundIndex >= ROUNDS.length) return;
    const section = document.getElementById(ROUNDS[roundIndex].section);
    section?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    highlightRound();
  }

  function showPrompt(title, msg, btnText, onClick) {
    if (!roundPrompt) return;
    if (promptTitle) promptTitle.textContent = title;
    if (promptMsg) promptMsg.textContent = msg;
    if (promptBtn) {
      promptBtn.textContent = btnText;
      promptBtn.onclick = onClick;
    }
    roundPrompt.classList.remove('hidden');
  }

  function hidePrompt() {
    roundPrompt?.classList.add('hidden');
  }

  function showResults(total, isNewBest) {
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
        '<div class="champ-breakdown-row">' +
        '<span>' + r.label + '</span>' +
        '<span>' + (runScores[r.id] || 0).toLocaleString() + '</span></div>'
      ).join('') +
        '<div class="champ-breakdown-row champ-breakdown-total">' +
        '<span>TOTAL</span><span>' + total.toLocaleString() + '</span></div>';
    }
    resultsModal?.classList.remove('hidden');
    if (lastRunEl) {
      lastRunEl.textContent = ROUNDS.map((r) => r.label + ': ' + (runScores[r.id] || 0)).join(' · ');
    }
  }

  function hideResults() {
    resultsModal?.classList.add('hidden');
  }

  function finishChampionship() {
    const total = sumRun();
    const isNewBest = total > bestTotal;
    if (isNewBest) {
      bestTotal = total;
      localStorage.setItem(CHAMP_BEST_KEY, String(bestTotal));
    }
    localStorage.setItem(CHAMP_LAST_KEY, JSON.stringify({
      scores: runScores,
      total,
      date: Date.now(),
    }));

    active = false;
    document.body.classList.remove('championship-active');
    highlightRound();
    hud?.classList.add('hidden');
    updateBestDisplay();
    updateHud();

    showResults(total, isNewBest);

    window.dispatchEvent(new CustomEvent('wasabi-championship-complete', {
      detail: { scores: runScores, total, best: bestTotal, isNewBest, rank: getRank(total) },
    }));
  }

  function advanceAfterRound(score) {
    const round = ROUNDS[roundIndex];
    runScores[round.id] = score;
    updateHud();

    roundIndex++;
    if (roundIndex >= ROUNDS.length) {
      hidePrompt();
      finishChampionship();
      return;
    }

    const next = ROUNDS[roundIndex];
    showPrompt(
      round.label + ' COMPLETE!',
      'Score: ' + score + ' · Championship total: ' + sumRun(),
      'NEXT: ' + next.label + ' →',
      () => {
        hidePrompt();
        goToCurrentRound();
      }
    );
  }

  function goToCurrentRound() {
    scrollToRound();
    updateHud();
    const round = ROUNDS[roundIndex];
    showPrompt(
      'ROUND ' + (roundIndex + 1) + '/4 — ' + round.label,
      'Play ' + round.label + ' and finish the round to continue the championship.',
      'GO TO ' + round.label,
      () => {
        hidePrompt();
        scrollToRound();
        setTimeout(() => {
          document.getElementById(round.startId)?.focus();
        }, 400);
      }
    );
  }

  function startChampionship() {
    active = true;
    roundIndex = 0;
    runScores = {};
    hideResults();
    document.body.classList.add('championship-active');
    hud?.classList.remove('hidden');
    updateHud();
    goToCurrentRound();
    window.dispatchEvent(new CustomEvent('wasabi-championship-start'));
  }

  function handleGameOver(event) {
    if (!active || roundIndex >= ROUNDS.length) return false;
    const { score, game } = event.detail;
    const expected = ROUNDS[roundIndex].id;
    const gameId = game || (expected === 'catch' ? 'catch' : null);
    if (gameId !== expected) return false;

    setTimeout(() => advanceAfterRound(score || 0), 800);
    return true;
  }

  function isActive() {
    return active;
  }

  document.getElementById('champ-btn-start')?.addEventListener('click', startChampionship);
  document.getElementById('champ-results-close')?.addEventListener('click', hideResults);
  document.getElementById('champ-results-retry')?.addEventListener('click', () => {
    hideResults();
    startChampionship();
  });

  promptBtn?.addEventListener('click', () => {});

  updateBestDisplay();
  updateHud();

  const last = localStorage.getItem(CHAMP_LAST_KEY);
  if (last && lastRunEl) {
    try {
      const data = JSON.parse(last);
      lastRunEl.textContent = ROUNDS.map((r) => r.label + ': ' + (data.scores?.[r.id] || 0)).join(' · ') +
        ' · TOTAL: ' + (data.total || 0);
    } catch (_) { /* ignore */ }
  }

  window.wasabiChampionship = {
    isActive,
    handleGameOver,
    startChampionship,
    getRank,
  };
})();
