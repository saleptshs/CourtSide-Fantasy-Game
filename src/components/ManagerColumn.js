import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import TacticalPitch from './TacticalPitch';
import CourtView from './CourtView';
import { POSITIONS } from '../data/positions';
import { getBalance } from '../utils/validation';
import { useGameDispatch } from '../context/GameContext';
import { haptics } from '../utils/haptics';
import { colors, spacing, radii, fonts, gradients, shadow, managerColor, positionColor } from '../theme/theme';

const COLUMN_WIDTH = 260;

export default function ManagerColumn({ sport, manager, managerIndex, budget, transfers, onUndo, onRequestTrade }) {
  const dispatch = useGameDispatch();
  const [selected, setSelected] = useState(null); // { position, id } — long-pressed slot awaiting a swap target

  const balance = getBalance({ id: manager.id, budget }, transfers);
  const mine = transfers.filter((t) => t.managerId === manager.id);
  const defs = POSITIONS[sport];
  const coachDef = defs.find((d) => d.isCoach);
  const fieldDefs = defs.filter((d) => !d.isCoach);
  const totalSlots = defs.reduce((n, d) => n + d.count, 0);
  const filledSlots = mine.length;
  const spent = mine.reduce((s, t) => s + t.price, 0);
  const avgPrice = filledSlots > 0 ? spent / filledSlots : 0;
  const isComplete = filledSlots >= totalSlots && totalSlots > 0;

  const accent = managerColor(managerIndex);
  const transfersFor = (posKey) => mine.filter((t) => t.position === posKey);

  const pct = budget > 0 ? Math.max(0, Math.min(1, balance / budget)) : 0;
  const balanceColor = pct <= 0 ? colors.danger : pct < 0.2 ? colors.secondary : colors.primary;
  const initials = manager.name.trim().slice(0, 2).toUpperCase();

  // Short tap: undo (unchanged). Long-press a filled slot to pick it up,
  // then tap another slot in the *same* position group to swap their
  // display order — a lightweight stand-in for drag-and-drop that never
  // risks misrepresenting a player's real position.
  const handleSlotPress = (position, slot) => {
    if (selected) {
      if (!slot || selected.id === slot.id) {
        setSelected(null);
        return;
      }
      if (selected.position === position) {
        haptics.select();
        dispatch({ type: 'SWAP_TRANSFER_ORDER', payload: { idA: selected.id, idB: slot.id } });
      } else {
        haptics.warning();
      }
      setSelected(null);
      return;
    }
    if (!slot) return;
    onUndo(slot.id);
  };

  const handleSlotLongPress = (position, slot) => {
    if (!slot) return;
    haptics.select();
    Alert.alert(
      slot.name,
      `${position} · ${slot.price.toFixed(2)}€`,
      [
        { text: 'Άκυρο', style: 'cancel' },
        { text: 'Αλλαγή θέσης εδώ', onPress: () => setSelected({ position, id: slot.id }) },
        {
          text: 'Μεταφορά σε άλλον παίκτη…',
          onPress: () => onRequestTrade?.(slot),
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.column,
        { width: sport === 'football' ? 320 : COLUMN_WIDTH },
        shadow(2, isComplete ? accent + '55' : 'rgba(0,0,0,0.4)'),
      ]}
    >
      <LinearGradient colors={gradients.card} style={StyleSheet.absoluteFill} />
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      {isComplete && (
        <View style={[styles.completeBadge, { backgroundColor: accent }]}>
          <Text style={styles.completeBadgeText}>ΠΛΗΡΕΣ ✓</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceHigh, borderColor: accent }]}>
            <Text style={[styles.avatarText, { color: accent }]}>{initials}</Text>
          </View>
          <View style={{ marginLeft: spacing.xs, flexShrink: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{manager.name}</Text>
            <Text style={[styles.statusLabel, { color: accent }]}>
              {filledSlots}/{totalSlots} SLOTS
            </Text>
          </View>
        </View>
        <View style={[styles.rankPill, { backgroundColor: accent + '1A' }]}>
          <Text style={[styles.rankText, { color: accent }]}>#{managerIndex + 1}</Text>
        </View>
      </View>

      {/* Budget gauge */}
      <View style={styles.gaugeBox}>
        <View style={styles.gaugeRow}>
          <Text style={styles.gaugeLabel}>Υπόλοιπο</Text>
          <Text style={[styles.gaugeValue, { color: balanceColor }]}>
            {balance.toFixed(2)}€ <Text style={styles.gaugeTotal}>/ {budget.toFixed(2)}€</Text>
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: balanceColor }]} />
        </View>
        {filledSlots > 0 && (
          <Text style={styles.avgPriceText}>
            Μέση τιμή/θέση <Text style={{ color: accent, fontFamily: fonts.monoBold }}>{avgPrice.toFixed(2)}€</Text>
          </Text>
        )}
      </View>

      {/* Head coach */}
      {coachDef && (
        <CoachSlot def={coachDef} transfers={transfersFor(coachDef.key)} onUndo={onUndo} />
      )}

      {/* Position stack */}
      {sport === 'football' ? (
        <TacticalPitch
          rows={fieldDefs
            .map((def, i) => ({
              key: def.key,
              label: def.key,
              accentColor: positionColor(i),
              slots: Array.from({ length: def.count }, (_, s) => transfersFor(def.key)[s] || null),
            }))
            .reverse()}
          selectedId={selected?.id}
          onSlotPress={handleSlotPress}
          onSlotLongPress={handleSlotLongPress}
        />
      ) : (
        <CourtView
          slotsByPos={Object.fromEntries(fieldDefs.map((def) => [def.key, transfersFor(def.key)[0] || null]))}
          colorByPos={Object.fromEntries(fieldDefs.map((def, i) => [def.key, positionColor(i)]))}
          selectedId={selected?.id}
          onSlotPress={handleSlotPress}
          onSlotLongPress={handleSlotLongPress}
        />
      )}
    </View>
  );
}

function CoachSlot({ def, transfers, onUndo }) {
  const t = transfers[0];
  return (
    <View style={styles.coachSlot}>
      <View style={styles.row}>
        <Text style={{ fontSize: 16 }}>👔</Text>
        <View style={{ marginLeft: spacing.xs }}>
          <Text style={styles.coachName} numberOfLines={1}>{t ? t.name : 'Κενή θέση HC'}</Text>
          {t && <Text style={styles.coachPrice}>{t.price.toFixed(2)}€</Text>}
        </View>
      </View>
      {t && (
        <Text style={styles.undoText} onPress={() => onUndo(t.id)}>
          ΑΝΑΙΡΕΣΗ
        </Text>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  column: {
    width: COLUMN_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  accentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  completeBadge: {
    position: 'absolute', top: spacing.xs, right: spacing.xs,
    borderRadius: radii.pill, paddingHorizontal: spacing.xs + 2, paddingVertical: 2,
  },
  completeBadgeText: { fontFamily: fonts.monoBold, fontSize: 8, color: colors.bg, letterSpacing: 0.4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs, marginBottom: spacing.sm },
  avatar: { width: 36, height: 36, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  avatarText: { fontFamily: fonts.headlineBold, fontSize: 13 },
  name: { fontFamily: fonts.headlineBold, fontSize: 15, color: colors.text },
  statusLabel: { fontFamily: fonts.monoSemiBold, fontSize: 9.5, letterSpacing: 0.6, marginTop: 1 },
  rankPill: { borderRadius: radii.pill, paddingHorizontal: spacing.xs + 2, paddingVertical: 2 },
  rankText: { fontFamily: fonts.monoBold, fontSize: 10 },

  gaugeBox: { backgroundColor: colors.bg, borderRadius: radii.md, padding: spacing.xs + 2, marginBottom: spacing.sm, gap: 5 },
  gaugeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gaugeLabel: { fontFamily: fonts.monoSemiBold, fontSize: 11, color: colors.textMuted },
  gaugeValue: { fontFamily: fonts.monoBold, fontSize: 13 },
  gaugeTotal: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11 },
  avgPriceText: { fontFamily: fonts.body, fontSize: 9.5, color: colors.textFaint, marginTop: 1 },
  track: { height: 6, borderRadius: radii.pill, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill },

  coachSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  coachName: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.text, maxWidth: 150 },
  coachPrice: { fontFamily: fonts.monoSemiBold, fontSize: 11, color: colors.primary },
  undoText: { fontFamily: fonts.mono, fontSize: 9, color: colors.danger, letterSpacing: 0.4 },
});

export { COLUMN_WIDTH };
