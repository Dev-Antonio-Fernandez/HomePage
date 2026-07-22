export * as AIService from './AIService';
export { AIError, MissingKeyError } from './AIService';
export type { ExamQuestion } from './AIService';
export {
  transcribeAudio,
  transcribeSegments,
  MissingSttKeyError,
} from './transcription';
export {
  getApiKey,
  setApiKey,
  hasApiKey,
  loadConfig,
  saveConfig,
  AI_PRESETS,
  AI_DEFAULTS,
  type AIConfig,
  getSttKey,
  setSttKey,
  hasSttKey,
  loadSttConfig,
  saveSttConfig,
  STT_PRESETS,
  STT_DEFAULTS,
  type STTConfig,
} from './config';
