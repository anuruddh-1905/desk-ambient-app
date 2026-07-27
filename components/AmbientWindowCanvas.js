// components/AmbientWindowCanvas.js
// Phase 1: static layout only. No Animated values yet — sway, rain, mist,
// and progress-driven color grading arrive in later phases. This pass exists
// purely to validate composition/proportions against the reference image.

import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

const SILHOUETTE_BLACK = '#000000';
const FRAME_WOOD = '#2B1B12';
const FRAME_WOOD_LIGHT = '#4A2F1D';
const DESK_WOOD = '#4A3018';
const STONE_PATH_COLOR = '#8A8FA3';
const STONE_PATH_HIGHLIGHT = '#6B7089';
const LAMP_SHADE_COLOR = '#F2C879';
const LAMP_GLOW_COLOR = 'rgba(246, 185, 59, 0.85)';

// ---------------------------------------------------------------------------
// Distant tree-line — one flat jagged silhouette strip, same primitive as
// the mountain-ridge shape used in Sunset/Eclipse (border-triangles).
// ---------------------------------------------------------------------------
function TreeLineSilhouette() {
  const peaks = [14, 22, 12, 26, 16, 24, 13, 20, 15, 23, 12, 18];
  return (
    <View style={styles.treeLineRow}>
      {peaks.map((h, i) => (
        <View
          key={i}
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 16,
            borderRightWidth: 16,
            borderBottomWidth: h,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: SILHOUETTE_BLACK,
            marginHorizontal: -4,
          }}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Hero tree — same tiered-triangle construction as Sunset's SpacedSwayingTree
// and Eclipse's SilhouettePine, unified into one component with a `variant`
// switch so both the broad pines and the tall thin birches (right side of the
// reference image) come from a single primitive. Static in Phase 1 — the
// `sway` prop is accepted now so Phase 4 can wire it in without reshaping
// this component.
// ---------------------------------------------------------------------------
function HeroTree({ height, scale = 1, left, right, variant = 'pine', sway = null }) {
  const h = height * scale;
  const tierH = Math.round(h * (variant === 'birch' ? 0.26 : 0.32));
  const baseWidth = Math.round(h * (variant === 'birch' ? 0.30 : 0.58));
  const Wrapper = sway ? require('react-native').Animated.View : View;
  const swayStyle = sway ? { transform: [{ rotateZ: sway }], transformOrigin: 'bottom center' } : null;

  return (
    <View style={[styles.absoluteBottomAnchor, { left, right, width: baseWidth, alignItems: 'center' }]}>
      <Wrapper style={[{ width: baseWidth, alignItems: 'center' }, swayStyle]}>
        {[0, 1, 2].map((i) => {
          const shrink = 1 - i * (variant === 'birch' ? 0.16 : 0.24);
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
      </Wrapper>
      <View
        style={{
          width: Math.max(3, baseWidth * (variant === 'birch' ? 0.08 : 0.14)),
          height: Math.round(h * (variant === 'birch' ? 0.36 : 0.18)),
          backgroundColor: SILHOUETTE_BLACK,
          marginTop: -1,
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Bush — rounded-blob silhouette, static in Phase 1 (may join a shared sway
// group later; not decided yet, so left un-animated for now).
// ---------------------------------------------------------------------------
function Bush({ size = 26, left, right }) {
  return (
    <View
      style={[
        styles.absoluteBottomAnchor,
        {
          left,
          right,
          width: size,
          height: size * 0.55,
          borderRadius: size * 0.4,
          backgroundColor: SILHOUETTE_BLACK,
        },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Fern — tiny triangle-blade tuft, same primitive as Sunset's soil grass.
// ---------------------------------------------------------------------------
function Fern({ left, right, baseHeight = 12 }) {
  const blades = [
    { h: baseHeight, rot: -18 },
    { h: baseHeight * 1.3, rot: 4 },
    { h: baseHeight * 0.85, rot: 20 },
  ];
  return (
    <View style={[styles.fernGroup, { left, right }]}>
      {blades.map((b, i) => (
        <View
          key={i}
          style={{
            width: 0,
            height: 0,
            marginHorizontal: -1,
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

// ---------------------------------------------------------------------------
// Stone path — the one SVG element in the scene, per the blueprint (a curved
// path can't be faked with border-triangles). Static fill only in Phase 1;
// the "wetness" sheen overlay arrives in Phase 5.
// ---------------------------------------------------------------------------
function StonePath() {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox="0 0 300 600"
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      <Path
        d="M 150 600
           C 150 520, 110 480, 130 420
           C 150 360, 195 340, 178 280
           C 165 235, 172 210, 182 180"
        stroke={STONE_PATH_COLOR}
        strokeWidth={22}
        strokeLinecap="round"
        fill="none"
        opacity={0.9}
      />
      <Path
        d="M 150 600
           C 150 520, 110 480, 130 420
           C 150 360, 195 340, 178 280
           C 165 235, 172 210, 182 180"
        stroke={STONE_PATH_HIGHLIGHT}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Lantern — static silhouette only in Phase 1 (no glow yet — glow at rest is
// Phase 2, per the build order). `near`/`far` just scales it.
// ---------------------------------------------------------------------------
function Lantern({ left, right, top, size = 'near' }) {
  const scale = size === 'near' ? 1 : 0.5;
  const w = 26 * scale;
  const h = 34 * scale;
  return (
    <View style={[styles.absoluteAnchor, { left, right, top, width: w, alignItems: 'center' }]}>
      <View style={{ width: w * 0.9, height: h * 0.15, backgroundColor: SILHOUETTE_BLACK }} />
      <View style={{ width: w, height: h * 0.5, backgroundColor: SILHOUETTE_BLACK }} />
      <View style={{ width: w * 0.4, height: h * 0.35, backgroundColor: SILHOUETTE_BLACK }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Window frame + desk + lamp — foreground-most layer, drawn last, entirely
// static forever (per blueprint: "these anchor the you're-sitting-still
// feeling"). The lamp is warm/lit from the start since a fixed color isn't
// animation.
// ---------------------------------------------------------------------------
function WindowFrameOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.muntinVertical} />
      <View style={[styles.muntinVertical, { left: undefined, right: '32%' }]} />
      <View style={styles.muntinHorizontal} />
      <View style={styles.frameBorder} />
    </View>
  );
}

function DeskAndLamp() {
  return (
    <View style={styles.deskArea} pointerEvents="none">
      <View style={styles.deskSurface} />
      <View style={styles.lampWrapper}>
        <View style={styles.lampGlowHalo} />
        <View style={styles.lampShade} />
        <View style={styles.lampPole} />
        <View style={styles.lampBase} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MASTER CANVAS
// ---------------------------------------------------------------------------
export default function AmbientWindowCanvas({ progress, isCompleted }) {
  const [canvasHeight, setCanvasHeight] = useState(0);
  const onCanvasLayout = useCallback((e) => {
    setCanvasHeight(e.nativeEvent.layout.height);
  }, []);

  return (
    <View style={styles.canvasFrame} onLayout={onCanvasLayout}>

      {/* ---------------- SKY (static mid-point palette for Phase 1) ---------------- */}
      <LinearGradient
        colors={['#2E2456', '#4A2E5C', '#B85C4A', '#E8935A']}
        style={StyleSheet.absoluteFill}
      />

      {/* ---------------- DISTANT TREE-LINE ---------------- */}
      <TreeLineSilhouette />

      {/* ---------------- HERO TREES ---------------- */}
      <HeroTree height={130} scale={1} left="4%" variant="pine" />
      <HeroTree height={70} scale={1} left="18%" variant="pine" />
      <HeroTree height={110} scale={1} right="30%" variant="pine" />
      <HeroTree height={190} scale={1} right="16%" variant="birch" />
      <HeroTree height={170} scale={1} right="6%" variant="birch" />

      {/* ---------------- BUSHES ---------------- */}
      <Bush size={22} left="10%" />
      <Bush size={18} left="24%" />
      <Bush size={26} left="40%" />
      <Bush size={20} right="38%" />
      <Bush size={24} right="22%" />
      <Bush size={18} right="10%" />

      {/* ---------------- FERNS ---------------- */}
      <Fern left="14%" baseHeight={12} />
      <Fern right="34%" baseHeight={10} />
      <Fern right="14%" baseHeight={13} />

      {/* ---------------- STONE PATH ---------------- */}
      <StonePath />

      {/* ---------------- LANTERNS ---------------- */}
      <Lantern left="8%" top="72%" size="near" />
      <Lantern left="46%" top="46%" size="far" />

      {/* ---------------- WINDOW FRAME + DESK + LAMP (foreground) ---------------- */}
      <WindowFrameOverlay />
      <DeskAndLamp />

    </View>
  );
}

const styles = StyleSheet.create({
  canvasFrame: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#1A1530',
  },
  absoluteBottomAnchor: {
    position: 'absolute',
    bottom: '18%',
    justifyContent: 'flex-end',
  },
  absoluteAnchor: {
    position: 'absolute',
  },
  treeLineRow: {
    position: 'absolute',
    bottom: '30%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  fernGroup: {
    position: 'absolute',
    bottom: '18%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  // Window frame
  muntinVertical: {
    position: 'absolute',
    left: '32%',
    top: 0,
    bottom: '20%',
    width: 10,
    backgroundColor: FRAME_WOOD,
  },
  muntinHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '55%',
    height: 10,
    backgroundColor: FRAME_WOOD,
  },
  frameBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '20%',
    borderWidth: 14,
    borderColor: FRAME_WOOD_LIGHT,
  },
  // Desk + lamp
  deskArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '20%',
  },
  deskSurface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DESK_WOOD,
  },
  lampWrapper: {
    position: 'absolute',
    right: '10%',
    bottom: '35%',
    alignItems: 'center',
  },
  lampGlowHalo: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: LAMP_GLOW_COLOR,
    opacity: 0.35,
    top: -20,
  },
  lampShade: {
    width: 44,
    height: 36,
    backgroundColor: LAMP_SHADE_COLOR,
    borderRadius: 6,
  },
  lampPole: {
    width: 4,
    height: 30,
    backgroundColor: '#1A1310',
  },
  lampBase: {
    width: 40,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A1310',
  },
});