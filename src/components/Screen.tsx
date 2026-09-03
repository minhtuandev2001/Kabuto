import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Aurora } from './Aurora';

export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.outer}>
      <Aurora />
      <View style={[styles.inner, { paddingTop: insets.top + 10 }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F6F3FF',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
  },
});
