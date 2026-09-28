import { POSITIONS } from '../data/positions';

// Returns the remaining budget for a manager given their transfers.
export function getBalance(manager, transfers) {
  const spent = transfers
    .filter((t) => t.managerId === manager.id)
    .reduce((sum, t) => sum + t.price, 0);
  return Math.round((manager.budget - spent) * 100) / 100;
}

// Returns { [positionKey]: { filled, total, remaining } } for a manager.
export function getSlotSummary(sport, managerId, transfers) {
  const defs = POSITIONS[sport];
  const summary = {};
  defs.forEach((d) => {
    const filled = transfers.filter(
      (t) => t.managerId === managerId && t.position === d.key
    ).length;
    summary[d.key] = { ...d, filled, remaining: d.count - filled };
  });
  return summary;
}

export function isRosterFull(sport, managerId, transfers) {
  const summary = getSlotSummary(sport, managerId, transfers);
  return Object.values(summary).every((s) => s.remaining <= 0);
}

// Central validation used before confirming a transfer.
// Returns { ok: true } or { ok: false, reason: string }.
export function validateTransfer({
  sport,
  manager,
  person,
  price,
  transfers,
}) {
  if (!manager) return { ok: false, reason: 'Επίλεξε παίκτη.' };
  if (!person) return { ok: false, reason: 'Επίλεξε παίκτη ή προπονητή.' };
  if (!(price > 0)) return { ok: false, reason: 'Μη έγκυρη τιμή.' };

  const alreadyOwned = transfers.some(
    (t) => t.managerId === manager.id && t.personId === person.id
  );
  if (alreadyOwned) {
    return { ok: false, reason: 'Ο παίκτης ανήκει ήδη σε αυτή την ομάδα.' };
  }

  const takenElsewhere = transfers.some((t) => t.personId === person.id);
  if (takenElsewhere) {
    return { ok: false, reason: 'Αυτός ο παίκτης έχει ήδη αγοραστεί.' };
  }

  const balance = getBalance(manager, transfers);
  if (price > balance) {
    return {
      ok: false,
      reason: `Υπέρβαση υπολοίπου (διαθέσιμο ${balance.toFixed(2)}€).`,
    };
  }

  const summary = getSlotSummary(sport, manager.id, transfers);
  const slot = summary[person.position];
  if (!slot || slot.remaining <= 0) {
    return {
      ok: false,
      reason: `Δεν υπάρχει διαθέσιμη θέση (${person.position}).`,
    };
  }

  return { ok: true };
}
