import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { Screen } from '../components/Screen';
import { usePlayer } from '../context/PlayerContext';
import { formatWordGap, useSettings } from '../context/SettingsContext';
import { formatLessonTitle, getAdjacentLesson, getHeadline, getWordsForLesson } from '../data/catalog';
import { getWordImage } from '../data/wordImages';
import { colors, font, glass, radius, shadows } from '../theme';

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function PlayerScreen({ onOpenQueue }: { onOpenQueue: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const {
    lesson,
    lessonId,
    words,
    currentWord,
    index,
    isPlaying,
    isLoading,
    isWaiting,
    position,
    duration,
    loopLesson,
    togglePlay,
    next,
    prev,
    toggleLoop,
  } = usePlayer();
  const { wordGapMs } = useSettings();

  const artSize = Math.min(width - 48, 400, height * 0.28);
  const progress = Math.min(1, position / Math.max(duration, 1));
  const headline = currentWord ? getHeadline(currentWord) : '—';
  const showKana = Boolean(currentWord?.kanji?.trim());
  const wordImage = getWordImage(currentWord);
  const nextWord = (() => {
    if (!words.length) {
      return undefined;
    }
    if (index + 1 < words.length) {
      return words[index + 1];
    }
    if (loopLesson) {
      return words[0];
    }
    const nextLesson = getAdjacentLesson(lessonId, 1);
    return nextLesson != null ? getWordsForLesson(nextLesson)[0] : undefined;
  })();

  return (
    <Screen>
      <View style={[styles.root, { paddingBottom: insets.bottom + 78 }]}>
        <GlassCard radius={radius.md} contentStyle={styles.topBar} strong>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{String(lesson?.lesson ?? 1).padStart(2, '0')}</Text>
          </View>
          <View style={styles.topCenter}>
            <Text style={styles.nowPlaying}>{isWaiting ? 'ĐANG NGHỈ' : 'ĐANG PHÁT'}</Text>
            <Text style={styles.lessonName} numberOfLines={1}>
              {lesson ? formatLessonTitle(lesson) : ''}
            </Text>
          </View>
          <Pressable onPress={onOpenQueue} style={styles.topBtn} hitSlop={8}>
            <Ionicons name="list" size={19} color={colors.primary} />
          </Pressable>
        </GlassCard>

        <View style={styles.artWrap}>
          <Text
            style={[styles.wordTitle, headline.length > 8 && styles.wordTitleSmall]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {headline}
          </Text>
          {showKana ? <Text style={styles.wordKana}>{currentWord?.kana}</Text> : null}

          <LinearGradient
            colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.art, { width: artSize, height: artSize }]}
          >
            <View style={[styles.sheen, styles.sheenOne]} />
            <View style={[styles.sheen, styles.sheenTwo]} />
            {wordImage ? (
              <Image source={wordImage} style={styles.artImage} resizeMode="contain" />
            ) : (
              <Text style={styles.artFallback}>あ</Text>
            )}
          </LinearGradient>
        </View>

        <GlassCard radius={radius.lg} contentStyle={styles.info} style={styles.infoWrap}>
          <Text style={styles.meaning} numberOfLines={2}>
            {currentWord?.meaning || 'Chọn một từ để nghe'}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.romaji}>{currentWord?.romaji}</Text>
            {currentWord?.sinoVietnamese ? (
              <>
                <View style={styles.dot} />
                <Text style={styles.han} numberOfLines={1}>
                  {currentWord.sinoVietnamese}
                </Text>
              </>
            ) : null}
          </View>
          {currentWord && !currentWord.audioUrl ? (
            <Text style={styles.noAudio}>Từ này chưa có file nghe</Text>
          ) : null}

          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]}>
              <View style={styles.knob} />
            </View>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{formatTime(position)}</Text>
            <Text style={styles.counter}>
              {index + 1} / {words.length}
            </Text>
            <Text style={styles.time}>{formatTime(duration)}</Text>
          </View>
          {isWaiting ? (
            <Text style={styles.waitHint}>Nghỉ {formatWordGap(wordGapMs)} rồi sang từ tiếp</Text>
          ) : null}
        </GlassCard>

        <GlassCard radius={radius.pill} contentStyle={styles.controls} strong>
          <Pressable onPress={toggleLoop} style={styles.sideBtn} hitSlop={8}>
            <Ionicons name="repeat" size={23} color={loopLesson ? colors.primary : colors.faint} />
          </Pressable>
          <Pressable onPress={prev} style={styles.skip} hitSlop={8}>
            <Ionicons name="play-skip-back" size={26} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => void togglePlay()} style={styles.playWrap}>
            <LinearGradient
              colors={[colors.primaryLight, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.play}
            >
              <Ionicons
                name={isLoading ? 'ellipsis-horizontal' : isWaiting || isPlaying ? 'pause' : 'play'}
                size={30}
                color={colors.white}
                style={!isPlaying && !isLoading && !isWaiting ? styles.playIcon : undefined}
              />
            </LinearGradient>
          </Pressable>
          <Pressable onPress={next} style={styles.skip} hitSlop={8}>
            <Ionicons name="play-skip-forward" size={26} color={colors.text} />
          </Pressable>
          <Pressable onPress={onOpenQueue} style={styles.sideBtn} hitSlop={8}>
            <Ionicons name="albums-outline" size={21} color={colors.faint} />
          </Pressable>
        </GlassCard>

        {nextWord ? (
          <Pressable onPress={onOpenQueue} style={styles.nextUp}>
            <Ionicons name="arrow-forward-circle" size={17} color={colors.primary} />
            <Text style={styles.nextLabel}>Tiếp theo</Text>
            <Text style={styles.nextWord} numberOfLines={1}>
              {getHeadline(nextWord)} · {nextWord.meaning}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: font.extra,
    color: colors.white,
    fontSize: 13.5,
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  nowPlaying: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: colors.primary,
  },
  lessonName: {
    fontWeight: '800',
    fontSize: 13.5,
    color: colors.text,
    marginTop: 2,
  },
  topBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: glass.fillStrong,
    borderWidth: 1,
    borderColor: glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    marginTop: 8,
  },
  wordTitle: {
    fontWeight: '800',
    fontSize: 34,
    lineHeight: 42,
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  wordTitleSmall: {
    fontSize: 24,
    lineHeight: 30,
  },
  wordKana: {
    marginTop: 2,
    marginBottom: 10,
    fontWeight: '700',
    fontSize: 15,
    color: colors.muted,
  },
  art: {
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.glow,
  },
  artImage: {
    width: '86%',
    height: '86%',
  },
  artFallback: {
    color: colors.white,
    fontSize: 64,
    fontWeight: '800',
  },
  sheen: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  sheenOne: {
    width: 220,
    height: 220,
    top: -110,
    left: -70,
  },
  sheenTwo: {
    width: 150,
    height: 150,
    bottom: -70,
    right: -40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  infoWrap: {
    marginTop: 18,
  },
  info: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  meaning: {
    fontFamily: font.extra,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 27,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  romaji: {
    fontFamily: font.semi,
    fontSize: 13.5,
    color: colors.muted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.faint,
  },
  han: {
    fontFamily: font.bold,
    fontSize: 11.5,
    color: colors.primary,
    flexShrink: 1,
  },
  noAudio: {
    marginTop: 6,
    fontFamily: font.bold,
    color: colors.amber,
    fontSize: 11.5,
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.track,
    alignSelf: 'stretch',
    marginTop: 16,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  knob: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.primary,
    marginRight: -4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 9,
  },
  time: {
    fontFamily: font.semi,
    fontSize: 11,
    color: colors.muted,
  },
  counter: {
    fontFamily: font.bold,
    fontSize: 11,
    color: colors.primary,
  },
  waitHint: {
    marginTop: 8,
    fontFamily: font.semi,
    fontSize: 12,
    color: colors.primary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  sideBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skip: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playWrap: {
    ...shadows.glow,
    borderRadius: 35,
  },
  play: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 4,
  },
  nextUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.md,
    backgroundColor: glass.fillSoft,
    borderWidth: 1,
    borderColor: glass.borderSoft,
  },
  nextLabel: {
    fontFamily: font.bold,
    fontSize: 11.5,
    color: colors.primary,
  },
  nextWord: {
    flex: 1,
    fontFamily: font.semi,
    fontSize: 12,
    color: colors.textSoft,
  },
});
