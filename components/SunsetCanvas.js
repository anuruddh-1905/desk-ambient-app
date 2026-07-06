import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Animated, Easing, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SILHOUETTE_BLACK = '#000000';

// Clean, static wild grass blades sprouting organically out of the soil line
function StaticSoilGrass({ baseHeight = 14, offsetLeft, offsetRight }) {
  const blades = [
    { h: baseHeight, rot: -15, mx: -1 },
    { h: baseHeight * 1.4, rot: 5, mx: -0.5 },
    { h: baseHeight * 0.9, rot: 20, mx: -1 },
    { h: baseHeight * 1.2, rot: -5, mx: -0.5 },
  ];

  return (
    <View style={[styles.grassSoilGroup, { left: offsetLeft, right: offsetRight }]}>
      {blades.map((b, i) => (
        <View
          key={i}
          style={{
            width: 0,
            height: 0,
            marginHorizontal: b.mx,
            borderLeftWidth: 2,
            borderRightWidth: 2,
            borderBottomWidth: b.h,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: SILHOUETTE_BLACK,
            transform: [{ rotateZ: `${b.rot}deg` }],
            transformOrigin: 'bottom center',
          }}
        />
      ))}
    </View>
  );
}

// Tree Structure: Trunk and Foliage are unified inside a single stable flex frame
function SpacedSwayingTree({ height, scale, left, right, swayDeg }) {
  const adjustedHeight = height * scale;
  const tierH = Math.round(adjustedHeight * 0.32);
  const baseWidth = Math.round(adjustedHeight * 0.60);

  return (
    <View style={[styles.absoluteObject, { bottom: '14%', left, right, width: baseWidth, alignItems: 'center' }]}>
      
      {/* 1. Only the upper foliage layers execute the wind rotation */}
      <Animated.View style={{ width: baseWidth, alignItems: 'center', transform: [{ rotateZ: swayDeg }], transformOrigin: 'bottom center' }}>
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
      </Animated.View>
      
      {/* 2. Rigid Trunk - Structured firmly under the center axis of the foliage */}
      <View 
        style={{ 
          width: Math.max(4, baseWidth * 0.14), 
          height: Math.round(adjustedHeight * 0.18), 
          backgroundColor: SILHOUETTE_BLACK,
          marginTop: -1 
        }} 
      />
    </View>
  );
}

// Turbine Structure: Tower pillar is locked. Only the hub blades spin.
function WindTurbine({ scale, spinDeg, left }) {
  return (
    <View style={[styles.absoluteObject, { bottom: '14%', left, width: 20, alignItems: 'center' }]}>
      <View style={styles.turbineContainer}>
        {/* Rigid Tapered Pillar (Unmoving) */}
        <View style={[styles.turbinePillarLower, { transform: [{ scaleX: scale }] }]} />
        <View style={[styles.turbinePillarUpper, { transform: [{ scaleX: scale }] }]} />

        {/* Kinetic Spinning Hub */}
        <Animated.View style={[styles.turbineHubGroup, { transform: [{ scale }, { rotateZ: spinDeg }] }]}>
          <View style={styles.turbineHub} />
          {[0, 120, 240].map((deg) => (
            <View key={deg} style={[styles.turbineBlade, { transform: [{ rotateZ: `${deg}deg` }] }]} />
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

function useWindEngine(progressAnim) {
  const windClock = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);
  const currentBucketRef = useRef(-1);

  const windMultiplier = progressAnim.interpolate({
    inputRange: [0, 40, 85, 100],
    outputRange: [1.5, 1.3, 0.2, 0],
    extrapolate: 'clamp',
  });

  const startClockLoop = useCallback((durationMs) => {
    if (loopRef.current) loopRef.current.stop();
    windClock.setValue(0);
    loopRef.current = Animated.loop(
      Animated.timing(windClock, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loopRef.current.start();
  }, [windClock]);

  useEffect(() => {
    const BASE_CYCLE_MS = 2400;

    const id = progressAnim.addListener(({ value }) => {
      let multiplier;
      if (value <= 40) multiplier = 1.5;
      else if (value <= 85) multiplier = 1.5 - ((value - 40) / 45) * 1.3;
      else multiplier = Math.max(0, 0.2 * (1 - (value - 85) / 15));

      if (multiplier < 0.02) {
        if (loopRef.current) {
          loopRef.current.stop();
          loopRef.current = null;
        }
        currentBucketRef.current = -1;
        return;
      }

      const bucket = Math.round(multiplier * 4);
      if (bucket !== currentBucketRef.current) {
        currentBucketRef.current = bucket;
        startClockLoop(BASE_CYCLE_MS / multiplier);
      }
    });
    
    startClockLoop(BASE_CYCLE_MS / 1.5);

    return () => {
      progressAnim.removeListener(id);
      if (loopRef.current) loopRef.current.stop();
    };
  }, [progressAnim, startClockLoop]);

  const triangleWave = windClock.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 1, 0, -1, 0],
  });

  const spinDeg = windClock.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return { triangleWave, windMultiplier, spinDeg };
}

export default function SunsetCanvas({ progress }) {
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

  const onCanvasLayout = useCallback((e) => {
    setCanvasHeight(e.nativeEvent.layout.height);
  }, []);

  const H = canvasHeight || 700;
  const sunTravelStart = H * 0.16;
  const sunTravelEnd = H * 0.86;

  const sunTranslateY = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [sunTravelStart, sunTravelEnd],
    extrapolate: 'clamp',
  });

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
  });

  const starsOpacity = progressAnim.interpolate({
    inputRange: [75, 95],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const { triangleWave, windMultiplier, spinDeg } = useWindEngine(progressAnim);

  const TREE_SWAY_DEG = 4.5;   
  const swayAmplitude = Animated.multiply(triangleWave, windMultiplier);

  const treeSwayDeg = Animated.multiply(swayAmplitude, TREE_SWAY_DEG).interpolate({
    inputRange: [-TREE_SWAY_DEG * 2.5, 0, TREE_SWAY_DEG * 2.5],
    outputRange: [`-${TREE_SWAY_DEG * 2.5}deg`, '0deg', `${TREE_SWAY_DEG * 2.5}deg`],
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

      {/* ---------------- STARS LAYERS ---------------- */}
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

      {/* ---------------- LANDSCAPE HORIZON SILHOUETTES ---------------- */}
      
      {/* Far-Left Background Cluster */}
      <SpacedSwayingTree height={90} scale={0.45} left="4%" swayDeg={treeSwayDeg} />
      <SpacedSwayingTree height={90} scale={0.60} left="12%" swayDeg={treeSwayDeg} />

      {/* Center-Left Kinetic Wind Turbine */}
      <WindTurbine scale={0.95} left="30%" spinDeg={spinDeg} />

      {/* Far-Right Foreground Cluster */}
      <SpacedSwayingTree height={110} scale={1.0} right="16%" swayDeg={treeSwayDeg} />
      <SpacedSwayingTree height={110} scale={0.82} right="4%" swayDeg={treeSwayDeg} />

      {/* ---------------- ORGANIC SCATTERED SOIL GRASS BLADES ---------------- */}
      <StaticSoilGrass baseHeight={14} offsetLeft="2%" />
      <StaticSoilGrass baseHeight={18} offsetLeft="9%" />
      <StaticSoilGrass baseHeight={15} offsetLeft="26%" />
      <StaticSoilGrass baseHeight={20} offsetLeft="33%" />
      <StaticSoilGrass baseHeight={16} offsetRight="25%" />
      <StaticSoilGrass baseHeight={22} offsetRight="13%" />
      <StaticSoilGrass baseHeight={15} offsetRight="1%" />

      {/* ---------------- FLAT SOLID GROUND CONTAINER ---------------- */}
      <View style={styles.foregroundContainer} />

    </View>
  );
}

const styles = StyleSheet.create({
  canvasFrame: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#020206',
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
    zIndex: 30, 
  },
  absoluteObject: {
    position: 'absolute',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  grassSoilGroup: {
    position: 'absolute',
    bottom: '14%', 
    flexDirection: 'row',
    alignItems: 'flex-end',
    zIndex: 20,
  },
  turbineContainer: {
    width: 20,
    height: 110,
    alignItems: 'center',
  },
  turbinePillarLower: {
    position: 'absolute',
    bottom: 0,
    width: 5,
    height: 60,
    backgroundColor: SILHOUETTE_BLACK,
  },
  turbinePillarUpper: {
    position: 'absolute',
    bottom: 58,
    width: 2.8,
    height: 52,
    backgroundColor: SILHOUETTE_BLACK,
  },
  turbineHubGroup: {
    position: 'absolute',
    bottom: 104,
    width: 4,
    height: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turbineHub: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SILHOUETTE_BLACK,
    zIndex: 12,
  },
  turbineBlade: {
    position: 'absolute',
    width: 1.8,
    height: 48,
    backgroundColor: SILHOUETTE_BLACK,
    bottom: 0,
    transformOrigin: 'bottom center',
  },
});