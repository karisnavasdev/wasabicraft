(function () {
  'use strict';

  const CHAMP_SESSION_KEY = 'wasabi-championship-session';
  const CHAMP_BEST_KEY = 'wasabi-championship-best';
  const CHAMP_LAST_KEY = 'wasabi-championship-last';

  const ROUNDS = [
    { id: 'catch', label: 'CATCH', page: 'index.html' },
    { id: 'fly', label: 'FLY', page: 'fly.html' },
    { id: 'cards', label: 'CARDS', page: 'cards.html' },
    { id: 'action', label: 'DASH', page: 'action.html' },
  ];

  function loadSession() {
    try {
      return JSON.parse(sessionStorage.getItem(CHAMP_SESSION_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  function saveSession(data) {
    sessionStorage.setItem(CHAMP_SESSION_KEY, JSON.stringify(data));
  }

  function clearSession() {
    sessionStorage.removeItem(CHAMP_SESSION_KEY);
  }

  function isActive() {
    const s = loadSession();
    return !!(s && s.active);
  }

  function getCurrentRound() {
    const s = loadSession();
    if (!s || !s.active) return null;
    return ROUNDS[s.round] || null;
  }

  function startRun() {
    saveSession({ active: true, round: 0, scores: {} });
    const base = window.location.pathname.includes('/game/') ? '' : 'game/';
    window.location.href = base + ROUNDS[0].page + '?champ=1';
  }

  function finishRun(scores) {
    const total = ROUNDS.reduce((sum, r) => sum + (scores[r.id] || 0), 0);
    const best = parseInt(localStorage.getItem(CHAMP_BEST_KEY) || '0', 10) || 0;
    const isNewBest = total > best;
    if (isNewBest) localStorage.setItem(CHAMP_BEST_KEY, String(total));
    localStorage.setItem(CHAMP_LAST_KEY, JSON.stringify({ scores, total, date: Date.now() }));
    clearSession();
    sessionStorage.setItem('wasabi-championship-done', JSON.stringify({ scores, total, isNewBest, best: isNewBest ? total : best }));
    const home = window.location.pathname.includes('/game/') ? '../' : './';
    window.location.href = home + '#championship-zone';
  }

  function handleGameOver(gameId, score) {
    const session = loadSession();
    if (!session || !session.active) return false;

    const expected = ROUNDS[session.round];
    if (!expected || expected.id !== gameId) return false;

    session.scores[gameId] = score || 0;
    session.round += 1;

    if (session.round >= ROUNDS.length) {
      finishRun(session.scores);
      return true;
    }

    saveSession(session);
    setTimeout(() => {
      window.location.href = ROUNDS[session.round].page + '?champ=1';
    }, 1200);
    return true;
  }

  function consumeDonePayload() {
    const raw = sessionStorage.getItem('wasabi-championship-done');
    if (!raw) return null;
    sessionStorage.removeItem('wasabi-championship-done');
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  window.wasabiChampRun = {
    ROUNDS,
    isActive,
    getCurrentRound,
    startRun,
    handleGameOver,
    consumeDonePayload,
    loadSession,
  };
})();
