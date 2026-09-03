import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayer } from '../context/PlayerContext';
import { formatLessonTitle, getHeadline } from '../data/catalog';
import { getWordImage } from '../data/wordImages';
import { colors, font, glass, shadows } from '../theme';

export const MINI_PLAYER_HEIGHT = 64;

type Props = {
  visible: boolean;
  onOpenPlayer: () => void;
};

export function MiniPlayer({ visible, onOpenPlayer }: Props) {
  const {
    currentWord,
    lesson,
    isPlaying,
    isLoading,
    isWaiting,
    position,
    duration,
    togglePlay,
    next,
  } = usePlayer();

  if (!visible || !currentWord) {
    return null;
  }

  const headline = getHeadline(currentWord);
  const wordImage = getWordImage(currentWord);
  const progress = Math.min(1, position / Math.max(duration, 1));
  const busy = isWaiting || isPlaying;

  return (
    <View style={styles.wrap}>
      <Pressable onPress={onOpenPlayer} style={styles.bar}>
        <View style={[styles.progress, { width: `${progress * 100}%` }]} />
        <View style={styles.art}>
          {wordImage ? (
            <Image source={wordImage} style={styles.artImage} resizeMode="contain" />
          ) : (
            <Text style={styles.artFallback}>あ</Text>
          )}
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>
            {headline}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {currentWord.meaning}
            {lesson ? ` · ${formatLessonTitle(lesson)}` : ''}
          </Text>
        </View>
        <Pressable onPress={() => void togglePlay()} style={styles.ctrl} hitSlop={8}>
          <Ionicons
            name={isLoading ? 'ellipsis-horizontal' : busy ? 'pause' : 'play'}
            size={22}
            color={colors.text}
            style={!busy && !isLoading ? styles.playIcon : undefined}
          />
        </Pressable>
        <Pressable onPress={next} style={styles.ctrl} hitSlop={8}>
          <Ionicons name="play-skip-forward" size={20} color={colors.text} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingBottom: 6,
  },
  bar: {
    height: MINI_PLAYER_HEIGHT,
    borderRadius: 18,
    backgroundColor: glass.fillStrong,
    borderWidth: 1,
    borderColor: glass.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    overflow: 'hidden',
    ...shadows.card,
  },
  progress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    backgroundColor: colors.primary,
  },
  art: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  artImage: {
    width: '88%',
    height: '88%',
  },
  artFallback: {
    color: colors.primary,
    fontFamily: font.extra,
    fontSize: 18,
  },
  copy: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  title: {
    fontFamily: font.extra,
    fontSize: 14,
    color: colors.text,
  },
  subtitle: {
    fontFamily: font.semi,
    fontSize: 11.5,
    color: colors.muted,
    marginTop: 2,
  },
  ctrl: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 2,
  },
});
