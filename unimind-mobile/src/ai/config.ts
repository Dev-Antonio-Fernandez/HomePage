import * as SecureStore from 'expo-secure-store';
import { Settings } from '../db';

// Claves de configuración de IA. Los modelos se guardan en la tabla settings
// (no se hardcodean en el código, según el brief). El API key va en SecureStore.
export const AI_KEYS = {
  BASE_URL: 'AI_BASE_URL',
  MODEL_FAST: 'AI_MODEL_FAST',
  MODEL_MAIN: 'AI_MODEL_MAIN',
  MODEL_ADVANCED: 'AI_MODEL_ADVANCED',
  PROVIDER: 'AI_PROVIDER', // etiqueta informativa (deepseek, moonshot, openai...)
} as const;

// Valores por defecto. Compatible con cualquier API estilo OpenAI:
// solo cambia BASE_URL y los nombres de modelo desde Ajustes.
export const AI_DEFAULTS = {
  BASE_URL: 'https://api.openai.com/v1',
  MODEL_FAST: 'gpt-4o-mini',
  MODEL_MAIN: 'gpt-4o-mini',
  MODEL_ADVANCED: 'gpt-4o',
  PROVIDER: 'openai',
};

// Presets rápidos para proveedores baratos comunes.
export const AI_PRESETS: Record<
  string,
  { label: string; baseUrl: string; fast: string; main: string; advanced: string }
> = {
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    fast: 'gpt-4o-mini',
    main: 'gpt-4o-mini',
    advanced: 'gpt-4o',
  },
  deepseek: {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    fast: 'deepseek-chat',
    main: 'deepseek-chat',
    advanced: 'deepseek-reasoner',
  },
  moonshot: {
    label: 'Kimi (Moonshot)',
    baseUrl: 'https://api.moonshot.cn/v1',
    fast: 'moonshot-v1-8k',
    main: 'moonshot-v1-32k',
    advanced: 'moonshot-v1-128k',
  },
};

const API_KEY_STORE = 'unimind_ai_api_key';
const STT_KEY_STORE = 'unimind_stt_api_key';

export async function getApiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(API_KEY_STORE);
  } catch {
    return null;
  }
}

export async function setApiKey(key: string): Promise<void> {
  if (key.trim().length === 0) {
    await SecureStore.deleteItemAsync(API_KEY_STORE);
    return;
  }
  await SecureStore.setItemAsync(API_KEY_STORE, key.trim());
}

export async function hasApiKey(): Promise<boolean> {
  const k = await getApiKey();
  return !!k && k.length > 0;
}

// ---- Transcripción (voz -> texto), configurable aparte del chat ----
export const STT_KEYS = {
  BASE_URL: 'STT_BASE_URL',
  MODEL: 'STT_MODEL',
  PROVIDER: 'STT_PROVIDER',
} as const;

// Groq es barato y rápido para Whisper; compatible con la API de OpenAI.
export const STT_DEFAULTS = {
  BASE_URL: 'https://api.groq.com/openai/v1',
  MODEL: 'whisper-large-v3-turbo',
  PROVIDER: 'groq',
};

export const STT_PRESETS: Record<
  string,
  { label: string; baseUrl: string; model: string }
> = {
  groq: {
    label: 'Groq (barato)',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'whisper-large-v3-turbo',
  },
  openai: {
    label: 'OpenAI Whisper',
    baseUrl: 'https://api.openai.com/v1',
    model: 'whisper-1',
  },
};

export interface STTConfig {
  baseUrl: string;
  model: string;
  provider: string;
}

export async function getSttKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STT_KEY_STORE);
  } catch {
    return null;
  }
}

export async function setSttKey(key: string): Promise<void> {
  if (key.trim().length === 0) {
    await SecureStore.deleteItemAsync(STT_KEY_STORE);
    return;
  }
  await SecureStore.setItemAsync(STT_KEY_STORE, key.trim());
}

export async function hasSttKey(): Promise<boolean> {
  const k = await getSttKey();
  return !!k && k.length > 0;
}

export async function loadSttConfig(): Promise<STTConfig> {
  const [baseUrl, model, provider] = await Promise.all([
    Settings.getSetting(STT_KEYS.BASE_URL),
    Settings.getSetting(STT_KEYS.MODEL),
    Settings.getSetting(STT_KEYS.PROVIDER),
  ]);
  return {
    baseUrl: baseUrl || STT_DEFAULTS.BASE_URL,
    model: model || STT_DEFAULTS.MODEL,
    provider: provider || STT_DEFAULTS.PROVIDER,
  };
}

export async function saveSttConfig(cfg: Partial<STTConfig>): Promise<void> {
  const entries: [string, string | undefined][] = [
    [STT_KEYS.BASE_URL, cfg.baseUrl],
    [STT_KEYS.MODEL, cfg.model],
    [STT_KEYS.PROVIDER, cfg.provider],
  ];
  for (const [k, v] of entries) {
    if (v !== undefined) await Settings.setSetting(k, v);
  }
}

export interface AIConfig {
  baseUrl: string;
  provider: string;
  modelFast: string;
  modelMain: string;
  modelAdvanced: string;
}

export async function loadConfig(): Promise<AIConfig> {
  const [baseUrl, provider, fast, main, adv] = await Promise.all([
    Settings.getSetting(AI_KEYS.BASE_URL),
    Settings.getSetting(AI_KEYS.PROVIDER),
    Settings.getSetting(AI_KEYS.MODEL_FAST),
    Settings.getSetting(AI_KEYS.MODEL_MAIN),
    Settings.getSetting(AI_KEYS.MODEL_ADVANCED),
  ]);
  return {
    baseUrl: baseUrl || AI_DEFAULTS.BASE_URL,
    provider: provider || AI_DEFAULTS.PROVIDER,
    modelFast: fast || AI_DEFAULTS.MODEL_FAST,
    modelMain: main || AI_DEFAULTS.MODEL_MAIN,
    modelAdvanced: adv || AI_DEFAULTS.MODEL_ADVANCED,
  };
}

export async function saveConfig(cfg: Partial<AIConfig>): Promise<void> {
  const entries: [string, string | undefined][] = [
    [AI_KEYS.BASE_URL, cfg.baseUrl],
    [AI_KEYS.PROVIDER, cfg.provider],
    [AI_KEYS.MODEL_FAST, cfg.modelFast],
    [AI_KEYS.MODEL_MAIN, cfg.modelMain],
    [AI_KEYS.MODEL_ADVANCED, cfg.modelAdvanced],
  ];
  for (const [k, v] of entries) {
    if (v !== undefined) await Settings.setSetting(k, v);
  }
}
