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
      <SilhouettePine scale={1.5} right={100} bottom={0} />
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
// 4. SKY ATMOSPHERE
// ---------------------------------------------------------------------------
function SkyAtmosphere({ progressAnim }) {
  const phaseAOpacity = progressAnim.interpolate({
    inputRange: [0, 68, 80],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  const phaseBOpacity = progressAnim.interpolate({
    inputRange: [68, 80, 84, 92],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  const phaseCOpacity = progressAnim.interpolate({
    inputRange: [84, 92, 100],
    outputRange: [0, 1, 1],
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
          colors={['#010206', '#02040A', '#060B18', '#0A101E', '#0C1526']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: phaseCOpacity }]}>
        <LinearGradient
          colors={['#010308', '#02040A', '#04070F', '#060B18', '#080E1C']}
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
const STAR_COLOR_COOL = '#E0F2FE'; 

const STAR_DATA = [
  // Tier 3
  { tier: 3, right: '12%', top: '8%', size: 8, color: STAR_COLOR_BASE_A, baseOpacity: 0.68, animated: false },
  { tier: 3, left: '72%', top: '28%', size: 7, color: STAR_COLOR_BASE_B, baseOpacity: 0.63, animated: false },
  // Tier 2
  { tier: 2, left: '78%', top: '14%', size: 2, color: STAR_COLOR_BASE_A, baseOpacity: 0.48, animated: false },
  { tier: 2, right: '30%', top: '34%', size: 2, color: STAR_COLOR_WARM, baseOpacity: 0.47, animated: true, duration: 11000, delay: 400 },
  { tier: 2, left: '85%', top: '40%', size: 2, color: STAR_COLOR_BASE_B, baseOpacity: 0.52, animated: false },
  // Tier 1
  { tier: 1, left: '6%', top: '12%', size: 1.2, color: STAR_COLOR_BASE_A, baseOpacity: 0.22, animated: false },
  { tier: 1, left: '18%', top: '30%', size: 1.4, color: STAR_COLOR_BASE_B, baseOpacity: 0.25, animated: true, duration: 8000, delay: 0 },
  { tier: 1, left: '38%', top: '6%', size: 1.0, color: STAR_COLOR_BASE_A, baseOpacity: 0.18, animated: false },
  { tier: 1, right: '42%', top: '20%', size: 1.3, color: STAR_COLOR_BASE_B, baseOpacity: 0.24, animated: false },
  { tier: 1, left: '62%', top: '10%', size: 1.1, color: STAR_COLOR_BASE_A, baseOpacity: 0.20, animated: false },
  { tier: 1, right: '6%', top: '22%', size: 1.5, color: STAR_COLOR_COOL, baseOpacity: 0.27, animated: false },
  { tier: 1, left: '90%', top: '6%', size: 1.2, color: STAR_COLOR_BASE_B, baseOpacity: 0.21, animated: false },
  { tier: 1, right: '50%', top: '38%', size: 1.3, color: STAR_COLOR_BASE_A, baseOpacity: 0.23, animated: false },
  { tier: 1, left: '10%', top: '42%', size: 1.0, color: STAR_COLOR_BASE_B, baseOpacity: 0.19, animated: false },
  { tier: 1, left: '70%', top: '44%', size: 1.4, color: STAR_COLOR_BASE_A, baseOpacity: 0.26, animated: true, duration: 14000, delay: 800 },
  { tier: 1, right: '22%', top: '42%', size: 1.1, color: STAR_COLOR_BASE_B, baseOpacity: 0.20, animated: false },
  { tier: 1, left: '30%', top: '16%', size: 1.3, color: STAR_COLOR_BASE_A, baseOpacity: 0.24, animated: false },
  { tier: 1, right: '15%', top: '36%', size: 1.2, color: STAR_COLOR_BASE_B, baseOpacity: 0.22, animated: false },
];

function StarDot({ d, tierMultiplier }) {
  const twinkleValue = useRef(new Animated.Value(d.baseOpacity)).current;

  useEffect(() => {
    if (!d.animated) return;

    const peak = Math.min(1, d.baseOpacity + 0.15);
    const trough = Math.max(0.05, d.baseOpacity - 0.15);

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

  // FIX: Nested opacity structure prevents JS and Native driver conflict
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
  const tier1Multiplier = progressAnim.interpolate({
    inputRange: [0, 75, 88],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const tier2Multiplier = progressAnim.interpolate({
    inputRange: [0, 75, 88],
    outputRange: [0.35, 0.35, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.starContainer}>
      {STAR_DATA.map((d, i) => (
        <StarDot key={i} d={d} tierMultiplier={d.tier === 1 ? tier1Multiplier : tier2Multiplier} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 6. MASTER CANVAS
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

  const shadowTranslateX = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [160, -10], 
    extrapolate: 'clamp',
  });

  const shadowOpacity = progressAnim.interpolate({
    inputRange: [0, 10, 90, 100],
    outputRange: [0, 0.92, 0.95, 0.98],
    extrapolate: 'clamp',
  });

  const moonBaseColor = progressAnim.interpolate({
    inputRange: [0, 35, 75, 100],
    outputRange: ['#FFFFFF', '#ECE8F5', '#8B0000', '#2E0303'],
  });

  return (
    <View style={styles.canvasFrame}>
      
      {/* ---------------- SKY ATMOSPHERE ---------------- */}
      <SkyAtmosphere progressAnim={progressAnim} />

      {/* ---------------- LAYERED STARFIELD ---------------- */}
      <StarField progressAnim={progressAnim} />

      {/* ---------------- MOON & ECLIPSE ---------------- */}
      <View style={styles.eclipseCenterFrame}>
        <Animated.View style={[styles.moonGlobe, { backgroundColor: moonBaseColor }]}>
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

        <SilhouettePine scale={1.0} left="58%" bottom={0} />

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
    backgroundColor: '#010206',
  },
  starContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  starAccentGlyph: {
    // position absolute moved to wrapper
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  starPinpoint: {
    // position absolute moved to wrapper
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
    overflow: 'hidden',
  },
  earthShadowCircle: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 180, 
    height: 180,
    borderRadius: 90,
    backgroundColor: '#02020E', 
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
    left: '25%', 
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