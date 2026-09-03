import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { Screen } from '../components/Screen';
import {
  MAX_WORD_GAP_MS,
  MIN_WORD_GAP_MS,
  WORD_GAP_PRESETS,
  WORD_GAP_STEP_MS,
  formatWordGap,
  useSettings,
} from '../context/SettingsContext';
import { colors, font, glass, radius } from '../theme';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { wordGapMs, setWordGapMs } = useSettings();

  return (
    <Screen>
      <View style={styles.root}>
        <Text style={styles.kicker}>TÙY CHỈNH</Text>
        <Text style={styles.title}>Cài đặt</Text>
        <Text style={styles.subtitle}>Chỉnh nhịp nghe cho vừa tốc độ học của bạn.</Text>

        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 90 + 76 }}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard radius={radius.lg} contentStyle={styles.card} strong>
            <View style={styles.cardHead}>
              <View style={styles.iconWrap}>
                <Ionicons name="hourglass-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>Nghỉ giữa các từ</Text>
                <Text style={styles.cardHint}>Sau khi phát xong một từ, đợi rồi mới sang từ kế.</Text>
              </View>
            </View>

            <View style={styles.valueRow}>
              <Pressable
                onPress={() => setWordGapMs(wordGapMs - WORD_GAP_STEP_MS)}
                disabled={wordGapMs <= MIN_WORD_GAP_MS}
                style={({ pressed }) => [
                  styles.stepBtn,
                  pressed && styles.pressed,
                  wordGapMs <= MIN_WORD_GAP_MS && styles.disabled,
                ]}
              >
                <Ionicons name="remove" size={20} color={colors.primary} />
              </Pressable>
              <Text style={styles.value}>{formatWordGap(wordGapMs)}</Text>
              <Pressable
                onPress={() => setWordGapMs(wordGapMs + WORD_GAP_STEP_MS)}
                disabled={wordGapMs >= MAX_WORD_GAP_MS}
                style={({ pressed }) => [
                  styles.stepBtn,
                  pressed && styles.pressed,
                  wordGapMs >= MAX_WORD_GAP_MS && styles.disabled,
                ]}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.presets}>
              {WORD_GAP_PRESETS.map((ms) => {
                const active = wordGapMs === ms;
                return (
                  <Pressable
                    key={ms}
                    onPress={() => setWordGapMs(ms)}
                    style={[styles.preset, active && styles.presetActive]}
                  >
                    <Text style={[styles.presetText, active && styles.presetTextActive]}>
                      {ms === 0 ? '0s' : `${ms / 1000}s`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
  },
  kicker: {
    fontFamily: font.bold,
    color: colors.primary,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: font.extra,
    fontSize: 28,
    color: colors.text,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: font.medium,
    fontSize: 14,
    color: colors.muted,
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    padding: 16,
  },
  cardHead: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: font.extra,
    fontSize: 16,
    color: colors.text,
  },
  cardHint: {
    fontFamily: font.medium,
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 19,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: glass.fillStrong,
    borderWidth: 1,
    borderColor: glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.35,
  },
  value: {
    fontFamily: font.extra,
    fontSize: 22,
    color: colors.primary,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: glass.fillSoft,
    borderWidth: 1,
    borderColor: glass.borderSoft,
  },
  presetActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetText: {
    fontFamily: font.bold,
    fontSize: 12.5,
    color: colors.textSoft,
  },
  presetTextActive: {
    color: colors.white,
  },
});
