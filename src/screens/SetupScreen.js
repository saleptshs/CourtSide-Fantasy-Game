import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { useGameDispatch } from '../context/GameContext';
import { SPORT_LABELS, LEAGUES, CURRENT_SEASON } from '../data/positions';
import { haptics } from '../utils/haptics';
import {
  colors,
  spacing,
  radii,
  fonts,
  gradients,
  shadow,
  managerColor,
} from '../theme/theme';

const MIN_MANAGERS = 2;
const MAX_MANAGERS = 8;
const BUDGET_PRESETS = [20, 50, 100, 200];
const BUDGET_STEP = 5;

const STEPS = ['ΑΘΛΗΜΑ', 'BUDGET', 'ΠΑΙΚΤΕΣ', 'READY'];

export default function SetupScreen({ navigation }) {
  const dispatch = useGameDispatch();

  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(20);
  const [sport, setSport] = useState(null);
  const [league, setLeague] = useState(null);
  const season = CURRENT_SEASON;
  const [managerNames, setManagerNames] = useState(['', '']);

  const goTo = (i) => {
    haptics.select();
    setStep(i);
  };
  const next = () => goTo(Math.min(STEPS.length - 1, step + 1));
  const back = () => {
    if (step === 0) return;
    goTo(step - 1);
  };

  const pickSport = (key) => {
    haptics.tap();
    setSport(key);
    setLeague(null);
  };

  const pickLeague = (key) => {
    haptics.select();
    setLeague(key);
    setTimeout(() => setStep(1), 140);
  };

  const updateManagerName = (index, value) => {
    const nextArr = [...managerNames];
    nextArr[index] = value;
    setManagerNames(nextArr);
  };
  const addManagerField = () => {
    if (managerNames.length >= MAX_MANAGERS) return;
    haptics.tap();
    setManagerNames([...managerNames, '']);
  };
  const removeManagerField = (index) => {
    if (managerNames.length <= MIN_MANAGERS) return;
    haptics.tap();
    setManagerNames(managerNames.filter((_, i) => i !== index));
  };

  const filledManagers = managerNames.map((n) => n.trim()).filter(Boolean);

  const stepValid = [
    !!sport && !!league,
    budget > 0,
    filledManagers.length >= MIN_MANAGERS,
    true,
  ][step];

  const startGame = () => {
    if (filledManagers.length < MIN_MANAGERS) {
      haptics.warning();
      Alert.alert('Λείπουν παίκτες', `Χρειάζονται τουλάχιστον ${MIN_MANAGERS} παίκτες.`);
      return;
    }
    const managers = filledManagers.map((name, i) => ({ id: `mgr-${Date.now()}-${i}`, name }));
    haptics.success();
    dispatch({ type: 'START_GAME', payload: { sport, league, season, budget, managers } });
    navigation.replace('Main');
  };

  const handlePrimary = () => {
    if (step === STEPS.length - 1) {
      startGame();
    } else {
      if (!stepValid) {
        haptics.warning();
        return;
      }
      next();
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Progress header */}
        <View style={styles.progressHeader}>
          {step > 0 ? (
            <TouchableOpacity onPress={back} hitSlop={10} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}
          <View style={styles.progressTrack}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSeg,
                  i <= step && { backgroundColor: colors.primary },
                ]}
              />
            ))}
          </View>
          <Text style={styles.stepCount}>{step + 1}/{STEPS.length}</Text>
        </View>

        <View style={styles.brandRow}>
          <Text style={styles.brandWord}>COURTSIDE</Text>
        </View>

        {/* Step body */}
        <View style={{ flex: 1 }}>
          {step === 0 && (
            <SportStep sport={sport} league={league} onPickSport={pickSport} onPickLeague={pickLeague} />
          )}
          {step === 1 && (
            <BudgetStep budget={budget} setBudget={setBudget} />
          )}
          {step === 2 && (
            <ManagersStep
              managerNames={managerNames}
              updateManagerName={updateManagerName}
              addManagerField={addManagerField}
              removeManagerField={removeManagerField}
            />
          )}
          {step === 3 && (
            <ReviewStep sport={sport} league={league} season={season} budget={budget} managers={filledManagers} />
          )}
        </View>

        {/* Primary action */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handlePrimary} disabled={!stepValid} style={!stepValid && { opacity: 0.35 }}>
            <LinearGradient
              colors={gradients.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cta, shadow(2, 'rgba(255,107,53,0.5)')]}
            >
              <Text style={styles.ctaText} numberOfLines={1}>
                {step === STEPS.length - 1 ? 'ΕΝΑΡΞΗ ΠΑΙΧΝΙΔΙΟΥ' : 'ΣΥΝΕΧΕΙΑ'}
              </Text>
              <MaterialIcons name={step === STEPS.length - 1 ? 'sports' : 'arrow-forward'} size={20} color={colors.bg} />
            </LinearGradient>
          </TouchableOpacity>
          {step === STEPS.length - 1 && (
            <Text style={styles.footerNote}>Designed by Saleptshs (All rights reservedⓒ).</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------- Step 0 --
function SportStep({ sport, league, onPickSport, onPickLeague }) {
  return (
    <ScrollView contentContainerStyle={styles.centerStep} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepEyebrow}>ΒΗΜΑ 01</Text>
      <Text style={styles.stepTitle}>ΔΙΑΛΕΞΕ{'\n'}ΑΘΛΗΜΑ</Text>
      <View style={{ height: spacing.lg }} />
      {Object.entries(SPORT_LABELS).map(([key, label]) => {
        const active = sport === key;
        return (
          <View key={key}>
            <TouchableOpacity
              onPress={() => onPickSport(key)}
              activeOpacity={0.85}
              style={[styles.hugeCard, active && styles.hugeCardActive, active && { marginBottom: 0 }]}
            >
              <Text style={styles.hugeEmoji}>{key === 'basketball' ? '🏀' : '⚽️'}</Text>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text
                  style={[styles.hugeCardTitle, active && styles.hugeCardTitleActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {label}
                </Text>
                <Text style={styles.hugeCardSub}>{LEAGUES[key].map((l) => l.label).join(' · ')}</Text>
              </View>
              <MaterialIcons
                name={active ? 'expand-less' : 'chevron-right'}
                size={26}
                color={active ? colors.primary : colors.textFaint}
              />
            </TouchableOpacity>

            {active && (
              <View style={styles.inlineLeagueBox}>
                <Text style={styles.inlineLeagueLabel}>ΔΙΑΛΕΞΕ ΔΙΟΡΓΑΝΩΣΗ</Text>
                <View style={styles.inlineLeagueRow}>
                  {LEAGUES[key].map((l) => {
                    const leagueActive = league === l.key;
                    return (
                      <TouchableOpacity
                        key={l.key}
                        onPress={() => onPickLeague(l.key)}
                        style={[styles.miniLeagueBtn, leagueActive && styles.miniLeagueBtnActive]}
                      >
                        <Text
                          style={[styles.miniLeagueText, leagueActive && styles.miniLeagueTextActive]}
                          numberOfLines={1}
                        >
                          {l.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ---------------------------------------------------------------- Step 1 --
function BudgetStep({ budget, setBudget }) {
  return (
    <View style={styles.centerStep}>
      <Text style={styles.stepEyebrow}>ΒΗΜΑ 02</Text>
      <Text style={styles.stepTitle}>ΟΡΙΣΕ{'\n'}BUDGET</Text>
      <View style={{ height: spacing.xl }} />

      <View style={styles.heroBudgetRow}>
        <TouchableOpacity
          onPress={() => { haptics.tap(); setBudget((b) => Math.max(BUDGET_STEP, b - BUDGET_STEP)); }}
          style={styles.heroStepBtn}
        >
          <MaterialIcons name="remove" size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.heroBudgetValueWrap}>
          <Text style={styles.heroCurrency}>€</Text>
          <Text style={styles.heroBudgetValue}>{budget}</Text>
        </View>

        <TouchableOpacity
          onPress={() => { haptics.tap(); setBudget((b) => b + BUDGET_STEP); }}
          style={styles.heroStepBtn}
        >
          <MaterialIcons name="add" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>
      <Text style={styles.heroCaption}>ΑΝΑ ΠΑΙΚΤΗ · ΟΡΙΟ ΜΙΣΘΩΝ</Text>

      <View style={{ height: spacing.xl }} />
      <View style={styles.chipWrap}>
        {BUDGET_PRESETS.map((p) => {
          const active = budget === p;
          return (
            <TouchableOpacity
              key={p}
              onPress={() => { haptics.tap(); setBudget(p); }}
              style={[styles.bigChip, active && styles.bigChipActive]}
            >
              <Text style={[styles.bigChipText, active && styles.bigChipTextActive]}>€{p}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Step 2 --
function ManagersStep({ managerNames, updateManagerName, addManagerField, removeManagerField }) {
  return (
    <ScrollView contentContainerStyle={styles.centerStep} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepEyebrow}>ΒΗΜΑ 03</Text>
      <Text style={styles.stepTitle}>ΠΡΟΣΘΗΚΗ{'\n'}ΠΑΙΚΤΩΝ</Text>
      <Text style={styles.stepHint}>{managerNames.length}/{MAX_MANAGERS} · ελάχιστο {MIN_MANAGERS}</Text>
      <View style={{ height: spacing.lg }} />

      <View style={{ gap: spacing.sm, width: '100%' }}>
        {managerNames.map((name, index) => (
          <View key={index} style={styles.managerRow}>
            <View style={[styles.managerAvatar, { backgroundColor: managerColor(index) + '26', borderColor: managerColor(index) }]}>
              <Text style={[styles.managerAvatarText, { color: managerColor(index) }]}>
                {(name.trim().slice(0, 2) || `Π${index + 1}`).toUpperCase()}
              </Text>
            </View>
            <TextInput
              value={name}
              onChangeText={(v) => updateManagerName(index, v)}
              placeholder={`Παίκτης ${index + 1}`}
              placeholderTextColor={colors.textFaint}
              style={styles.managerInput}
            />
            {managerNames.length > MIN_MANAGERS && (
              <TouchableOpacity onPress={() => removeManagerField(index)} hitSlop={8}>
                <MaterialIcons name="close" size={18} color={colors.textFaint} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {managerNames.length < MAX_MANAGERS && (
        <TouchableOpacity onPress={addManagerField} style={styles.addManagerBtn}>
          <MaterialIcons name="add" size={18} color={colors.primary} />
          <Text style={styles.addManagerText}>ΔΙΑΧΕΙΡΙΣΗ ΠΑΙΚΤΩΝ</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------- Step 3 --
function ReviewStep({ sport, league, season, budget, managers }) {
  const rows = [
    { icon: sport === 'basketball' ? 'sports-basketball' : 'sports-soccer', label: 'Άθλημα', value: SPORT_LABELS[sport] },
    { icon: 'emoji-events', label: 'Διοργάνωση', value: `${league} · ${season}` },
    { icon: 'account-balance-wallet', label: 'Budget / παίκτη', value: `€${budget}` },
    { icon: 'groups', label: 'Παίκτες', value: `${managers.length} — ${managers.join(', ')}` },
  ];
  return (
    <ScrollView contentContainerStyle={styles.centerStep} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepEyebrow}>ΈΤΟΙΜΟΙ</Text>
      <Text style={styles.stepTitle}>ΕΛΕΓΞΕ{'\n'}ΚΑΙ ΞΕΚΙΝΑ</Text>
      <View style={{ height: spacing.lg }} />

      <View style={{ width: '100%', gap: spacing.sm }}>
        {rows.map((r) => (
          <View key={r.label} style={styles.reviewRow}>
            <View style={styles.reviewIconWrap}>
              <MaterialIcons name={r.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewLabel}>{r.label}</Text>
              <Text style={styles.reviewValue} numberOfLines={2}>{r.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  progressHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { flex: 1, flexDirection: 'row', gap: 4 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceHigh },
  stepCount: { fontFamily: fonts.monoSemiBold, color: colors.textFaint, fontSize: 10.5, width: 30, textAlign: 'right' },

  brandRow: { paddingHorizontal: spacing.md, marginTop: spacing.sm },
  brandWord: { fontFamily: fonts.headlineBold, color: colors.textFaint, fontSize: 13, letterSpacing: 3 },

  centerStep: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg, justifyContent: 'center' },
  stepEyebrow: { fontFamily: fonts.monoBold, color: colors.primary, fontSize: 12, letterSpacing: 1.5 },
  stepTitle: { fontFamily: fonts.headlineBlack, color: colors.text, fontSize: 44, lineHeight: 44, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 4 },
  stepHint: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  groupLabel: { fontFamily: fonts.monoBold, color: colors.textFaint, fontSize: 10.5, letterSpacing: 1, marginBottom: spacing.xs },

  hugeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radii.xl,
    borderWidth: 1.5, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  hugeCardActive: {
    borderColor: colors.primary, backgroundColor: colors.surfaceAlt,
    shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  },
  hugeEmoji: { fontSize: 40 },
  hugeCardTitle: {
    fontFamily: fonts.heavy, color: colors.text, fontSize: 19, textTransform: 'uppercase', letterSpacing: 0,
  },
  // Crisp neon: bright core colour + a tight, low-blur glow (no smudge).
  hugeCardTitleActive: {
    color: colors.primaryBright,
    textShadowColor: 'rgba(255,107,53,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  hugeCardSub: { fontFamily: fonts.monoSemiBold, color: colors.primary, fontSize: 11, letterSpacing: 0.6, marginTop: 2 },

  inlineLeagueBox: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5, borderColor: colors.primary, borderTopWidth: 0,
    borderBottomLeftRadius: radii.xl, borderBottomRightRadius: radii.xl,
    padding: spacing.md, marginBottom: spacing.md,
  },
  inlineLeagueLabel: { fontFamily: fonts.monoBold, color: colors.textFaint, fontSize: 9.5, letterSpacing: 1, marginBottom: spacing.sm },
  inlineLeagueRow: { flexDirection: 'row', gap: spacing.sm },
  miniLeagueBtn: {
    flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radii.md,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center',
  },
  miniLeagueBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  miniLeagueText: { fontFamily: fonts.bodyBold, color: colors.text, fontSize: 13 },
  miniLeagueTextActive: { color: colors.bg },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  bigChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderRadius: radii.md, backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border,
  },
  bigChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  bigChipText: { fontFamily: fonts.bodyBold, color: colors.text, fontSize: 14 },
  bigChipTextActive: { color: colors.bg },

  heroBudgetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  heroStepBtn: {
    width: 56, height: 56, borderRadius: radii.pill,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  heroBudgetValueWrap: { flexDirection: 'row', alignItems: 'flex-start' },
  heroCurrency: { fontFamily: fonts.headlineBold, color: colors.primary, fontSize: 28, marginTop: 10 },
  heroBudgetValue: { fontFamily: fonts.headlineBlack, color: colors.text, fontSize: 72, lineHeight: 76 },
  heroCaption: { fontFamily: fonts.monoSemiBold, color: colors.textFaint, fontSize: 10.5, letterSpacing: 1, textAlign: 'center', marginTop: spacing.xs },

  managerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.sm,
  },
  managerAvatar: { width: 32, height: 32, borderRadius: radii.sm + 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  managerAvatarText: { fontFamily: fonts.monoBold, fontSize: 11 },
  managerInput: { flex: 1, color: colors.text, fontFamily: fonts.body, fontSize: 15 },
  addManagerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: spacing.md, paddingVertical: spacing.sm + 2,
    borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
  },
  addManagerText: { fontFamily: fonts.monoBold, color: colors.primary, fontSize: 12, letterSpacing: 0.5 },

  reviewRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.sm + 2,
  },
  reviewIconWrap: {
    width: 36, height: 36, borderRadius: radii.md, backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  reviewLabel: { fontFamily: fonts.monoSemiBold, color: colors.textFaint, fontSize: 9.5, letterSpacing: 0.6 },
  reviewValue: { fontFamily: fonts.bodySemiBold, color: colors.text, fontSize: 14, marginTop: 2 },

  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.xs },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    borderRadius: radii.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
  },
  ctaText: { fontFamily: fonts.headlineExtraBold, fontSize: 14, color: colors.bg, letterSpacing: 0.3 },
  footerNote: { fontFamily: fonts.mono, color: colors.textFaint, textAlign: 'center', fontSize: 10, marginTop: spacing.xs },
});
