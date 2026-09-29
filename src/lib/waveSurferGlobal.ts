import type WaveSurfer from 'wavesurfer.js';

// Ported from admanager_landing/src/lib/wave-surfer-global.ts (used by AudioCardPlayer):
// a registry so starting one player pauses any other that's playing.
const players = new Set<WaveSurfer>();

export function registerWaveSurferPlayer(ws: WaveSurfer) {
  players.add(ws);
}

export function unregisterWaveSurferPlayer(ws: WaveSurfer) {
  players.delete(ws);
}

/** Pause every registered WaveSurfer except the one that is starting playback. */
export function pauseOtherWaveSurfers(current: WaveSurfer) {
  for (const ws of players) {
    if (ws !== current && ws.isPlaying()) {
      ws.pause();
    }
  }
}
