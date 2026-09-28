import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { getBalance, getSlotSummary } from '../utils/validation';
import { haptics } from '../utils/haptics';
import { colors, spacing, radii, fonts, gradients, shadow, managerColor } from '../theme/theme';

const PRICE_STEP = 1;

// Bail-out / hand-over sheet: when a manager can't afford a player anymore,
// the host uses this to move that pick to someone else — either as a gift
// at whatever price they agree, or a nominal €1 takeover.
export default function TradeModal({ visible, transfer, sport, managers, budget, transfers, onClose, onConfirm }) {
  const [toManagerId, setToManagerId] = useState(null);
  const [price, setPrice] = useState(1);

  useEffect(() => {
    if (visible) {
      setToManagerId(null);
      setPrice(1);
    }
  }, [visible, transfer?.id]);

  if (!transfer) return null;

  const fromManager = managers.find((m) => m.id === transfer.managerId);
  const candidates = managers.filter((m) => m.id !== transfer.managerId);

  const confirm = () => {
    if (!toManagerId) return;
    const target = managers.find((m) => m.id === toManagerId);
    const liveBalance = getBalance({ id: toManagerId, budget }, transfers);
    if (price > liveBalance) {
      haptics.warning();
      return;
    }
    const summary = getSlotSummary(sport, toManagerId, transfers);
    const slot = summary[transfer.position];
    if (!slot || slot.remaining <= 0) {
      haptics.warning();
      return;
    }
    haptics.success();
    onConfirm(toManagerId, price);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{transfer.name}</Text>
              <Text style={styles.subtitle}>
                {transfer.position} · είχε: {fromManager?.name} · {transfer.price.toFixed(2)}€
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <MaterialIcons name="close" size={22} color={colors.textFaint} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>ΣΕ ΠΟΙΟΝ ΠΑΕΙ;</Text>
          <View style={{ gap: spacing.xs + 2 }}>
            {candidates.map((m) => {
              const idx = managers.findIndex((mm) => mm.id === m.id);
              const accent = managerColor(idx);
              const active = toManagerId === m.id;
              const liveBalance = getBalance({ id: m.id, budget }, transfers);
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => { haptics.tap(); setToManagerId(m.id); }}
                  style={[styles.candidateRow, active && { borderColor: accent, backgroundColor: accent + '14' }]}
                >
                  <View style={[styles.dot, { backgroundColor: accent }]} />
                  <Text style={styles.candidateName} numberOfLines={1}>{m.name}</Text>
                  <Text style={styles.candidateBalance}>{liveBalance.toFixed(2)}€</Text>
                  <MaterialIcons
                    name={active ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={18}
                    color={active ? accent : colors.textFaint}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>ΤΙΜΗ ΜΕΤΑΦΟΡΑΣ</Text>
          <View style={styles.priceRow}>
            <TouchableOpacity
              onPress={() => { haptics.tap(); setPrice((p) => Math.max(0, Math.round((p - PRICE_STEP) * 100) / 100)); }}
              style={styles.priceBtn}
            >
              <MaterialIcons name="remove" size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.priceValue}>{price.toFixed(2)}€</Text>
            <TouchableOpacity
              onPress={() => { haptics.tap(); setPrice((p) => Math.round((p + PRICE_STEP) * 100) / 100); }}
              style={styles.priceBtn}
            >
              <MaterialIcons name="add" size={18} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { haptics.tap(); setPrice(1); }} style={styles.oneEuroChip}>
              <Text style={styles.oneEuroText}>€1 TAKEOVER</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={confirm} disabled={!toManagerId} style={!toManagerId && { opacity: 0.4 }}>
            <LinearGradient
              colors={gradients.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.confirmBtn, shadow(2, 'rgba(255,107,53,0.5)')]}
            >
              <MaterialIcons name="swap-horiz" size={17} color={colors.bg} />
              <Text style={styles.confirmText} numberOfLines={1}>ΜΕΤΑΦΟΡΑ ΠΑΙΚΤΗ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl,
    borderWidth: 1, borderColor: colors.border, borderBottomWidth: 0,
    padding: spacing.lg, paddingBottom: spacing.xl,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surfaceHigh, alignSelf: 'center', marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  title: { fontFamily: fonts.headlineBold, color: colors.text, fontSize: 20, textTransform: 'uppercase' },
  subtitle: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 12, marginTop: 2 },

  sectionLabel: { fontFamily: fonts.monoBold, color: colors.textFaint, fontSize: 10.5, letterSpacing: 1, marginBottom: spacing.sm },
  candidateRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surfaceHigh, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.sm + 2,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  candidateName: { flex: 1, fontFamily: fonts.bodySemiBold, color: colors.text, fontSize: 14 },
  candidateBalance: { fontFamily: fonts.monoSemiBold, color: colors.textMuted, fontSize: 12 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  priceBtn: {
    width: 34, height: 34, borderRadius: radii.sm, backgroundColor: colors.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  priceValue: { fontFamily: fonts.headlineBold, color: colors.primary, fontSize: 20, width: 68, textAlign: 'center' },
  oneEuroChip: {
    marginLeft: 'auto', paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: radii.pill, borderWidth: 1, borderColor: colors.secondary,
  },
  oneEuroText: { fontFamily: fonts.monoBold, color: colors.secondary, fontSize: 9.5, letterSpacing: 0.4 },

  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 50, borderRadius: radii.lg,
  },
  confirmText: { fontFamily: fonts.headlineExtraBold, color: colors.bg, fontSize: 13, letterSpacing: 0.3 },
});
