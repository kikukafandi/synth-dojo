// Client-side service for Battle Hints API
export async function fetchHint({ prompt, userCode = "", aiCode = "", difficulty = 1 }) {
  const res = await fetch('/api/battle/hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, userCode, aiCode, difficulty }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Hint API ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data?.hints || null;
}
