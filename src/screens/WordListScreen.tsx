import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { Screen } from '../components/Screen';
import {
  formatLessonSubtitle,
  formatLessonTitle,
  getHeadline,
  getLesson,
  getWordsForLesson,
} from '../data/catalog';
import { colors, font, glass, radius, shadows } from '../theme';

type Props = {
  lesson: number;
  currentIndex: number;
  currentLessonId: number;
  isPlaying: boolean;
  onBack: () => void;
  onPlayWord: (index: number) => void;
  onPlayAll: () => void;
};

export function WordListScreen({
  lesson,
  currentIndex,
  currentLessonId,
  isPlaying,
  onBack,
  onPlayWord,
  onPlayAll,
}: Props) {
  const insets = useSafeAreaInsets();
  const info = getLesson(lesson);
  const words = getWordsForLesson(lesson);

  return (
    <Screen>
      <View style={styles.root}>
        <GlassCard radius={radius.md} contentStyle={styles.header} strong>
          <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
            <Ionicons name="chevron-back" size={19} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>BÀI {String(lesson).padStart(2, '0')}</Text>
            <Text style={styles.title} numberOfLines={1}>
              {info ? formatLessonTitle(info) : `Bài ${lesson}`}
            </Text>
          </View>
          <Pressable onPress={onPlayAll} style={styles.playAll} hitSlop={8}>
            <Ionicons name="play" size={15} color={colors.white} style={styles.playAllIcon} />
          </Pressable>
        </GlassCard>

        <Text style={styles.subtitle} numberOfLines={1}>
          {info ? formatLessonSubtitle(info) : ''} · {words.length} từ
        </Text>

        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 + 76 }]}
          showsVerticalScrollIndicator={false}
        >
          {words.map((word, index) => {
            const active = currentLessonId === lesson && currentIndex === index;
            return (
              <Pressable
                key={`${word.order}-${index}`}
                onPress={() => onPlayWord(index)}
                style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && styles.rowPressed]}
              >
                <View style={[styles.index, active && styles.indexActive]}>
                  <Text style={[styles.indexText, active && styles.indexTextActive]}>{word.order}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={[styles.kana, active && styles.kanaActive]} numberOfLines={1}>
                    {getHeadline(word)}
                  </Text>
                  <Text style={styles.meaning} numberOfLines={1}>
                    {word.kanji ? `${word.kana} · ` : ''}
                    {word.meaning}
                  </Text>
                </View>
                <Ionicons
                  name={active && isPlaying ? 'pause-circle' : 'play-circle'}
                  size={26}
                  color={active ? colors.primary : colors.faint}
                />
              </Pressable>
            );
          })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: glass.fillStrong,
    borderWidth: 1,
    borderColor: glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    fontFamily: font.bold,
    color: colors.primary,
    fontSize: 9.5,
    letterSpacing: 1.4,
  },
  title: {
    fontWeight: '800',
    fontSize: 18,
    color: colors.text,
    marginTop: 2,
  },
  playAll: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  playAllIcon: {
    marginLeft: 2,
  },
  subtitle: {
    fontFamily: font.medium,
    color: colors.textSoft,
    fontSize: 13,
    marginTop: 12,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  list: {
    gap: 10,
  },
  row: {
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadows.card,
  },
  rowActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
  },
  rowPressed: {
    backgroundColor: glass.fillStrong,
  },
  index: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: glass.fillStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexActive: {
    backgroundColor: colors.primary,
  },
  indexText: {
    fontFamily: font.extra,
    color: colors.muted,
    fontSize: 11.5,
  },
  indexTextActive: {
    color: colors.white,
  },
  rowBody: {
    flex: 1,
  },
  kana: {
    fontWeight: '800',
    fontSize: 15.5,
    color: colors.text,
  },
  kanaActive: {
    color: colors.primary,
  },
  meaning: {
    fontFamily: font.semi,
    fontSize: 12.5,
    color: colors.textSoft,
    marginTop: 2,
  },
});
