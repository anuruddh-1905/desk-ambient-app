import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { Audio } from 'expo-av';

const GLOW_BASE = '#FF5500';
const GLOW_CORE = '#FFF5EE';
const GLOW_AURA = '#FF6600';

const DISPLAY_SCALE_SECONDS = 59 * 60 + 59; // 59:59 ceiling

function formatTime(progress) {
  const remainingFraction = Math.max(0, Math.min(1, (100 - progress) / 100));
  const totalSeconds = Math.round(remainingFraction * DISPLAY_SCALE_SECONDS);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export default function DigitalGlowCanvas({ progress, isCompleted }) {
  const soundRef = useRef(null);

  // ANIMATION VALUES
  const gasFlicker = useRef(new Animated.Value(1)).current;
  const breathingAura = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // 1. Sync Progress Animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      easing: Easing.linear,
      useNativeDriver: false, // Must be false to drive shadowRadius
    }).start();
  }, [progress]);

  // 2. Loop Animations (Flicker and Breathe)
  useEffect(() => {
    // We use useNativeDriver: false for EVERYTHING here. 
    // Mixing true and false on values that interact causes the crash you saw.
    const flickerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(gasFlicker, { toValue: 0.95, duration: 90, useNativeDriver: false }),
        Animated.timing(gasFlicker, { toValue: 1.0, duration: 110, useNativeDriver: false }),
        Animated.timing(gasFlicker, { toValue: 0.97, duration: 130, useNativeDriver: false }),
        Animated.timing(gasFlicker, { toValue: 1.0, duration: 80, useNativeDriver: false }),
      ])
    );

    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAura, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(breathingAura, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );

    flickerLoop.start();
    breatheLoop.start();

    return () => {
      flickerLoop.stop();
      breatheLoop.stop();
    };
  }, []);

  // 3. Audio Logic
  useEffect(() => {
    let cancelled = false;

    async function playCompletionChime() {
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
        console.log('Audio playback skipped:', error);
      }
    }

    playCompletionChime();

    return () => {
      cancelled = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [isCompleted]);

  // INTERPOLATIONS
  const progressGlowRadius = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [15, 4],
    extrapolate: 'clamp',
  });

  const progressGlowOpacity = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0.8, 0.25],
    extrapolate: 'clamp',
  });

  const breathingOffset = breathingAura.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  // Calculate dynamic shadow radius by adding the base glow and the "breath"
  const shadowRadius = Animated.add(progressGlowRadius, breathingOffset);
  
  // Combine flicker and progress dimming for opacity
  const combinedOpacity = Animated.multiply(gasFlicker, progressGlowOpacity);

  const timeString = formatTime(progress);

  return (
    <View style={styles.canvasFrame}>
      <View style={styles.glassTubeContainer}>
        <View style={styles.digitStack}>
          {/* Layer 1 — Base: deep muted amber */}
          <Text style={styles.layerBase}>{timeString}</Text>

          {/* Layer 2 — Core: crisp white */}
          <Text style={styles.layerCore}>{timeString}</Text>

          {/* Layer 3 — Glow Aura: Animated Layer */}
          <Animated.Text
            style={[
              styles.layerAura,
              {
                opacity: combinedOpacity,
                shadowRadius: shadowRadius, 
              },
            ]}
          >
            {timeString}
          </Animated.Text>
        </View>
      </View>

      <View style={styles.deskReflection} />
    </View>
  );
}

const styles = StyleSheet.create({
  canvasFrame: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  glassTubeContainer: {
    position: 'absolute',
    top: '38%',
    left: '10%',
    right: '10%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  digitStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerBase: {
    position: 'absolute',
    fontSize: 88,
    fontWeight: '200',
    letterSpacing: 4,
    color: GLOW_BASE,
    opacity: 0.2,
  },
  layerCore: {
    position: 'absolute',
    fontSize: 88,
    fontWeight: '100',
    letterSpacing: 4,
    color: GLOW_CORE,
    zIndex: 2,
  },
  layerAura: {
    fontSize: 88,
    fontWeight: '200',
    letterSpacing: 4,
    color: GLOW_AURA,
    shadowColor: GLOW_AURA,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    elevation: 0, // Removed elevation to prevent Android conflict with shadowRadius
  },
  deskReflection: {
    position: 'absolute',
    bottom: 60,
    left: '20%',
    right: '20%',
    height: 10,
    backgroundColor: '#FF5500',
    opacity: 0.05,
    borderRadius: 5,
  },
});