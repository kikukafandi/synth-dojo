// Synth-Dojo Utility Functions
// Common helper functions used across the application

/**
 * Calculates user level based on points
 * @param points - Total points earned
 * @returns Current level
 */
export function calculateLevel(points: number): number {
  // Level formula: sqrt(points / 100)
  return Math.floor(Math.sqrt(points / 100)) + 1;
}

/**
 * Calculates points needed for next level
 * @param currentLevel - Current user level
 * @returns Points needed for next level
 */
export function pointsForNextLevel(currentLevel: number): number {
  return (currentLevel * currentLevel) * 100;
}

/**
 * Formats date to relative time (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHour > 0) return `${diffHour}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'Just now';
}

/**
 * Generates a random room code for matches
 * @returns 6-character room code
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validates email format
 * @param email - Email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Calculates match score based on correctness, speed, and style
 * @param correct - Whether answer is correct
 * @param runtimeMs - Runtime in milliseconds
 * @param styleScore - Code style score (0-100)
 * @param basePoints - Base points for question
 * @returns Total score
 */
export function calculateMatchScore(
  correct: boolean,
  runtimeMs: number,
  styleScore: number,
  basePoints: number = 100
): number {
  if (!correct) return 0;
  
  // Speed bonus (faster = more points, max 50% bonus)
  const speedBonus = Math.max(0, 1 - (runtimeMs / 5000)) * 0.5;
  
  // Style bonus (max 30% bonus)
  const styleBonus = (styleScore / 100) * 0.3;
  
  return Math.floor(basePoints * (1 + speedBonus + styleBonus));
}

/**
 * Determines difficulty level based on user performance history
 * @param winRate - User's win rate (0-1)
 * @param avgScore - Average score
 * @returns Difficulty level (1-5)
 */
export function determineDifficulty(winRate: number, avgScore: number): number {
  if (winRate > 0.8 && avgScore > 80) return 5;
  if (winRate > 0.6 && avgScore > 60) return 4;
  if (winRate > 0.4 && avgScore > 40) return 3;
  if (winRate > 0.2) return 2;
  return 1;
}

/**
 * Update user HP based on match result
 * @param currentHp - Current HP
 * @param won - Whether user won
 * @returns New HP value
 */
export function updateHP(currentHp: number, won: boolean): number {
  if (won) {
    return Math.min(5, currentHp + 1); // Max HP is 5
  } else {
    return Math.max(0, currentHp - 1); // Min HP is 0
  }
}
