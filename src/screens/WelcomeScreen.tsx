import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { Screen } from '../components/Screen';
import { allWords, lessons } from '../data/catalog';
import { colors, font, radius } from '../theme';

const HERO = require('../../assets/hero-listening.png');

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const heroSize = Math.max(200, Math.min(320, height * 0.34));

  return (
    <Screen>
      <View style={[styles.root, { paddingBottom: insets.bottom + 24 }]}>
        <GlassCard radius={radius.pill} style={styles.brandWrap} contentStyle={styles.brand} strong>
          <View style={styles.brandDot}>
            <Text style={styles.brandDotText}>あ</Text>
          </View>
          <Text style={styles.brandText}>Minna no Nihongo</Text>
        </GlassCard>

        <View style={styles.heroWrap}>
          <View style={[styles.heroGlow, { width: heroSize, height: heroSize }]} />
          <Image source={HERO} style={{ width: heroSize, height: heroSize }} resizeMode="contain" />
        </View>

        <View style={styles.statsRow}>
          <GlassCard radius={22} style={styles.stat} contentStyle={styles.statInner}>
            <Text style={styles.statValue}>{lessons.length}</Text>
            <Text style={styles.statLabel}>bài học</Text>
          </GlassCard>
          <GlassCard radius={22} style={styles.stat} contentStyle={styles.statInner}>
            <Text style={styles.statValue}>{allWords.length.toLocaleString('vi-VN')}</Text>
            <Text style={styles.statLabel}>từ vựng</Text>
          </GlassCard>
          <GlassCard radius={22} style={styles.stat} contentStyle={styles.statInner}>
            <Text style={styles.statValue}>N5→N4</Text>
            <Text style={styles.statLabel}>trình độ</Text>
          </GlassCard>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Học từ vựng{'\n'}bằng đôi tai.</Text>
          <Text style={styles.subtitle}>
            Nghe phát âm chuẩn từng từ, lặp lại theo bài. Mỗi ngày một chút, nhớ lâu hơn học chay.
          </Text>
        </View>

        <GradientButton label="Bắt đầu học" onPress={onStart} icon="arrow-forward" />
        <Text style={styles.hint}>Không cần tài khoản · vào thẳng bài 01</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
  },
  brandWrap: {
    alignSelf: 'flex-start',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingLeft: 6,
    paddingRight: 16,
    paddingVertical: 6,
  },
  brandDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandDotText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    marginTop: -2,
  },
  brandText: {
    fontFamily: font.bold,
    color: colors.text,
    fontSize: 14,
  },
  heroWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  heroGlow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    opacity: 0.28,
    transform: [{ scaleX: 1.05 }, { scaleY: 0.82 }],
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  stat: {
    flex: 1,
  },
  statInner: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: font.extra,
    fontSize: 17,
    color: colors.primary,
  },
  statLabel: {
    fontFamily: font.semi,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  copy: {
    marginBottom: 24,
  },
  title: {
    fontFamily: font.extra,
    fontSize: 34,
    lineHeight: 41,
    color: colors.text,
  },
  subtitle: {
    marginTop: 12,
    fontFamily: font.medium,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSoft,
  },
  hint: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: font.semi,
    color: colors.muted,
    fontSize: 12.5,
  },
});
