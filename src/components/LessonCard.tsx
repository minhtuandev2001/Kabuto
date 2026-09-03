import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatLessonSubtitle, formatLessonTitle, getWordsForLesson } from '../data/catalog';
import { colors, font, glass, lessonAccents, radius, shadows } from '../theme';
import type { LessonInfo } from '../types';

type Props = {
  lesson: LessonInfo;
  onOpen: () => void;
  onPlay: () => void;
};

export function LessonCard({ lesson, onOpen, onPlay }: Props) {
  const accent = lessonAccents[(lesson.lesson - 1) % lessonAccents.length];
  const count = getWordsForLesson(lesson.lesson).length;

  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <LinearGradient colors={[...accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badge}>
        <Text style={styles.badgeNum}>{String(lesson.lesson).padStart(2, '0')}</Text>
        <Text style={styles.badgeLabel}>BÀI</Text>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {formatLessonTitle(lesson)}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {formatLessonSubtitle(lesson)}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{lesson.jlpt}</Text>
          </View>
          <Ionicons name="musical-notes-outline" size={12} color={colors.muted} />
          <Text style={styles.count}>{count} từ</Text>
        </View>
      </View>

      <Pressable onPress={onPlay} hitSlop={10} style={({ pressed }) => [styles.play, pressed && styles.playPressed]}>
        <Ionicons name="play" size={16} color={colors.white} style={styles.playIcon} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadows.card,
  },
  pressed: {
    backgroundColor: glass.fillStrong,
    transform: [{ scale: 0.995 }],
  },
  badge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNum: {
    color: colors.white,
    fontFamily: font.extra,
    fontSize: 18,
    lineHeight: 22,
  },
  badgeLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: font.bold,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  body: {
    flex: 1,
  },
  title: {
    fontWeight: '800',
    fontSize: 15.5,
    color: colors.text,
  },
  subtitle: {
    fontFamily: font.semi,
    fontSize: 12.5,
    color: colors.muted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  chipText: {
    fontFamily: font.bold,
    fontSize: 10.5,
    color: colors.primary,
  },
  count: {
    fontFamily: font.semi,
    fontSize: 11.5,
    color: colors.muted,
  },
  play: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  playPressed: {
    opacity: 0.8,
  },
  playIcon: {
    marginLeft: 2,
  },
});
