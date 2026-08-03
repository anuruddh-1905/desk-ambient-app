// components/AmbientWindowCanvas.js
import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const SILHOUETTE_BLACK = '#000000';
const FAR_FOREST_COLOR = '#182447'; // distant forest silhouette — spec-approved, distinct from pure black hero trees
const MIDGROUND_COLOR = '#131C37'; // medium-distance trees — sits between far forest and pure-black hero trees
const HERO_TREE_COLOR = '#040404'; // foreground hero trees — spec-approved, near-black
const BIRCH_TRUNK_COLOR = '#565F7A'; // muted cool slate — lighter than the canopy so birch reads as birch, but dim enough to stay silhouette-like
const BIRCH_NOTCH_COLOR = '#1B2036'; // subtle darker bark marks on the birch trunk
const WALL_COLOR = '#0A0604'; 
const FRAME_WOOD = '#2B1B12';
const FRAME_WOOD_LIGHT = '#3A2417';
const PATH_COLOR_NEAR = '#6E7078';   // foreground, closest to the viewer
const PATH_COLOR_MID = '#555A63';    // middle distance
const PATH_COLOR_FAR = '#3D4350';    // near the horizon
const LAMP_SHADE_COLOR = '#F2C879';
const LAMP_GLOW_COLOR = 'rgba(246, 185, 59, 0.85)';

const DESK_HEIGHT_PERCENT = '26%'; 
const HORIZON_BOTTOM_PERCENT = '54%'; 

// ---------------------------------------------------------------------------
// Background Elements (Sky, Ground, Horizon & Trees)
// ---------------------------------------------------------------------------
function GroundPlane() {
  return (
    <LinearGradient
      colors={['#162024', '#0E1417', '#080A0C']} // Deep nocturnal blue-green/black
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: DESK_HEIGHT_PERCENT,
        height: '28%', // Fills exactly from the desk up to the horizon line
      }}
    />
  );
}

function TreeLineSilhouette() {
  // Spec rhythm (18,22,20,28,24,19,26,21,23,18) extended to ~22 peaks with
  // slight variation on the repeat so it never looks like an exact loop.
  const peaks = [18, 22, 20, 28, 24, 19, 26, 21, 23, 18, 20, 24, 19, 27, 23, 18, 25, 20, 22, 17, 24, 19];
  return (
    <View style={styles.treeLineRow}>
      {/* Solid strip behind the peaks — this is what makes it blend into
          the horizon as one continuous silhouette rather than a row of
          spikes with visible ground-color gaps between them. */}
      <View style={styles.treeLineBaseStrip} />
      {peaks.map((h, i) => (
        <View
          key={i}
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 10,
            borderRightWidth: 10,
            borderBottomWidth: h,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: FAR_FOREST_COLOR,
            marginHorizontal: -3, // tight overlap ≈ spec's 4–5% spacing
          }}
        />
      ))}
    </View>
  );
}

// Medium-distance layer — purely an atmospheric depth cue, never a focal
// point. Deliberately flat/undetailed (no tiers, no trunk) since at this
// distance simplicity itself reads as "farther away." Fully static.
function MidgroundTree({ height, left, right, bottom }) {
  const w = Math.round(height * 0.5);
  return (
    <View style={[styles.absoluteAnchor, { left, right, bottom, width: w, alignItems: 'center' }]}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: w / 2,
          borderRightWidth: w / 2,
          borderBottomWidth: height,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: MIDGROUND_COLOR,
        }}
      />
    </View>
  );
}

// Rounded canopy built from overlapping circles — the classic cheap way to
// fake an organic, lobed silhouette instead of a geometric triangle stack.
function BroadleafCanopy({ width, aspect = 0.85 }) {
  const h = width * aspect;
  const lobes = [
    { size: 1.0, top: 0, left: 0.5 },
    { size: 0.72, top: 0.22, left: 0.17 },
    { size: 0.72, top: 0.22, left: 0.83 },
    { size: 0.6, top: 0.48, left: 0.32 },
    { size: 0.6, top: 0.48, left: 0.68 },
  ];
  return (
    <View style={{ width, height: h }}>
      {lobes.map((l, i) => {
        const d = width * l.size * 0.62;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: d,
              height: d,
              borderRadius: d / 2,
              backgroundColor: HERO_TREE_COLOR,
              left: width * l.left - d / 2,
              top: h * l.top,
            }}
          />
        );
      })}
    </View>
  );
}

function HeroTree({ height, scale = 1, left, right, bottom, variant = 'pine', canopyWidth = null, sway = null }) {
  const h = height * scale;
  const Wrapper = sway ? Animated.View : View;
  const swayStyle = sway ? { transform: [{ rotateZ: sway }], transformOrigin: 'bottom center' } : null;

  if (variant === 'broadleaf') {
    const cWidth = (canopyWidth || h * 0.46) * scale;
    const trunkHeight = h * 0.22;
    return (
      <View style={[styles.absoluteAnchor, { left, right, bottom: bottom || DESK_HEIGHT_PERCENT, width: cWidth, alignItems: 'center' }]}>
        <Wrapper style={swayStyle}>
          <BroadleafCanopy width={cWidth} />
        </Wrapper>
        <View style={{ width: Math.max(4, cWidth * 0.08), height: trunkHeight, backgroundColor: HERO_TREE_COLOR, marginTop: -2 }} />
      </View>
    );
  }

  const tierH = Math.round(h * (variant === 'birch' ? 0.26 : 0.32));
  const baseWidth = Math.round(h * (variant === 'birch' ? 0.30 : 0.58));

  return (
    <View style={[styles.absoluteAnchor, { left, right, bottom: bottom || DESK_HEIGHT_PERCENT, width: baseWidth, alignItems: 'center' }]}>
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
                borderBottomColor: HERO_TREE_COLOR,
              }}
            />
          );
        })}
      </Wrapper>
      <View
        style={{
          width: Math.max(3, baseWidth * (variant === 'birch' ? 0.08 : 0.14)),
          height: Math.round(h * (variant === 'birch' ? 0.36 : 0.18)),
          backgroundColor: HERO_TREE_COLOR,
          marginTop: -1,
        }}
      />
    </View>
  );
}

// Single thin birch trunk: small sparse canopy only near the top (not a
// full tiered cone), pale-slate trunk with a few subtle darker bark notches
// — since color does the "this is birch, not pine" work now.
function BirchTrunk({ height, trunkWidth = 4 }) {
  const canopyH = height * 0.2;
  const trunkH = height * 0.8;
  const notchPositions = [0.28, 0.52, 0.74];
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: trunkWidth * 2.4,
          borderRightWidth: trunkWidth * 2.4,
          borderBottomWidth: canopyH,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: HERO_TREE_COLOR,
        }}
      />
      <View style={{ width: trunkWidth, height: trunkH, backgroundColor: BIRCH_TRUNK_COLOR, marginTop: -1 }}>
        {notchPositions.map((p, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: `${p * 100}%`,
              left: 0,
              right: 0,
              height: 2,
              backgroundColor: BIRCH_NOTCH_COLOR,
              opacity: 0.65,
            }}
          />
        ))}
      </View>
    </View>
  );
}

// Three birch trunks grouped as ONE visual unit (and, once animation is
// wired, one shared sway) — cheaper than three independent trees, and reads
// as "a stand of birches" the way a single tree wouldn't.
function BirchCluster({ left, right, bottom, heights = [150, 140, 132], sway = null }) {
  const Wrapper = sway ? Animated.View : View;
  const swayStyle = sway ? { transform: [{ rotateZ: sway }], transformOrigin: 'bottom center' } : null;
  return (
    <View style={[styles.absoluteAnchor, { left, right, bottom: bottom || DESK_HEIGHT_PERCENT, flexDirection: 'row', alignItems: 'flex-end' }]}>
      <Wrapper style={[{ flexDirection: 'row', alignItems: 'flex-end' }, swayStyle]}>
        {heights.map((h, i) => (
          <View key={i} style={{ marginHorizontal: 2 }}>
            <BirchTrunk height={h} trunkWidth={i === 1 ? 5 : 4} />
          </View>
        ))}
      </Wrapper>
    </View>
  );
}

function Bush({ size = 26, left, right, bottom }) {
  return (
    <View
      style={[
        styles.absoluteAnchor,
        {
          left, right, bottom: bottom || DESK_HEIGHT_PERCENT,
          width: size, height: size * 0.55,
          borderRadius: size * 0.4,
          backgroundColor: SILHOUETTE_BLACK,
        },
      ]}
    />
  );
}

function Fern({ left, right, bottom, baseHeight = 12 }) {
  const blades = [
    { h: baseHeight, rot: -18 },
    { h: baseHeight * 1.3, rot: 4 },
    { h: baseHeight * 0.85, rot: 20 },
  ];
  return (
    <View style={[styles.fernGroup, { left, right, bottom: bottom || DESK_HEIGHT_PERCENT }]}>
      {blades.map((b, i) => (
        <View
          key={i}
          style={{
            width: 0, height: 0, marginHorizontal: -1,
            borderLeftWidth: 2, borderRightWidth: 2, borderBottomWidth: b.h,
            borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: SILHOUETTE_BLACK,
            transform: [{ rotateZ: `${b.rot}deg` }], transformOrigin: 'bottom center',
          }}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Path — ONE continuous tapering shape (not individual stones). Wide near
// the desk/viewer, narrowing toward the horizon for perspective. Single
// flat fill color for now — color is the only thing we tune from here.
// ---------------------------------------------------------------------------
function StonePath() {
  return (
    <View style={styles.pathContainer} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          {/* y1=0 is the top of the viewBox (distance/horizon), y2=1 is the
              bottom (foreground/viewer) — matches how the path shape itself
              is drawn (wide at y=100, narrow at y=10). */}
          <SvgGradient id="pathFillGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={PATH_COLOR_FAR} />
            <Stop offset="0.5" stopColor={PATH_COLOR_MID} />
            <Stop offset="1" stopColor={PATH_COLOR_NEAR} />
          </SvgGradient>
        </Defs>
        <Path
          d="M 25 100 C 40 70, 52 40, 49 10 L 53 10 C 60 40, 66 70, 59 100 Z"
          fill="url(#pathFillGradient)"
        />
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Lanterns (Perspective Depth)
// ---------------------------------------------------------------------------
function Lantern({ left, right, bottom, size = 'near' }) {
  const scale = size === 'near' ? 1 : 0.4;
  const w = 26 * scale;
  const h = 34 * scale;
  return (
    <View style={[styles.absoluteAnchor, { left, right, bottom, width: w, alignItems: 'center' }]}>
      <View style={{ width: w * 0.9, height: h * 0.15, backgroundColor: SILHOUETTE_BLACK }} />
      <View style={{ width: w, height: h * 0.5, backgroundColor: SILHOUETTE_BLACK }} />
      <View style={{ width: w * 0.4, height: h * 0.35, backgroundColor: SILHOUETTE_BLACK }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Foreground Architectural Elements (Window Frame & 3D Desk)
// ---------------------------------------------------------------------------
function WindowFrameOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.wallBorder} />
      <View style={styles.windowSill} />
      
      <View style={styles.muntinVerticalLeft} />
      <View style={styles.muntinVerticalRight} />
      
      <View style={styles.muntinHorizontalLeft} />
      <View style={styles.muntinHorizontalRight} />
    </View>
  );
}

function DeskAndLamp() {
  return (
    <View style={styles.deskArea} pointerEvents="none">
      <LinearGradient
        colors={['#120A07', '#3A1E0D', '#8C481A']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.deskTopSurface}
      />
      <LinearGradient
        colors={['#0F0805', '#1F1008', '#381C0E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.deskFrontEdge}
      />
      <View style={styles.lampWrapper}>
        <View style={styles.tableReflectionGlow} />
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
      <LinearGradient colors={['#2E2456', '#4A2E5C', '#B85C4A', '#E8935A']} style={StyleSheet.absoluteFill} />
      
      <GroundPlane />
      <TreeLineSilhouette />

      <StonePath />
      
      {/* Hero trees — Tree A pushed to 11% to respect the 10% empty-margin
          rule (spec's literal 9% would sit inside that zone). Static for
          now; sway wiring comes in a later animation pass. */}
      <HeroTree variant="broadleaf" left="11%" height={135} canopyWidth={62} />
      <HeroTree variant="pine" left="24%" height={82} />
      <HeroTree variant="broadleaf" left="73%" height={102} />
      <BirchCluster left="91%" heights={[150, 140, 132]} />
      
      <Lantern left="18%" bottom="28%" size="near" />
      <Lantern left="50%" bottom="52%" size="far" />
      
      <Bush size={22} left="10%" />
      <Bush size={18} left="24%" bottom="30%" />
      <Bush size={26} left="40%" bottom="38%" />
      <Bush size={20} right="38%" bottom="42%" />
      <Bush size={24} right="22%" bottom="32%" />
      <Bush size={18} right="10%" />
      
      <Fern left="14%" baseHeight={12} />
      <Fern right="34%" bottom="30%" baseHeight={10} />
      <Fern right="14%" baseHeight={13} />
      
      <WindowFrameOverlay />
      <DeskAndLamp />
    </View>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  canvasFrame: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#1A1530',
  },
  absoluteAnchor: {
    position: 'absolute',
    justifyContent: 'flex-end',
  },
  treeLineRow: {
    position: 'absolute',
    bottom: HORIZON_BOTTOM_PERCENT,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  treeLineBaseStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -4, // bleeds a few px below the horizon line into the ground plane — no visible seam
    height: 8,
    backgroundColor: FAR_FOREST_COLOR,
  },
  fernGroup: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  pathContainer: {
    position: 'absolute',
    bottom: DESK_HEIGHT_PERCENT,
    left: '10%',
    right: '10%',
    height: '28%',
  },

  // -- WINDOW ARCHITECTURE --
  wallBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: DESK_HEIGHT_PERCENT,
    borderWidth: 16,
    borderBottomWidth: 0, 
    borderColor: WALL_COLOR, 
  },
  windowSill: {
    position: 'absolute',
    left: 0, right: 0, bottom: DESK_HEIGHT_PERCENT,
    height: 14,
    backgroundColor: FRAME_WOOD_LIGHT,
    borderTopWidth: 2,
    borderTopColor: '#5C3A24',
  },
  muntinVerticalLeft: {
    position: 'absolute', left: '15%', top: 16, bottom: DESK_HEIGHT_PERCENT, width: 14, backgroundColor: FRAME_WOOD,
  },
  muntinVerticalRight: {
    position: 'absolute', right: '15%', top: 16, bottom: DESK_HEIGHT_PERCENT, width: 14, backgroundColor: FRAME_WOOD,
  },
  muntinHorizontalLeft: {
    position: 'absolute', top: '25%', left: 16, width: '15%', height: 14, backgroundColor: FRAME_WOOD,
  },
  muntinHorizontalRight: {
    position: 'absolute', top: '25%', right: 16, width: '15%', height: 14, backgroundColor: FRAME_WOOD,
  },

  // -- DESK (3D Realism via Light Gradients) & LAMP --
  deskArea: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: DESK_HEIGHT_PERCENT,
  },
  deskTopSurface: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '65%', 
    borderTopWidth: 2,
    borderTopColor: '#1A0E08',
  },
  deskFrontEdge: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '35%', 
    borderTopWidth: 1,
    borderTopColor: '#4A2510', 
  },
  lampWrapper: {
    position: 'absolute',
    right: '8%',
    bottom: '15%', 
    alignItems: 'center',
  },
  tableReflectionGlow: {
    position: 'absolute',
    bottom: -8,
    width: 130, 
    height: 30,
    borderRadius: 65,
    backgroundColor: 'rgba(246, 185, 59, 0.45)', 
    transform: [{ scaleY: 0.4 }], 
  },
  lampGlowHalo: {
    position: 'absolute',
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: LAMP_GLOW_COLOR, opacity: 0.35, top: -35,
  },
  lampShade: {
    width: 80, height: 60, backgroundColor: LAMP_SHADE_COLOR, borderRadius: 8,
  },
  lampPole: {
    width: 8, height: 50, backgroundColor: '#1A1310',
  },
  lampBase: {
    width: 70, height: 10, borderRadius: 5, backgroundColor: '#1A1310',
  },
});