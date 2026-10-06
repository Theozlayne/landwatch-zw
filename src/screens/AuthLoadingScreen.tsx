import { Ionicons } from '../components/Ionicons';
import { useEffect, useRef } from 'react';
import { Animated, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export function AuthLoadingScreen({ mode }: { mode: 'creating' | 'signing' }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(fade, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0.45, duration: 900, useNativeDriver: true }),
      ]),
    ]));
    animation.start();
    return () => animation.stop();
  }, [fade, pulse]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Animated.View style={[styles.crestFrame, { transform: [{ scale: pulse }] }]}>
          <Image source={require('../../coat-of-arms-transparent.png')} style={styles.crest} resizeMode="contain" />
        </Animated.View>
        <Text style={styles.brand}>LandWatch ZW</Text>
        <Text style={styles.ministry}>Ministry of Local Government and Public Works</Text>
        <View style={styles.loadingBlock}>
          <Animated.View style={{ opacity: fade }}><Ionicons name="shield-checkmark-outline" size={30} color="#DCC189" /></Animated.View>
          <Text style={styles.title}>{mode === 'creating' ? 'Creating your LandWatch account' : 'Signing you in securely'}</Text>
          <Text style={styles.subtitle}>{mode === 'creating' ? 'Setting up your secure citizen profile.' : 'Checking your account details.'}</Text>
          <View style={styles.dots}><Animated.View style={[styles.dot, { opacity: fade }]} /><Animated.View style={[styles.dot, { opacity: pulse }]} /><Animated.View style={[styles.dot, { opacity: fade }]} /></View>
        </View>
        <Text style={styles.footer}>Please keep this screen open</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#06291A' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  crestFrame: { width: 82, height: 82, backgroundColor: '#FFFFFF', borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#A9812F', overflow: 'hidden' },
  crest: { width: 74, height: 74 },
  brand: { color: '#FFFFFF', fontSize: 25, fontWeight: '700', marginTop: 18 },
  ministry: { color: '#B7D5C5', fontSize: 10, textAlign: 'center', marginTop: 5 },
  loadingBlock: { alignItems: 'center', marginTop: 74 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 17 },
  subtitle: { color: '#D6EBE0', fontSize: 12, textAlign: 'center', marginTop: 7 },
  dots: { flexDirection: 'row', gap: 7, marginTop: 22 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#DCC189' },
  footer: { color: '#8DB6A0', fontSize: 10, position: 'absolute', bottom: 30 },
});
