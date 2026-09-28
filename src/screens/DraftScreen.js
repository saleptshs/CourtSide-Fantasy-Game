import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { useGameState, useGameDispatch } from '../context/GameContext';
import TransferBar from '../components/TransferBar';
import ManagerColumn from '../components/ManagerColumn';
import TradeModal from '../components/TradeModal';
import { validateTransfer } from '../utils/validation';
import { haptics } from '../utils/haptics';
import playersDb from '../data/players.sample.json';
import { colors, spacing, radii, fonts, typography, shadow, managerColor } from '../theme/theme';

export default function DraftScreen({ navigation }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const { sport, league, season, budget, managers, transfers, customPeople } = state;
  const [activeColumn, setActiveColumn] = useState(0);
  const [tradeTransfer, setTradeTransfer] = useState(null);

  const columnWidth = sport === 'football' ? 320 : 260;
  const columnGap = spacing.md;

  const people = useMemo(() => {
    const fromDb = playersDb[sport]?.[season] ?? [];
    const filtered = league ? fromDb.filter((p) => p.league === league) : fromDb;
    return [...filtered, ...customPeople];
  }, [sport, league, season, customPeople]);

  const takenPersonIds = useMemo(
    () => new Set(transfers.map((t) => t.personId)),
    [transfers]
  );

  if (!sport || managers.length === 0) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <Text style={typography.body}>Δεν υπάρχει ενεργή δημοπρασία.</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.getParent()?.replace?.('Setup') ?? navigation.navigate('Setup')}
        >
          <Text style={{ color: colors.bg, fontFamily: fonts.headlineBold, fontSize: 13 }}>
            Πίσω στη Ρύθμιση
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleConfirm = (person, manager, priceNum) => {
    const result = validateTransfer({ sport, manager, person, price: priceNum, transfers });
    if (!result.ok) return result;

    dispatch({
      type: 'ADD_TRANSFER',
      payload: {
        id: `t-${Date.now()}`,
        managerId: manager.id,
        personId: person.id,
        name: person.name,
        position: person.position,
        price: Math.round(priceNum * 100) / 100,
        isCustom: person.id.startsWith('custom-'),
      },
    });
    return { ok: true };
  };

  const handleUndo = (transferId) => {
    haptics.tap();
    dispatch({ type: 'UNDO_TRANSFER', payload: { id: transferId } });
  };

  const handleAddCustomPerson = (person) => {
    dispatch({ type: 'ADD_CUSTOM_PERSON', payload: person });
  };

  const handleTradeConfirm = (toManagerId, price) => {
    dispatch({
      type: 'REASSIGN_TRANSFER',
      payload: { transferId: tradeTransfer.id, toManagerId, price },
    });
    setTradeTransfer(null);
  };

  const confirmNewGame = () => {
    haptics.warning();
    Alert.alert('Νέα Δημοπρασία', 'Θα χαθεί η τρέχουσα πρόοδος. Συνέχεια;', [
      { text: 'Άκυρο', style: 'cancel' },
      {
        text: 'Νέα Δημοπρασία',
        style: 'destructive',
        onPress: () => {
          dispatch({ type: 'RESET' });
          navigation.getParent()?.replace?.('Setup') ?? navigation.navigate('Setup');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[colors.primary, colors.primaryBright]}
            style={[styles.logoDot, shadow(2, 'rgba(255,107,53,0.6)')]}
          >
            <MaterialIcons name="bolt" size={16} color={colors.bg} />
          </LinearGradient>
          <View style={{ marginLeft: spacing.xs + 2, flexShrink: 1 }}>
            <View style={styles.row}>
              <Text style={styles.headerTitle} numberOfLines={1}>COURTSIDE</Text>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>LIVE DRAFT</Text>
              </View>
            </View>
            <Text style={styles.headerSub} numberOfLines={1}>
              {sport === 'basketball' ? 'ΜΠΑΣΚΕΤ' : 'ΠΟΔΟΣΦΑΙΡΟ'} · {league} · {season}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={confirmNewGame} style={[styles.resetBtn, shadow(1)]} hitSlop={8} activeOpacity={0.7}>
          <MaterialIcons name="restart-alt" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <TransferBar
          sport={sport}
          managers={managers}
          budget={budget}
          transfers={transfers}
          people={people}
          takenPersonIds={takenPersonIds}
          onConfirm={handleConfirm}
          onAddCustomPerson={handleAddCustomPerson}
        />

        <View style={styles.statusRow}>
          <View style={styles.row}>
            <View style={styles.autoSaveDot} />
            <Text style={styles.statusText}>AUTO-SAVE ΕΝΕΡΓΟ</Text>
          </View>
          <View style={styles.row}>
            <MaterialIcons name="sports-basketball" size={13} color={colors.textFaint} />
            <Text style={[styles.statusText, { marginLeft: 4, color: colors.textFaint }]}>
              {people.length} διαθέσιμοι παίκτες
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>ΡΟΣΤΕΡ & BUDGET ΠΑΙΚΤΩΝ</Text>
          <View style={styles.row}>
            <Text style={styles.sectionHint}>Σύρετε για περισσότερα</Text>
            <MaterialIcons name="arrow-forward" size={13} color={colors.textFaint} />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={columnWidth + columnGap}
          snapToAlignment="start"
          contentContainerStyle={styles.columnsRow}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / (columnWidth + columnGap));
            setActiveColumn(Math.max(0, Math.min(managers.length - 1, idx)));
          }}
        >
          {managers.map((m, i) => (
            <ManagerColumn
              key={m.id}
              sport={sport}
              manager={m}
              managerIndex={i}
              budget={budget}
              transfers={transfers}
              onUndo={handleUndo}
              onRequestTrade={setTradeTransfer}
            />
          ))}
        </ScrollView>

        {managers.length > 1 && (
          <View style={styles.dotsRow}>
            {managers.map((m, i) => (
              <View
                key={m.id}
                style={[
                  styles.dot,
                  i === activeColumn
                    ? { backgroundColor: managerColor(i), width: 16 }
                    : { backgroundColor: colors.surfaceHigh },
                ]}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <TradeModal
        visible={!!tradeTransfer}
        transfer={tradeTransfer}
        sport={sport}
        managers={managers}
        budget={budget}
        transfers={transfers}
        onClose={() => setTradeTransfer(null)}
        onConfirm={handleTradeConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },


  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(26,15,40,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  logoDot: {
    width: 32, height: 32, borderRadius: radii.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: fonts.headlineBold, color: colors.text, fontSize: 15, letterSpacing: 0.2 },
  headerSub: { fontFamily: fonts.monoSemiBold, color: colors.textMuted, fontSize: 9.5, letterSpacing: 1, marginTop: 2 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceHigh, borderRadius: radii.pill,
    paddingHorizontal: 8, paddingVertical: 2, marginLeft: spacing.xs,
  },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary },
  livePillText: { fontFamily: fonts.monoSemiBold, color: colors.primary, fontSize: 8 },
  resetBtn: {
    width: 38, height: 38, borderRadius: radii.pill,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt,
  },

  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md + spacing.md, marginTop: spacing.xs,
  },
  autoSaveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: 5 },
  statusText: { fontFamily: fonts.monoSemiBold, color: colors.primary, fontSize: 10, letterSpacing: 0.6 },

  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md + spacing.md, marginTop: spacing.md, marginBottom: spacing.sm,
  },
  sectionTitle: { fontFamily: fonts.headlineBold, color: colors.text, fontSize: 13, letterSpacing: 0.3 },
  sectionHint: { fontFamily: fonts.body, color: colors.textFaint, fontSize: 11, marginRight: 3 },

  columnsRow: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  dot: { width: 6, height: 6, borderRadius: 3 },
  backBtn: {
    backgroundColor: colors.primary, borderRadius: radii.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
  },
});
