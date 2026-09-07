// hooks/useAudioManager.js
//
// Dual-layer ambient audio crossfade, driven by the same 0–100 `progress`
// value used by the visual themes. Track A (brown_noise) is the deep-focus
// mask; Track B (evening_wind) is the decompression bridge.

import { useEffect, useRef } from 'react';
import { Audio, InterruptionModeIOS } from 'expo-av';

const TRACK_A_SOURCE = require('../assets/audio/brown_noise.m4a');
const TRACK_B_SOURCE = require('../assets/audio/evening_wind.m4a');

// ---------------------------------------------------------------------------
// Crossfade matrix — pure functions, no side effects
// ---------------------------------------------------------------------------
function lerp(progress, startP, endP, startV, endV) {
  if (progress <= startP) return startV;
  if (progress >= endP) return endV;
  const t = (progress - startP) / (endP - startP);
  return startV + t * (endV - startV);
}

function computeVolumeA(progress) {
  // 0–80: full. 80–88: linear decay to 0. 88–100: silent (and paused).
  if (progress <= 80) return 1.0;
  if (progress <= 88) return lerp(progress, 80, 88, 1.0, 0.0);
  return 0.0;
}

function computeVolumeB(progress) {
  // 0–80: silent. 80–88: fade in to 0.6.
  // 88–95: hold at 0.6. 95–100: linear decay to 0.
  if (progress <= 80) return 0.0;
  if (progress <= 88) return lerp(progress, 80, 88, 0.0, 0.6);
  if (progress <= 95) return 0.6;
  return lerp(progress, 95, 100, 0.6, 0.0);
}

// Added isMuted parameter (defaults to false if not provided)
export function useAudioManager(progress, isMuted = false) {
  const soundARef = useRef(null);
  const soundBRef = useRef(null);
  const isMountedRef = useRef(true);
  const trackBStartedRef = useRef(false);
  const trackAPausedRef = useRef(false);
  
  const lastAppliedProgressRef = useRef(-1);
  const lastMutedRef = useRef(isMuted);

  // ---- Setup: audio mode + load & direct start ---------------------------
  useEffect(() => {
    isMountedRef.current = true;

    async function setup() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        // Track A plays immediately. 
        // We use the initial isMuted state to prevent a loud blast if starting muted.
        const { sound: soundA } = await Audio.Sound.createAsync(
          TRACK_A_SOURCE,
          {
            isLooping: true,
            volume: isMuted ? 0.0 : 1.0,
            shouldPlay: true,
          }
        );

        if (!isMountedRef.current) {
          soundA.unloadAsync().catch(() => {});
          return;
        }

        soundARef.current = soundA;

        // Preload Track B silently (starts at 80% progress)
        const { sound: soundB } = await Audio.Sound.createAsync(
          TRACK_B_SOURCE,
          {
            isLooping: true,
            volume: 0.0,
            shouldPlay: false,
          }
        );

        if (!isMountedRef.current) {
          soundB.unloadAsync().catch(() => {});
          return;
        }

        soundBRef.current = soundB;
      } catch (error) {
        console.log('Audio setup skipped quietly:', error);
      }
    }

    setup();

    return () => {
      isMountedRef.current = false;

      const cleanupTrack = async (soundRef) => {
        if (!soundRef.current) return;
        const sound = soundRef.current;
        soundRef.current = null;
        try {
          await sound.setVolumeAsync(0.0);
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch {}
      };

      cleanupTrack(soundARef);
      cleanupTrack(soundBRef);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only runs once on mount

  // ---- Crossfade updates, throttled to whole-percent changes OR mute toggles
  useEffect(() => {
    if (progress == null) return;

    const rounded = Math.round(progress);
    const muteToggled = lastMutedRef.current !== isMuted;

    // Skip update if neither the rounded progress nor the mute state changed
    if (rounded === lastAppliedProgressRef.current && !muteToggled) return;
    
    lastAppliedProgressRef.current = rounded;
    lastMutedRef.current = isMuted;

    async function applyCrossfade() {
      // Calculate what the volume SHOULD be based on time
      const targetVolA = computeVolumeA(rounded);
      const targetVolB = computeVolumeB(rounded);

      // Override to 0.0 if the user tapped the mute button
      const effectiveVolA = isMuted ? 0.0 : targetVolA;
      const effectiveVolB = isMuted ? 0.0 : targetVolB;

      try {
        if (soundARef.current && isMountedRef.current) {
          await soundARef.current.setVolumeAsync(effectiveVolA);
          
          // Only physically pause Track A if the session actually wants it silent at the end (88-100%).
          // If the user just muted it manually, we keep it playing at 0 volume so it stays in sync.
          if (targetVolA <= 0 && !trackAPausedRef.current) {
            trackAPausedRef.current = true;
            await soundARef.current.pauseAsync();
          } else if (targetVolA > 0 && trackAPausedRef.current) {
            trackAPausedRef.current = false;
            await soundARef.current.playAsync();
          }
        }

        if (soundBRef.current && isMountedRef.current) {
          if (rounded >= 80 && !trackBStartedRef.current) {
            trackBStartedRef.current = true;
            await soundBRef.current.playAsync();
          }
          await soundBRef.current.setVolumeAsync(effectiveVolB);
        }
      } catch (error) {
        console.log('Audio crossfade update skipped quietly:', error);
      }
    }

    applyCrossfade();
  }, [progress, isMuted]); // Added isMuted to dependencies
}

export default useAudioManager;