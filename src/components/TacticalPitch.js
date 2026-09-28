import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, fonts, gradients } from '../theme/theme';

// Full tactical pitch card, v2 — richer turf (mowing stripes, full touchline
// frame, real box/arc/corner markings), and jersey nodes built to look like
// actual glossy match tokens (gradient sphere, highlight, grounded shadow,
// a star badge on the priciest signing) rather than flat chips.
//
// rows: [{ key, label, accentColor, slots: [{id,name,price} | null] }]
// already ordered attack-first (FWD → MID → DEF → GK).
// Tap a filled node = undo. Long-press = pick it up (picks-up mode shows a
// pulsing ring); tap another same-position node to swap, or tap the empty
// slot to move it there.
export default function TacticalPitch({ rows, selectedId, onSlotPress, onSlotLongPress }) {
  const starId = React.useMemo(() => {
    let best = null;
    rows.forEach((row) => row.slots.forEach((s) => {
      if (s && (!best || s.price > best.price)) best = s;
    }));
    return best?.id ?? null;
  }, [rows]);

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={gradients.pitch} style={StyleSheet.absoluteFill} />

      {/* mowing stripes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stripe,
            { top: `${i * 12.5}%`, height: '12.5%', opacity: i % 2 === 0 ? 0.05 : 0 },
          ]}
        />
      ))}

      {/* touchline frame */}
      <View style={styles.touchline} />

      {/* halfway line + center circle */}
      <View style={styles.centerLine} />
      <View style={styles.centerCircle} />
      <View style={styles.centerDot} />

      {/* attacking-end box (near GK) */}
      <View style={styles.penaltyBox} />
      <View style={styles.sixYardBox} />
      <View style={styles.penaltySpot} />
      <View style={styles.penaltyArc} />

      {/* far-end box hint, just the corners peeking in at the top */}
      <View style={[styles.cornerArc, styles.cornerTL]} />
      <View style={[styles.cornerArc, styles.cornerTR]} />
      <View style={[styles.cornerArc, styles.cornerBL]} />
      <View style={[styles.cornerArc, styles.cornerBR]} />

      <View style={styles.rowsStack}>
        {rows.map((row) => (
          <View key={row.key} style={styles.row}>
            {row.slots.map((slot, i) => (
              <JerseyNode
                key={`${row.key}-${i}`}
                label={row.label}
                slot={slot}
                accentColor={row.accentColor}
                isStar={!!slot && slot.id === starId}
                isSelected={!!slot && slot.id === selectedId}
                onPress={() => onSlotPress?.(row.label, slot)}
                onLongPress={() => onSlotLongPress?.(row.label, slot)}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function JerseyNode({ label, slot, accentColor, isStar, isSelected, onPress, onLongPress }) {
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

// Lighten a hex color for the top-left of the jersey sphere gradient.
function lighten(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 255) + 60);
  const g = Math.min(255, ((n >> 8) & 255) + 60);
  const b = Math.min(255, (n & 255) + 60);
  return `rgb(${r},${g},${b})`;
}

const NODE = 42;

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xs,
  },
  stripe: { position: 'absolute', left: 0, right: 0, backgroundColor: '#FFFFFF' },

  touchline: {
    position: 'absolute', top: 8, left: 8, right: 8, bottom: 8,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)', borderRadius: radii.md,
  },
  centerLine: {
    position: 'absolute', top: '46%', left: 8, right: 8, height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  centerCircle: {
    position: 'absolute', top: '46%', left: '50%', width: 60, height: 60,
    marginLeft: -30, marginTop: -30, borderRadius: 30,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)',
  },
  centerDot: {
    position: 'absolute', top: '46%', left: '50%', width: 4, height: 4,
    marginLeft: -2, marginTop: -2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)',
  },

  penaltyBox: {
    position: 'absolute', bottom: 8, left: '24%', right: '24%', height: 64,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)', borderBottomWidth: 0,
  },
  sixYardBox: {
    position: 'absolute', bottom: 8, left: '38%', right: '38%', height: 28,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)', borderBottomWidth: 0,
  },
  penaltySpot: {
    position: 'absolute', bottom: 48, left: '50%', width: 4, height: 4,
    marginLeft: -2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)',
  },
  penaltyArc: {
    position: 'absolute', bottom: 58, left: '50%', width: 56, height: 56,
    marginLeft: -28, borderRadius: 28,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)',
  },

  cornerArc: {
    position: 'absolute', width: 16, height: 16, borderColor: 'rgba(255,255,255,0.28)',
  },
  cornerTL: { top: 8, left: 8, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderBottomRightRadius: 16 },
  cornerTR: { top: 8, right: 8, borderTopWidth: 0, borderRightWidth: 0, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderBottomLeftRadius: 16 },
  cornerBL: { bottom: 8, left: 8, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 1.5, borderTopWidth: 1.5, borderTopRightRadius: 16 },
  cornerBR: { bottom: 8, right: 8, borderBottomWidth: 0, borderRightWidth: 0, borderLeftWidth: 1.5, borderTopWidth: 1.5, borderTopLeftRadius: 16 },

  rowsStack: { gap: spacing.sm + 4 },
  row: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'flex-start' },

  nodeWrap: { alignItems: 'center', width: 64 },
  groundShadow: {
    position: 'absolute', top: NODE - 6, width: 30, height: 8, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.45)', alignSelf: 'center',
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
    width: NODE, height: NODE, borderRadius: NODE / 2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
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
    position: 'absolute', top: -4, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.secondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.bg,
  },
  emptyTag: {
    marginTop: 6, fontFamily: fonts.monoSemiBold, fontSize: 8.5, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.4,
  },
  nameTag: {
    marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(10,10,10,0.8)', borderRadius: radii.sm,
    paddingHorizontal: 5, paddingVertical: 2.5, maxWidth: 64,
  },
  nameTagBar: { width: 3, height: 10, borderRadius: 1.5 },
  nameTagText: { fontFamily: fonts.bodySemiBold, fontSize: 9.5, color: colors.text, flexShrink: 1 },
  priceTag: { marginTop: 2, fontFamily: fonts.monoBold, fontSize: 9 },
});
