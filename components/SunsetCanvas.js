import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Animated, Easing, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

const SILHOUETTE_BLACK = '#000000';

function SilhouettePine({ height = 55, style }) {
  const tierH = Math.round(height * 0.32);
  const baseWidth = Math.round(height * 0.60);

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      {[0, 1, 2].map((i) => {
        const shrink = 1 - i * 0.24;
        return (
          <View
            key={i}
            style={{
              width: 0,
              height: 0,
              marginTop: i === 0 ? 0 : -tierH * 0.45,
              borderLeftWidth: (baseWidth * shrink) / 2,
              borderRightWidth: (baseWidth * shrink) / 2,
              borderBottomWidth: tierH,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: SILHOUETTE_BLACK,
            }}
          />
        );
      })}
      <View style={{ width: Math.max(3, baseWidth * 0.12), height: Math.round(height * 0.12), backgroundColor: SILHOUETTE_BLACK }} />
    </View>
  );
}

export default function SunsetCanvas({ progress, isCompleted }) {
  const soundRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [canvasHeight, setCanvasHeight] = useState(0);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [progress, progressAnim]);

  useEffect(() => {
    let cancelled = false;
    async function playCompletionSound() {
      if (!isCompleted) return;
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.mp3' },
          { shouldPlay: true, volume: 0.4 }
        );
        if (cancelled) {
          sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
      } catch (error) {
        console.log('Audio playback skipped quietly:', error);
      }
    }

    playCompletionSound();

    return () => {
      cancelled = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [isCompleted]);

  const onCanvasLayout = useCallback((e) => {
    setCanvasHeight(e.nativeEvent.layout.height);
  }, []);

  const H = canvasHeight || 700;
  const sunTravelStart = H * 0.12;
  const sunTravelEnd = H * 0.88;

  const sunTranslateY = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [sunTravelStart, sunTravelEnd],
    extrapolate: 'clamp',
  });

  // UPDATED: Cranked up the scale to 2.4x for a massive, cinematic sunset effect
  const sunScale = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 2.4],
    extrapolate: 'clamp',
  });

  const sunFadeOut = progressAnim.interpolate({
    inputRange: [92, 98, 100],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  });

  const sunColor = progressAnim.interpolate({
    inputRange: [0, 40, 75, 100],
    outputRange: ['#FFCD4D', '#FFAD29', '#E65100', '#BF2600'],
  });

  const skyDawnOpacity = progressAnim.interpolate({
    inputRange: [0, 22, 50],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });
  
  const skyDuskOpacity = progressAnim.interpolate({
    inputRange: [15, 32, 75, 92],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  
  const skyNightOpacity = progressAnim.interpolate({
    inputRange: [68, 88, 100],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  const starsOpacity = progressAnim.interpolate({
    inputRange: [75, 95],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.canvasFrame} onLayout={onCanvasLayout}>
      
      {/* ---------------- SKY BACKGROUND LAYERS ---------------- */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: skyDawnOpacity }]}>
        <LinearGradient colors={['#3A255B', '#803D65', '#D66A54', '#F4A261']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: skyDuskOpacity }]}>
        <LinearGradient colors={['#1E1035', '#4A1540', '#880B39', '#F95738']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: skyNightOpacity }]}>
        <LinearGradient colors={['#020206', '#050512', '#0A0A1C']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* ---------------- LARGE BRIGHT AESTHETIC STARS (Re-positioned) ---------------- */}
      <Animated.View style={[styles.starContainer, { opacity: starsOpacity }]}>
        <Text style={[styles.starSparkle, { left: '15%', top: '15%', fontSize: 26 }]}>✦</Text>
        <Text style={[styles.starSparkle, { right: '20%', top: '20%', fontSize: 20 }]}>✦</Text>
        <Text style={[styles.starSparkle, { left: '45%', top: '8%', fontSize: 24 }]}>✦</Text>
        <Text style={[styles.starSparkle, { right: '12%', top: '35%', fontSize: 16 }]}>✦</Text>
        <Text style={[styles.starSparkle, { left: '8%', top: '32%', fontSize: 18 }]}>✦</Text>
        <Text style={[styles.starSparkle, { left: '65%', top: '14%', fontSize: 22 }]}>✦</Text>
      </Animated.View>

      {/* ---------------- THE SUN GLOBE ---------------- */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sunWrapper,
          {
            opacity: sunFadeOut,
            transform: [{ translateY: sunTranslateY }, { scale: sunScale }],
          },
        ]}
      >
        <Animated.View style={[styles.sunCore, { backgroundColor: sunColor }]} />
      </Animated.View>

      {/* ---------------- SOLID GROUND & TREES ---------------- */}
      <View style={styles.foregroundContainer}>
        {/* UPDATED: Trees on the left are now much larger to frame the massive sun */}
        <SilhouettePine height={125} style={{ position: 'absolute', left: '2%', bottom: '100%' }} />
        <SilhouettePine height={85} style={{ position: 'absolute', left: '24%', bottom: '100%' }} />
        
        {/* Right side remains minimal to keep visual balance */}
        <SilhouettePine height={45} style={{ position: 'absolute', right: '22%', bottom: '100%' }} />
        <SilhouettePine height={35} style={{ position: 'absolute', right: '8%', bottom: '100%' }} />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  canvasFrame: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  starContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  starSparkle: {
    position: 'absolute',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  sunWrapper: {
    position: 'absolute',
    left: '50%',
    top: 0,
    marginLeft: -45,
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunCore: {
    width: 76,
    height: 76,
    borderRadius: 38,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 25,
    elevation: 6,
  },
  foregroundContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '14%',
    backgroundColor: SILHOUETTE_BLACK,
  },
});