import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Animated, Easing, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

const SILHOUETTE_BLACK = '#000000';
const MOUNTAIN_COLOR = '#07050E'; 

// Scaled Up Minimalist vector silhouette pine element
function SilhouettePine({ height = 195, style }) {
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
      <View style={{ width: Math.max(4, baseWidth * 0.12), height: Math.round(height * 0.12), backgroundColor: SILHOUETTE_BLACK }} />
    </View>
  );
}

// Scaled Up Geometric vector telescope pointing upwards (3x increase)
function SilhouetteTelescope({ scale = 3.6, style }) {
  return (
    <View style={[{ width: 40 * scale, height: 50 * scale, alignItems: 'center' }, style]}>
      {/* Main Telescope Tube - Angled upwards */}
      <View 
        style={{
          width: 26 * scale,
          height: 6 * scale,
          backgroundColor: SILHOUETTE_BLACK,
          transform: [{ rotate: '-42deg' }],
          position: 'absolute',
          top: 12 * scale,
          borderRadius: 1.5,
        }} 
      />
      {/* Counterweight/Mount block */}
      <View style={{ width: 6 * scale, height: 6 * scale, backgroundColor: SILHOUETTE_BLACK, position: 'absolute', top: 19 * scale }} />
      {/* Tripod Legs */}
      <View 
        style={{
          width: 2.5 * scale,
          height: 26 * scale,
          backgroundColor: SILHOUETTE_BLACK,
          transform: [{ rotate: '14deg' }],
          position: 'absolute',
          bottom: 0,
          left: '36%',
        }} 
      />
      <View 
        style={{
          width: 2.5 * scale,
          height: 26 * scale,
          backgroundColor: SILHOUETTE_BLACK,
          transform: [{ rotate: '-14deg' }],
          position: 'absolute',
          bottom: 0,
          right: '36%',
        }} 
      />
    </View>
  );
}

export default function EclipseCanvas({ progress, isCompleted }) {
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
          { shouldPlay: true, volume: 0.5 }
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

  const shadowTranslateX = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [195, -45], 
    extrapolate: 'clamp',
  });

  // UPDATED: Initial state uses clean vibrant white `#FFFFFF` for maximal radiance
  const moonBaseColor = progressAnim.interpolate({
    inputRange: [0, 50, 80, 100],
    outputRange: ['#FFFFFF', '#EAE7FF', '#AD1111', '#6B0202'],
  });

  const skyNormalOpacity = progressAnim.interpolate({
    inputRange: [0, 70, 92],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  const skyTotalityOpacity = progressAnim.interpolate({
    inputRange: [75, 92, 100],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  const starsOpacity = progressAnim.interpolate({
    inputRange: [0, 15],
    outputRange: [0.4, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.canvasFrame} onLayout={onCanvasLayout}>
      
      {/* ---------------- SKY BACKGROUND LAYERS ---------------- */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: skyNormalOpacity }]}>
        <LinearGradient colors={['#020106', '#060312', '#0E0820']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: skyTotalityOpacity }]}>
        <LinearGradient colors={['#000000', '#020104', '#030208']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* ---------------- SHIMMERING STARS ---------------- */}
      <Animated.View style={[styles.starContainer, { opacity: starsOpacity }]}>
        <Text style={[styles.starSparkle, { left: '14%', top: '16%', fontSize: 18 }]}>✦</Text>
        <Text style={[styles.starSparkle, { right: '16%', top: '9%', fontSize: 24 }]}>✦</Text>
        <Text style={[styles.starSparkle, { left: '32%', top: '7%', fontSize: 14 }]}>✦</Text>
        <Text style={[styles.starSparkle, { right: '26%', top: '22%', fontSize: 20 }]}>✦</Text>
        <Text style={[styles.starSparkle, { left: '78%', top: '28%', fontSize: 16 }]}>✦</Text>
        <Text style={[styles.starSparkle, { left: '20%', top: '34%', fontSize: 22 }]}>✦</Text>
      </Animated.View>

      {/* ---------------- THE MOON LAYER COMPLEX ---------------- */}
      <View style={styles.eclipseCenterFrame}>
        <Animated.View style={[styles.moonGlobe, { backgroundColor: moonBaseColor }]}>
          {/* Enhanced alpha lighting vectors to maximize initial high-contrast brightness */}
          <LinearGradient 
            colors={['rgba(255,255,255,0.65)', 'transparent', 'rgba(0,0,0,0.5)'] } 
            style={StyleSheet.absoluteFill} 
          />
        </Animated.View>

        {/* Umbral Shadow Overlap */}
        <Animated.View 
          style={[
            styles.earthShadowCircle, 
            { transform: [{ translateX: shadowTranslateX }] }
          ]} 
        />
      </View>

      {/* ---------------- BACKGROUND MOUNTAINS ---------------- */}
      <View style={styles.mountainMidground}>
        <View style={[styles.mountainPeak, { left: '-15%', width: '60%', height: 85, transform: [{ rotate: '24deg' }] }]} />
        <View style={[styles.mountainPeak, { right: '-10%', width: '55%', height: 75, transform: [{ rotate: '-20deg' }] }]} />
        <View style={[styles.mountainPeak, { left: '25%', width: '50%', height: 70, transform: [{ rotate: '12deg' }] }]} />
        <View style={[styles.mountainPeak, { right: '30%', width: '45%', height: 80, transform: [{ rotate: '-15deg' }] }]} />
      </View>

      {/* ---------------- MASSIVE 3X FOREGROUND ---------------- */}
      <View style={styles.foregroundContainer}>
        {/* Giant pine silhouette nesting the moon structure */}
        <SilhouettePine height={230} style={{ position: 'absolute', left: '1%', bottom: '100%' }} />
        
        {/* Massive telescope silhouette pointing toward center sky */}
        <SilhouetteTelescope scale={3.4} style={{ position: 'absolute', right: '1%', bottom: '100%' }} />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  canvasFrame: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  starContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  starSparkle: {
    position: 'absolute',
    color: '#FFFFFF',
    opacity: 0.85,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  eclipseCenterFrame: {
    position: 'absolute',
    left: '50%',
    top: '38%', // Raised slightly to balance the newly elevated 3x foreground horizon
    marginLeft: -97.5, 
    marginTop: -97.5,
    width: 195,
    height: 195,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', 
    borderRadius: 97.5,
  },
  moonGlobe: {
    width: 195,
    height: 195,
    borderRadius: 97.5,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35, // Amplified bright light glow aura
    shadowRadius: 40,
    elevation: 6,
    overflow: 'hidden',
  },
  earthShadowCircle: {
    position: 'absolute',
    width: 202,
    height: 202,
    borderRadius: 101,
    backgroundColor: '#020104', 
  },
  mountainMidground: {
    position: 'absolute',
    bottom: '12%',
    left: 0,
    right: 0,
    height: 80,
    zIndex: 10,
  },
  mountainPeak: {
    position: 'absolute',
    bottom: -35,
    backgroundColor: MOUNTAIN_COLOR,
  },
  foregroundContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '14%',
    backgroundColor: SILHOUETTE_BLACK,
    zIndex: 20, 
  },
});