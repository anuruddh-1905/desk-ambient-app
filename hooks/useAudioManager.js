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

export function useAudioManager(progress) {
  const soundARef = useRef(null);
  const soundBRef = useRef(null);
  const isMountedRef = useRef(true);
  const trackBStartedRef = useRef(false);
  const trackAPausedRef = useRef(false);
  const lastAppliedProgressRef = useRef(-1);

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

        // Track A plays immediately at 1.0 — the initial fade is baked into the audio file
        const { sound: soundA } = await Audio.Sound.createAsync(
          TRACK_A_SOURCE,
          {
            isLooping: true,
            volume: 1.0,
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
  }, []);

  // ---- Crossfade updates, throttled to whole-percent changes -------------
  useEffect(() => {
    if (progress == null) return;

    const rounded = Math.round(progress);
    if (rounded === lastAppliedProgressRef.current) return;
    lastAppliedProgressRef.current = rounded;

    async function applyCrossfade() {
      const volA = computeVolumeA(rounded);
      const volB = computeVolumeB(rounded);

      try {
        if (soundARef.current && isMountedRef.current) {
          await soundARef.current.setVolumeAsync(volA);
          if (volA <= 0 && !trackAPausedRef.current) {
            trackAPausedRef.current = true;
            await soundARef.current.pauseAsync();
          } else if (volA > 0 && trackAPausedRef.current) {
            trackAPausedRef.current = false;
            await soundARef.current.playAsync();
          }
        }

        if (soundBRef.current && isMountedRef.current) {
          if (rounded >= 80 && !trackBStartedRef.current) {
            trackBStartedRef.current = true;
            await soundBRef.current.playAsync();
          }
          await soundBRef.current.setVolumeAsync(volB);
        }
      } catch (error) {
        console.log('Audio crossfade update skipped quietly:', error);
      }
    }

    applyCrossfade();
  }, [progress]);
}

export default useAudioManager;