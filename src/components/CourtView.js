import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, fonts } from '../theme/theme';

// Half-court view for basketball rosters, v2 — full court frame, key/arc/
// baseline markings, and the same glossy jersey-node language as the
// football pitch (gradient sphere, grounded shadow, star badge on the
// priciest signing) for a consistent, upgraded look across both sports.
// slotsByPos: { PG, SG, SF, PF, C } -> {id,name,price} | null
// colorByPos: { PG, SG, SF, PF, C } -> hex accent
// Tap a filled node = undo. Long-press = pick it up (pulsing ring); tap
// another node of the same position to swap, or an empty slot to move it.
export default function CourtView({ slotsByPos, colorByPos, selectedId, onSlotPress, onSlotLongPress }) {
  const starId = React.useMemo(() => {
    let best = null;
    Object.values(slotsByPos).forEach((s) => {
      if (s && (!best || s.price > best.price)) best = s;
    });
    return best?.id ?? null;
  }, [slotsByPos]);

  const nodeProps = (label) => {
    const slot = slotsByPos[label];
    return {
      label,
      slot,
      accentColor: colorByPos[label],
      isStar: !!slot && slot.id === starId,
      isSelected: !!slot && slot.id === selectedId,
      onPress: () => onSlotPress?.(label, slot),
      onLongPress: () => onSlotLongPress?.(label, slot),
    };
  };

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#8B5A2E', '#63401E']} style={StyleSheet.absoluteFill} />

      {/* plank stripes */}
      {Array.from({ length: 7 }).map((_, i) => (
        <View key={i} style={[styles.plank, { left: `${i * (100 / 7)}%`, width: `${100 / 7}%` }]} />
      ))}

      {/* court frame + markings */}
      <View style={styles.frame} />
      <View style={styles.baseline} />
      <View style={styles.arc} />
      <View style={styles.key} />
      <View style={styles.freeThrowCircle} />
      <View style={styles.restrictedArea} />

      <View style={styles.grid}>
        <View style={styles.row}>
          <Node {...nodeProps('PG')} />
          <Node {...nodeProps('SG')} />
        </View>
        <View style={styles.row}>
          <Node {...nodeProps('SF')} />
          <Node {...nodeProps('PF')} />
        </View>
        <View style={[styles.row, { justifyContent: 'center' }]}>
          <Node {...nodeProps('C')} />
        </View>
      </View>
    </View>
  );
}

function lighten(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 255) + 60);
  const g = Math.min(255, ((n >> 8) & 255) + 60);
  const b = Math.min(255, (n & 255) + 60);
  return `rgb(${r},${g},${b})`;
}

function Node({ label, slot, accentColor, isStar, isSelected, onPress, onLongPress }) {
  if (!slot) {
    return (
      <TouchableOpacity style={styles.nodeWrap} onPress={onPress} activeOpacity={0.6}>
        <View style={styles.groundShadow} />
        <View style={[styles.node, styles.nodeEmpty, isSelected && styles.nodeTargetable]}>
          <MaterialIcons name="add" size={16} color="rgba(255,255,255,0.5)" />
        </View>
        <Text style={styles.emptyTag}>{label}</Text>
      </TouchableOpacity>
    );
  }
  const shortName = slot.name.split(' ').slice(-1)[0];
  return (
    <TouchableOpacity style={styles.nodeWrap} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.75}>
      <View style={styles.groundShadow} />
      <View style={[styles.nodeShadowRing, isSelected && styles.nodeSelectedRing]}>
        <LinearGradient
          colors={[lighten(accentColor), accentColor]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.node}
        >
          <View style={styles.glossHighlight} />
          <Text style={styles.nodeLabel}>{label}</Text>
        </LinearGradient>
      </View>
      {isStar && (
        <View style={styles.starBadge}>
          <MaterialIcons name="star" size={11} color="#0A0A0A" />
        </View>
      )}
      <View style={styles.nameTag}>
        <View style={[styles.nameTagBar, { backgroundColor: accentColor }]} />
        <Text style={styles.nameTagText} numberOfLines={1}>{shortName}</Text>
      </View>
      <Text style={[styles.priceTag, { color: accentColor }]}>{slot.price.toFixed(2)}€</Text>
    </TouchableOpacity>
  );
}

const NODE = 42;

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.sm,
    minHeight: 226,
  },
  plank: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.06)' },
  frame: {
    position: 'absolute', top: 8, left: 8, right: 8, bottom: 8,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', borderRadius: radii.md,
  },
  baseline: {
    position: 'absolute', top: 8, left: 8, right: 8, height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  arc: {
    position: 'absolute', top: -74, left: '50%', width: 176, height: 176,
    marginLeft: -88, borderRadius: 88,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
  },
  key: {
    position: 'absolute', top: 8, left: '50%', width: 78, height: 104,
    marginLeft: -39, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)', borderTopWidth: 0,
  },
  freeThrowCircle: {
    position: 'absolute', top: 96, left: '50%', width: 62, height: 62,
    marginLeft: -31, borderRadius: 31, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  restrictedArea: {
    position: 'absolute', top: 8, left: '50%', width: 32, height: 32,
    marginLeft: -16, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
    borderTopWidth: 0,
  },
  grid: { gap: spacing.md + 2, marginTop: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-around' },

  nodeWrap: { alignItems: 'center', width: 68 },
  groundShadow: {
    position: 'absolute', top: NODE - 6, width: 30, height: 8, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)', alignSelf: 'center',
  },
  nodeShadowRing: {
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 5,
    borderRadius: NODE / 2 + 3,
  },
  nodeSelectedRing: {
    borderWidth: 2, borderColor: colors.secondary, borderRadius: NODE / 2 + 4,
    shadowColor: colors.secondary, shadowOpacity: 0.7, shadowRadius: 8, elevation: 8,
  },
  node: {
    width: NODE, height: NODE, borderRadius: NODE / 2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', overflow: 'hidden',
  },
  glossHighlight: {
    position: 'absolute', top: -NODE * 0.35, left: -NODE * 0.1,
    width: NODE * 1.1, height: NODE * 1.1, borderRadius: NODE,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  nodeEmpty: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', borderStyle: 'dashed',
  },
  nodeTargetable: {
    borderColor: colors.secondary, borderWidth: 2,
  },
  nodeLabel: { fontFamily: fonts.monoBold, fontSize: 10.5, color: '#0A0A0A' },
  starBadge: {
    position: 'absolute', top: -4, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.secondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.bg,
  },
  emptyTag: { marginTop: 6, fontFamily: fonts.monoSemiBold, fontSize: 8.5, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.4 },
  nameTag: {
    marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(10,10,10,0.8)', borderRadius: radii.sm,
    paddingHorizontal: 5, paddingVertical: 2.5, maxWidth: 68,
  },
  nameTagBar: { width: 3, height: 10, borderRadius: 1.5 },
  nameTagText: { fontFamily: fonts.bodySemiBold, fontSize: 9.5, color: colors.text, flexShrink: 1 },
  priceTag: { marginTop: 2, fontFamily: fonts.monoBold, fontSize: 9 },
});
