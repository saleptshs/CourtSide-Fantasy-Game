import * as Haptics from 'expo-haptics';

// Tiny wrapper so every call site doesn't need its own try/catch — haptics
// aren't available on web and shouldn't ever crash the app if they fail.
const safe = (fn) => {
  try {
    fn();
  } catch (e) {
    // no-op — haptics are a nice-to-have, never a requirement
  }
};

export const haptics = {
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  select: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
