// hooks/useAudioManager.js
//
// Dual-layer ambient audio crossfade, driven by the same 0–100 `progress`
// value used by the visual themes. Track A (brown_noise) is the deep-focus
// mask; Track B (evening_wind) is the decompression bridge. See the
// crossfade matrix in the inline comments below for exact volume schedule.

import { useEffect, useRef } from 'react';
import { Audio, InterruptionModeIOS } from 'expo-av';

// Pointing directly to PCM 16-bit WAV assets for seamless looping
const TRACK_A_SOURCE = require('../assets/audio/brown_noise.wav');
const TRACK_B_SOURCE = require('../assets/audio/evening_wind.wav');

// ---------------------------------------------------------------------------
// Crossfade matrix — pure functions, no side effects, easy to verify in
// isolation against the spec's exact schedule.
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
  // 0–80: silent (loaded, not playing). 80–88: fade in to 0.6.
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
  const lastAppliedProgressRef = useRef(-1); // throttle guard

  // ---- Setup: audio mode + load both tracks -----------------------------
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

        const { sound: soundA } = await Audio.Sound.createAsync(TRACK_A_SOURCE, {
          isLooping: true,
          volume: 1.0,
        });
        if (!isMountedRef.current) {
          soundA.unloadAsync();
          return;
        }
        soundARef.current = soundA;
        await soundA.playAsync();

        // Track B is loaded but NOT started yet — no point playing an
        // inaudible looping track for the first 80% of a long session.
        const { sound: soundB } = await Audio.Sound.createAsync(TRACK_B_SOURCE, {
          isLooping: true,
          volume: 0.0,
        });
        if (!isMountedRef.current) {
          soundB.unloadAsync();
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

      // Graceful micro-fade before unload to prevent pops on manual exit
      const cleanupTrack = async (soundRef) => {
        if (!soundRef.current) return;
        const sound = soundRef.current;
        soundRef.current = null;
        try {
          await sound.setVolumeAsync(0);
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

    // Guard: don't spam setVolumeAsync on every fractional progress tick —
    // only act when the rounded percentage actually changes.
    const rounded = Math.round(progress);
    if (rounded === lastAppliedProgressRef.current) return;
    lastAppliedProgressRef.current = rounded;

    async function applyCrossfade() {
      const volA = computeVolumeA(rounded);
      const volB = computeVolumeB(rounded);

      try {
        if (soundARef.current && isMountedRef.current) {
          await soundARef.current.setVolumeAsync(volA);
          // Pause Track A once fully silent, per spec ("save CPU") — guarded
          // so pauseAsync only fires once, not on every subsequent tick.
          if (volA <= 0 && !trackAPausedRef.current) {
            trackAPausedRef.current = true;
            await soundARef.current.pauseAsync();
          } else if (volA > 0 && trackAPausedRef.current) {
            // Defensive: if progress ever moves backward (e.g. timer reset),
            // resume Track A rather than leaving it silently paused forever.
            trackAPausedRef.current = false;
            await soundARef.current.playAsync();
          }
        }

        if (soundBRef.current && isMountedRef.current) {
          // Start Track B only once, right as the crossfade window begins.
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