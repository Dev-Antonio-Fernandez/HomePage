import {
  IOSOutputFormat,
  AudioQuality,
  type RecordingOptions,
} from 'expo-audio';

// Preset optimizado para voz de clase: mono, 16 kHz, ~24 kbps.
// Whisper transcribe a 16 kHz mono de todos modos, así que esto no baja la
// calidad de transcripción pero reduce el peso ~5x frente a HIGH_QUALITY.
// A 24 kbps: ~0.18 MB/min → 20 min ≈ 3.6 MB (holgado bajo el límite de 25 MB).
export const LECTURE_PRESET: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 24000,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.LOW,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 24000,
  },
};

// Duración de cada segmento antes de cortar (segundos). 20 min.
export const SEGMENT_SECONDS = 20 * 60;
