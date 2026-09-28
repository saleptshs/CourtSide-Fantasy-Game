import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { POSITIONS } from '../data/positions';
import { getBalance, getSlotSummary } from '../utils/validation';
import { haptics } from '../utils/haptics';
import { colors, spacing, radii, fonts, typography, gradients, shadow, managerColor } from '../theme/theme';

const BID_STEP = 1;

export default function TransferBar({
  sport,
  managers,
  budget,
  transfers,
  people,
  takenPersonIds,
  onConfirm,
  onAddCustomPerson,
}) {
  const [query, setQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [leaderId, setLeaderId] = useState(null);
  const [bidCount, setBidCount] = useState(0);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPosition, setCustomPosition] = useState(POSITIONS[sport][0].key);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return people
      .filter((p) => !takenPersonIds.has(p.id))
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, people, takenPersonIds]);

  const pickPerson = (p) => {
    setSelectedPerson(p);
    setQuery(p.name);
    setCurrentBid(0);
    setLeaderId(null);
    setBidCount(0);
  };

  const randomize = () => {
    haptics.select();
    const pool = people.filter((p) => !takenPersonIds.has(p.id));
    if (pool.length === 0) {
      Alert.alert('Δεν απομένουν παίκτες', 'Όλοι έχουν ήδη αγοραστεί.');
      return;
    }

    // Which positions still have an open slot for at least one manager —
    // early in the draft this is "all of them" (no real bias yet), but as
    // rosters fill up it naturally narrows to only what's still missing.
    const neededPositions = new Set();
    managers.forEach((m) => {
      const summary = getSlotSummary(sport, m.id, transfers);
      Object.values(summary).forEach((s) => {
        if (s.remaining > 0) neededPositions.add(s.key);
      });
    });

    const prioritized = pool.filter((p) => neededPositions.has(p.position));
    const finalPool = prioritized.length > 0 ? prioritized : pool;
    const pick = finalPool[Math.floor(Math.random() * finalPool.length)];
    pickPerson(pick);
  };

  const reset = () => {
    setSelectedPerson(null);
    setQuery('');
    setCurrentBid(0);
    setLeaderId(null);
    setBidCount(0);
    setShowCustomForm(false);
  };

  const tapBid = (managerId) => {
    const manager = managers.find((m) => m.id === managerId);
    const liveBalance = getBalance({ id: managerId, budget }, transfers);
    const nextBid = Math.round((currentBid + BID_STEP) * 100) / 100;
    if (nextBid > liveBalance) {
      haptics.warning();
      return;
    }
    haptics.tap();
    setCurrentBid(nextBid);
    setLeaderId(managerId);
    setBidCount((c) => c + 1);
  };

  const confirm = () => {
    const manager = managers.find((m) => m.id === leaderId);
    const result = onConfirm(selectedPerson, manager, currentBid);
    if (!result.ok) {
      haptics.warning();
      Alert.alert('Δεν ολοκληρώθηκε', result.reason);
      return;
    }
    haptics.success();
    reset();
  };

  const submitCustom = () => {
    if (!customName.trim()) return;
    const isCoach = customPosition === 'HC';
    const person = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      role: isCoach ? 'coach' : 'player',
      position: customPosition,
      team: 'Custom',
      league: 'Custom',
      nationality: null,
      photoUrl: null,
    };
    onAddCustomPerson(person);
    pickPerson(person);
    setShowCustomForm(false);
    setCustomName('');
  };

  return (
    <View style={[styles.bar, shadow(2)]}>
      <View style={styles.glow} pointerEvents="none" />

      {/* Search */}
      <View style={styles.searchBay}>
        <MaterialIcons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            setSelectedPerson(null);
          }}
          placeholder="Αναζήτηση παίκτη ή προπονητή..."
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              setSelectedPerson(null);
            }}
            style={styles.clearBtn}
            hitSlop={8}
          >
            <MaterialIcons name="close" size={16} color={colors.textFaint} />
          </TouchableOpacity>
        )}
      </View>

      {query.length > 0 && !selectedPerson && (
        <View style={styles.resultsBox}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 190 }}
            ListEmptyComponent={
              <TouchableOpacity style={styles.resultRow} onPress={() => setShowCustomForm(true)}>
                <Text style={{ color: colors.info, fontFamily: fonts.bodyMedium, fontSize: 13 }}>
                  Δεν βρέθηκε — προσθήκη "{query}" χειροκίνητα
                </Text>
              </TouchableOpacity>
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultRow} onPress={() => pickPerson(item)}>
                <View style={styles.resultPosTag}>
                  <Text style={styles.resultPosText}>{item.position}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultMeta}>
                    {item.team} · {item.league}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Active spotlight player card */}
      {selectedPerson && (
        <View style={styles.spotlightCard}>
          <View style={styles.spotlightTop}>
            <View style={styles.posBadge}>
              <Text style={styles.posBadgeText}>{selectedPerson.position}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.spotlightName} numberOfLines={1}>
                {selectedPerson.name}
              </Text>
              <View style={styles.spotlightMetaRow}>
                <View style={styles.liveDot} />
                <Text style={styles.spotlightMeta} numberOfLines={1}>
                  {selectedPerson.team} · {selectedPerson.league}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.utilityRow}>
            <TouchableOpacity onPress={randomize} style={styles.utilityBtn}>
              <MaterialIcons name="casino" size={14} color={colors.secondary} />
              <Text style={styles.utilityText} numberOfLines={1}>Τυχαία</Text>
              <Text style={styles.utilityRerollText} numberOfLines={1}>↻ Re-roll</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCustomForm((s) => !s)} style={styles.utilityBtn}>
              <MaterialIcons name="person-add" size={14} color={colors.primary} />
              <Text style={styles.utilityText} numberOfLines={1}>+ Custom</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!selectedPerson && (
        <View style={styles.preRollRow}>
          <TouchableOpacity onPress={randomize} style={[styles.utilityBtn, { flex: 1 }]}>
            <MaterialIcons name="casino" size={16} color={colors.secondary} />
            <Text style={styles.utilityText} numberOfLines={1}>Τυχαία Επιλογή</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCustomForm((s) => !s)} style={styles.utilityBtn}>
            <MaterialIcons name="person-add" size={16} color={colors.primary} />
            <Text style={styles.utilityText} numberOfLines={1}>+ Custom</Text>
          </TouchableOpacity>
        </View>
      )}

      {showCustomForm && (
        <View style={styles.customForm}>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="Όνομα παίκτη/προπονητή"
            placeholderTextColor={colors.textFaint}
            style={styles.customInput}
          />
          <View style={styles.posRow}>
            {POSITIONS[sport].map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setCustomPosition(p.key)}
                style={[styles.posChip, customPosition === p.key && styles.posChipActive]}
              >
                <Text style={[styles.posChipText, customPosition === p.key && styles.posChipTextActive]}>
                  {p.key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={submitCustom} style={styles.customSubmit}>
            <Text style={styles.customSubmitText} numberOfLines={1}>ΠΡΟΣΘΗΚΗ ΣΤΗ ΛΙΣΤΑ</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Live bid arena */}
      {selectedPerson && (
        <>
          <View style={styles.leaderBar}>
            <View style={styles.row}>
              <View style={[styles.liveDot, { backgroundColor: leaderId ? colors.primary : colors.textFaint }]} />
              <Text style={styles.leaderText} numberOfLines={1}>
                {leaderId
                  ? <>Προηγείται ο <Text style={{ color: colors.primary }}>{managers.find((m) => m.id === leaderId)?.name}</Text> με €{currentBid.toFixed(0)}</>
                  : 'Πάτα ΤΑΡ σε έναν παίκτη για να ξεκινήσει η δημοπρασία'}
              </Text>
            </View>
            {bidCount > 0 && (
              <View style={styles.bidCountPill}>
                <Text style={styles.bidCountText}>{bidCount} bids</Text>
              </View>
            )}
          </View>

          <View style={styles.managerGrid}>
            {managers.map((m, i) => {
              const isLeader = leaderId === m.id;
              const accent = managerColor(i);
              const liveBalance = getBalance({ id: m.id, budget }, transfers);
              const nextBid = Math.round((currentBid + BID_STEP) * 100) / 100;
              const canAfford = nextBid <= liveBalance;
              return (
                <View
                  key={m.id}
                  style={[
                    styles.bidCard,
                    isLeader && { borderColor: accent, backgroundColor: accent + '14' },
                  ]}
                >
                  <View style={styles.bidCardTop}>
                    <View style={[styles.dot, { backgroundColor: accent }]} />
                    <Text style={styles.bidCardName} numberOfLines={1}>{m.name}</Text>
                  </View>
                  <Text style={styles.bidCardBalance}>Υπόλοιπο: €{liveBalance.toFixed(0)}</Text>
                  <TouchableOpacity
                    onPress={() => tapBid(m.id)}
                    disabled={!canAfford}
                    style={[
                      styles.tapBtn,
                      { backgroundColor: canAfford ? accent : colors.surfaceHighest },
                      !canAfford && { opacity: 0.4 },
                    ]}
                  >
                    <Text style={[styles.tapBtnText, { color: canAfford ? colors.bg : colors.textFaint }]} numberOfLines={1}>
                      +€{BID_STEP} TAP
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={confirm}
            disabled={!leaderId}
            style={!leaderId && { opacity: 0.4 }}
          >
            <LinearGradient
              colors={gradients.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmBtn}
            >
              <MaterialIcons name="gavel" size={15} color={colors.bg} />
              <Text style={styles.confirmText} numberOfLines={1}>
                ΚΑΤΑΚΥΡΩΣΗ{leaderId ? ` (€${currentBid.toFixed(0)} στον ${managers.find((m) => m.id === leaderId)?.name})` : ''}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    margin: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    gap: spacing.sm,
  },
  glow: {
    position: 'absolute',
    top: -80, right: -80, width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,107,53,0.08)',
  },

  searchBay: { position: 'relative', justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: spacing.sm + 2, zIndex: 1 },
  searchInput: {
    height: 44,
    paddingLeft: 40,
    paddingRight: 36,
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  clearBtn: { position: 'absolute', right: spacing.sm, padding: 4 },

  resultsBox: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultPosTag: {
    width: 34, height: 22, borderRadius: radii.sm,
    backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center',
  },
  resultPosText: { fontFamily: fonts.monoBold, color: colors.primary, fontSize: 10 },
  resultName: { fontFamily: fonts.bodyBold, color: colors.text, fontSize: 14 },
  resultMeta: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 12, marginTop: 1 },

  spotlightCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    gap: spacing.xs + 2,
  },
  spotlightTop: { flexDirection: 'row', alignItems: 'center' },
  posBadge: {
    width: 44, height: 44, borderRadius: radii.md,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    ...shadow(1, 'rgba(255,107,53,0.5)'),
  },
  posBadgeText: { fontFamily: fonts.headlineBold, color: colors.bg, fontSize: 15 },
  spotlightName: { fontFamily: fonts.headlineBold, color: colors.text, fontSize: 16 },
  spotlightMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  spotlightMeta: { fontFamily: fonts.body, color: colors.primary, fontSize: 12, flexShrink: 1 },

  utilityRow: { flexDirection: 'row', gap: spacing.sm },
  preRollRow: { flexDirection: 'row', gap: spacing.sm },
  utilityBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    height: 38, paddingHorizontal: spacing.xs + 2,
    backgroundColor: colors.surfaceHigh, borderRadius: radii.md,
  },
  utilityText: { fontFamily: fonts.monoSemiBold, color: colors.text, fontSize: 10.5 },
  utilityRerollText: { fontFamily: fonts.mono, color: colors.secondary, fontSize: 9 },

  customForm: {
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customInput: {
    height: 40, paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceAlt, borderRadius: radii.sm,
    color: colors.text, fontFamily: fonts.body, fontSize: 13,
  },
  posRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  posChip: {
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: radii.pill, backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: colors.border,
  },
  posChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  posChipText: { fontFamily: fonts.monoSemiBold, color: colors.text, fontSize: 11 },
  posChipTextActive: { color: colors.bg },
  customSubmit: {
    backgroundColor: colors.info, borderRadius: radii.md,
    paddingVertical: spacing.sm, alignItems: 'center',
  },
  customSubmitText: { fontFamily: fonts.monoBold, color: colors.bg, fontSize: 10.5, letterSpacing: 0.3 },

  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },

  leaderBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bg, borderRadius: radii.md,
    paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.sm,
  },
  leaderText: { fontFamily: fonts.bodyMedium, color: colors.textMuted, fontSize: 11.5, marginLeft: spacing.xs, flexShrink: 1 },
  bidCountPill: {
    backgroundColor: colors.surfaceHigh, borderRadius: radii.pill,
    paddingHorizontal: spacing.xs + 2, paddingVertical: 2, marginLeft: spacing.xs,
  },
  bidCountText: { fontFamily: fonts.monoBold, color: colors.secondary, fontSize: 9.5 },

  managerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  bidCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs + 2,
    gap: spacing.xs,
  },
  bidCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bidCardName: { fontFamily: fonts.bodySemiBold, color: colors.text, fontSize: 12.5, flexShrink: 1 },
  bidCardBalance: { fontFamily: fonts.monoSemiBold, color: colors.textMuted, fontSize: 10 },
  tapBtn: {
    height: 34, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center',
  },
  tapBtnText: { fontFamily: fonts.monoBold, fontSize: 11 },

  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    height: 48, borderRadius: radii.md, paddingHorizontal: spacing.xs,
  },
  confirmText: { fontFamily: fonts.headlineExtraBold, color: colors.bg, fontSize: 11.5, letterSpacing: 0.2 },
});
