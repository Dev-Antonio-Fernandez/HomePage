// Transcripción de audio (voz -> texto) vía API compatible con OpenAI/Groq.

import { getSttKey, loadSttConfig } from './config';
import { AIError } from './AIService';

export class MissingSttKeyError extends AIError {
  constructor() {
    super('Falta configurar el API key de transcripción en Ajustes.');
  }
}

// Sube el archivo de audio y devuelve el texto transcrito.
export async function transcribeAudio(uri: string): Promise<string> {
  const key = await getSttKey();
  if (!key) throw new MissingSttKeyError();
  const cfg = await loadSttConfig();
  const url = `${cfg.baseUrl.replace(/\/$/, '')}/audio/transcriptions`;

  const form = new FormData();
  // En React Native el archivo se adjunta como { uri, name, type }.
  form.append('file', {
    uri,
    name: 'clase.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);
  form.append('model', cfg.model);
  form.append('language', 'es');
  form.append('response_format', 'json');

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        // No fijar Content-Type: fetch pone el boundary de multipart solo.
      },
      body: form,
    });
  } catch {
    throw new AIError(
      'No se pudo conectar con el servicio de transcripción. Revisa tu conexión.',
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 401) {
      throw new AIError('API key de transcripción inválida (401).');
    }
    throw new AIError(
      `Error de transcripción (${res.status}). ${body.slice(0, 160)}`,
    );
  }

  const data = (await res.json()) as { text?: string };
  return (data.text ?? '').trim();
}
