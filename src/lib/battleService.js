// Client-side service for battle APIs

export async function startBattle({ mode, userLevel }) {
  const res = await fetch('/api/battle/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, userLevel }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Start battle ${res.status}: ${text}`);
  }
  return res.json();
}

export async function submitBattle({ code, questionId, mode, timeSpent, aiCode }) {
  const res = await fetch('/api/battle/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, questionId, mode, timeSpent, aiCode }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Submit battle ${res.status}: ${text}`);
  }
  return res.json();
}

export async function startAiCodeStream({ provider = 'openai', prompt, starterCode, difficulty, matchId, questionId, typingSpeed = 50 }) {
  const apiUrl = provider === 'gemini' ? '/api/battle/gemini-code' : '/api/battle/ai-code';
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, starterCode, difficulty, matchId, questionId, typingSpeed }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Start AI stream ${res.status}: ${text}`);
  }
  return res;
}
