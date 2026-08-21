# UniMind Mobile

App móvil **personal, local-first y sin fines de lucro** para controlar tu vida
universitaria: horario, clases del día, asistencias y faltas restantes, notas
rápidas por materia, cierre de clase, memoria por materia y repaso con IA.

No es una app genérica de notas: está pensada para responder _"¿qué necesito
entender, recordar y cumplir hoy?"_.

> Los datos viven en tu teléfono (SQLite). La IA solo se usa cuando tú la pides
> o al cerrar una clase. No hay servidor, ni login, ni monetización.

---

## Cómo ejecutarla

Necesitas [Node.js](https://nodejs.org) 18+ y la app **Expo Go** en tu teléfono
(App Store / Play Store).

```bash
cd unimind-mobile
npm install
npx expo start
```

Escanea el QR con Expo Go (Android) o la cámara (iOS). La app abre en tu
teléfono como app real, sin navegador.

Si alguna versión de dependencia se queja, reconcíliala con el SDK instalado:

```bash
npx expo install --fix
```

### Instalarla como app independiente (sin Expo Go)

Para tener un `.apk` / build nativo que se instale solo:

```bash
npm install -g eas-cli
eas build -p android --profile preview   # genera un APK descargable
```

(Requiere una cuenta gratuita de Expo. iOS necesita cuenta de Apple Developer.)

---

## Configurar la IA

La app funciona **sin IA** para todo lo académico (horario, asistencia, notas).
La IA es opcional y se activa en la pestaña **Más → Inteligencia artificial**:

1. Elige un proveedor (OpenAI, **DeepSeek**, **Kimi/Moonshot** o personalizado).
2. Pega tu **API key** — se guarda cifrada en el dispositivo (SecureStore),
   nunca en la base de datos ni en el código.
3. Ajusta los modelos si quieres (rápido / principal / avanzado).

Cualquier API compatible con OpenAI funciona: solo cambia la URL base y los
nombres de modelo. Los modelos **no están hardcodeados** en el código.

Funciones de IA disponibles:

- **Limpiar nota** — convierte una nota rápida en texto claro.
- **Resumen de clase** — 5 puntos clave al cerrar la clase.
- **Detectar tareas** — extrae pendientes mencionados en las notas.
- **Generar preguntas / flashcards** — para repasar.
- **Explicar duda** — tutor que responde usando solo tus notas.

---

## Arquitectura

```
src/
  navigation/   # navegación (tabs + stack) y tab bar con botón +
  features/     # pantallas por dominio
    home/         Inicio / Hoy
    subjects/     Materias, formulario y memoria de materia
    sessions/     Clase activa y cierre de clase
    notes/        Nueva nota + tipos de nota
    study/        Estudio (flashcards) y explicación con IA
    settings/     Más (perfil, IA, tareas)
  db/           # SQLite: sqlite.ts, migrations.ts, repositories/, types.ts
  ai/           # AIService (cliente OpenAI-compatible), prompts, config
  components/ui # componentes reutilizables (Card, Button, StatTile, ...)
  theme/        # colores, espaciado, tipografía (tema oscuro morado)
  utils/        # fechas, ids, lógica de faltas, exportación Markdown
```

- **Persistencia:** `expo-sqlite` con migraciones por `PRAGMA user_version`.
- **Secretos:** `expo-secure-store` (llavero del dispositivo) para el API key.
- **Lógica de faltas:** explícita y auditable en `utils/attendance.ts`
  (`riesgo = faltas_usadas / límite`; alerta a 0.6 y 0.8).

### Modelo de datos

`subjects · schedule_blocks · class_sessions · attendance_records · notes ·
tasks · flashcards · ai_events · settings`

---

## Estado (roadmap del brief)

- ✅ **Fase 1 – Control académico:** materias, horario, asistencias, faltas
  restantes, notas rápidas, clase activa y cierre de clase.
- ✅ **Fase 2 – Aprendizaje con IA:** limpiar notas, resúmenes, detectar tareas,
  generar preguntas/flashcards, explicar dudas.
- 🔜 **Fase 3 – Memoria inteligente:** búsqueda por materia, temas débiles,
  modo examen, repaso diario recomendado.
- 🔜 **Fase 4 – Extras:** voz a texto, backup, widgets, notificaciones,
  sincronización.
