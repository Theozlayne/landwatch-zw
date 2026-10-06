let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;

  const audioWindow = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextConstructor = window.AudioContext || audioWindow.webkitAudioContext;
  if (!AudioContextConstructor) return null;

  audioContext ??= new AudioContextConstructor();
  return audioContext;
}

/** Plays a quiet, short two-tone chime. Audio failures are intentionally ignored. */
export async function playNotificationSound() {
  try {
    const context = getAudioContext();
    if (!context) return;
    if (context.state === 'suspended') await context.resume();

    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.045, now + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    master.connect(context.destination);

    const firstTone = context.createOscillator();
    firstTone.type = 'sine';
    firstTone.frequency.setValueAtTime(784, now);
    firstTone.connect(master);
    firstTone.start(now);
    firstTone.stop(now + 0.13);

    const secondTone = context.createOscillator();
    secondTone.type = 'sine';
    secondTone.frequency.setValueAtTime(988, now + 0.075);
    secondTone.connect(master);
    secondTone.start(now + 0.075);
    secondTone.stop(now + 0.22);
  } catch {
    // Notifications must never block reporting or case review.
  }
}
