import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
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
// 2. WIND TURBINE (Smooth continuous decay logic)
// ---------------------------------------------------------------------------
function WindTurbine({ progress = 0 }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const progressRef = useRef(progress);
  const isMounted = useRef(true);

  // Keep latest progress value fresh inside the recursive loop
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    isMounted.current = true;

    // Linearly interpolates the rotation duration so the blade speed
    // decays imperceptibly smoothly across the entire session.
    const getDuration = (p) => {
      if (p <= 0) return 6500;
      if (p <= 25) return 6500 + ((p - 0) / 25) * (8000 - 6500);
      if (p <= 50) return 8000 + ((p - 25) / 25) * (12000 - 8000);
      if (p <= 75) return 12000 + ((p - 50) / 25) * (18000 - 12000);
      if (p <= 100) return 18000 + ((p - 75) / 25) * (25000 - 18000);
      return 25000;
    };

    const runRotationCycle = () => {
      if (!isMounted.current) return;

      spinAnim.setValue(0);
      const currentDuration = getDuration(progressRef.current);

      Animated.timing(spinAnim, {
        toValue: 1,
        duration: currentDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && isMounted.current) {
          runRotationCycle();
        }
      });
    };

    runRotationCycle();

    return () => {
      isMounted.current = false;
      spinAnim.stopAnimation();
    };
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
  // Awakens at 50%, hits full brightness at 90%, and holds through 100%
  const windowGlowOpacity = eclipseProgress.interpolate({
    inputRange: [0, 25, 50, 75, 90, 100],
    outputRange: [0, 0, 0.15, 0.45, 1.0, 1.0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.rightClusterWrapper}>
      <SilhouettePine scale={0.95} right={95} bottom={0} />
      <SilhouettePine scale={1.45} right={45} bottom={0} />
      <SilhouettePine scale={0.75} right={10} bottom={0} />

      <View style={styles.cottageBlock}>
        <View style={styles.cottageRoof} />
        <View style={styles.cottageBody} />
        <Animated.View style={[styles.cottageWindow, { opacity: windowGlowOpacity }]} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 4. SKY ATMOSPHERE
// ---------------------------------------------------------------------------
function SkyAtmosphere({ progressAnim }) {
  const phaseAOpacity = progressAnim.interpolate({
    inputRange: [0, 25, 50, 75, 100],
    outputRange: [1, 1, 0.5, 0, 0],
    extrapolate: 'clamp',
  });

  const phaseBOpacity = progressAnim.interpolate({
    inputRange: [0, 25, 50, 75, 100],
    outputRange: [0, 0, 0.5, 1, 0],
    extrapolate: 'clamp',
  });

  const phaseCOpacity = progressAnim.interpolate({
    inputRange: [0, 25, 50, 75, 100],
    outputRange: [0, 0, 0, 0, 1],
    extrapolate: 'clamp',
  });

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: phaseAOpacity }]}>
        <LinearGradient
          colors={['#000003', '#030611', '#080D22', '#101936']}
          locations={[0, 0.60, 0.82, 1.0]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: phaseBOpacity }]}>
        <LinearGradient
          colors={['#010206', '#02040A', '#060B18', '#0A101E', '#0E172A']}
          locations={[0, 0.55, 0.78, 0.90, 1.0]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: phaseCOpacity }]}>
        <LinearGradient
          colors={['#010308', '#02040A', '#050914', '#080E1E', '#0B132B']}
          locations={[0, 0.50, 0.75, 0.90, 1.0]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5. STAR ENGINE
// ---------------------------------------------------------------------------
const STAR_COLOR_BASE_A = '#E2E8F0';
const STAR_COLOR_BASE_B = '#CBD5E1';
const STAR_COLOR_WARM = '#FEF3C7';
const STAR_COLOR_COOL = '#BAE6FD';

const STAR_DATA = [
  { tier: 3, right: '14%', top: '10%', size: 9, color: STAR_COLOR_BASE_A, baseOpacity: 0.72, animated: false },
  { tier: 3, left: '16%', top: '18%', size: 8, color: STAR_COLOR_BASE_B, baseOpacity: 0.68, animated: false },
  { tier: 2, left: '28%', top: '12%', size: 2.5, color: STAR_COLOR_BASE_A, baseOpacity: 0.58, animated: false },
  { tier: 2, right: '28%', top: '30%', size: 2.5, color: STAR_COLOR_WARM, baseOpacity: 0.55, animated: true, duration: 11000, delay: 400 },
  { tier: 2, left: '8%', top: '38%', size: 2.2, color: STAR_COLOR_COOL, baseOpacity: 0.52, animated: false },
  { tier: 2, right: '12%', top: '44%', size: 2.4, color: STAR_COLOR_BASE_B, baseOpacity: 0.56, animated: false },
  { tier: 1, left: '7%', top: '14%', size: 1.8, color: STAR_COLOR_BASE_A, baseOpacity: 0.38, animated: false },
  { tier: 1, left: '22%', top: '32%', size: 2.0, color: STAR_COLOR_BASE_B, baseOpacity: 0.40, animated: true, duration: 8000, delay: 0 },
  { tier: 1, left: '38%', top: '8%', size: 1.8, color: STAR_COLOR_BASE_A, baseOpacity: 0.36, animated: false },
  { tier: 1, left: '42%', top: '36%', size: 2.0, color: STAR_COLOR_BASE_B, baseOpacity: 0.38, animated: false },
  { tier: 1, left: '62%', top: '12%', size: 1.8, color: STAR_COLOR_BASE_A, baseOpacity: 0.36, animated: false },
  { tier: 1, right: '8%', top: '22%', size: 2.2, color: STAR_COLOR_COOL, baseOpacity: 0.42, animated: false },
  { tier: 1, right: '40%', top: '14%', size: 1.8, color: STAR_COLOR_BASE_B, baseOpacity: 0.36, animated: false },
  { tier: 1, right: '48%', top: '36%', size: 2.0, color: STAR_COLOR_BASE_A, baseOpacity: 0.38, animated: false },
  { tier: 1, left: '12%', top: '46%', size: 1.8, color: STAR_COLOR_BASE_B, baseOpacity: 0.34, animated: false },
  { tier: 1, left: '72%', top: '42%', size: 2.2, color: STAR_COLOR_BASE_A, baseOpacity: 0.40, animated: true, duration: 14000, delay: 800 },
  { tier: 1, right: '22%', top: '42%', size: 1.8, color: STAR_COLOR_BASE_B, baseOpacity: 0.36, animated: false },
  { tier: 1, right: '16%', top: '34%', size: 2.0, color: STAR_COLOR_BASE_B, baseOpacity: 0.38, animated: false },
];

function StarDot({ d, tierMultiplier }) {
  const twinkleValue = useRef(new Animated.Value(d.baseOpacity)).current;

  useEffect(() => {
    if (!d.animated) return;

    const peak = Math.min(1, d.baseOpacity + 0.15);
    const trough = Math.max(0.12, d.baseOpacity - 0.15);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkleValue, {
          toValue: peak,
          duration: d.duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(twinkleValue, {
          toValue: trough,
          duration: d.duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const timeoutId = setTimeout(() => loop.start(), d.delay || 0);
    return () => {
      clearTimeout(timeoutId);
      loop.stop();
    };
  }, [twinkleValue, d.animated, d.baseOpacity, d.duration, d.delay]);

  const wrapperOpacity = d.tier === 3 ? 1 : tierMultiplier;
  const innerOpacity = d.animated ? twinkleValue : d.baseOpacity;
  const positionStyle = { position: 'absolute', left: d.left, right: d.right, top: d.top };

  if (d.tier === 3) {
    return (
      <Animated.View style={[positionStyle, { opacity: wrapperOpacity }]}>
        <Animated.Text
          style={[styles.starAccentGlyph, { fontSize: d.size, color: d.color, opacity: innerOpacity }]}
        >
          ✦
        </Animated.Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[positionStyle, { opacity: wrapperOpacity }]}>
      <Animated.View
        style={[
          styles.starPinpoint,
          { width: d.size, height: d.size, borderRadius: d.size / 2, backgroundColor: d.color, opacity: innerOpacity },
        ]}
      />
    </Animated.View>
  );
}

function StarField({ progressAnim }) {
  const starVisibilityMultiplier = progressAnim.interpolate({
    inputRange: [0, 25, 50, 75, 100],
    outputRange: [0.20, 0.35, 0.55, 0.80, 1.0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.starContainer}>
      {STAR_DATA.map((d, i) => (
        <StarDot key={i} d={d} tierMultiplier={starVisibilityMultiplier} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 6. MASTER CANVAS
// ---------------------------------------------------------------------------
export default function EclipseCanvas({ progress = 0 }) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  // Master Moon Shadow Traverse (Changed starting value from 160 to 180 to clear the disk completely)
  const shadowTranslateX = progressAnim.interpolate({
    inputRange: [0, 25, 50, 75, 100],
    outputRange: [180, 120, 80, 30, 4],
    extrapolate: 'clamp',
  });

  // Shifts from pure starlight to a visible, rich copper blood moon
  const moonBaseColor = progressAnim.interpolate({
    inputRange: [0, 25, 50, 75, 100],
    outputRange: ['#FFFFFF', '#FFFFFF', '#EAE6F3', '#C53030', '#8B1E1E'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.canvasFrame}>
      {/* SKY ATMOSPHERE */}
      <SkyAtmosphere progressAnim={progressAnim} />

      {/* LAYERED STARFIELD */}
      <StarField progressAnim={progressAnim} />

      {/* MOON & ECLIPSE */}
      <View style={styles.eclipseCenterFrame}>
        <Animated.View style={[styles.moonGlobe, { backgroundColor: moonBaseColor }]}>
          <Animated.View 
            style={[
              styles.earthShadowCircle, 
              { transform: [{ translateX: shadowTranslateX }] }
            ]} 
          />
        </Animated.View>
      </View>

      {/* RURAL HORIZON */}
      <View style={styles.horizonMatting}>
        <SilhouettePine scale={0.45} left="5%" bottom={0} />
        <SilhouettePine scale={0.70} left="13%" bottom={0} />

        <WindTurbine progress={progress} />

        <SilhouettePine scale={0.75} left="58%" bottom={0} />

        <ForegroundCluster eclipseProgress={progressAnim} />
      </View>

      {/* UI SAFE ZONE */}
      <View style={styles.foregroundContainer} />
    </View>
  );
}

const styles = StyleSheet.create({
  canvasFrame: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#010206',
  },
  starContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  starAccentGlyph: {
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  starPinpoint: {},
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
    overflow: 'hidden',
  },
  earthShadowCircle: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 180, 
    height: 180,
    borderRadius: 90,
    backgroundColor: '#010206',
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
    left: '28%', 
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
    right: '2%', 
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