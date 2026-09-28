// Roster composition per sport. Change counts here to reshape the squad
// without touching player data or screens.

export const POSITIONS = {
  basketball: [
    { key: 'PG', label: 'Point Guard', count: 1 },
    { key: 'SG', label: 'Shooting Guard', count: 1 },
    { key: 'SF', label: 'Small Forward', count: 1 },
    { key: 'PF', label: 'Power Forward', count: 1 },
    { key: 'C', label: 'Center', count: 1 },
    { key: 'HC', label: 'Head Coach', count: 1, isCoach: true },
  ],
  football: [
    { key: 'GK', label: 'Goalkeeper', count: 1 },
    { key: 'DEF', label: 'Defender', count: 4 },
    { key: 'MID', label: 'Midfielder', count: 4 },
    { key: 'FWD', label: 'Forward', count: 2 },
    { key: 'HC', label: 'Head Coach', count: 1, isCoach: true },
  ],
};

export const SPORT_LABELS = {
  basketball: 'Μπάσκετ',
  football: 'Ποδόσφαιρο',
};

// Competitions available per sport — drives the league selector on Setup
// and filters the player pool in the draft.
export const LEAGUES = {
  basketball: [
    { key: 'EuroLeague', label: 'EuroLeague' },
    { key: 'Greek Basket League', label: 'Ελληνικό Πρωτάθλημα' },
  ],
  football: [
    { key: 'Super League Greece', label: 'Super League' },
    { key: 'UCL', label: 'UCL' },
  ],
};

export const SEASONS = ['2026-2027', '2025-2026', '2024-2025'];
export const CURRENT_SEASON = SEASONS[0];

export function totalSlots(sport) {
  return POSITIONS[sport].reduce((sum, p) => sum + p.count, 0);
}

// Given a sport and a position key, is it a coach slot?
export function isCoachPosition(sport, positionKey) {
  const def = POSITIONS[sport].find((p) => p.key === positionKey);
  return !!def?.isCoach;
}
