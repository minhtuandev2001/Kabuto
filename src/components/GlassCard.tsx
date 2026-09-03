import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { glass, shadows } from '../theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  intensity?: number;
  strong?: boolean;
};

export function GlassCard({ children, style, contentStyle, radius = 24, intensity = 32, strong }: Props) {
  return (
    <View style={[shadows.soft, style]}>
      <View style={[styles.clip, { borderRadius: radius }]}>
        <BlurView
          intensity={intensity}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: strong ? glass.fillStrong : glass.fill,
              borderRadius: radius,
              borderWidth: 1,
              borderColor: glass.border,
            },
          ]}
        />
        <View style={contentStyle}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
});
