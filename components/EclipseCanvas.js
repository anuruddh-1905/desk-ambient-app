import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SILHOUETTE_BLACK = '#000000';

// ---------------------------------------------------------------------------
// 1. GEOMETRIC PINE TREE
// ---------------------------------------------------------------------------
function SilhouettePine({ scale = 1, left, right, bottom = 0 }) {
  const baseWidth = 30 * scale;
  const tierHeight = 20 * scale;

  return (
    <View style={[styles.pineWrapper, { left, right, bottom }]}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: 0,
            height: 0,
            marginTop: i === 0 ? 0 : -tierHeight * 0.4,
            borderLeftWidth: (baseWidth - (i * 6 * scale)) / 2,
            borderRightWidth: (baseWidth - (i * 6 * scale)) / 2,
            borderBottomWidth: tierHeight,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: SILHOUETTE_BLACK,
          }}
        />
      ))}
      <View style={{ width: 4 * scale, height: 10 * scale, backgroundColor: SILHOUETTE_BLACK, marginTop: -1 }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// 2. WIND TURBINE
// ---------------------------------------------------------------------------
function WindTurbine() {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 9000, 
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.turbineWrapper}>
      <Animated.View style={[styles.turbineHub, { transform: [{ rotateZ: rotate }] }]}>
        {[0, 120, 240].map((deg) => (
          <View key={deg} style={[styles.turbineBlade, { transform: [{ rotateZ: `${deg}deg` }] }]} />
        ))}
      </Animated.View>
      <View style={styles.turbineMast} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// 3. RIGHT FOREGROUND CLUSTER
// ---------------------------------------------------------------------------
function ForegroundCluster({ eclipseProgress }) {
  const windowGlowOpacity = eclipseProgress.interpolate({
    inputRange: [0, 85, 95, 100],
    outputRange: [0, 0, 1, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.rightClusterWrapper}>
      <SilhouettePine scale={1.0} right={130} bottom={0} /> 
      <SilhouettePine scale={1.5} right={85} bottom={0} />  
      <SilhouettePine scale={2.0} right={35} bottom={0} />  

      <View style={styles.cottageBlock}>
        <View style={styles.cottageRoof} />
        <View style={styles.cottageBody} />
        <Animated.View style={[styles.cottageWindow, { opacity: windowGlowOpacity }]} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 4. MASTER CANVAS
// ---------------------------------------------------------------------------
export default function EclipseCanvas({ progress }) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: false, 
    }).start();
  }, [progress, progressAnim]);

  // Smooth shadow traverse across the moon disc
  const shadowTranslateX = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [160, -10], 
    extrapolate: 'clamp',
  });

  // Soft atmospheric shadow opacity for a realistic edge bleed
  const shadowOpacity = progressAnim.interpolate({
    inputRange: [0, 10, 90, 100],
    outputRange: [0, 0.92, 0.95, 0.98],
    extrapolate: 'clamp',
  });

  const moonBaseColor = progressAnim.interpolate({
    inputRange: [0, 40, 75, 100],
    outputRange: ['#FFF9EE', '#D0CCD5', '#8B0000', '#2E0303'],
  });

  const horizonLightOpacity = progressAnim.interpolate({
    inputRange: [0, 80, 100],
    outputRange: [1, 0.75, 0.45],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.canvasFrame}>
      
      {/* ---------------- OLED-SAFE HORIZON LIGHTING ---------------- */}
      <LinearGradient colors={['#000004', '#02020E', '#080A26', '#0F133D']} style={StyleSheet.absoluteFill} />
      
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: horizonLightOpacity }]}>
        <LinearGradient 
          colors={['transparent', 'transparent', 'rgba(12, 16, 52, 0.3)', 'rgba(22, 26, 75, 0.8)']} 
          locations={[0, 0.5, 0.75, 1]}
          style={StyleSheet.absoluteFill} 
        />
      </Animated.View>

      {/* ---------------- SCATTERED STARS ---------------- */}
      <View style={styles.starContainer}>
        <Text style={[styles.starSparkle, { left: '10%', top: '15%', fontSize: 9 }]}>✦</Text>
        <Text style={[styles.starSparkle, { right: '15%', top: '10%', fontSize: 11 }]}>✦</Text>
        <Text style={[styles.starSparkle, { left: '25%', top: '35%', fontSize: 7 }]}>✦</Text>
        <Text style={[styles.starSparkle, { right: '20%', top: '42%', fontSize: 10 }]}>✦</Text>
        <Text style={[styles.starSparkle, { left: '80%', top: '22%', fontSize: 8 }]}>✦</Text>
      </View>

      {/* ---------------- REALISTIC SOFT-ECLIPSE MOON ---------------- */}
      <View style={styles.eclipseCenterFrame}>
        {/* Base Moon Globe */}
        <Animated.View style={[styles.moonGlobe, { backgroundColor: moonBaseColor }]}>
          {/* Feathered Atmospheric Shadow Overlay */}
          <Animated.View 
            style={[
              styles.earthShadowCircle, 
              { 
                opacity: shadowOpacity,
                transform: [{ translateX: shadowTranslateX }] 
              }
            ]} 
          />
        </Animated.View>
      </View>

      {/* ---------------- RURAL HORIZON ---------------- */}
      <View style={styles.horizonMatting}>
        <SilhouettePine scale={0.7} left="6%" bottom={0} />
        <SilhouettePine scale={0.9} left="16%" bottom={0} />

        <WindTurbine />

        <ForegroundCluster eclipseProgress={progressAnim} />
      </View>

      {/* ---------------- UI SAFE ZONE ---------------- */}
      <View style={styles.foregroundContainer} />
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
    opacity: 0.35,
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  eclipseCenterFrame: {
    position: 'absolute',
    left: '50%',
    top: '22%', 
    marginLeft: -80, 
    marginTop: -80,
    width: 160, 
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },  
  moonGlobe: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden', // Clips shadow strictly inside moon bounds
    shadowColor: '#FFF9EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, 
    shadowRadius: 25, 
    elevation: 4,
  },
  earthShadowCircle: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 180, 
    height: 180,
    borderRadius: 90,
    backgroundColor: '#02020E', // Deep space atmospheric shadow tone
    // Soft blurred edge effect for umbra/penumbra realism
    shadowColor: '#000000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 14,
    elevation: 6,
  },
  horizonMatting: {
    position: 'absolute',
    bottom: '22%', 
    left: 0,
    right: 0,
    height: 180, 
    zIndex: 15,
  },
  pineWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  turbineWrapper: {
    position: 'absolute',
    bottom: 0,
    left: '32%', 
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 120,
  },
  turbineMast: {
    width: 4,
    height: 70,
    backgroundColor: SILHOUETTE_BLACK,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  turbineHub: {
    position: 'absolute',
    top: 48,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SILHOUETTE_BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  turbineBlade: {
    position: 'absolute',
    bottom: 3, 
    width: 2,
    height: 45,
    backgroundColor: SILHOUETTE_BLACK,
    transformOrigin: 'bottom center',
    borderRadius: 1,
  },
  rightClusterWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 180,
    height: 120,
  },
  cottageBlock: {
    position: 'absolute',
    bottom: 0,
    right: '0%', 
    width: 45,
    height: 45,
    zIndex: 5,
  },
  cottageBody: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 45,
    height: 30,
    backgroundColor: SILHOUETTE_BLACK,
  },
  cottageRoof: {
    position: 'absolute',
    bottom: 29,
    right: -3,
    width: 0,
    height: 0,
    borderLeftWidth: 25,
    borderRightWidth: 25,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: SILHOUETTE_BLACK,
  },
  cottageWindow: {
    position: 'absolute',
    bottom: 8,
    right: 18,
    width: 8,
    height: 8,
    backgroundColor: '#FFB300',
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  foregroundContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '22%', 
    backgroundColor: SILHOUETTE_BLACK,
    zIndex: 30, 
  },
});