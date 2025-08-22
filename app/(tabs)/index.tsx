// app/(tabs)/index.tsx
import { AnimatedTabView } from '@/components/ui/AnimatedTabView';
import { Image, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  return (
    <AnimatedTabView>
      <View style={styles.container}>
        <Image
          source={require('@/assets/images/KHC_LOGO.png')} // Use your correct path
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </AnimatedTabView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
  },
});
