import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

/** Soft colour field that the frosted surfaces refract. */
export function Aurora() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#F6F3FF', '#EEF1FF', '#FDF2FB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.blob, styles.violet]} />
      <View style={[styles.blob, styles.pink]} />
      <View style={[styles.blob, styles.cyan]} />
      <View style={[styles.blob, styles.amber]} />
      <BlurView intensity={64} tint="light" style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  violet: {
    width: 320,
    height: 320,
    backgroundColor: '#A78BFA',
    opacity: 0.5,
    top: -90,
    left: -80,
  },
  pink: {
    width: 260,
    height: 260,
    backgroundColor: '#F9A8D4',
    opacity: 0.45,
    top: 120,
    right: -90,
  },
  cyan: {
    width: 300,
    height: 300,
    backgroundColor: '#7DD3FC',
    opacity: 0.4,
    bottom: -60,
    left: -70,
  },
  amber: {
    width: 200,
    height: 200,
    backgroundColor: '#FDE68A',
    opacity: 0.45,
    bottom: 90,
    right: -40,
  },
});
