// components/ZenPandaCanvas.js
// Step 6: Updated dark patches. Deepened the base color to midnight black, 
// added glowing neon pink rim-lighting to the outer edges of the ears and arms, 
// and turned the eyes into bright white highlights.

import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const PLACEHOLDER_VOID = '#0B0D12';
const PLACEHOLDER_BODY = '#C1C6CF'; 

// 1. Deepened the dark base color for limbs, ears, and patches
const COLOR_DARK_PATCH = '#0A0B10'; 
// 2. Defined the neon magenta rim light
const COLOR_NEON_RIM = '#FF29FF'; 

const COLOR_VOID_TOP = '#080A0F';     
const COLOR_VOID_BOTTOM = '#1C2433';  
const COLOR_DESK = '#161921';         
const COLOR_DESK_HIGHLIGHT = 'rgba(255, 255, 255, 0.08)'; 
const SHADOW_COLOR = '#000000';

const DESK_HEIGHT_PERCENT = '12%'; 

function PhygitalCompanion({ canvasWidth }) {
  const W = canvasWidth * 0.5; 
  
  const wrapW = W * 1.2; 
  const wrapH = W * 1.8; 

  const headW = W;
  const headH = W * 0.75; 
  const bodyW = W * 0.95; 
  const bodyH = W * 1.15; 
  
  const bambooW = W * 0.24;

  const deskY = 0;
  const bodyBottom = deskY - (bodyH * 0.05); 
  const headBottom = bodyBottom + (bodyH * 0.60); 
  
  const bambooH = headBottom + (headH * 0.1) - deskY;

  return (
    <View style={{ width: wrapW, height: wrapH }}>
      
      {/* --- AMBIENT SHADOW --- */}
      <View style={{
        position: 'absolute',
        width: bodyW * 1.1,
        height: W * 0.25,
        borderRadius: bodyW * 0.55,
        backgroundColor: SHADOW_COLOR,
        opacity: 0.4,
        bottom: deskY - (W * 0.12), 
        left: (wrapW - (bodyW * 1.1)) / 2,
        zIndex: 0,
      }} />

      {/* --- BODY --- */}
      <View style={[
        styles.bodyShape, 
        { 
          width: bodyW, 
          height: bodyH, 
          borderRadius: bodyW / 2, 
          bottom: bodyBottom, 
          left: (wrapW - bodyW) / 2,
          overflow: 'hidden', 
          zIndex: 2 
        }
      ]}>
        <LinearGradient
          colors={['#C084FC', '#38BDF8', '#06B6D4']} 
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* --- JADISH BAMBOO GLASS --- */}
      <View style={[
        styles.bambooShape, 
        { 
          width: bambooW, 
          height: bambooH, 
          borderRadius: bambooW * 0.15, 
          bottom: deskY, 
          left: (wrapW - bambooW) / 2,
          zIndex: 3 
        }
      ]}>
        <View style={styles.bambooJoint} />
        <View style={styles.bambooJoint} />
      </View>

      {/* --- GENTLE ARMS (With Neon Rim Light) --- */}
      <View style={[
        styles.patchShape, 
        { 
          width: W * 0.52, 
          height: W * 0.24, 
          borderRadius: W * 0.12, 
          bottom: bodyBottom + (bodyH * 0.34),
          left: (wrapW - bodyW) / 2 - (W * 0.09),
          transform: [{ rotateZ: '28deg' }],
          borderTopWidth: 2.5,
          borderLeftWidth: 2.5,
          borderColor: COLOR_NEON_RIM,
          zIndex: 4,
        }
      ]} />
      <View style={[
        styles.patchShape, 
        { 
          width: W * 0.52, 
          height: W * 0.24, 
          borderRadius: W * 0.12, 
          bottom: bodyBottom + (bodyH * 0.34), 
          right: (wrapW - bodyW) / 2 - (W * 0.09), 
          transform: [{ rotateZ: '-28deg' }], 
          borderTopWidth: 2.5,
          borderRightWidth: 2.5,
          borderColor: COLOR_NEON_RIM,
          zIndex: 4,
        }
      ]} />

      {/* --- HEAD GROUP --- */}
      <View style={{ 
        position: 'absolute', 
        width: headW, 
        height: headH, 
        bottom: headBottom, 
        left: (wrapW - headW) / 2,
        zIndex: 5 
      }}>
        
        {/* Ears (With Neon Rim Light) */}
        <View style={[
          styles.patchShape, 
          { 
            width: W*0.3, height: W*0.3, borderRadius: W*0.15, top: -W*0.06, left: -W*0.02, 
            borderTopWidth: 2, borderLeftWidth: 2, borderColor: COLOR_NEON_RIM, zIndex: -1 
          }
        ]} />
        <View style={[
          styles.patchShape, 
          { 
            width: W*0.3, height: W*0.3, borderRadius: W*0.15, top: -W*0.06, right: -W*0.02, 
            borderTopWidth: 2, borderRightWidth: 2, borderColor: COLOR_NEON_RIM, zIndex: -1 
          }
        ]} />

        {/* Head Base */}
        <View style={[
          styles.bodyShape, 
          { 
            width: headW, 
            height: headH, 
            borderRadius: headW * 0.5, 
            top: 0, 
            left: 0,
            overflow: 'hidden' 
          }
        ]}>
          <LinearGradient
            colors={['#A855F7', '#818CF8', '#38BDF8']} 
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* Eye Patches (Solid Dark Base) */}
        <View style={[
          styles.patchShape, 
          { width: W*0.32, height: W*0.22, borderRadius: W*0.12, top: headH*0.4, left: W*0.12, transform: [{rotateZ: '-25deg'}] }
        ]} />
        <View style={[
          styles.patchShape, 
          { width: W*0.32, height: W*0.22, borderRadius: W*0.12, top: headH*0.4, right: W*0.12, transform: [{rotateZ: '25deg'}] }
        ]} />

        {/* Eyes (Updated to pure white highlights) */}
        <View style={{ position: 'absolute', width: W*0.07, height: W*0.07, backgroundColor: '#FFFFFF', top: headH*0.48, left: W*0.22, borderRadius: W*0.035 }} />
        <View style={{ position: 'absolute', width: W*0.07, height: W*0.07, backgroundColor: '#FFFFFF', top: headH*0.48, right: W*0.22, borderRadius: W*0.035 }} />

        {/* Nose (Solid Dark Base) */}
        <View style={[
          styles.patchShape, 
          { width: W*0.12, height: W*0.07, borderRadius: W*0.035, bottom: headH*0.12, left: (headW - W*0.12) / 2 }
        ]} />
      </View>

    </View>
  );
}

export default function ZenPandaCanvas({ progress, isCompleted }) {
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  const onCanvasLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
  }, []);

  return (
    <View style={styles.canvasFrame} onLayout={onCanvasLayout}>
      
      <LinearGradient 
        colors={[COLOR_VOID_TOP, COLOR_VOID_BOTTOM]} 
        start={{ x: 0.5, y: 0 }} 
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject} 
      />

      {canvasSize.width > 0 && (
        <View style={styles.sceneAnchor}>
          <PhygitalCompanion canvasWidth={canvasSize.width} />
        </View>
      )}

      {/* Matte Slate Platform */}
      <View style={styles.deskSurface} />
    </View>
  );
}

const styles = StyleSheet.create({
  canvasFrame: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#080A0F', 
  },
  sceneAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: DESK_HEIGHT_PERCENT,
    alignItems: 'center',
    zIndex: 2,
  },
  bodyShape: {
    position: 'absolute',
    backgroundColor: PLACEHOLDER_BODY,
  },
  patchShape: {
    position: 'absolute',
    backgroundColor: COLOR_DARK_PATCH, // Applied deep midnight black
  },
  bambooShape: {
    position: 'absolute',
    backgroundColor: 'rgba(74, 222, 128, 0.15)', 
    borderWidth: 2,
    borderColor: 'rgba(74, 222, 128, 0.4)', 
    justifyContent: 'space-evenly',
    overflow: 'hidden',
  },
  bambooJoint: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(74, 222, 128, 0.4)', 
  },
  deskSurface: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: DESK_HEIGHT_PERCENT,
    backgroundColor: COLOR_DESK,
    borderTopWidth: 1,
    borderTopColor: COLOR_DESK_HIGHLIGHT, 
    zIndex: 5, 
  },
});