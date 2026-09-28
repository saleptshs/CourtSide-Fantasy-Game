import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { useGameState, useGameDispatch } from '../context/GameContext';
import { POSITIONS, totalSlots } from '../data/positions';
import { getBalance } from '../utils/validation';
import { haptics } from '../utils/haptics';
import { colors, spacing, radii, fonts, typography, gradients, shadow, managerColor } from '../theme/theme';

export default function RankingScreen({ navigation }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const { sport, league, season, budget, managers, transfers } = state;

  const slotsPerManager = sport ? totalSlots(sport) : 0;
  const totalSlotsAll = slotsPerManager * managers.length;

  const ranked = useMemo(() => {
    if (!sport) return [];
    return managers
      .map((m, i) => {
        const mine = transfers.filter((t) => t.managerId === m.id);
        const spent = mine.reduce((s, t) => s + t.price, 0);
        const balance = getBalance({ id: m.id, budget }, transfers);
        const filled = mine.length;
        const spendPct = budget > 0 ? Math.min(1, spent / budget) : 0;
        const fillPct = slotsPerManager > 0 ? Math.min(1, filled / slotsPerManager) : 0;
        // "Power rating" — a fun completion+spend score, not real player stats.
        const rating = Math.round(fillPct * 60 + spendPct * 40);
        const topPick = [...mine].sort((a, b) => b.price - a.price)[0];
        return {
          manager: m,
          index: i,
          spent,
          balance,
          filled,
          spendPct,
          rating,
          topPick,
        };
      })
      .sort((a, b) => b.rating - a.rating || b.spent - a.spent);
  }, [managers, transfers, budget, sport, slotsPerManager]);

  const filledSlotsAll = transfers.length;
  const donePct = totalSlotsAll > 0 ? Math.round((filledSlotsAll / totalSlotsAll) * 100) : 0;
  const complete = totalSlotsAll > 0 && filledSlotsAll >= totalSlotsAll;
  const totalSpent = transfers.reduce((s, t) => s + t.price, 0);
  const totalBudgetAll = budget * managers.length;
  const totalLeft = Math.max(0, totalBudgetAll - totalSpent);

  const handleShare = async () => {
    if (!sport) return;
    haptics.select();
    const lines = ranked.map((r, i) => {
      const rosterLines = transfers
        .filter((t) => t.managerId === r.manager.id)
        .map((t) => `   ${t.position} — ${t.name} (${t.price.toFixed(2)}€)`)
        .join('\n');
      return `${i + 1}. ${r.manager.name} — ${r.spent.toFixed(2)}€ δαπάνη, ${r.filled}/${slotsPerManager} θέσεις, rating ${r.rating}/100\n${rosterLines}`;
    });
    const message = `🏆 Courtside — Τελικό Draft (${season})\n\n${lines.join('\n\n')}`;
    try {
      await Share.share({ message });
    } catch (e) {
      Alert.alert('Δεν ήταν δυνατή η κοινοποίηση');
    }
  };

  const handleNewDraft = () => {
    haptics.warning();
    Alert.alert('Νέο Draft', 'Θα χαθεί η τρέχουσα δημοπρασία. Συνέχεια;', [
      { text: 'Άκυρο', style: 'cancel' },
      {
        text: 'Νέο Draft',
        style: 'destructive',
        onPress: () => {
          dispatch({ type: 'RESET' });
          navigation.getParent()?.replace?.('Setup') ?? navigation.navigate('Setup');
        },
      },
    ]);
  };

  if (!sport) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <Text style={typography.body}>Δεν υπάρχει ενεργή δημοπρασία.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {sport === 'basketball' ? 'ΜΠΑΣΚΕΤ' : 'ΠΟΔΟΣΦΑΙΡΟ'} · {league} · {season}
          </Text>
          <Text style={typography.headlineXl}>ΤΕΛΙΚΗ ΣΥΝΟΨΗ DRAFT</Text>
        </View>

        {/* Completion banner */}
        <View style={[styles.banner, complete && styles.bannerComplete]}>
          <View style={[styles.bannerIcon, complete && { backgroundColor: colors.primary }]}>
            <MaterialIcons name={complete ? 'flag' : 'hourglass-top'} size={20} color={complete ? colors.bg : colors.secondary} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.bannerTitle}>
              {filledSlotsAll} / {totalSlotsAll} SLOTS ΚΑΤΟΧΥΡΩΘΗΚΑΝ
            </Text>
            <Text style={styles.bannerSub}>
              {complete
                ? 'Η δημοπρασία έληξε. Όλα τα ρόστερ είναι έτοιμα για σέντρα!'
                : 'Η δημοπρασία βρίσκεται σε εξέλιξη.'}
            </Text>
          </View>
          <Text style={[styles.bannerPct, complete && { color: colors.primary }]}>{donePct}%</Text>
        </View>

        {/* Budget summary */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ΣΥΝΟΛΟ BUDGET</Text>
            <Text style={styles.statValue}>{totalBudgetAll.toFixed(2)}€</Text>
            <Text style={styles.statCaption}>{managers.length} Παίκτες</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.primary }]}>ΔΑΠΑΝΗΘΗΚΑΝ</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{totalSpent.toFixed(2)}€</Text>
            <View style={styles.miniTrack}>
              <View style={[styles.miniFill, { width: `${totalBudgetAll > 0 ? (totalSpent / totalBudgetAll) * 100 : 0}%` }]} />
            </View>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.secondary }]}>ΑΔΙΑΘΕΤΟ</Text>
            <Text style={[styles.statValue, { color: colors.secondary }]}>{totalLeft.toFixed(2)}€</Text>
            <Text style={styles.statCaption}>
              {totalBudgetAll > 0 ? Math.round((totalLeft / totalBudgetAll) * 100) : 0}% ταμείο
            </Text>
          </View>
        </View>

        {/* Ranked managers */}
        <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
          {ranked.map((r, i) => {
            const medalColor = i === 0 ? colors.primary : i === 1 ? '#C7D2E0' : i === 2 ? '#D8935B' : null;
            return (
            <View key={r.manager.id} style={styles.rankCard}>
              <View style={styles.rankTop}>
                <View style={[styles.rankBadge, medalColor && { backgroundColor: medalColor }]}>
                  <Text style={[styles.rankBadgeText, medalColor && { color: colors.bg }]}>{i + 1}</Text>
                </View>
                <View style={[styles.avatar, { backgroundColor: managerColor(r.index) + '26' }]}>
                  <Text style={[styles.avatarText, { color: managerColor(r.index) }]}>
                    {r.manager.name.trim().slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.xs + 2 }}>
                  <View style={styles.row}>
                    <Text style={styles.managerName} numberOfLines={1}>{r.manager.name}</Text>
                    {i === 0 && (
                      <View style={styles.leaderPill}>
                        <Text style={styles.leaderPillText}>ΠΡΩΤΑΘΛΗΤΗΣ</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.slotsText}>{r.filled}/{slotsPerManager} ρόστερ {r.filled >= slotsPerManager ? '✓' : ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.ratingLabel}>POWER RATING</Text>
                  <Text style={styles.ratingValue}>{r.rating}<Text style={styles.ratingMax}>/100</Text></Text>
                </View>
              </View>

              <View style={styles.rankMetaRow}>
                <Text style={styles.rankMetaText}>
                  Δαπάνη/Υπόλοιπο: <Text style={{ color: colors.text }}>{r.spent.toFixed(2)}€</Text>
                  {'  '}(<Text style={{ color: colors.secondary }}>{r.balance.toFixed(2)}€</Text>)
                </Text>
                {r.topPick && (
                  <Text style={styles.rankMetaText} numberOfLines={1}>
                    Top Αγορά: <Text style={{ color: colors.info }}>{r.topPick.name} ({r.topPick.price.toFixed(2)}€)</Text>
                  </Text>
                )}
              </View>

              <View style={styles.track}>
                <View style={[styles.fill, { width: `${r.spendPct * 100}%`, backgroundColor: managerColor(r.index) }]} />
              </View>
              <Text style={styles.utilizedText}>{Math.round(r.spendPct * 100)}% Spent</Text>
            </View>
            );
          })}
        </View>

        <TouchableOpacity onPress={handleShare} style={{ marginTop: spacing.md }}>
          <LinearGradient
            colors={gradients.primaryButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.exportBtn, shadow(2, 'rgba(255,107,53,0.5)')]}
          >
            <MaterialIcons name="ios-share" size={17} color={colors.bg} />
            <Text style={styles.exportText} numberOfLines={1}>ΚΟΙΝΟΠΟΙΗΣΗ ΡΟΣΤΕΡ</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNewDraft} style={styles.newDraftBtn}>
          <MaterialIcons name="refresh" size={16} color={colors.danger} />
          <Text style={styles.newDraftText} numberOfLines={1}>ΝΕΟ DRAFT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },

  eyebrow: { fontFamily: fonts.monoSemiBold, color: colors.primary, fontSize: 10.5, letterSpacing: 1.2, marginBottom: 2 },

  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.sm + 2, borderWidth: 1, borderColor: colors.border,
    ...shadow(1),
  },
  bannerComplete: { borderColor: 'rgba(255,107,53,0.35)', backgroundColor: 'rgba(255,107,53,0.06)' },
  bannerIcon: {
    width: 40, height: 40, borderRadius: radii.md,
    backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { fontFamily: fonts.headlineBold, color: colors.text, fontSize: 13 },
  bannerSub: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11.5, marginTop: 2 },
  bannerPct: { fontFamily: fonts.headlineExtraBold, color: colors.secondary, fontSize: 20 },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.md,
    padding: spacing.sm, borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  statLabel: { fontFamily: fonts.monoSemiBold, color: colors.textMuted, fontSize: 8.5, letterSpacing: 0.5 },
  statValue: { fontFamily: fonts.headlineBold, color: colors.text, fontSize: 16 },
  statCaption: { fontFamily: fonts.body, color: colors.textFaint, fontSize: 9.5 },
  miniTrack: { height: 3, borderRadius: 2, backgroundColor: colors.surfaceHigh, overflow: 'hidden', marginTop: 2 },
  miniFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },

  rankCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.sm + 2, borderWidth: 1, borderColor: colors.border, gap: spacing.xs + 2,
    ...shadow(1),
  },
  rankTop: { flexDirection: 'row', alignItems: 'center' },
  rankBadge: {
    width: 24, height: 24, borderRadius: radii.pill,
    backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center',
  },
  rankBadgeText: { fontFamily: fonts.headlineBold, color: colors.textMuted, fontSize: 12 },
  avatar: { width: 34, height: 34, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs },
  avatarText: { fontFamily: fonts.monoBold, fontSize: 11 },
  managerName: { fontFamily: fonts.headlineBold, color: colors.text, fontSize: 14, flexShrink: 1 },
  slotsText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11, marginTop: 1 },
  leaderPill: { backgroundColor: 'rgba(255,107,53,0.15)', borderRadius: radii.pill, paddingHorizontal: 6, paddingVertical: 2 },
  leaderPillText: { fontFamily: fonts.monoBold, color: colors.primary, fontSize: 8 },
  ratingLabel: { fontFamily: fonts.monoSemiBold, color: colors.textFaint, fontSize: 8 },
  ratingValue: { fontFamily: fonts.headlineExtraBold, color: colors.primary, fontSize: 18 },
  ratingMax: { fontFamily: fonts.body, color: colors.textFaint, fontSize: 11 },

  rankMetaRow: { gap: 2 },
  rankMetaText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11.5 },

  track: { height: 5, borderRadius: 3, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  utilizedText: { fontFamily: fonts.monoSemiBold, color: colors.textFaint, fontSize: 9.5, alignSelf: 'flex-end' },

  exportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    height: 50, borderRadius: radii.lg, paddingHorizontal: spacing.sm,
  },
  exportText: { fontFamily: fonts.headlineExtraBold, color: colors.bg, fontSize: 12, letterSpacing: 0.2 },

  newDraftBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 46, borderRadius: radii.lg, marginTop: spacing.xs,
    borderWidth: 1, borderColor: 'rgba(255,84,112,0.4)',
  },
  newDraftText: { fontFamily: fonts.monoBold, color: colors.danger, fontSize: 11, letterSpacing: 0.3 },
});
