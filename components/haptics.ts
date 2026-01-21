import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const OPTIONS = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
} as const;

export type HapticKind =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

export function haptic(kind: HapticKind = 'selection') {
  const type =
    kind === 'light'
      ? 'impactLight'
      : kind === 'medium'
        ? 'impactMedium'
        : kind === 'heavy'
          ? 'impactHeavy'
          : kind === 'success'
            ? 'notificationSuccess'
            : kind === 'warning'
              ? 'notificationWarning'
              : kind === 'error'
                ? 'notificationError'
                : 'selection';

  try {
    ReactNativeHapticFeedback.trigger(type as any, OPTIONS);
  } catch {
    // no-op
  }
}
