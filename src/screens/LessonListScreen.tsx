import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { LessonCard } from '../components/LessonCard';
import { Screen } from '../components/Screen';
import { allWords, lessons } from '../data/catalog';
import { colors, font, glass, radius, shadows } from '../theme';

const MASCOT = require('../../assets/mascot-cat.png');

type Filter = 'all' | 'N5' | 'N4';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'N5', label: 'N5 · Sơ cấp 1' },
  { id: 'N4', label: 'N4 · Sơ cấp 2' },
];

type Props = {
  onOpenLesson: (lesson: number) => void;
  onPlayLesson: (lesson: number) => void;
};

export function LessonListScreen({ onOpenLesson, onPlayLesson }: Props) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const visible = filter === 'all' ? lessons : lessons.filter((item) => item.jlpt === filter);

  return (
    <Screen>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 + 76 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Xin chào 👋</Text>
            <Text style={styles.title}>Chọn bài học</Text>
          </View>
          <GlassCard radius={16} contentStyle={styles.avatar} strong>
            <Text style={styles.avatarText}>あ</Text>
          </GlassCard>
        </View>

        <LinearGradient
          colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroSheen} />
          <View style={styles.heroBody}>
            <Text style={styles.heroKicker}>THƯ VIỆN TỪ VỰNG</Text>
            <Text style={styles.heroTitle}>{lessons.length} bài học</Text>
            <Text style={styles.heroHint}>{allWords.length.toLocaleString('vi-VN')} từ có phát âm</Text>
          </View>
          <Image source={MASCOT} style={styles.mascot} resizeMode="contain" />
        </LinearGradient>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsRow}
        >
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(item.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.list}>
          {visible.map((lesson) => (
            <LessonCard
              key={lesson.lesson}
              lesson={lesson}
              onOpen={() => onOpenLesson(lesson.lesson)}
              onPlay={() => onPlayLesson(lesson.lesson)}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hello: {
    fontFamily: font.semi,
    color: colors.muted,
    fontSize: 13.5,
  },
  title: {
    fontFamily: font.extra,
    fontSize: 26,
    color: colors.text,
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '800',
  },
  hero: {
    marginTop: 16,
    borderRadius: radius.lg,
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...shadows.glow,
  },
  heroSheen: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    right: -30,
    top: -80,
  },
  heroBody: {
    flex: 1,
  },
  heroKicker: {
    fontFamily: font.bold,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 9.5,
    letterSpacing: 1.4,
  },
  heroTitle: {
    fontFamily: font.extra,
    color: colors.white,
    fontSize: 22,
    marginTop: 5,
  },
  heroHint: {
    fontFamily: font.semi,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 3,
    fontSize: 12.5,
  },
  mascot: {
    width: 88,
    height: 88,
  },
  chipsRow: {
    flexGrow: 0,
    marginTop: 16,
    marginBottom: 14,
  },
  chips: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: font.bold,
    color: colors.textSoft,
    fontSize: 12.5,
  },
  chipTextActive: {
    color: colors.white,
  },
  list: {
    gap: 12,
  },
});
